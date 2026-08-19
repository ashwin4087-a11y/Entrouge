export function AppFooter() {
  return (
    <footer className="shrink-0 flex h-10 items-center justify-between border-t border-outline-variant bg-shell-surface px-6 shadow-sm">
      <div className="font-label-sm text-on-surface-variant">
        © 2026 ENTROUGE URBAN MOBILITY INTELLIGENCE
      </div>
      <div className="flex items-center gap-6">
        <span className="font-label-sm text-on-surface-variant">System Status: Operational</span>
        <span className="font-label-sm text-on-surface-variant">API v0.1</span>
        <span className="font-label-sm text-on-surface-variant">Documentation</span>
      </div>
    </footer>
  )
}
