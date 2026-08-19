import type {
  EdgeMetrics,
  NetworkGeoJSON,
  ScenarioAction,
  SelectedRoad,
  SimulationResult,
  TimeProfile,
} from '@/types'

export type InterventionType = ScenarioAction | 'signal_timing'

export interface InterventionConfig {
  road: SelectedRoad
  action: InterventionType
  timeProfile: TimeProfile
  durationMinutes: number
  closureType: 'full' | 'partial'
  currentLanes: number
  reducedLanes: number
  currentSpeedKmh: number
  newSpeedKmh: number
  currentGreenPhaseSec: number
  newGreenPhaseSec: number
  cycleLengthSec: number
  capacityFactor: number
  speedFactor: number
}

export interface MetricSnapshot {
  congestionPct: number
  travelTimeMin: number
  co2Kg: number
  avgSpeedKmh: number
  trafficVolumeVph: number
}

export interface MetricDelta {
  congestionPct: number
  travelTimeMin: number
  co2Kg: number
  avgSpeedKmh: number
  trafficVolumeVph: number
}

export interface DiversionCorridor {
  name: string
  edgeId: string
  baselineLoadPct: number
  simulatedLoadPct: number
  changePct: number
}

export interface RecommendationSuggestion {
  id: string
  title: string
  reason: string
  patch: Partial<InterventionConfig>
}

export interface PlaybackFrame {
  timeMin: number
  label: string
  edgeCongestion: Record<string, number>
}

export type SimulationMode = 'api' | 'virtual'

export interface EnrichedSimulationResult {
  id: string
  title: string
  scenarioId: string
  createdAt: string
  corridor: SelectedRoad
  intervention: InterventionType
  interventionLabel: string
  timeProfile: TimeProfile
  durationMinutes: number
  mode: SimulationMode
  baseline: MetricSnapshot
  simulated: MetricSnapshot
  delta: MetricDelta
  affectedPopulation: number
  emergencyAccessScore: number
  emergencyAccessStatus: string
  equityScore: number
  equityStatus: string
  divertedTraffic: DiversionCorridor[]
  primaryAffectedCorridor: string
  alternateCorridors: string[]
  executiveSummary: string
  whatHappened: string
  whyItHappened: string
  recommendedAction: string
  recommendations: RecommendationSuggestion[]
  playbackFrames: PlaybackFrame[]
  edgeMetrics: EdgeMetrics[]
  rawApiResult?: SimulationResult
}

export interface SimulationProgress {
  phase: 'initializing' | 'running' | 'complete' | 'failed'
  progress: number
  message: string
}

export interface SimulationReport extends EnrichedSimulationResult {
  title: string
}

export function defaultInterventionConfig(road: SelectedRoad): InterventionConfig {
  return {
    road,
    action: 'close',
    timeProfile: 'evening_rush',
    durationMinutes: 60,
    closureType: 'full',
    currentLanes: 3,
    reducedLanes: 2,
    currentSpeedKmh: 50,
    newSpeedKmh: 40,
    currentGreenPhaseSec: 45,
    newGreenPhaseSec: 60,
    cycleLengthSec: 120,
    capacityFactor: 0.67,
    speedFactor: 0.8,
  }
}

export function interventionLabel(action: InterventionType): string {
  switch (action) {
    case 'close':
      return 'Full Closure'
    case 'restrict':
      return 'Lane Reduction'
    case 'slow':
      return 'Speed Limit Change'
    case 'signal_timing':
      return 'Signal Timing Adjustment'
  }
}

export function timeProfileLabel(profile: TimeProfile): string {
  switch (profile) {
    case 'morning_rush':
      return 'Morning Peak'
    case 'evening_rush':
      return 'Evening Peak'
    case 'off_peak':
      return 'Off Peak'
    case 'all_day':
      return 'All Day'
  }
}

export function buildReportTitle(result: EnrichedSimulationResult): string {
  return `${result.corridor.name} — ${result.interventionLabel}`
}

export type NetworkData = NetworkGeoJSON
