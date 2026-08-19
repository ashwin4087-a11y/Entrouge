import { Icon } from '@/components/Icon'

interface HeaderProps {
  copilotOpen: boolean
  onCopilotToggle: () => void
}

const NAV_ITEMS = ['DIGITAL TWIN', 'SCENARIOS', 'REPORTS', 'COPILOT'] as const

export function Header({ copilotOpen, onCopilotToggle }: HeaderProps) {
  return (
    <header className="fixed top-0 left-0 z-50 flex h-16 w-full items-center justify-between border-b border-outline-variant bg-shell-surface px-6 shadow-sm">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <img
            src="/entrouge-logo.png"
            alt="Entrouge"
            className="h-8 w-8 rounded-lg object-contain"
          />
          <span className="text-lg font-semibold tracking-widest text-deep-navy uppercase">
            ENTROUGE
          </span>
        </div>
        <nav className="ml-8 hidden items-center gap-6 md:flex">
          {NAV_ITEMS.map((item) => (
            <a
              key={item}
              href="#"
              onClick={(e) => {
                e.preventDefault()
                if (item === 'COPILOT') onCopilotToggle()
              }}
              className={`font-label-md px-2 py-1 transition-colors ${
                item === 'DIGITAL TWIN' || (item === 'COPILOT' && copilotOpen)
                  ? 'border-b-2 border-brand-accent font-bold text-brand-accent'
                  : 'text-on-surface-variant hover:bg-canvas'
              }`}
            >
              {item}
            </a>
          ))}
        </nav>
      </div>
      <div className="flex items-center gap-4">
        <button
          type="button"
          className="flex items-center gap-2 rounded-[6px] border border-outline-variant bg-canvas px-4 py-1.5 font-label-md text-brand-text transition-colors hover:border-brand-accent"
        >
          <Icon name="sensors" className="text-[16px] text-brand-accent" />
          Live Status
        </button>
        <div className="flex items-center gap-1 text-on-surface-variant">
          <button type="button" className="rounded-full p-2 transition-colors hover:bg-canvas">
            <Icon name="notifications" />
          </button>
          <button type="button" className="rounded-full p-2 transition-colors hover:bg-canvas">
            <Icon name="schedule" />
          </button>
          <button type="button" className="rounded-full p-2 transition-colors hover:bg-canvas">
            <Icon name="account_circle" />
          </button>
        </div>
        <button
          type="button"
          onClick={onCopilotToggle}
          className="ml-2 flex items-center gap-2 rounded-[6px] bg-brand-accent px-3 py-1.5 font-label-md text-white shadow-sm transition-colors hover:bg-brand-accent-hover"
        >
          <Icon name="smart_toy" className="text-[18px]" />
          Copilot
        </button>
      </div>
    </header>
  )
}
