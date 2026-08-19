import {
  Card,
  GhostBtn,
  MetricBox,
  PrimaryBtn,
  ScreenTitle,
  SectionLabel,
} from '@/components/design/ui'
import { ScreenShell } from '@/components/layout/ScreenShell'

const REPORTS = [
  {
    title: 'ANNA SALAI CLOSURE — EVENING PEAK',
    date: '19 Aug 2026',
    scenario: 'Anna Salai Closure',
    result: '+18% congestion',
  },
  {
    title: 'ANNA SALAI + BUS PRIORITY',
    date: '18 Aug 2026',
    scenario: 'Closure + mitigation',
    result: '-24% congestion vs closure-only',
  },
  {
    title: 'OMR LANE REDUCTION',
    date: '17 Aug 2026',
    scenario: 'OMR Lane Reduction',
    result: '+11% congestion',
  },
]

export function ReportsScreen() {
  return (
    <ScreenShell activeNav="REPORTS">
      <ScreenTitle
        title="REPORTS"
        subtitle="Simulation results and network intelligence."
      />
      <div className="flex-1 overflow-y-auto bg-canvas p-6">
        <div className="mb-6 grid grid-cols-3 gap-3">
          <MetricBox label="Reports Generated" value="18" />
          <MetricBox label="This Month" value="7" />
          <MetricBox label="Scenarios Analyzed" value="24" />
        </div>

        <Card className="mb-6 border-2 border-brand-accent/30 bg-shell-surface p-6">
          <div className="font-label-md uppercase text-brand-accent">Featured Report · Latest Analysis</div>
          <h3 className="mt-2 text-xl font-semibold text-deep-navy">Anna Salai Network Intervention</h3>
          <ul className="mt-3 space-y-1 text-sm text-on-surface-variant">
            <li>Network Impact · Congestion · Travel Time · Emissions</li>
            <li>Entrouge Recommendation included</li>
          </ul>
          <PrimaryBtn className="mt-4">View Full Report</PrimaryBtn>
        </Card>

        <SectionLabel>Report List</SectionLabel>
        <div className="space-y-3">
          {REPORTS.map((r) => (
            <Card key={r.title} className="flex flex-wrap items-center justify-between gap-4 p-4">
              <div>
                <h4 className="font-semibold text-deep-navy">{r.title}</h4>
                <p className="text-sm text-on-surface-variant">{r.date}</p>
                <p className="text-sm">Scenario: {r.scenario}</p>
                <p className="font-mono text-sm text-brand-accent">Key Result: {r.result}</p>
              </div>
              <div className="flex gap-2">
                <GhostBtn>View</GhostBtn>
                <GhostBtn>Export</GhostBtn>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </ScreenShell>
  )
}
