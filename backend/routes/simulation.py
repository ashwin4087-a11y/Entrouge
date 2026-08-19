from fastapi import APIRouter

from services.simulation_service import get_network, get_network_info, run_simulation
from simulation.models import SimulationRequest, SimulationResult

router = APIRouter(tags=["simulation"])


@router.get("/network")
def network_geojson():
    return get_network()


@router.get("/network/info")
def network_info():
    return get_network_info()


@router.post("/simulate", response_model=SimulationResult)
def simulate(request: SimulationRequest):
    return run_simulation(request)
