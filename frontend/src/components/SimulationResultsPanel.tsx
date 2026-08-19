import { Icon } from '@/components/Icon'
import { DigitalTwinMap } from '@/components/Map/DigitalTwinMap'
import type { NetworkGeoJSON, SelectedRoad, SimulationResult } from '@/types'
import type { ReactNode } from 'react'

interface SimulationResultsPanelProps {
  result: SimulationResult
  roadName: string
  network: NetworkGeoJSON | null
  selectedRoad: SelectedRoad | null
  onSelectRoad: (road: SelectedRoad) => void
  onBack: () => void
}

export function SimulationResultsPanel({
  result,
  roadName,
  network,
  selectedRoad,
  onSelectRoad,
  onBack,
}: SimulationResultsPanelProps) {
  return (
    <section className="min-w-0 p-4 md:p-6">
      <header className="mb-6">
        <div className="mb-2 flex items-center gap-2 font-label-md text-brand-accent">
          <Icon name="check_circle" className="text-[16px]" />
          SIMULATION COMPLETE
        </div>
        <h1 className="text-3xl font-semibold text-deep-navy">{roadName} Scenario</h1>
        <p className="mt-2 text-sm text-on-surface-variant">
          Impact analysis for {roadName} intervention during peak hours.
        </p>
      </header>

      <div className="grid min-w-0 grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <MetricCard label="NETWORK CONGESTION" value={`${result.scenario.congestion_index}%`} delta={`+${result.delta_congestion}% from baseline`} />
        <MetricCard label="AVG TRAVEL TIME" value={`${result.scenario.avg_travel_time_min} min`} delta={`+${result.delta_travel_time_pct}% delay`} />
        <MetricCard
          label="EST. CO2 EMISSIONS"
          value={`${result.scenario.co2_kg} kg`}
          delta={`${result.delta_co2_kg < 0 ? '' : '+'}${result.delta_co2_kg} kg impact`}
        />
      </div>

      <div className="mt-6 grid min-w-0 gap-6 xl:grid-cols-[minmax(280px,0.85fr)_minmax(0,1.15fr)]">
        <article className="min-w-0 rounded-lg border-2 border-interaction-blue/30 bg-shell-surface p-5">
          <h2 className="mb-5 flex items-center gap-2 text-lg font-semibold text-deep-navy">
            <Icon name="smart_toy" className="text-[24px] text-interaction-blue" />
            ENTROUGE RECOMMENDATION
          </h2>
          <Recommendation label="What happened?">Closure triggered increased load on alternate corridors.</Recommendation>
          <Recommendation label="Why?">Diverted volume exceeds capacity on parallel routes.</Recommendation>
          <Recommendation label="What should we do?">
            <div className="rounded border border-outline-variant bg-canvas p-3">
              <div className="flex items-start gap-2 font-medium text-deep-navy">
                <Icon name="adjust" className="text-[20px] text-interaction-blue" />
                <span>Extend Green Phase by +15s</span>
              </div>
              <p className="mt-1 pl-7 text-sm text-on-surface-variant">On stressed alternate corridors</p>
            </div>
          </Recommendation>
        </article>

        <article className="min-w-0 rounded-lg border border-outline-variant bg-shell-surface p-4">
          <div className="mb-3 flex items-center justify-between gap-3">
            <h2 className="flex items-center gap-2 text-lg font-semibold text-deep-navy">
              <Icon name="map" className="text-interaction-blue" />
              NETWORK IMPACT
            </h2>
            <span className="font-label-sm uppercase text-on-surface-variant">Chennai network</span>
          </div>
          <DigitalTwinMap
            network={network}
            selectedRoad={selectedRoad}
            edgeMetrics={result.edges}
            onSelectRoad={(road) => road && onSelectRoad(road)}
            className="h-[420px] min-h-0 w-full overflow-hidden rounded"
          />
        </article>
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-3 border-t border-outline-variant pt-5">
        <button type="button" onClick={onBack} className="rounded bg-brand-accent px-4 py-2 font-label-md text-white hover:bg-brand-accent-hover">BACK TO DIGITAL TWIN</button>
        <button type="button" onClick={() => window.print()} className="rounded border border-outline-variant bg-shell-surface px-4 py-2 font-label-md text-deep-navy hover:border-brand-accent">EXPORT REPORT</button>
        <button type="button" onClick={() => undefined} className="rounded border border-outline-variant bg-shell-surface px-4 py-2 font-label-md text-deep-navy hover:border-brand-accent">COMPARE SCENARIOS</button>
      </div>
    </section>
  )
}

function Recommendation({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="mb-5 last:mb-0">
      <h3 className="mb-1 font-label-md font-bold uppercase tracking-widest text-interaction-blue">{label}</h3>
      <div className="text-sm leading-relaxed text-deep-navy">{children}</div>
    </div>
  )
}

function MetricCard({ label, value, delta }: { label: string; value: string; delta: string }) {
  return (
    <div className="min-w-0 rounded-lg border border-outline-variant bg-shell-surface p-4 shadow-sm">
      <div className="mb-3 flex items-start justify-between gap-2 font-label-sm font-bold text-on-surface-variant">
        <span>{label}</span>
        <Icon name="trending_up" className="shrink-0 text-[16px] text-brand-accent" />
      </div>
      <div className="truncate text-3xl font-bold text-deep-navy">{value}</div>
      <div className="mt-2 font-label-sm font-bold text-brand-accent">{delta}</div>
    </div>
  )
}