import { MapHero } from '@/components/design/MapHero'
import {
  Card,
  GhostBtn,
  MetricBox,
  PrimaryBtn,
  ScreenTitle,
  SectionLabel,
} from '@/components/design/ui'
import { Icon } from '@/components/Icon'
import { ScreenShell } from '@/components/layout/ScreenShell'

export function SimulationResultsScreen() {
  return (
    <ScreenShell activeNav="DIGITAL TWIN">
      <ScreenTitle
        title="SIMULATION RESULTS"
        subtitle="Anna Salai Closure · 17:00–20:00 · Evening Peak"
      />
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
        <div className="grid shrink-0 grid-cols-2 gap-3 border-b border-outline-variant bg-canvas p-4 md:grid-cols-4">
          <MetricBox label="Congestion" value="+18%" />
          <MetricBox label="Travel Time" value="+6.4 min" />
          <MetricBox label="Emissions" value="+11%" />
          <MetricBox label="Affected Commuters" value="14,200" />
        </div>

        <div className="flex min-h-0 flex-1 overflow-hidden">
          <div className="relative min-h-0 flex-1">
            <MapHero variant="results" className="h-full min-h-[280px]" />
          </div>
          <aside className="w-full max-w-md shrink-0 overflow-y-auto border-l border-outline-variant bg-canvas p-4 space-y-4">
            <SectionLabel>Before / After</SectionLabel>
            <div className="grid grid-cols-2 gap-3">
              <Card className="p-3">
                <div className="font-label-sm text-on-surface-variant">BEFORE</div>
                <div className="mt-2 space-y-1 text-sm">
                  <div>Congestion <strong className="font-mono">71%</strong></div>
                  <div>Avg Speed <strong className="font-mono">32 km/h</strong></div>
                </div>
              </Card>
              <Card className="p-3 border-brand-accent/40">
                <div className="font-label-sm text-brand-accent">AFTER</div>
                <div className="mt-2 space-y-1 text-sm">
                  <div>Congestion <strong className="font-mono text-error">89%</strong></div>
                  <div>Avg Speed <strong className="font-mono">24 km/h</strong></div>
                </div>
              </Card>
            </div>

            <Card className="border-2 border-brand-accent/30 bg-shell-surface p-4">
              <h3 className="mb-3 flex items-center gap-2 text-lg font-semibold text-deep-navy">
                <Icon name="smart_toy" className="text-brand-accent" />
                ENTROUGE RECOMMENDS
              </h3>
              <p className="text-sm text-deep-navy">
                Do not close Anna Salai without mitigation.
              </p>
              <p className="mt-2 text-sm font-medium text-deep-navy">
                Recommended: Signal retiming + temporary bus priority.
              </p>
              <div className="mt-3 rounded-[6px] border border-outline-variant bg-canvas p-3 text-sm">
                <div className="font-label-sm text-on-surface-variant">Expected Improvement</div>
                <div className="mt-1 font-mono">Congestion 89% → 65%</div>
                <div className="font-mono">Travel Time +6.4 min → +2.1 min</div>
              </div>
            </Card>

            <div className="flex flex-wrap gap-2">
              <GhostBtn>Compare Scenarios</GhostBtn>
              <GhostBtn>Open Copilot</GhostBtn>
              <GhostBtn>Export Report</GhostBtn>
              <PrimaryBtn>Return to Digital Twin</PrimaryBtn>
            </div>
          </aside>
        </div>
      </div>
    </ScreenShell>
  )
}
