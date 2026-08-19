import { Icon } from '@/components/Icon'
import type { SimulationResult } from '@/types'

interface SimulationResultsPanelProps {
  result: SimulationResult
  roadName: string
  onClose: () => void
}

export function SimulationResultsPanel({
  result,
  roadName,
  onClose,
}: SimulationResultsPanelProps) {
  return (
    <div className="absolute inset-x-4 top-4 z-30 max-h-[calc(100%-120px)] overflow-y-auto rounded-lg border border-outline-variant bg-canvas/95 p-4 shadow-xl backdrop-blur-md md:inset-x-auto md:right-[420px] md:left-4 md:max-w-2xl">
      <div className="mb-4 flex items-start justify-between">
        <div>
          <div className="mb-1 flex items-center gap-2 font-label-md text-brand-accent">
            <Icon name="check_circle" className="text-[16px]" />
            SIMULATION COMPLETE
          </div>
          <h2 className="text-2xl font-semibold text-deep-navy">{roadName} Scenario</h2>
          <p className="mt-1 text-sm text-on-surface-variant">
            Impact analysis for {roadName} intervention during peak hours.
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="rounded p-1 text-on-surface-variant hover:text-deep-navy"
        >
          <Icon name="close" />
        </button>
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
        <MetricCard
          label="NETWORK CONGESTION"
          before={`${result.baseline.congestion_index}%`}
          after={`${result.scenario.congestion_index}%`}
          delta={`+${result.delta_congestion}% from baseline`}
        />
        <MetricCard
          label="AVG TRAVEL TIME"
          before={`${result.baseline.avg_travel_time_min}m`}
          after={`${result.scenario.avg_travel_time_min}m`}
          delta={`+${result.delta_travel_time_pct}% delay`}
        />
        <MetricCard
          label="EST. CO2 EMISSIONS"
          before={`${result.baseline.co2_kg} kg`}
          after={`${result.scenario.co2_kg} kg`}
          delta={`+${result.delta_co2_kg} kg impact`}
        />
      </div>

      {result.alternate_routes.length > 0 && (
        <div className="mt-4 rounded-lg border border-outline-variant bg-shell-surface p-4">
          <h3 className="mb-2 flex items-center gap-2 text-lg font-semibold text-deep-navy">
            <Icon name="insights" className="text-interaction-blue" />
            Network Impact
          </h3>
          <p className="text-sm leading-relaxed text-on-surface-variant">
            Traffic volume is primarily forced onto{' '}
            {result.alternate_routes.map((r, i) => (
              <span key={r}>
                <span className="rounded bg-surface-container px-1 font-semibold text-deep-navy">
                  {r}
                </span>
                {i < result.alternate_routes.length - 1 ? ' and ' : ''}
              </span>
            ))}
            , exceeding baseline capacity within the simulation window.
          </p>
        </div>
      )}

      <div className="mt-4 rounded-lg border-2 border-interaction-blue/30 bg-shell-surface p-4">
        <h3 className="mb-3 flex items-center gap-2 text-lg font-semibold text-deep-navy">
          <Icon name="smart_toy" className="text-[24px] text-interaction-blue" />
          ENTROUGE RECOMMENDATION
        </h3>
        <div className="space-y-3 text-sm text-deep-navy">
          <div>
            <h4 className="mb-1 font-label-md font-bold uppercase tracking-widest text-interaction-blue">
              What happened?
            </h4>
            <p>Closure triggered increased load on alternate corridors.</p>
          </div>
          <div>
            <h4 className="mb-1 font-label-md font-bold uppercase tracking-widest text-interaction-blue">
              Why?
            </h4>
            <p>Diverted volume exceeds capacity on parallel routes.</p>
          </div>
          <div>
            <h4 className="mb-1 font-label-md font-bold uppercase tracking-widest text-interaction-blue">
              What should we do?
            </h4>
            <ul className="space-y-2">
              <li className="flex items-start gap-2 rounded border border-outline-variant bg-canvas p-3">
                <Icon name="adjust" className="text-[20px] text-interaction-blue" />
                <div>
                  <div className="font-label-md font-bold">Extend Green Phase by +15s</div>
                  <div className="font-label-sm text-on-surface-variant">
                    On stressed alternate corridors
                  </div>
                </div>
              </li>
              <li className="flex items-start gap-2 rounded border border-outline-variant bg-canvas p-3">
                <Icon name="adjust" className="text-[20px] text-interaction-blue" />
                <div>
                  <div className="font-label-md font-bold">Deploy VMS Rerouting</div>
                  <div className="font-label-sm text-on-surface-variant">
                    At key junction approaches
                  </div>
                </div>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}

function MetricCard({
  label,
  before,
  after,
  delta,
}: {
  label: string
  before: string
  after: string
  delta: string
}) {
  return (
    <div className="hover-glow flex flex-col rounded-lg border border-outline-variant bg-shell-surface p-4 shadow-sm transition-all">
      <div className="mb-1 flex items-center justify-between font-label-sm font-bold text-on-surface-variant">
        {label}
        <Icon name="trending_up" className="text-[16px] text-error" />
      </div>
      <div className="flex items-baseline gap-3">
        <span className="text-2xl font-semibold text-on-surface-variant line-through opacity-60">
          {before}
        </span>
        <span className="text-4xl font-bold text-error">{after}</span>
      </div>
      <div className="mt-1 font-label-sm font-bold text-error">{delta}</div>
    </div>
  )
}
