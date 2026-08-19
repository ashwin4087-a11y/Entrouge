import json
from pathlib import Path

import networkx as nx

DATA_DIR = Path(__file__).resolve().parent.parent / "data"


class RoadNetwork:
    """Load and manage a road network from GeoJSON."""

    def __init__(self, geojson_path: Path | None = None):
        path = geojson_path or DATA_DIR / "chennai_central.geojson"
        with open(path, encoding="utf-8") as f:
            self.geojson = json.load(f)

        self.graph = nx.DiGraph()
        self.edges: dict[str, dict] = {}
        self._build_graph()

    def _build_graph(self) -> None:
        for feature in self.geojson.get("features", []):
            props = feature.get("properties", {})
            geom = feature.get("geometry", {})
            if geom.get("type") != "LineString":
                continue

            edge_id = props.get("id") or props.get("edge_id")
            if not edge_id:
                continue

            coords = geom["coordinates"]
            u, v = props.get("from_node"), props.get("to_node")
            if not u or not v:
                u = f"n_{coords[0][0]}_{coords[0][1]}"
                v = f"n_{coords[-1][0]}_{coords[-1][1]}"

            length_km = props.get("length_km", 0.5)
            capacity = props.get("capacity_vph", 2000)
            free_flow_min = props.get("free_flow_min", length_km / 40 * 60)

            self.edges[edge_id] = {
                "id": edge_id,
                "name": props.get("name", edge_id),
                "coordinates": coords,
                "length_km": length_km,
                "capacity_vph": capacity,
                "free_flow_min": free_flow_min,
                "from_node": u,
                "to_node": v,
            }

            self.graph.add_edge(
                u,
                v,
                edge_id=edge_id,
                length=length_km,
                capacity=capacity,
                free_flow=free_flow_min,
                weight=free_flow_min,
            )

    def get_geojson(self) -> dict:
        return self.geojson

    def find_edges_by_name(self, name: str) -> list[str]:
        name_lower = name.lower()
        return [
            eid
            for eid, data in self.edges.items()
            if name_lower in data["name"].lower()
        ]

    def get_edge(self, edge_id: str) -> dict | None:
        return self.edges.get(edge_id)

    def info(self) -> dict:
        center = self.geojson.get("properties", {}).get("center", [13.0827, 80.2707])
        return {
            "city": self.geojson.get("properties", {}).get("city", "Chennai"),
            "center": center,
            "edge_count": len(self.edges),
            "node_count": self.graph.number_of_nodes(),
        }

    def copy_graph(self) -> nx.DiGraph:
        return self.graph.copy()
