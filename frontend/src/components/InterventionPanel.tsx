import { Icon } from '@/components/Icon'
import type { ScenarioAction, SelectedRoad, TimeProfile } from '@/types'

interface InterventionPanelProps {
  road: SelectedRoad
  action: ScenarioAction
  timeProfile: TimeProfile
  durationHours: number
  loading: boolean
  onActionChange: (action: ScenarioAction) => void
  onTimeProfileChange: (profile: TimeProfile) => void
  onDurationChange: (hours: number) => void
  onRunSimulation: () => void
  onClose: () => void
}

const TIME_OPTIONS: { value: TimeProfile; label: string }[] = [
  { value: 'evening_rush', label: 'Evening Peak (Historical avg + 15% load)' },
  { value: 'morning_rush', label: 'Morning Peak (Historical avg)' },
  { value: 'off_peak', label: 'Off-Peak / Nominal' },
  { value: 'all_day', label: 'All Day' },
]

export function InterventionPanel({
  road,
  action,
  timeProfile,
  durationHours,
  loading,
  onActionChange,
  onTimeProfileChange,
  onDurationChange,
  onRunSimulation,
  onClose,
}: InterventionPanelProps) {
  return (
    <div className="absolute top-4 right-4 bottom-4 z-20 hidden w-[400px] flex-col overflow-hidden rounded-xl border border-outline-variant bg-shell-surface shadow-lg md:flex">
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

      <div className="flex flex-1 flex-col gap-6 overflow-y-auto bg-canvas p-6">
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

        <div className="flex flex-col gap-4">
          <h4 className="-mx-2 flex items-center gap-2 rounded bg-shell-surface px-2 py-1 font-label-md font-bold uppercase text-deep-navy">
            <Icon name="my_location" className="text-[16px] text-interaction-blue" />
            Impact Area
          </h4>
          <div className="flex flex-col gap-2">
            <label className="font-label-sm uppercase tracking-wider text-on-surface-variant">
              Target Corridor
            </label>
            <div className="flex items-center overflow-hidden rounded border border-interaction-blue">
              <div className="border-r border-outline-variant bg-shell-surface py-2 pl-3">
                <Icon name="search" className="text-[18px] text-on-surface-variant" />
              </div>
              <input
                type="text"
                readOnly
                value={road.name}
                className="w-full border-none bg-canvas py-2 pl-3 text-sm font-medium text-deep-navy focus:ring-0"
              />
            </div>
            <div className="mt-1 flex justify-between font-label-sm text-on-surface-variant">
              <span>Selected segment</span>
              <span className="font-bold text-interaction-blue">{road.length_km} km</span>
            </div>
          </div>

          <div className="mt-2 flex flex-col gap-2">
            <label className="font-label-sm uppercase tracking-wider text-on-surface-variant">
              Intervention Action
            </label>
            <div className="grid grid-cols-3 gap-2">
              <ActionOption
                icon="block"
                label="Full Closure"
                selected={action === 'close'}
                variant="error"
                onClick={() => onActionChange('close')}
              />
              <ActionOption
                icon="merge"
                label="Lane Reduction"
                selected={action === 'restrict'}
                onClick={() => onActionChange('restrict')}
              />
              <ActionOption
                icon="speed"
                label="Speed Limit"
                selected={action === 'slow'}
                onClick={() => onActionChange('slow')}
              />
            </div>
          </div>
        </div>

        <div className="h-px bg-outline-variant opacity-50" />

        <div className="flex flex-col gap-4">
          <h4 className="-mx-2 flex items-center gap-2 rounded bg-shell-surface px-2 py-1 font-label-md font-bold uppercase text-deep-navy">
            <Icon name="model_training" className="text-[16px] text-interaction-blue" />
            Traffic Model Context
          </h4>
          <div className="flex flex-col gap-2">
            <label className="font-label-sm uppercase tracking-wider text-on-surface-variant">
              Base Condition Model
            </label>
            <select
              value={timeProfile}
              onChange={(e) => onTimeProfileChange(e.target.value as TimeProfile)}
              className="w-full appearance-none rounded border border-outline-variant bg-canvas px-3 py-2 text-sm font-medium text-deep-navy"
            >
              {TIME_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>
          <div className="mt-2 grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-2">
              <label className="font-label-sm uppercase tracking-wider text-on-surface-variant">
                Duration
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min={1}
                  max={12}
                  value={durationHours}
                  onChange={(e) => onDurationChange(Number(e.target.value))}
                  className="w-full rounded border border-outline-variant bg-canvas px-3 py-2 text-sm text-deep-navy"
                />
                <span className="font-label-md text-on-surface-variant">hrs</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-3 border-t border-outline-variant bg-shell-surface p-6">
        <button
          type="button"
          disabled={loading}
          onClick={onRunSimulation}
          className="flex w-full items-center justify-center gap-2 rounded bg-interaction-blue py-3 text-lg font-bold tracking-wider text-white shadow-md transition-colors hover:bg-deep-navy disabled:opacity-50"
        >
          <Icon name="play_circle" className="text-[20px]" filled />
          {loading ? 'EXECUTING…' : 'EXECUTE SIMULATION'}
        </button>
      </div>
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
      <Icon
        name={icon}
        className={`mb-1 ${variant === 'error' ? 'text-error' : 'text-deep-navy'}`}
      />
      <span
        className={`font-label-sm font-bold ${
          variant === 'error' && selected ? 'text-error' : 'text-deep-navy'
        }`}
      >
        {label}
      </span>
    </button>
  )
}
