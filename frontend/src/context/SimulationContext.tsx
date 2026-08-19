import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { getNetwork, getNetworkInfo } from '@/api/client'
import { executeSimulation } from '@/services/simulationService'
import type { NetworkGeoJSON, SelectedRoad } from '@/types'
import type {
  EnrichedSimulationResult,
  InterventionConfig,
  SimulationProgress,
  SimulationReport,
} from '@/types/simulation'
import {
  buildReportTitle,
  defaultInterventionConfig,
} from '@/types/simulation'

const STORAGE_KEY = 'entrouge-simulation-reports'

interface SimulationContextValue {
  network: NetworkGeoJSON | null
  apiError: string | null
  config: InterventionConfig | null
  appState: 'idle' | 'configuring' | 'simulating' | 'completed'
  progress: SimulationProgress | null
  currentResult: EnrichedSimulationResult | null
  reports: SimulationReport[]
  playbackTimeMin: number
  isPlaying: boolean
  setPlaybackTimeMin: (t: number) => void
  setIsPlaying: (p: boolean) => void
  selectCorridor: (road: SelectedRoad) => void
  updateConfig: (patch: Partial<InterventionConfig>) => void
  closeIntervention: () => void
  runSimulation: () => Promise<void>
  applyRecommendation: (patch: Partial<InterventionConfig>) => void
  clearResult: () => void
  getReport: (id: string) => SimulationReport | undefined
}

const SimulationContext = createContext<SimulationContextValue | null>(null)

function loadReports(): SimulationReport[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    return JSON.parse(raw) as SimulationReport[]
  } catch {
    return []
  }
}

function saveReports(reports: SimulationReport[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(reports))
}

export function SimulationProvider({ children }: { children: ReactNode }) {
  const [network, setNetwork] = useState<NetworkGeoJSON | null>(null)
  const [apiError, setApiError] = useState<string | null>(null)
  const [config, setConfig] = useState<InterventionConfig | null>(null)
  const [appState, setAppState] = useState<SimulationContextValue['appState']>('idle')
  const [progress, setProgress] = useState<SimulationProgress | null>(null)
  const [currentResult, setCurrentResult] = useState<EnrichedSimulationResult | null>(null)
  const [reports, setReports] = useState<SimulationReport[]>(loadReports)
  const [playbackTimeMin, setPlaybackTimeMin] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)

  useEffect(() => {
    async function load() {
      try {
        const [geo, info] = await Promise.all([getNetwork(), getNetworkInfo()])
        if (!geo.properties?.center && info.center) {
          geo.properties = { ...geo.properties, center: info.center }
        }
        setNetwork(geo)
        setApiError(null)
      } catch {
        setApiError('Backend not reachable. Virtual simulation mode is active.')
      }
    }
    load()
  }, [])

  const selectCorridor = useCallback((road: SelectedRoad) => {
    setConfig(defaultInterventionConfig(road))
    setCurrentResult(null)
    setAppState('configuring')
    setPlaybackTimeMin(0)
    setIsPlaying(false)
  }, [])

  const updateConfig = useCallback((patch: Partial<InterventionConfig>) => {
    setConfig((prev) => (prev ? { ...prev, ...patch } : prev))
  }, [])

  const closeIntervention = useCallback(() => {
    setConfig(null)
    setAppState('idle')
    setProgress(null)
  }, [])

  const runSimulationFlow = useCallback(async () => {
    if (!config || !network) return
    setAppState('simulating')
    setProgress({ phase: 'initializing', progress: 0, message: 'SIMULATION INITIALIZING…' })
    setIsPlaying(false)
    setPlaybackTimeMin(0)

    try {
      const result = await executeSimulation(network, config, setProgress)
      setCurrentResult(result)
      const report: SimulationReport = {
        ...result,
        title: buildReportTitle(result),
      }
      const next = [report, ...reports.filter((r) => r.id !== report.id)]
      setReports(next)
      saveReports(next)
      setAppState('completed')
      setApiError(null)
    } catch {
      setProgress({
        phase: 'failed',
        progress: 0,
        message: 'SIMULATION FAILED',
      })
      setApiError('Unable to complete the virtual mobility model.')
      setAppState('configuring')
    }
  }, [config, network, reports])

  const applyRecommendation = useCallback(
    (patch: Partial<InterventionConfig>) => {
      if (!config) return
      const next = { ...config, ...patch }
      if (patch.road) next.road = patch.road
      setConfig(next)
      setCurrentResult(null)
      setAppState('configuring')
      setPlaybackTimeMin(0)
      setIsPlaying(false)
    },
    [config],
  )

  const clearResult = useCallback(() => {
    setCurrentResult(null)
    setAppState(config ? 'configuring' : 'idle')
    setPlaybackTimeMin(0)
    setIsPlaying(false)
  }, [config])

  const getReport = useCallback(
    (id: string) => reports.find((r) => r.id === id),
    [reports],
  )

  const value = useMemo(
    () => ({
      network,
      apiError,
      config,
      appState,
      progress,
      currentResult,
      reports,
      playbackTimeMin,
      isPlaying,
      setPlaybackTimeMin,
      setIsPlaying,
      selectCorridor,
      updateConfig,
      closeIntervention,
      runSimulation: runSimulationFlow,
      applyRecommendation,
      clearResult,
      getReport,
    }),
    [
      network,
      apiError,
      config,
      appState,
      progress,
      currentResult,
      reports,
      playbackTimeMin,
      isPlaying,
      selectCorridor,
      updateConfig,
      closeIntervention,
      runSimulationFlow,
      applyRecommendation,
      clearResult,
      getReport,
    ],
  )

  return (
    <SimulationContext.Provider value={value}>{children}</SimulationContext.Provider>
  )
}

export function useSimulation() {
  const ctx = useContext(SimulationContext)
  if (!ctx) throw new Error('useSimulation must be used within SimulationProvider')
  return ctx
}
