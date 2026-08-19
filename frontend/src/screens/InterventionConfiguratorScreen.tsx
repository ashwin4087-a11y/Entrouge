import { MapHero } from '@/components/design/MapHero'
import {
  ActionChip,
  Card,
  PrimaryBtn,
  ScreenTitle,
  SectionLabel,
} from '@/components/design/ui'
import { ScreenShell } from '@/components/layout/ScreenShell'

const ACTIONS = [
  { icon: 'block', label: 'CLOSE ROAD' },
  { icon: 'merge', label: 'REDUCE LANES' },
  { icon: 'add_road', label: 'ADD LANE' },
  { icon: 'speed', label: 'SPEED LIMIT' },
  { icon: 'traffic', label: 'SIGNAL RETIMING' },
  { icon: 'directions_bus', label: 'BUS PRIORITY' },
]

const MODELS = ['Evening Peak', 'Normal Day', 'Weekend', 'Special Event', 'Emergency']

export function InterventionConfiguratorScreen() {
  return (
    <ScreenShell activeNav="DIGITAL TWIN">
      <ScreenTitle
        title="INTERVENTION CONFIGURATOR"
        subtitle="Configure network constraints and simulate impact."
      />
      <div className="flex min-h-0 flex-1 overflow-hidden">
        <div className="flex-1 overflow-y-auto bg-canvas p-6 space-y-6 max-w-2xl">
          <SectionLabel>Impact Area</SectionLabel>
          <Card className="p-4">
            <div className="text-lg font-semibold text-deep-navy">Anna Salai</div>
            <div className="mt-1 font-label-md text-brand-accent">Affected Length · 3.2 km</div>
          </Card>

          <SectionLabel>Intervention</SectionLabel>
          <div className="grid grid-cols-3 gap-2">
            {ACTIONS.map((a, i) => (
              <ActionChip key={a.label} icon={a.icon} label={a.label} selected={i === 0} />
            ))}
          </div>

          <SectionLabel>Time Window</SectionLabel>
          <div className="grid grid-cols-3 gap-3">
            <Card className="p-3">
              <div className="font-label-sm text-on-surface-variant">Start</div>
              <div className="font-mono text-lg font-semibold">05:00 PM</div>
            </Card>
            <Card className="p-3">
              <div className="font-label-sm text-on-surface-variant">End</div>
              <div className="font-mono text-lg font-semibold">08:00 PM</div>
            </Card>
            <Card className="p-3">
              <div className="font-label-sm text-on-surface-variant">Duration</div>
              <div className="font-mono text-lg font-semibold">3 hours</div>
            </Card>
          </div>

          <SectionLabel>Traffic Model</SectionLabel>
          <div className="flex flex-wrap gap-2">
            {MODELS.map((m, i) => (
              <span
                key={m}
                className={`rounded-[6px] border px-3 py-2 font-label-md ${
                  i === 0
                    ? 'border-brand-accent bg-brand-accent text-white'
                    : 'border-outline-variant bg-white text-deep-navy'
                }`}
              >
                {m}
              </span>
            ))}
          </div>

          <Card className="p-4">
            <SectionLabel>Summary</SectionLabel>
            <ul className="space-y-1 text-sm text-deep-navy">
              <li>Anna Salai</li>
              <li>Close Road</li>
              <li className="font-mono">17:00–20:00</li>
              <li>Evening Peak</li>
            </ul>
            <PrimaryBtn className="mt-4 w-full">EXECUTE SIMULATION</PrimaryBtn>
          </Card>
        </div>

        <div className="hidden w-[45%] shrink-0 border-l border-outline-variant md:block">
          <div className="border-b border-outline-variant bg-shell-surface px-4 py-3 font-label-md uppercase text-on-surface-variant">
            Live Preview
          </div>
          <MapHero variant="intervention" className="h-full min-h-[400px]" showControls={false} />
          <p className="p-3 text-center text-xs text-on-surface-variant">
            Traffic redistribution preview
          </p>
        </div>
      </div>
    </ScreenShell>
  )
}
