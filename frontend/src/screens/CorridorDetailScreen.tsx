import { MapHero } from '@/components/design/MapHero'
import {
  ActionChip,
  Card,
  MetricBox,
  PrimaryBtn,
  ScreenTitle,
  SectionLabel,
  StatusBadge,
} from '@/components/design/ui'
import { ScreenShell } from '@/components/layout/ScreenShell'

const INTERVENTIONS = [
  'Close Road',
  'Reduce Lanes',
  'Add Lane',
  'Speed Restriction',
  'Signal Retiming',
  'Bus Priority',
]

export function CorridorDetailScreen() {
  return (
    <ScreenShell activeNav="DIGITAL TWIN">
      <ScreenTitle
        title="CORRIDOR DETAIL"
        subtitle="Anna Salai · Chennai"
        badge={
          <div className="flex gap-2">
            <StatusBadge label="HEAVY CONGESTION" variant="error" />
            <StatusBadge label="88% NETWORK LOAD" variant="warning" />
          </div>
        }
      />
      <div className="flex min-h-0 flex-1 overflow-hidden">
        <div className="relative min-h-0 flex-1">
          <MapHero variant="corridor" className="h-full min-h-[360px]" showControls />
        </div>
        <aside className="w-[380px] shrink-0 overflow-y-auto border-l border-outline-variant bg-canvas p-4 space-y-4">
          <SectionLabel>Corridor Metrics</SectionLabel>
          <div className="grid grid-cols-2 gap-3">
            <MetricBox label="Current Load" value="88%" />
            <MetricBox label="Average Speed" value="18 km/h" />
            <MetricBox label="Traffic Volume" value="14,200 veh/hr" />
            <MetricBox label="Travel Time" value="+22%" />
            <MetricBox label="Incident Risk" value="Medium" />
          </div>

          <SectionLabel>Traffic Profile</SectionLabel>
          <Card className="p-4">
            <div className="flex h-24 items-end gap-1">
              {[30, 45, 55, 70, 88, 75, 60, 40].map((h, i) => (
                <div
                  key={i}
                  className="flex-1 rounded-t bg-brand-accent/80"
                  style={{ height: `${h}%` }}
                />
              ))}
            </div>
            <p className="mt-2 text-center font-label-sm text-on-surface-variant">
              Evening peak highlighted
            </p>
          </Card>

          <SectionLabel>Available Interventions</SectionLabel>
          <div className="grid grid-cols-2 gap-2">
            {INTERVENTIONS.map((label, i) => (
              <ActionChip key={label} icon="construction" label={label} selected={i === 0} />
            ))}
          </div>

          <SectionLabel>Network Effect</SectionLabel>
          <Card className="p-3 text-sm text-on-surface-variant">
            Affected areas:{' '}
            <strong className="text-deep-navy">Teynampet · Saidapet · Guindy</strong>
          </Card>

          <PrimaryBtn className="w-full">Configure Intervention</PrimaryBtn>
        </aside>
      </div>
    </ScreenShell>
  )
}
