import { getNetwork, getNetworkInfo, runSimulation } from '@/api/client'
import { CityNetworkPanel } from '@/components/CityNetworkPanel'
import { CopilotDrawer } from '@/components/CopilotDrawer'
import { FloatingCorridorCard } from '@/components/FloatingCorridorCard'
import { Footer } from '@/components/Footer'
import { Header } from '@/components/Header'
import { InterventionPanel } from '@/components/InterventionPanel'
import { MapView } from '@/components/MapView'
import { ScenarioBar } from '@/components/ScenarioBar'
import { SimulationResultsPanel } from '@/components/SimulationResultsPanel'
import type {
  NetworkGeoJSON,
  ScenarioAction,
  SelectedRoad,
  SimulationResult,
  TimeProfile,
} from '@/types'
import { useCallback, useEffect, useMemo, useState } from 'react'

export default function App() {
  const [network, setNetwork] = useState<NetworkGeoJSON | null>(null)
  const [selectedRoad, setSelectedRoad] = useState<SelectedRoad | null>(null)
  const [action, setAction] = useState<ScenarioAction>('close')
  const [timeProfile, setTimeProfile] = useState<TimeProfile>('evening_rush')
  const [durationHours, setDurationHours] = useState(3)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<SimulationResult | null>(null)
  const [showResults, setShowResults] = useState(false)
  const [copilotOpen, setCopilotOpen] = useState(false)
  const [showIntervention, setShowIntervention] = useState(true)
  const [apiError, setApiError] = useState<string | null>(null)

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
        setApiError('Backend not reachable. Start the API with: uvicorn main:app --reload')
      }
    }
    load()
  }, [])

  useEffect(() => {
    if (selectedRoad) {
      setShowIntervention(true)
    }
  }, [selectedRoad])

  const selectedCongestion = useMemo(() => {
    if (!result?.edges || !selectedRoad) return 0.2
    return result.edges.find((e) => e.edge_id === selectedRoad.id)?.congestion ?? 0.2
  }, [result, selectedRoad])

  const scenarioName = selectedRoad
    ? `${selectedRoad.name} — ${action === 'close' ? 'Closure' : action === 'restrict' ? 'Restriction' : 'Speed Limit'}`
    : 'Baseline Network'

  const handleRunSimulation = useCallback(async () => {
    if (!selectedRoad) return
    setLoading(true)
    try {
      const simResult = await runSimulation({
        modifications: [{ edge_id: selectedRoad.id, action }],
        time_profile: timeProfile,
        duration_hours: durationHours,
      })
      setResult(simResult)
      setShowResults(true)
      setApiError(null)
    } catch {
      setApiError('Simulation failed. Check backend logs.')
    } finally {
      setLoading(false)
    }
  }, [selectedRoad, action, timeProfile, durationHours])

  const handleCopilotSimulation = useCallback((simResult: SimulationResult) => {
    setResult(simResult)
    setShowResults(true)
  }, [])

  return (
    <div className="flex h-full flex-col overflow-hidden bg-shell-bg text-deep-navy">
      <Header
        copilotOpen={copilotOpen}
        onCopilotToggle={() => setCopilotOpen((o) => !o)}
      />

      {apiError && (
        <div className="fixed top-16 right-0 left-0 z-[60] bg-error-container px-4 py-2 text-center text-sm text-on-error-container">
          {apiError}
        </div>
      )}

      <main className="relative mt-16 mb-10 flex flex-1 overflow-hidden">
        <CityNetworkPanel
          network={network}
          selectedRoad={selectedRoad}
          edgeMetrics={result?.edges ?? null}
          result={result}
          loading={loading}
          onSelectCorridor={setSelectedRoad}
          onRunSimulation={handleRunSimulation}
        />

        <div className="relative min-h-0 flex-1">
          <MapView
            network={network}
            selectedRoad={selectedRoad}
            edgeMetrics={result?.edges ?? null}
            onSelectRoad={setSelectedRoad}
          />

          {selectedRoad && (
            <FloatingCorridorCard
              road={selectedRoad}
              congestion={selectedCongestion}
              action={action}
              onActionChange={setAction}
              onRunScenario={handleRunSimulation}
              onClose={() => setSelectedRoad(null)}
              loading={loading}
            />
          )}

          {selectedRoad && showIntervention && !copilotOpen && (
            <InterventionPanel
              road={selectedRoad}
              action={action}
              timeProfile={timeProfile}
              durationHours={durationHours}
              loading={loading}
              onActionChange={setAction}
              onTimeProfileChange={setTimeProfile}
              onDurationChange={setDurationHours}
              onRunSimulation={handleRunSimulation}
              onClose={() => setShowIntervention(false)}
            />
          )}

          {result && showResults && selectedRoad && (
            <SimulationResultsPanel
              result={result}
              roadName={selectedRoad.name}
              onClose={() => setShowResults(false)}
            />
          )}

          <ScenarioBar
            scenarioName={scenarioName}
            loading={loading}
            onRunSimulation={handleRunSimulation}
            disabled={!selectedRoad}
          />
        </div>

        <CopilotDrawer
          open={copilotOpen}
          onClose={() => setCopilotOpen(false)}
          simulationResult={result}
          onSimulationFromCopilot={handleCopilotSimulation}
        />
      </main>

      <Footer />
    </div>
  )
}
