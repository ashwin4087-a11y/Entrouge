from simulation.models import NetworkInfo, SimulationRequest, SimulationResult
from simulation.network import RoadNetwork
from simulation.simulator import TrafficSimulator

_network: RoadNetwork | None = None
_simulator: TrafficSimulator | None = None


def _ensure_loaded():
    global _network, _simulator
    if _network is None:
        _network = RoadNetwork()
        _simulator = TrafficSimulator(_network)


def get_network() -> dict:
    _ensure_loaded()
    return _network.get_geojson()


def get_network_info() -> NetworkInfo:
    _ensure_loaded()
    return NetworkInfo(**_network.info())


def get_road_network() -> RoadNetwork:
    _ensure_loaded()
    return _network


def run_simulation(request: SimulationRequest) -> SimulationResult:
    _ensure_loaded()
    return _simulator.run(request)
