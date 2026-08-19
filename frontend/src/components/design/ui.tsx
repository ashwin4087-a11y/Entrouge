import { Icon } from '@/components/Icon'
import type { ReactNode } from 'react'

export function ScreenTitle({
  title,
  subtitle,
  badge,
}: {
  title: string
  subtitle?: string
  badge?: ReactNode
}) {
  return (
    <div className="border-b border-outline-variant bg-shell-surface px-6 py-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-deep-navy">{title}</h1>
          {subtitle && (
            <p className="mt-1 text-sm text-on-surface-variant">{subtitle}</p>
          )}
        </div>
        {badge}
      </div>
    </div>
  )
}

export function Card({
  children,
  className = '',
}: {
  children: ReactNode
  className?: string
}) {
  return (
    <div
      className={`rounded-[6px] border border-outline-variant bg-white shadow-sm ${className}`}
    >
      {children}
    </div>
  )
}

export function MetricBox({
  label,
  value,
  sub,
  mono = true,
}: {
  label: string
  value: string
  sub?: string
  mono?: boolean
}) {
  return (
    <Card className="p-4">
      <div className="mb-1 font-label-sm uppercase text-on-surface-variant">{label}</div>
      <div
        className={`text-2xl font-semibold text-deep-navy ${mono ? 'font-mono' : ''}`}
      >
        {value}
      </div>
      {sub && <div className="mt-1 text-xs text-on-surface-variant">{sub}</div>}
    </Card>
  )
}

export function PrimaryBtn({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <button
      type="button"
      className={`rounded-[6px] bg-brand-accent px-4 py-2.5 font-label-md font-bold tracking-wide text-white shadow-sm hover:bg-brand-accent-hover ${className}`}
    >
      {children}
    </button>
  )
}

export function GhostBtn({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <button
      type="button"
      className={`rounded-[6px] border border-outline-variant bg-canvas px-4 py-2 font-label-md text-deep-navy hover:border-brand-accent ${className}`}
    >
      {children}
    </button>
  )
}

export function StatusBadge({
  label,
  variant = 'default',
}: {
  label: string
  variant?: 'default' | 'error' | 'success' | 'warning'
}) {
  const colors = {
    default: 'bg-brand-accent/10 text-brand-accent border-brand-accent/30',
    error: 'bg-error-container text-error border-error/30',
    success: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    warning: 'bg-amber-50 text-amber-800 border-amber-200',
  }
  return (
    <span
      className={`inline-flex items-center gap-1 rounded border px-2 py-0.5 font-label-sm ${colors[variant]}`}
    >
      {label}
    </span>
  )
}

export function SectionLabel({
  children,
  className = '',
}: {
  children: ReactNode
  className?: string
}) {
  return (
    <h3
      className={`mb-3 border-b border-outline-variant pb-1 font-label-md uppercase text-on-surface-variant ${className}`}
    >
      {children}
    </h3>
  )
}

export function ActionChip({
  icon,
  label,
  selected,
}: {
  icon: string
  label: string
  selected?: boolean
}) {
  return (
    <div
      className={`flex cursor-default flex-col items-center rounded-[6px] border-2 p-3 text-center ${
        selected
          ? 'border-brand-accent bg-brand-accent/10'
          : 'border-outline-variant bg-white opacity-80'
      }`}
    >
      <Icon name={icon} className={`mb-1 ${selected ? 'text-brand-accent' : 'text-deep-navy'}`} />
      <span className="font-label-sm font-bold text-deep-navy">{label}</span>
    </div>
  )
}
