import { Icon } from '@/components/Icon'

interface CopilotPanelProps {
  open: boolean
  onClose: () => void
}

const SUGGESTIONS = [
  'Why did congestion increase?',
  'Where will traffic move?',
  'What is the best mitigation?',
  'Can we reduce emissions?',
]

export function CopilotPanel({ open, onClose }: CopilotPanelProps) {
  if (!open) return null

  return (
    <aside
      className={`fixed top-16 right-0 z-40 flex h-[calc(100%-2.5rem)] w-[380px] flex-col border-l border-outline-variant bg-shell-surface shadow-xl transition-transform ${
        open ? 'drawer-open' : 'drawer-closed'
      }`}
    >
      <div className="flex items-center justify-between border-b border-outline-variant bg-white p-4">
        <div>
          <div className="flex items-center gap-2">
            <Icon name="smart_toy" className="text-brand-accent" />
            <h2 className="text-lg font-semibold uppercase tracking-wide text-deep-navy">
              Entrouge Copilot
            </h2>
          </div>
          <div className="mt-1 flex items-center gap-2">
            <span className="rounded border border-brand-accent/20 bg-brand-accent/10 px-2 py-0.5 font-label-sm text-brand-accent">
              ANNA SALAI
            </span>
            <span className="font-label-sm text-on-surface-variant">Scenario: CLOSURE</span>
          </div>
        </div>
        <button type="button" onClick={onClose} className="rounded p-1 hover:bg-canvas">
          <Icon name="close" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto bg-canvas p-4 space-y-4">
        <div className="rounded-[6px] border border-outline-variant bg-white p-3 text-sm text-deep-navy shadow-sm">
          Traffic diverted to Mount Road and parallel arterials. Evening peak demand exceeds alternate
          corridor capacity by ~22%.
        </div>

        <div>
          <div className="mb-2 font-label-sm uppercase text-on-surface-variant">
            Suggested Questions
          </div>
          <div className="space-y-2">
            {SUGGESTIONS.map((q) => (
              <button
                key={q}
                type="button"
                className="w-full rounded-[6px] border border-outline-variant bg-white p-3 text-left text-sm text-deep-navy hover:border-brand-accent"
              >
                {q}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="border-t border-outline-variant bg-white p-4">
        <div className="relative">
          <input
            type="text"
            readOnly
            placeholder="Ask Copilot…"
            className="w-full rounded-[6px] border border-outline-variant bg-canvas py-2.5 pl-3 pr-10 text-sm outline-none"
          />
          <Icon
            name="send"
            className="absolute right-3 top-1/2 -translate-y-1/2 text-brand-accent"
          />
        </div>
      </div>
    </aside>
  )
}
