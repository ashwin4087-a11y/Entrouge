export type ScenarioAction = 'close' | 'restrict' | 'slow'
export type TimeProfile = 'morning_rush' | 'evening_rush' | 'off_peak' | 'all_day'

export interface RoadFeature {
  type: 'Feature'
  properties: {
    id: string
    name: string
    length_km?: number
    capacity_vph?: number
    free_flow_min?: number
  }
  geometry: {
    type: 'LineString'
    coordinates: [number, number][]
  }
}

export interface NetworkGeoJSON {
  type: 'FeatureCollection'
  properties?: {
    city?: string
    center?: [number, number]
  }
  features: RoadFeature[]
}

export interface NetworkInfo {
  city: string
  center: [number, number]
  edge_count: number
  node_count: number
}

export interface ScenarioModification {
  edge_id: string
  action: ScenarioAction
  capacity_factor?: number
  speed_factor?: number
}

export interface SimulationRequest {
  modifications: ScenarioModification[]
  time_profile: TimeProfile
  duration_hours: number
}

export interface ImpactSummary {
  avg_travel_time_min: number
  congestion_index: number
  co2_kg: number
  affected_commuters: number
  total_trips: number
}

export interface EdgeMetrics {
  edge_id: string
  name: string
  congestion: number
  travel_time_min: number
  volume: number
  capacity: number
}

export interface SimulationResult {
  baseline: ImpactSummary
  scenario: ImpactSummary
  edges: EdgeMetrics[]
  delta_travel_time_pct: number
  delta_congestion: number
  delta_co2_kg: number
  affected_commuters: number
  alternate_routes: string[]
}

export interface CopilotResponse {
  type: 'scenario' | 'explanation' | 'error'
  message: string
  scenario?: {
    road_name?: string
    edge_ids: string[]
    action: ScenarioAction
    duration_hours: number
    time_profile: TimeProfile
    description: string
  }
  simulation?: SimulationResult
}

export interface SelectedRoad {
  id: string
  name: string
  length_km: number
  capacity_vph: number
}
