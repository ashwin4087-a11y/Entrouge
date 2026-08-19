from enum import Enum
from typing import Literal

from pydantic import BaseModel, Field


class ScenarioAction(str, Enum):
    CLOSE = "close"
    RESTRICT = "restrict"
    SLOW = "slow"


class TimeProfile(str, Enum):
    MORNING_RUSH = "morning_rush"
    EVENING_RUSH = "evening_rush"
    OFF_PEAK = "off_peak"
    ALL_DAY = "all_day"


class ScenarioModification(BaseModel):
    edge_id: str
    action: ScenarioAction
    capacity_factor: float = Field(default=1.0, ge=0.0, le=1.0)
    speed_factor: float = Field(default=1.0, ge=0.1, le=1.0)


class SimulationRequest(BaseModel):
    modifications: list[ScenarioModification] = Field(default_factory=list)
    time_profile: TimeProfile = TimeProfile.EVENING_RUSH
    duration_hours: float = Field(default=3.0, ge=0.5, le=24.0)


class EdgeMetrics(BaseModel):
    edge_id: str
    name: str
    congestion: float = Field(ge=0.0, le=1.0)
    travel_time_min: float
    volume: float
    capacity: float


class ImpactSummary(BaseModel):
    avg_travel_time_min: float
    congestion_index: float
    co2_kg: float
    affected_commuters: int
    total_trips: int


class SimulationResult(BaseModel):
    baseline: ImpactSummary
    scenario: ImpactSummary
    edges: list[EdgeMetrics]
    delta_travel_time_pct: float
    delta_congestion: float
    delta_co2_kg: float
    affected_commuters: int
    alternate_routes: list[str] = Field(default_factory=list)


class NetworkInfo(BaseModel):
    city: str
    center: list[float]
    edge_count: int
    node_count: int


class CopilotScenario(BaseModel):
    road_name: str | None = None
    edge_ids: list[str] = Field(default_factory=list)
    action: ScenarioAction = ScenarioAction.CLOSE
    duration_hours: float = 3.0
    time_profile: TimeProfile = TimeProfile.EVENING_RUSH
    description: str = ""


class CopilotRequest(BaseModel):
    message: str
    context: dict | None = None


class CopilotResponse(BaseModel):
    type: Literal["scenario", "explanation", "error"]
    message: str
    scenario: CopilotScenario | None = None
    simulation: SimulationResult | None = None
