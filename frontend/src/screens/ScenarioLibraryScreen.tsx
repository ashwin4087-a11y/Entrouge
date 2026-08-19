import { Card, GhostBtn, MetricBox, ScreenTitle, SectionLabel, StatusBadge } from '@/components/design/ui'
import { ScreenShell } from '@/components/layout/ScreenShell'

const SCENARIOS = [
  {
    title: 'ANNA SALAI CLOSURE',
    peak: 'Evening Peak',
    window: '17:00–20:00',
    result: '+18% congestion',
    commuters: '14,200 affected commuters',
    status: 'COMPLETED',
  },
  {
    title: 'OMR LANE REDUCTION',
    peak: 'Morning Peak',
    window: '07:00–10:00',
    result: '+11% congestion',
    commuters: '8,200 affected commuters',
    status: 'COMPLETED',
  },
  {
    title: 'GST ROAD BUS PRIORITY',
    peak: 'Morning Peak',
    window: '07:30–09:30',
    result: '-8% travel time',
    commuters: '12,400 affected commuters',
    status: 'COMPLETED',
  },
  {
    title: 'GUINDY SIGNAL RETIMING',
    peak: 'Evening Peak',
    window: '16:30–19:30',
    result: '-12% intersection delay',
    commuters: 'Network-wide',
    status: 'COMPLETED',
  },
]

export function ScenarioLibraryScreen() {
  return (
    <ScreenShell activeNav="DIGITAL TWIN">
      <ScreenTitle
        title="SCENARIO LIBRARY"
        subtitle="Explore, compare and reuse mobility scenarios."
      />
      <div className="flex-1 overflow-y-auto bg-canvas p-6">
        <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-4">
          <MetricBox label="Total Scenarios" value="24" />
          <MetricBox label="Completed" value="19" />
          <MetricBox label="Running" value="2" />
          <MetricBox label="Drafts" value="3" />
        </div>

        <div className="mb-6 flex flex-wrap gap-2">
          {['Search', 'Status', 'Corridor', 'Intervention', 'Date'].map((f) => (
            <span
              key={f}
              className="rounded-[6px] border border-outline-variant bg-white px-3 py-2 font-label-md text-deep-navy"
            >
              {f}
            </span>
          ))}
        </div>

        <SectionLabel>Scenarios</SectionLabel>
        <div className="grid gap-4 md:grid-cols-2">
          {SCENARIOS.map((s) => (
            <Card key={s.title} className="p-4">
              <div className="flex items-start justify-between gap-2">
                <h3 className="font-semibold text-deep-navy">{s.title}</h3>
                <StatusBadge label={s.status} variant="success" />
              </div>
              <p className="mt-1 text-sm text-on-surface-variant">{s.peak}</p>
              <p className="font-mono text-sm text-deep-navy">{s.window}</p>
              <p className="mt-2 font-mono text-sm font-semibold text-brand-accent">{s.result}</p>
              <p className="text-xs text-on-surface-variant">{s.commuters}</p>
              <div className="mt-4 flex gap-2">
                <GhostBtn>Open</GhostBtn>
                <GhostBtn>Compare</GhostBtn>
                <GhostBtn>Duplicate</GhostBtn>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </ScreenShell>
  )
}
