import { MapHero } from '@/components/design/MapHero'
import { Card, MetricBox, PrimaryBtn, SectionLabel, StatusBadge } from '@/components/design/ui'
import { Icon } from '@/components/Icon'
import { ScreenShell } from '@/components/layout/ScreenShell'

const CORRIDORS = [
  { name: 'Anna Salai', load: 88 },
  { name: 'OMR', load: 71 },
  { name: 'GST Road', load: 63 },
  { name: 'Mount Road', load: 58 },
]

export function DigitalTwinScreen() {
  return (
    <ScreenShell activeNav="DIGITAL TWIN">
      <main className="flex min-h-0 flex-1 overflow-hidden">
        <aside className="flex w-[340px] shrink-0 flex-col border-r border-outline-variant bg-shell-surface">
          <div className="border-b border-outline-variant p-4">
            <h2 className="text-lg font-semibold text-deep-navy">DIGITAL TWIN</h2>
            <p className="mt-1 text-sm text-on-surface-variant">Chennai Urban Mobility Network</p>
          </div>
          <div className="flex-1 space-y-4 overflow-y-auto bg-canvas p-4">
            <Card className="p-4">
              <div className="mb-2 flex justify-between font-label-sm">
                <span className="text-on-surface-variant">Network Status</span>
                <StatusBadge label="Operational" variant="success" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <MetricBox label="Network Load" value="64%" />
                <MetricBox label="Active Corridors" value="7" />
                <MetricBox label="Active Incidents" value="2" />
                <MetricBox label="Average Speed" value="32 km/h" />
              </div>
            </Card>
            <div>
              <SectionLabel>Active Corridors</SectionLabel>
              <div className="space-y-2">
                {CORRIDORS.map((c, i) => (
                  <div
                    key={c.name}
                    className={`flex justify-between rounded-[6px] border p-2 ${
                      i === 0
                        ? 'border-l-4 border-l-brand-accent border-outline-variant bg-brand-accent/10'
                        : 'border-outline-variant bg-white'
                    }`}
                  >
                    <span className="text-sm font-medium text-deep-navy">{c.name}</span>
                    <span className="font-label-md font-mono text-brand-accent">{c.load}% Load</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </aside>

        <div className="relative min-h-0 flex-1">
          <MapHero variant="dashboard" className="h-full min-h-[400px]" />

          <div className="absolute top-1/4 left-[28%] z-20 w-[300px] rounded-[6px] border border-brand-accent bg-shell-surface p-4 shadow-lg">
            <div className="mb-3 flex justify-between border-b border-outline-variant pb-2">
              <div>
                <div className="font-label-sm uppercase text-brand-accent">Selected Corridor</div>
                <h3 className="text-lg font-semibold text-deep-navy">Anna Salai</h3>
              </div>
            </div>
            <div className="mb-3 flex items-center gap-3">
              <div className="h-2 flex-1 overflow-hidden rounded-full border border-outline-variant bg-canvas">
                <div className="h-full w-[88%] bg-error" />
              </div>
              <span className="font-label-md font-mono text-error">88% Load</span>
            </div>
            <div className="mb-3 grid grid-cols-2 gap-2 text-sm">
              <div><span className="text-on-surface-variant">Status</span><br /><strong>Heavy Congestion</strong></div>
              <div><span className="text-on-surface-variant">Speed</span><br /><strong className="font-mono">18 km/h</strong></div>
              <div className="col-span-2"><span className="text-on-surface-variant">Volume</span><br /><strong className="font-mono">14,200 veh/hr</strong></div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <GhostAction icon="block" label="Close Road" />
              <GhostAction icon="add_road" label="Add Lane" />
              <GhostAction icon="traffic" label="Signal Timing" />
              <PrimaryBtn className="col-span-2 w-full">Run Scenario</PrimaryBtn>
            </div>
          </div>
        </div>
      </main>
    </ScreenShell>
  )
}

function GhostAction({ icon, label }: { icon: string; label: string }) {
  return (
    <button
      type="button"
      className="flex items-center justify-center gap-1 rounded-[6px] border border-outline-variant bg-white py-2 text-xs font-medium text-deep-navy"
    >
      <Icon name={icon} className="text-[14px]" />
      {label}
    </button>
  )
}
