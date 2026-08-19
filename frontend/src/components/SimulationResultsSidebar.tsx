import { Link } from 'react-router-dom'
import { Icon } from '@/components/Icon'
import type { ReactNode } from 'react'
import { useSimulation } from '@/context/SimulationContext'
import type { MetricDelta } from '@/types/simulation'

function formatDelta(value: number, unit = ''): string {
  const sign = value > 0 ? '+' : ''
  return `${sign}${value}${unit}`
}

function DeltaBadge({ value, unit = '', invert = false }: { value: number; unit?: string; invert?: boolean }) {
  const isBad = invert ? value < 0 : value > 0
  const isGood = invert ? value > 0 : value < 0
  const color = isBad ? 'text-error' : isGood ? 'text-[#2d6a4f]' : 'text-on-surface-variant'
  return <span className={`font-mono font-bold ${color}`}>{formatDelta(value, unit)}</span>
}

export function SimulationResultsSidebar() {
  const { currentResult, applyRecommendation, clearResult } = useSimulation()
  if (!currentResult) return null

  const r = currentResult

  return (
    <div className="flex min-h-[420px] min-w-0 w-full flex-col overflow-hidden rounded-lg border border-outline-variant bg-shell-surface shadow-lg">
      <div className="border-b border-outline-variant px-6 py-4">
        <div className="mb-1 flex items-center gap-2 font-label-md text-brand-accent">
          <Icon name="check_circle" className="text-[16px]" />
          SIMULATION COMPLETE
        </div>
        <h3 className="text-lg font-semibold text-deep-navy">{r.title}</h3>
        <p className="text-sm text-on-surface-variant">{r.interventionLabel} · {r.corridor.name}</p>
      </div>

      <div className="flex-1 space-y-4 overflow-y-auto p-6">
        <MetricBlock
          label="NETWORK CONGESTION"
          baseline={`${r.baseline.congestionPct}%`}
          simulated={`${r.simulated.congestionPct}%`}
          delta={<DeltaBadge value={r.delta.congestionPct} unit="%" />}
        />
        <MetricBlock
          label="AVERAGE TRAVEL TIME"
          baseline={`${r.baseline.travelTimeMin} min`}
          simulated={`${r.simulated.travelTimeMin} min`}
          delta={<DeltaBadge value={r.delta.travelTimeMin} unit=" min" />}
        />
        <MetricBlock
          label="CO₂ EMISSIONS"
          baseline={`${r.baseline.co2Kg} kg`}
          simulated={`${r.simulated.co2Kg} kg`}
          delta={<DeltaBadge value={r.delta.co2Kg} unit=" kg" invert />}
        />
        <MetricBlock
          label="AVERAGE SPEED"
          baseline={`${r.baseline.avgSpeedKmh} km/h`}
          simulated={`${r.simulated.avgSpeedKmh} km/h`}
          delta={<DeltaBadge value={r.delta.avgSpeedKmh} unit=" km/h" invert />}
        />
        <MetricBlock
          label="TRAFFIC VOLUME"
          baseline={`${r.baseline.trafficVolumeVph.toLocaleString()} veh/hr`}
          simulated={`${r.simulated.trafficVolumeVph.toLocaleString()} veh/hr`}
          delta={<DeltaBadge value={r.delta.trafficVolumeVph} />}
        />
        <div className="rounded border border-outline-variant bg-canvas p-3">
          <div className="font-label-sm uppercase text-on-surface-variant">Affected Commuters</div>
          <div className="font-mono text-2xl font-bold text-deep-navy">{r.affectedPopulation}</div>
        </div>

        <InsightBlock title="WHAT HAPPENED?" text={r.whatHappened} />
        <InsightBlock title="WHY DID IT HAPPEN?" text={r.whyItHappened} />

        <div className="rounded border border-outline-variant bg-canvas p-3">
          <h4 className="mb-2 font-label-md font-bold uppercase text-deep-navy">Traffic Diversion</h4>
          <p className="mb-2 text-xs text-on-surface-variant">PRIMARY: {r.primaryAffectedCorridor}</p>
          <ul className="space-y-1 text-sm">
            {r.divertedTraffic.filter((d) => d.changePct > 0).map((d) => (
              <li key={d.edgeId} className="flex justify-between gap-2">
                <span>{d.name}</span>
                <span className="font-mono text-brand-accent">+{d.changePct}%</span>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h4 className="mb-2 font-label-md font-bold uppercase text-deep-navy">What Should We Test Next?</h4>
          <div className="space-y-2">
            {r.recommendations.map((rec, i) => (
              <div key={rec.id} className="rounded border border-outline-variant bg-white p-3">
                <p className="text-sm font-medium text-deep-navy">{i + 1}. {rec.title}</p>
                <p className="mt-1 text-xs text-on-surface-variant">{rec.reason}</p>
                <button
                  type="button"
                  onClick={() => applyRecommendation(rec.patch)}
                  className="mt-2 rounded border border-brand-accent px-3 py-1 font-label-md text-brand-accent hover:bg-brand-accent/10"
                >
                  TEST THIS
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-2 border-t border-outline-variant p-4">
        <Link
          to={`/reports/${r.id}`}
          className="flex w-full items-center justify-center rounded bg-brand-accent py-2.5 font-label-md font-bold text-white hover:bg-brand-accent-hover"
        >
          VIEW REPORT
        </Link>
        <button
          type="button"
          onClick={clearResult}
          className="w-full rounded border border-outline-variant py-2 font-label-md text-deep-navy hover:border-brand-accent"
        >
          BACK TO DIGITAL TWIN
        </button>
      </div>
    </div>
  )
}

function MetricBlock({
  label,
  baseline,
  simulated,
  delta,
}: {
  label: string
  baseline: string
  simulated: string
  delta: ReactNode
}) {
  return (
    <div className="rounded border border-outline-variant bg-canvas p-3">
      <div className="mb-2 font-label-sm uppercase text-on-surface-variant">{label}</div>
      <div className="grid grid-cols-3 gap-2 text-sm">
        <div>
          <div className="text-xs text-on-surface-variant">Baseline</div>
          <div className="font-mono font-semibold">{baseline}</div>
        </div>
        <div>
          <div className="text-xs text-on-surface-variant">Simulated</div>
          <div className="font-mono font-semibold">{simulated}</div>
        </div>
        <div>
          <div className="text-xs text-on-surface-variant">Change</div>
          <div>{delta}</div>
        </div>
      </div>
    </div>
  )
}

function InsightBlock({ title, text }: { title: string; text: string }) {
  return (
    <div className="rounded border border-brand-accent/20 bg-brand-accent/5 p-3">
      <h4 className="mb-1 font-label-md font-bold uppercase text-brand-accent">{title}</h4>
      <p className="text-sm leading-relaxed text-deep-navy">{text}</p>
    </div>
  )
}

export function compareMetrics(results: { title: string; delta: MetricDelta; interventionLabel: string }[]) {
  if (results.length < 2) return null
  const best = results.reduce((a, b) =>
    a.delta.congestionPct < b.delta.congestionPct ? a : b,
  )
  return best
}
