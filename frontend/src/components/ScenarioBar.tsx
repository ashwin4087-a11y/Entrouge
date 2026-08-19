import { Icon } from '@/components/Icon'

interface ScenarioBarProps {
  scenarioName: string
  loading: boolean
  onRunSimulation: () => void
  disabled: boolean
}

export function ScenarioBar({
  scenarioName,
  loading,
  onRunSimulation,
  disabled,
}: ScenarioBarProps) {
  return (
    <div className="absolute bottom-6 left-1/2 z-20 flex -translate-x-1/2 items-center gap-6 rounded-[6px] border border-outline-variant bg-shell-surface/95 px-6 py-3 shadow-lg backdrop-blur-md">
      <div className="flex items-center gap-2">
        <Icon name="tune" className="text-brand-accent" />
        <span className="font-label-md uppercase tracking-wider text-on-surface-variant">
          Scenario:
        </span>
        <span className="text-sm font-medium text-brand-text">{scenarioName}</span>
      </div>
      <div className="h-6 w-px bg-outline-variant" />
      <button
        type="button"
        disabled={disabled || loading}
        onClick={onRunSimulation}
        className="rounded-[6px] bg-brand-accent px-6 py-1.5 font-label-md font-bold text-white shadow-sm transition-colors hover:bg-brand-accent-hover disabled:opacity-50"
      >
        {loading ? '[ RUNNING… ]' : '[ RUN SIMULATION ]'}
      </button>
    </div>
  )
}
