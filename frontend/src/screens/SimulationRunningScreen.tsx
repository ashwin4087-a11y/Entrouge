import { MapHero } from '@/components/design/MapHero'
import { Card, MetricBox, ScreenTitle } from '@/components/design/ui'
import { ScreenShell } from '@/components/layout/ScreenShell'

const PIPELINE = [
  { label: 'NETWORK MODEL', status: 'complete' },
  { label: 'TRAFFIC ASSIGNMENT', status: 'running' },
  { label: 'CONGESTION PROPAGATION', status: 'running' },
  { label: 'EMISSIONS MODEL', status: 'pending' },
  { label: 'RESULT AGGREGATION', status: 'pending' },
] as const

export function SimulationRunningScreen() {
  return (
    <ScreenShell activeNav="DIGITAL TWIN">
      <ScreenTitle
        title="RUNNING SIMULATION"
        subtitle="Calculating network response to Anna Salai closure."
      />
      <div className="flex min-h-0 flex-1 overflow-hidden">
        <div className="relative min-h-0 flex-1">
          <MapHero variant="running" className="h-full min-h-[360px]" />
          <div className="absolute bottom-6 left-1/2 z-10 -translate-x-1/2 rounded-[6px] border border-outline-variant bg-shell-surface/95 px-6 py-2 font-label-md text-deep-navy shadow-lg backdrop-blur-sm">
            Calculating network-wide impact…
          </div>
        </div>
        <aside className="w-[360px] shrink-0 overflow-y-auto border-l border-outline-variant bg-canvas p-4 space-y-4">
          <h3 className="font-label-md uppercase text-on-surface-variant">Simulation Pipeline</h3>
          <div className="space-y-2">
            {PIPELINE.map((step) => (
              <div
                key={step.label}
                className="flex items-center justify-between rounded-[6px] border border-outline-variant bg-white px-3 py-2"
              >
                <span className="text-sm font-medium text-deep-navy">{step.label}</span>
                <PipelineStatus status={step.status} />
              </div>
            ))}
          </div>
          <Card className="p-4">
            <div className="mb-2 font-label-sm text-on-surface-variant">Overall Progress</div>
            <div className="h-2 overflow-hidden rounded-full bg-shell-surface">
              <div className="h-full w-[67%] bg-brand-accent" />
            </div>
            <div className="mt-1 font-mono text-2xl font-bold text-brand-accent">67%</div>
          </Card>
          <SectionMetrics />
        </aside>
      </div>
    </ScreenShell>
  )
}

function PipelineStatus({ status }: { status: 'complete' | 'running' | 'pending' }) {
  if (status === 'complete')
    return <span className="font-label-sm text-emerald-600">✓ Complete</span>
  if (status === 'running')
    return <span className="font-label-sm text-brand-accent">● Running</span>
  return <span className="font-label-sm text-on-surface-variant">Pending</span>
}

function SectionMetrics() {
  return (
    <>
      <h3 className="font-label-md uppercase text-on-surface-variant">Live Computation</h3>
      <div className="grid grid-cols-2 gap-3">
        <MetricBox label="Scenario" value="Anna Salai Closure" mono={false} />
        <MetricBox label="Model" value="Evening Peak" mono={false} />
        <MetricBox label="Affected Vehicles" value="14,200+" />
        <MetricBox label="Nodes Analyzed" value="284" />
        <MetricBox label="Corridors Analyzed" value="37" />
      </div>
    </>
  )
}
