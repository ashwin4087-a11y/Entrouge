import { Icon } from '@/components/Icon'
import type { ScenarioAction, SelectedRoad } from '@/types'

interface FloatingCorridorCardProps {
  road: SelectedRoad
  congestion: number
  action: ScenarioAction
  onActionChange: (action: ScenarioAction) => void
  onRunScenario: () => void
  onClose: () => void
  loading: boolean
}

export function FloatingCorridorCard({
  road,
  congestion,
  action,
  onActionChange,
  onRunScenario,
  onClose,
  loading,
}: FloatingCorridorCardProps) {
  const loadPct = Math.round(congestion * 100)

  return (
    <div className="absolute top-1/4 left-1/4 z-20 w-[320px] rounded-[6px] border border-brand-accent bg-shell-surface p-4 shadow-lg backdrop-blur-md transition-all">
      <div className="mb-3 flex items-start justify-between border-b border-outline-variant pb-2">
        <div>
          <div className="mb-1 font-label-sm uppercase tracking-wider text-brand-accent">
            Selected Corridor
          </div>
          <h3 className="text-lg font-semibold text-brand-text">{road.name}</h3>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="text-on-surface-variant hover:text-brand-text"
        >
          <Icon name="close" className="text-[18px]" />
        </button>
      </div>

      <div className="mb-4 flex items-center gap-4">
        <div className="h-2 flex-1 overflow-hidden rounded-full border border-outline-variant/50 bg-canvas">
          <div
            className={`h-full ${loadPct > 70 ? 'bg-error' : 'bg-brand-accent'}`}
            style={{ width: `${loadPct}%` }}
          />
        </div>
        <span className={`font-mono font-label-md ${loadPct > 70 ? 'text-error' : 'text-brand-accent'}`}>
          {loadPct}% Load
        </span>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={() => onActionChange('close')}
          className={`flex items-center justify-center gap-1 rounded-[6px] border py-2 font-label-md shadow-sm transition-colors ${
            action === 'close'
              ? 'border-error bg-error-container text-error'
              : 'border-outline-variant bg-white text-brand-text hover:border-error/50'
          }`}
        >
          <Icon name="block" className="text-[14px] text-error" />
          Close Road
        </button>
        <button
          type="button"
          onClick={() => onActionChange('restrict')}
          className={`flex items-center justify-center gap-1 rounded-[6px] border py-2 font-label-md shadow-sm transition-colors ${
            action === 'restrict'
              ? 'border-brand-accent bg-brand-accent/10 text-brand-accent'
              : 'border-outline-variant bg-white text-brand-text hover:border-brand-accent/50'
          }`}
        >
          <Icon name="add_road" className="text-[14px] text-brand-accent" />
          Restrict
        </button>
        <button
          type="button"
          disabled={loading}
          onClick={onRunScenario}
          className="col-span-2 mt-1 flex items-center justify-center gap-1 rounded-[6px] border border-brand-accent bg-brand-accent py-2 font-label-md text-white shadow-sm transition-colors hover:bg-brand-accent-hover disabled:opacity-50"
        >
          <Icon name="science" className="text-[14px]" />
          {loading ? 'Running…' : 'Run Scenario'}
        </button>
      </div>
    </div>
  )
}
