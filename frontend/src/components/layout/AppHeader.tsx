import { Link, useLocation } from 'react-router-dom'
import { Icon } from '@/components/Icon'

export type NavItem = 'DIGITAL TWIN' | 'REPORTS'

interface AppHeaderProps {
  activeNav?: NavItem
}

const NAV: { item: NavItem; path: string }[] = [
  { item: 'DIGITAL TWIN', path: '/digital-twin' },
  { item: 'REPORTS', path: '/reports' },
]

export function AppHeader({ activeNav }: AppHeaderProps) {
  const location = useLocation()
  const resolvedNav =
    activeNav ??
    (location.pathname.startsWith('/reports') ? 'REPORTS' : 'DIGITAL TWIN')

  return (
    <header className="fixed top-0 left-0 z-50 flex h-16 w-full items-center justify-between border-b border-outline-variant bg-shell-surface px-6 shadow-sm">
      <div className="flex items-center gap-4">
        <Link to="/digital-twin" className="flex items-center gap-2.5">
          <img
            src="/entrouge-logo.png"
            alt=""
            className="h-8 w-8 shrink-0 rounded-md object-contain"
          />
          <span className="text-lg font-semibold tracking-widest text-deep-navy uppercase">
            ENTROUGE
          </span>
        </Link>
        <nav className="ml-6 hidden items-center gap-5 md:flex">
          {NAV.map(({ item, path }) => (
            <Link
              key={item}
              to={path}
              className={`font-label-md px-2 py-1 ${
                resolvedNav === item
                  ? 'border-b-2 border-brand-accent font-bold text-brand-accent'
                  : 'text-deep-navy hover:text-brand-accent'
              }`}
            >
              {item}
            </Link>
          ))}
        </nav>
      </div>
      <div className="flex items-center gap-3">
        <div
          className="hidden items-center gap-2 rounded-[6px] border border-outline-variant bg-canvas px-4 py-1.5 font-label-md text-deep-navy md:flex"
        >
          <Icon name="sensors" className="text-[16px] text-brand-accent" />
          Live Status
        </div>
        <div className="flex items-center gap-0.5 text-deep-navy">
          <button type="button" className="rounded-full p-2 hover:bg-canvas" aria-label="Notifications">
            <Icon name="notifications" />
          </button>
          <button type="button" className="rounded-full p-2 hover:bg-canvas" aria-label="Activity">
            <Icon name="schedule" />
          </button>
          <button type="button" className="rounded-full p-2 hover:bg-canvas" aria-label="Profile">
            <Icon name="account_circle" />
          </button>
        </div>
      </div>
    </header>
  )
}
