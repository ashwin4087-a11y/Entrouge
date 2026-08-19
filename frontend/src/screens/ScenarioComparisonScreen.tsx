import { MapHero } from '@/components/design/MapHero'
import {
  Card,
  GhostBtn,
  PrimaryBtn,
  ScreenTitle,
  SectionLabel,
} from '@/components/design/ui'
import { ScreenShell } from '@/components/layout/ScreenShell'

const METRICS = [
  { label: 'Congestion', a: '89%', b: '65%' },
  { label: 'Travel Time', a: '+6.4 min', b: '+2.1 min' },
  { label: 'Emissions', a: '+11%', b: '+3%' },
  { label: 'Affected Commuters', a: '14,200', b: '8,600' },
]

export function ScenarioComparisonScreen() {
  return (
    <ScreenShell activeNav="DIGITAL TWIN">
      <ScreenTitle
        title="SCENARIO COMPARISON"
        subtitle="Compare network outcomes before making a decision."
      />
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
        <div className="grid shrink-0 gap-4 border-b border-outline-variant bg-shell-surface p-4 md:grid-cols-2">
          <Card className="p-4">
            <div className="font-label-sm text-on-surface-variant">Scenario A</div>
            <div className="text-lg font-semibold text-deep-navy">Anna Salai Closure</div>
            <div className="font-mono text-sm">17:00–20:00</div>
          </Card>
          <Card className="p-4 border-brand-accent/40">
            <div className="font-label-sm text-brand-accent">Scenario B</div>
            <div className="text-lg font-semibold text-deep-navy">
              Anna Salai Closure + Bus Priority
            </div>
            <div className="font-mono text-sm">17:00–20:00</div>
          </Card>
        </div>

        <div className="flex min-h-0 flex-1 overflow-hidden">
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            <SectionLabel>Comparison</SectionLabel>
            <div className="space-y-3">
              {METRICS.map((m) => (
                <Card key={m.label} className="p-3">
                  <div className="mb-2 font-label-sm uppercase text-on-surface-variant">
                    {m.label}
                  </div>
                  <div className="grid grid-cols-2 gap-4 font-mono text-lg">
                    <div>
                      <span className="text-xs text-on-surface-variant">A </span>
                      <strong className="text-deep-navy">{m.a}</strong>
                    </div>
                    <div>
                      <span className="text-xs text-brand-accent">B </span>
                      <strong className="text-brand-accent">{m.b}</strong>
                    </div>
                  </div>
                </Card>
              ))}
            </div>

            <Card className="border-2 border-brand-accent/30 bg-shell-surface p-4">
              <div className="font-label-md uppercase text-brand-accent">Entrouge Recommends</div>
              <div className="mt-2 text-lg font-semibold text-deep-navy">Scenario B</div>
              <p className="mt-1 text-sm text-on-surface-variant">
                Anna Salai Closure + Bus Priority — reduces congestion propagation while maintaining
                the planned intervention.
              </p>
            </Card>

            <div className="flex flex-wrap gap-2">
              <GhostBtn>Open Scenario A</GhostBtn>
              <GhostBtn>Open Scenario B</GhostBtn>
              <PrimaryBtn>Export Comparison</PrimaryBtn>
            </div>
          </div>
          <div className="hidden w-[42%] shrink-0 border-l border-outline-variant md:block">
            <SectionLabel className="p-4">Comparison Map</SectionLabel>
            <MapHero variant="comparison" className="h-[calc(100%-3rem)] min-h-[300px]" showControls={false} />
            <p className="p-2 text-center font-label-sm text-on-surface-variant">
              Scenario A: muted navy · Scenario B: #3F72AF
            </p>
          </div>
        </div>
      </div>
    </ScreenShell>
  )
}
