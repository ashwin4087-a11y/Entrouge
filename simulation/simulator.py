import random

import networkx as nx

from simulation.models import (
    EdgeMetrics,
    ImpactSummary,
    ScenarioModification,
    SimulationRequest,
    SimulationResult,
    TimeProfile,
)
from simulation.network import RoadNetwork

# Demand multiplier by time profile
DEMAND_PROFILES: dict[TimeProfile, float] = {
    TimeProfile.MORNING_RUSH: 1.4,
    TimeProfile.EVENING_RUSH: 1.5,
    TimeProfile.OFF_PEAK: 0.6,
    TimeProfile.ALL_DAY: 1.0,
}

# CO2 g per vehicle-km (rough urban average)
CO2_G_PER_VKM = 180


class TrafficSimulator:
    """Lightweight graph-based traffic assignment."""

    def __init__(self, network: RoadNetwork):
        self.network = network
        self._od_pairs: list[tuple[str, str]] | None = None

    def _generate_od_pairs(self, graph: nx.DiGraph, count: int = 80) -> list[tuple[str, str]]:
        nodes = list(graph.nodes())
        if len(nodes) < 2:
            return []
        pairs = []
        rng = random.Random(42)
        for _ in range(count):
            o, d = rng.sample(nodes, 2)
            if nx.has_path(graph, o, d):
                pairs.append((o, d))
        return pairs

    def _apply_modifications(
        self,
        graph: nx.DiGraph,
        modifications: list[ScenarioModification],
    ) -> nx.DiGraph:
        g = graph.copy()
        for mod in modifications:
            edge_id = mod.edge_id
            to_remove: list[tuple[str, str]] = []
            for u, v, data in g.edges(data=True):
                if data.get("edge_id") != edge_id:
                    continue
                if mod.action.value == "close":
                    to_remove.append((u, v))
                elif mod.action.value == "restrict":
                    data["capacity"] = data["capacity"] * mod.capacity_factor
                elif mod.action.value == "slow":
                    data["free_flow"] = data["free_flow"] * (1 / mod.speed_factor)
                    data["weight"] = data["free_flow"]
            for u, v in to_remove:
                g.remove_edge(u, v)
        return g

    def _bpr_travel_time(self, volume: float, capacity: float, free_flow: float) -> float:
        """Bureau of Public Roads travel time function."""
        if capacity <= 0:
            return free_flow * 10
        ratio = volume / capacity
        return free_flow * (1 + 0.15 * (ratio ** 4))

    def _assign_traffic(
        self,
        graph: nx.DiGraph,
        demand_factor: float,
    ) -> dict[str, float]:
        """All-pairs shortest path demand assignment (simplified)."""
        od_pairs = self._od_pairs or self._generate_od_pairs(graph)
        edge_volume: dict[str, float] = {eid: 0.0 for eid in self.network.edges}

        base_demand = 25 * demand_factor

        for origin, dest in od_pairs:
            try:
                path = nx.shortest_path(graph, origin, dest, weight="weight")
            except (nx.NetworkXNoPath, nx.NodeNotFound):
                continue

            for u, v in zip(path, path[1:]):
                data = graph.get_edge_data(u, v)
                if data:
                    eid = data.get("edge_id")
                    if eid:
                        edge_volume[eid] = edge_volume.get(eid, 0) + base_demand

        return edge_volume

    def _compute_metrics(
        self,
        graph: nx.DiGraph,
        edge_volume: dict[str, float],
        od_pairs: list[tuple[str, str]],
    ) -> tuple[ImpactSummary, list[EdgeMetrics]]:
        travel_times: list[float] = []
        congestions: list[float] = []
        total_vkm = 0.0
        affected = 0

        edge_metrics: list[EdgeMetrics] = []

        for edge_id, edge_data in self.network.edges.items():
            vol = edge_volume.get(edge_id, 0)
            cap = edge_data["capacity_vph"]
            ff = edge_data["free_flow_min"]
            tt = self._bpr_travel_time(vol, cap, ff)
            cong = min(1.0, vol / cap if cap > 0 else 0)

            edge_metrics.append(
                EdgeMetrics(
                    edge_id=edge_id,
                    name=edge_data["name"],
                    congestion=round(cong, 3),
                    travel_time_min=round(tt, 2),
                    volume=round(vol, 1),
                    capacity=cap,
                )
            )
            travel_times.append(tt)
            congestions.append(cong)
            total_vkm += edge_data["length_km"] * (vol / 100)

        # Count trips that still have a valid path
        for o, d in od_pairs:
            try:
                nx.shortest_path(graph, o, d, weight="weight")
                affected += 1
            except (nx.NetworkXNoPath, nx.NodeNotFound):
                pass

        avg_tt = sum(travel_times) / len(travel_times) if travel_times else 0
        avg_cong = sum(congestions) / len(congestions) if congestions else 0
        co2 = total_vkm * CO2_G_PER_VKM / 1000

        summary = ImpactSummary(
            avg_travel_time_min=round(avg_tt, 2),
            congestion_index=round(avg_cong * 100, 1),
            co2_kg=round(co2, 2),
            affected_commuters=affected,
            total_trips=len(od_pairs),
        )
        return summary, edge_metrics

    def _find_alternate_routes(
        self,
        baseline_volumes: dict[str, float],
        scenario_volumes: dict[str, float],
        modifications: list[ScenarioModification],
    ) -> list[str]:
        closed_ids = {m.edge_id for m in modifications if m.action.value == "close"}
        alternates = []
        for eid, scen_vol in scenario_volumes.items():
            if eid in closed_ids:
                continue
            base_vol = baseline_volumes.get(eid, 0)
            if scen_vol > base_vol * 1.2 and scen_vol > 50:
                name = self.network.edges.get(eid, {}).get("name", eid)
                alternates.append(name)
        return alternates[:5]

    def run(self, request: SimulationRequest) -> SimulationResult:
        base_graph = self.network.copy_graph()
        self._od_pairs = self._generate_od_pairs(base_graph)
        demand = DEMAND_PROFILES.get(request.time_profile, 1.0)

        baseline_volumes = self._assign_traffic(base_graph, demand)
        baseline_summary, _ = self._compute_metrics(
            base_graph, baseline_volumes, self._od_pairs
        )

        scenario_graph = self._apply_modifications(base_graph, request.modifications)
        scenario_volumes = self._assign_traffic(scenario_graph, demand)
        scenario_summary, scenario_edges = self._compute_metrics(
            scenario_graph, scenario_volumes, self._od_pairs
        )

        delta_tt = 0.0
        if baseline_summary.avg_travel_time_min > 0:
            delta_tt = (
                (scenario_summary.avg_travel_time_min - baseline_summary.avg_travel_time_min)
                / baseline_summary.avg_travel_time_min
                * 100
            )

        alternates = self._find_alternate_routes(
            baseline_volumes, scenario_volumes, request.modifications
        )

        return SimulationResult(
            baseline=baseline_summary,
            scenario=scenario_summary,
            edges=scenario_edges,
            delta_travel_time_pct=round(delta_tt, 1),
            delta_congestion=round(
                scenario_summary.congestion_index - baseline_summary.congestion_index, 1
            ),
            delta_co2_kg=round(
                scenario_summary.co2_kg - baseline_summary.co2_kg, 2
            ),
            affected_commuters=scenario_summary.affected_commuters,
            alternate_routes=alternates,
        )
