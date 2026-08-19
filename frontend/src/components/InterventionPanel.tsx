import { Icon } from '@/components/Icon'
import type { NetworkGeoJSON, SelectedRoad } from '@/types'
import type { InterventionConfig } from '@/types/simulation'
import { timeProfileLabel } from '@/types/simulation'
import type { ReactNode } from 'react'

interface InterventionPanelProps {
  network: NetworkGeoJSON | null
  config: InterventionConfig
  loading: boolean
  progressMessage?: string
  onConfigChange: (patch: Partial<InterventionConfig>) => void
  onSelectCorridor: (road: SelectedRoad) => void
  onRunSimulation: () => void
  onClose: () => void
}

const TIME_OPTIONS = [
  { value: 'evening_rush' as const, label: 'Evening Peak' },
  { value: 'morning_rush' as const, label: 'Morning Peak' },
  { value: 'off_peak' as const, label: 'Off Peak' },
  { value: 'all_day' as const, label: 'All Day' },
]

const DURATION_OPTIONS = [30, 60, 120]

export function InterventionPanel({
  network,
  config,
  loading,
  progressMessage,
  onConfigChange,
  onSelectCorridor,
  onRunSimulation,
  onClose,
}: InterventionPanelProps) {
  const road = config.road
  const corridors = network?.features ?? []

  const peakLoad =
    config.timeProfile === 'evening_rush' ? '+15%' : config.timeProfile === 'morning_rush' ? '+8%' : 'Nominal'

  return (
    <div className="flex min-h-[420px] min-w-0 w-full flex-col overflow-hidden rounded-lg border border-outline-variant bg-shell-surface shadow-lg">
      <div className="flex items-center justify-between border-b border-outline-variant bg-shell-surface px-6 py-4">
        <div className="flex items-center gap-2">
          <Icon name="engineering" className="text-interaction-blue" />
          <h3 className="text-lg font-semibold tracking-wide text-deep-navy">
            CONFIGURE INTERVENTION
          </h3>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="rounded p-1 text-on-surface-variant transition-colors hover:bg-surface-variant hover:text-deep-navy"
        >
          <Icon name="close" className="text-lg" />
        </button>
      </div>

      <div className="flex flex-1 flex-col gap-5 overflow-y-auto bg-canvas p-6">
        <div className="flex flex-col gap-2">
          <label className="font-label-sm font-bold uppercase tracking-wider text-on-surface-variant">
            Intervention ID
          </label>
          <div className="flex items-center gap-2">
            <span className="rounded bg-brand-accent px-2 py-1 font-label-md text-white">
              INT-{road.id.slice(-4).toUpperCase()}
            </span>
            <input
              type="text"
              readOnly
              value={`${road.name} Intervention`}
              className="flex-1 rounded border border-outline-variant bg-canvas px-3 py-2 text-sm text-deep-navy"
            />
          </div>
        </div>

        <div className="h-px bg-outline-variant opacity-50" />

        <div className="flex flex-col gap-3">
          <h4 className="font-label-md font-bold uppercase text-deep-navy">Target Corridor</h4>
          <select
            value={road.id}
            onChange={(e) => {
              const f = corridors.find((c) => c.properties.id === e.target.value)
              if (!f) return
              onSelectCorridor({
                id: f.properties.id,
                name: f.properties.name,
                length_km: f.properties.length_km ?? 0.5,
                capacity_vph: f.properties.capacity_vph ?? 2000,
              })
            }}
            className="w-full rounded border border-interaction-blue bg-canvas px-3 py-2 text-sm font-medium text-deep-navy"
          >
            {corridors.map((f) => (
              <option key={f.properties.id} value={f.properties.id}>
                {f.properties.name}
              </option>
            ))}
          </select>
          <div className="flex justify-between font-label-sm text-on-surface-variant">
            <span>Selected segment</span>
            <span className="font-bold text-interaction-blue">{road.length_km} km</span>
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <label className="font-label-sm uppercase tracking-wider text-on-surface-variant">
            Intervention Action
          </label>
          <div className="grid grid-cols-2 gap-2">
            <ActionOption icon="block" label="Full Closure" selected={config.action === 'close'} variant="error" onClick={() => onConfigChange({ action: 'close' })} />
            <ActionOption icon="merge" label="Lane Reduction" selected={config.action === 'restrict'} onClick={() => onConfigChange({ action: 'restrict' })} />
            <ActionOption icon="speed" label="Speed Limit" selected={config.action === 'slow'} onClick={() => onConfigChange({ action: 'slow' })} />
            <ActionOption icon="traffic" label="Signal Timing" selected={config.action === 'signal_timing'} onClick={() => onConfigChange({ action: 'signal_timing' })} />
          </div>
        </div>

        {config.action === 'close' && (
          <InterventionBlock title="Full Closure">
            <FieldLabel>Closure Type</FieldLabel>
            <select
              value={config.closureType}
              onChange={(e) => onConfigChange({ closureType: e.target.value as 'full' | 'partial' })}
              className="w-full rounded border border-outline-variant bg-white px-3 py-2 text-sm"
            >
              <option value="full">Full Closure</option>
              <option value="partial">Partial Closure</option>
            </select>
            <FieldLabel className="mt-3">Duration</FieldLabel>
            <DurationButtons value={config.durationMinutes} onChange={(m) => onConfigChange({ durationMinutes: m })} />
            <FieldLabel className="mt-3">Peak Period</FieldLabel>
            <PeakButtons config={config} onConfigChange={onConfigChange} />
          </InterventionBlock>
        )}

        {config.action === 'restrict' && (
          <InterventionBlock title="Lane Reduction">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <FieldLabel>Current Lanes</FieldLabel>
                <div className="font-mono text-lg font-semibold text-deep-navy">{config.currentLanes}</div>
              </div>
              <div>
                <FieldLabel>Reduced Lanes</FieldLabel>
                <div className="flex gap-2">
                  {[1, 2].map((n) => (
                    <button
                      key={n}
                      type="button"
                      onClick={() => onConfigChange({ reducedLanes: n, capacityFactor: n / config.currentLanes })}
                      className={`rounded border px-3 py-1 font-mono text-sm ${config.reducedLanes === n ? 'border-brand-accent bg-brand-accent/10 text-brand-accent' : 'border-outline-variant'}`}
                    >
                      {n}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <FieldLabel className="mt-3">Impact Duration</FieldLabel>
            <DurationButtons value={config.durationMinutes} onChange={(m) => onConfigChange({ durationMinutes: m })} />
          </InterventionBlock>
        )}

        {config.action === 'slow' && (
          <InterventionBlock title="Speed Limit">
            <FieldLabel>Current Speed</FieldLabel>
            <div className="font-mono text-lg font-semibold text-deep-navy">{config.currentSpeedKmh} km/h</div>
            <FieldLabel className="mt-3">New Speed Limit</FieldLabel>
            <div className="flex gap-2">
              {[30, 40, 50].map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => onConfigChange({ newSpeedKmh: s, speedFactor: s / config.currentSpeedKmh })}
                  className={`rounded border px-3 py-1 font-mono text-sm ${config.newSpeedKmh === s ? 'border-brand-accent bg-brand-accent/10 text-brand-accent' : 'border-outline-variant'}`}
                >
                  {s}
                </button>
              ))}
            </div>
            <FieldLabel className="mt-3">Duration</FieldLabel>
            <DurationButtons value={config.durationMinutes} onChange={(m) => onConfigChange({ durationMinutes: m })} />
          </InterventionBlock>
        )}

        {config.action === 'signal_timing' && (
          <InterventionBlock title="Signal Timing">
            <FieldLabel>Current Green Phase</FieldLabel>
            <div className="font-mono text-lg font-semibold text-deep-navy">{config.currentGreenPhaseSec} sec</div>
            <FieldLabel className="mt-3">New Green Phase</FieldLabel>
            <div className="flex items-center gap-3">
              <button type="button" onClick={() => onConfigChange({ newGreenPhaseSec: Math.max(30, config.newGreenPhaseSec - 5) })} className="rounded border border-outline-variant px-2 py-1">−</button>
              <span className="font-mono text-lg font-semibold">{config.newGreenPhaseSec} sec</span>
              <button type="button" onClick={() => onConfigChange({ newGreenPhaseSec: Math.min(90, config.newGreenPhaseSec + 5) })} className="rounded border border-outline-variant px-2 py-1">+</button>
            </div>
            <FieldLabel className="mt-3">Cycle Length</FieldLabel>
            <div className="font-mono text-lg font-semibold text-deep-navy">{config.cycleLengthSec} sec</div>
          </InterventionBlock>
        )}

        <div className="rounded border border-outline-variant bg-shell-surface p-4">
          <h4 className="mb-3 font-label-md font-bold uppercase text-deep-navy">Traffic Model Context</h4>
          <div className="space-y-2 text-sm">
            <ContextRow label="Base Condition" value={timeProfileLabel(config.timeProfile)} />
            <ContextRow label="Historical Traffic Load" value={peakLoad} />
            <ContextRow label="Average Network Speed" value="32 km/h" />
            <ContextRow label="Traffic Demand" value="14,200 veh/hr" />
          </div>
          <select
            value={config.timeProfile}
            onChange={(e) => onConfigChange({ timeProfile: e.target.value as InterventionConfig['timeProfile'] })}
            className="mt-3 w-full rounded border border-outline-variant bg-canvas px-3 py-2 text-sm"
          >
            {TIME_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex flex-col gap-3 border-t border-outline-variant bg-shell-surface p-6">
        {progressMessage && (
          <p className="text-center font-label-md text-brand-accent">{progressMessage}</p>
        )}
        <button
          type="button"
          disabled={loading}
          onClick={onRunSimulation}
          className="flex w-full items-center justify-center gap-2 rounded bg-interaction-blue py-3 text-lg font-bold tracking-wider text-white shadow-md transition-colors hover:bg-deep-navy disabled:opacity-50"
        >
          <Icon name="play_circle" className="text-[20px]" filled />
          {loading ? progressMessage ?? 'RUNNING…' : 'RUN SIMULATION'}
        </button>
      </div>
    </div>
  )
}

function InterventionBlock({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="rounded border border-outline-variant bg-white p-4">
      <h5 className="mb-3 font-label-md font-bold uppercase text-deep-navy">{title}</h5>
      {children}
    </div>
  )
}

function FieldLabel({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <div className={`font-label-sm uppercase tracking-wider text-on-surface-variant ${className}`}>{children}</div>
}

function ContextRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-2">
      <span className="text-on-surface-variant">{label}</span>
      <span className="font-medium text-deep-navy">{value}</span>
    </div>
  )
}

