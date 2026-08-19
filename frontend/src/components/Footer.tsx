export function Footer() {
  return (
    <footer className="fixed bottom-0 left-0 z-30 flex w-full items-center justify-between border-t border-outline-variant bg-shell-surface px-6 py-2 shadow-sm">
      <div className="font-label-sm text-on-surface-variant">
        © 2024 ENTROUGE URBAN MOBILITY INTELLIGENCE
      </div>
      <div className="flex items-center gap-6">
        <span className="cursor-pointer font-label-sm text-on-surface-variant transition-colors hover:text-brand-accent">
          System Status: Operational
        </span>
        <span className="cursor-pointer font-label-sm text-on-surface-variant transition-colors hover:text-brand-accent">
          API v0.1
        </span>
        <span className="cursor-pointer font-label-sm text-on-surface-variant transition-colors hover:text-brand-accent">
          Documentation
        </span>
      </div>
    </footer>
  )
}
