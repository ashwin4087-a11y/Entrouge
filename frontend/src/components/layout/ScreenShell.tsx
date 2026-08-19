import { AppFooter } from '@/components/layout/AppFooter'
import { AppHeader, type NavItem } from '@/components/layout/AppHeader'
import type { ReactNode } from 'react'

interface ScreenShellProps {
  activeNav?: NavItem
  children: ReactNode
  showFooter?: boolean
}

export function ScreenShell({
  activeNav,
  children,
  showFooter = true,
}: ScreenShellProps) {
  return (
    <div className="flex h-full flex-col overflow-hidden bg-canvas text-deep-navy">
      <AppHeader activeNav={activeNav} />
      <div className="mt-16 flex min-h-0 flex-1 flex-col overflow-hidden">{children}</div>
      {showFooter && <AppFooter />}
    </div>
  )
}