function DurationButtons({ value, onChange }: { value: number; onChange: (m: number) => void }) {
  return (
    <div className="flex gap-2">
      {DURATION_OPTIONS.map((m) => (
        <button
          key={m}
          type="button"
          onClick={() => onChange(m)}
          className={`rounded border px-3 py-1 text-sm ${value === m ? 'border-brand-accent bg-brand-accent/10 text-brand-accent' : 'border-outline-variant'}`}
        >
          {m} min
        </button>
      ))}
    </div>
  )
}

function PeakButtons({
  config,
  onConfigChange,
}: {
  config: InterventionConfig
  onConfigChange: (p: Partial<InterventionConfig>) => void
}) {
  return (
    <div className="flex gap-2">
      {(['morning_rush', 'evening_rush'] as const).map((p) => (
        <button
          key={p}
          type="button"
          onClick={() => onConfigChange({ timeProfile: p })}
          className={`rounded border px-3 py-1 text-sm ${config.timeProfile === p ? 'border-brand-accent bg-brand-accent/10 text-brand-accent' : 'border-outline-variant'}`}
        >
          {timeProfileLabel(p)}
        </button>
      ))}
    </div>
  )
}

function ActionOption({
  icon,
  label,
  selected,
  variant,
  onClick,
}: {
  icon: string
  label: string
  selected: boolean
  variant?: 'error'
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex cursor-pointer flex-col items-center rounded border-2 p-3 text-center transition-all ${
        selected
          ? variant === 'error'
            ? 'border-error bg-error-container'
            : 'border-interaction-blue bg-brand-accent/10'
          : 'border-outline-variant opacity-70 hover:border-interaction-blue hover:opacity-100'
      }`}
    >
      <Icon name={icon} className={`mb-1 ${variant === 'error' ? 'text-error' : 'text-deep-navy'}`} />
      <span className={`font-label-sm font-bold ${variant === 'error' && selected ? 'text-error' : 'text-deep-navy'}`}>
        {label}
      </span>
    </button>
  )
}
