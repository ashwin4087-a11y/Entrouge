import { CopilotDrawer } from '@/components/CopilotDrawer'
import { Icon } from '@/components/Icon'
import { CityNetworkPanel } from '@/components/CityNetworkPanel'
import { InterventionPanel } from '@/components/InterventionPanel'
import { DigitalTwinMap } from '@/components/Map/DigitalTwinMap'
import { SimulationPlayback, getPlaybackEdgeMetrics } from '@/components/SimulationPlayback'
import { SimulationResultsSidebar } from '@/components/SimulationResultsSidebar'
import { AppFooter } from '@/components/layout/AppFooter'
import { AppHeader } from '@/components/layout/AppHeader'
import { useSimulation } from '@/context/SimulationContext'
import { defaultInterventionConfig } from '@/types/simulation'
import { useCallback, useEffect, useMemo, useState } from 'react'

export function DigitalTwinPage() {
  const {
    network,
    apiError,
    config,
    appState,
    progress,
    currentResult,
    playbackTimeMin,
    selectCorridor,
    updateConfig,
    closeIntervention,
    runSimulation,
    clearResult,
  } = useSimulation()

  const [copilotOpen, setCopilotOpen] = useState(false)
  const [focusEdgeId, setFocusEdgeId] = useState<string | null>(null)

  useEffect(() => {
    if (config?.road.id) setFocusEdgeId(config.road.id)
  }, [config?.road.id])

  const handleSelectCorridor = useCallback(
    (road: Parameters<typeof selectCorridor>[0]) => {
      selectCorridor(road)
      setFocusEdgeId(road.id)
    },
    [selectCorridor],
  )

  const edgeMetrics = useMemo(() => {
    if (!currentResult) return null
    if (appState === 'completed') {
      return getPlaybackEdgeMetrics(currentResult, playbackTimeMin)
    }
    return currentResult.edgeMetrics
  }, [currentResult, appState, playbackTimeMin])

  const diversionEdgeIds = useMemo(
    () => currentResult?.divertedTraffic.filter((d) => d.changePct > 0).map((d) => d.edgeId) ?? [],
    [currentResult],
  )

  const legacyResult = currentResult?.rawApiResult ?? null

  const handleDemoAnnaSalai = () => {
    const feature = network?.features.find((f) => f.properties.id === 'anna_salai_1')
    if (!feature) return
    const road = {
      id: feature.properties.id,
      name: feature.properties.name,
      length_km: feature.properties.length_km ?? 1.2,
      capacity_vph: feature.properties.capacity_vph ?? 2800,
    }
    selectCorridor(road)
    updateConfig({
      ...defaultInterventionConfig(road),
      action: 'close',
      timeProfile: 'evening_rush',
      durationMinutes: 60,
    })
    setFocusEdgeId(road.id)
  }

  return (
    <div className="flex h-full min-w-0 flex-col overflow-hidden bg-shell-bg text-deep-navy">
      <AppHeader activeNav="DIGITAL TWIN" />

      {apiError && (
        <div className="fixed top-16 right-0 left-0 z-[60] bg-warning-container px-4 py-2 text-center text-sm text-on-warning-container">
          {apiError}
        </div>
      )}

      <main className="relative mt-16 mb-10 grid min-h-0 min-w-0 flex-1 grid-cols-1 overflow-hidden md:grid-cols-[minmax(260px,360px)_minmax(0,1fr)]">
        <CityNetworkPanel
          network={network}
          selectedRoad={config?.road ?? null}
          edgeMetrics={edgeMetrics}
          result={legacyResult}
          enrichedResult={currentResult}
          onSelectCorridor={handleSelectCorridor}
        />

        <div className="relative grid min-h-0 min-w-0 grid-cols-1 overflow-hidden lg:grid-cols-[minmax(0,1fr)_minmax(320px,400px)]">
          <div className="relative flex min-h-0 min-w-0 flex-col overflow-hidden">
            {appState === 'simulating' ? (
              <div className="flex min-h-full flex-col items-center justify-center gap-4 p-8">
                <div className="w-full max-w-xl rounded-lg border border-outline-variant bg-shell-surface p-8 text-center shadow-sm">
                  <div className="mb-3 font-label-md uppercase tracking-widest text-brand-accent">
                    {progress?.message ?? 'SIMULATION RUNNING…'}
                  </div>
                  <h2 className="text-2xl font-semibold text-deep-navy">
                    {config?.road.name ?? 'Corridor'}
                  </h2>
                  <div className="mt-6 h-2 overflow-hidden rounded-full bg-canvas">
                    <div
                      className="h-full rounded-full bg-brand-accent transition-all duration-300"
                      style={{ width: `${progress?.progress ?? 0}%` }}
                    />
                  </div>
                  <p className="mt-2 font-mono text-sm text-on-surface-variant">{progress?.progress ?? 0}%</p>
                </div>
              </div>
            ) : (
              <>
                <DigitalTwinMap
                  network={network}
                  selectedRoad={config?.road ?? null}
                  edgeMetrics={edgeMetrics}
                  focusEdgeId={focusEdgeId}
                  diversionEdgeIds={appState === 'completed' ? diversionEdgeIds : []}
                  onSelectRoad={(road) => road && handleSelectCorridor(road)}
                  className="h-full min-h-[420px] w-full"
                  showLegend={appState !== 'completed'}
                />
                {appState === 'completed' && currentResult && (
                  <div className="absolute bottom-4 left-4 right-4 z-20 max-w-2xl">
                    <SimulationPlayback />
                  </div>
                )}
              </>
            )}

            {appState === 'idle' && (
              <button
                type="button"
                onClick={() => setCopilotOpen(true)}
                className="absolute top-4 right-4 z-30 flex items-center gap-2 rounded-lg border border-brand-accent bg-shell-surface px-4 py-2.5 font-label-md font-bold text-brand-accent shadow-lg transition-colors hover:bg-brand-accent hover:text-white"
              >
                <Icon name="smart_toy" className="text-[18px]" />
                OPEN COPILOT
              </button>
            )}

            {appState === 'idle' && (
              <button
                type="button"
                onClick={handleDemoAnnaSalai}
                className="absolute bottom-4 left-4 z-30 rounded-lg border border-outline-variant bg-shell-surface/95 px-4 py-2 font-label-md text-deep-navy shadow-md hover:border-brand-accent"
              >
                Demo: Anna Salai Closure
              </button>
            )}
          </div>

          {config && appState === 'configuring' && (
            <InterventionPanel
              network={network}
              config={config}
              loading={false}
              onConfigChange={updateConfig}
              onSelectCorridor={handleSelectCorridor}
              onRunSimulation={runSimulation}
              onClose={closeIntervention}
            />
          )}

          {appState === 'completed' && currentResult && (
            <SimulationResultsSidebar />
          )}
        </div>

        <CopilotDrawer
          open={copilotOpen}
          onClose={() => setCopilotOpen(false)}
          simulationResult={legacyResult}
          onSimulationFromCopilot={() => {
            clearResult()
          }}
        />
      </main>

      <AppFooter />
    </div>
  )
}
