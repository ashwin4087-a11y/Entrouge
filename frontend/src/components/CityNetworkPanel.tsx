import { Icon } from '@/components/Icon'
import type { EdgeMetrics, NetworkGeoJSON, SelectedRoad, SimulationResult } from '@/types'
import { useMemo } from 'react'

interface CorridorItem {
  name: string
  edgeId: string
  congestion: number
}

interface CityNetworkPanelProps {
  network: NetworkGeoJSON | null
  selectedRoad: SelectedRoad | null
  edgeMetrics: EdgeMetrics[] | null
  result: SimulationResult | null
  loading: boolean
  onSelectCorridor: (road: SelectedRoad) => void
  onRunSimulation: () => void
}

function groupCorridors(
  network: NetworkGeoJSON | null,
  edgeMetrics: EdgeMetrics[] | null,
): CorridorItem[] {
  if (!network) return []
  const metricsMap = new Map(edgeMetrics?.map((m) => [m.edge_id, m]) ?? [])

  const byName = new Map<string, CorridorItem>()
  for (const f of network.features) {
    const name = f.properties.name
    const id = f.properties.id
    const cong = metricsMap.get(id)?.congestion ?? 0.2
    const existing = byName.get(name)
    if (!existing || cong > existing.congestion) {
      byName.set(name, { name, edgeId: id, congestion: cong })
    }
  }
  return Array.from(byName.values()).sort((a, b) => b.congestion - a.congestion)
}

export function CityNetworkPanel({
  network,
  selectedRoad,
  edgeMetrics,
  result,
  loading,
  onSelectCorridor,
  onRunSimulation,
}: CityNetworkPanelProps) {
  const corridors = useMemo(
    () => groupCorridors(network, edgeMetrics),
    [network, edgeMetrics],
  )

  const avgCongestion = result
    ? result.scenario.congestion_index
    : edgeMetrics?.length
      ? Math.round(
          (edgeMetrics.reduce((s, e) => s + e.congestion, 0) / edgeMetrics.length) * 100,
        )
      : 64

  const avgTravel = result?.scenario.avg_travel_time_min ?? 21.4
  const co2 = result?.scenario.co2_kg ?? 4.9

  const handleCorridorClick = (item: CorridorItem) => {
    const feature = network?.features.find((f) => f.properties.id === item.edgeId)
    if (!feature) return
    onSelectCorridor({
      id: item.edgeId,
      name: item.name,
      length_km: feature.properties.length_km ?? 0.5,
      capacity_vph: feature.properties.capacity_vph ?? 2000,
    })
  }

  return (
    <aside className="relative z-20 flex h-full w-[340px] shrink-0 flex-col border-r border-outline-variant bg-shell-surface shadow-sm">
      <div className="border-b border-outline-variant p-4">
        <div className="mb-1">
          <h2 className="text-lg font-semibold tracking-wide text-brand-text">CITY NETWORK</h2>
        </div>
        <p className="font-label-md text-on-surface-variant">Chennai District</p>
      </div>

      <div className="flex flex-1 flex-col gap-6 overflow-y-auto bg-shell-bg p-4">
        <div className="rounded-[6px] border border-outline-variant bg-white p-4 shadow-sm">
          <div className="mb-2 flex items-center justify-between">
            <span className="font-label-sm uppercase text-on-surface-variant">
              Network Health
            </span>
            <span className="flex items-center gap-1 font-label-sm text-brand-accent">
              <span className="h-2 w-2 animate-pulse rounded-full bg-brand-accent" />
              Operational
            </span>
          </div>
          <div className="text-lg font-semibold text-brand-text">CHENNAI CENTRAL</div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <KpiCard
            label="Congestion"
            value={`${avgCongestion}%`}
            icon="trending_up"
            iconColor="text-error"
          />
          <KpiCard
            label="Avg Travel"
            value={`${avgTravel}`}
            suffix="m"
            icon="trending_down"
            iconColor="text-brand-accent"
          />
          <KpiCard label="Vehicles/hr" value="18.2" suffix="k" icon="drag_handle" />
          <KpiCard
            label="CO2/hr"
            value={co2.toFixed(1)}
            suffix="t"
            icon="trending_up"
            iconColor="text-error"
          />
        </div>

        {result && (
          <div className="rounded-[6px] border border-brand-accent/30 bg-brand-accent/5 p-3">
            <div className="mb-2 flex items-center gap-2 font-label-md text-brand-accent">
              <Icon name="check_circle" className="text-[16px]" />
              SIMULATION COMPLETE
            </div>
            <p className="text-sm font-medium text-brand-text">
              Travel time +{result.delta_travel_time_pct}%
            </p>
            <p className="mt-1 text-xs text-on-surface-variant">
              {result.affected_commuters} commuters affected
            </p>
            {result.alternate_routes.length > 0 && (
              <p className="mt-2 text-xs text-on-surface-variant">
                Stress on: {result.alternate_routes.join(', ')}
              </p>
            )}
          </div>
        )}

        <div>
          <h3 className="mb-3 border-b border-outline-variant pb-1 font-label-md uppercase text-on-surface-variant">
            Active Corridors
          </h3>
          <div className="flex flex-col gap-2">
            {corridors.map((item) => {
              const pct = Math.round(item.congestion * 100)
              const selected = selectedRoad?.id === item.edgeId
              return (
                <button
                  key={item.edgeId}
                  type="button"
                  onClick={() => handleCorridorClick(item)}
                  className={`flex cursor-pointer items-center justify-between rounded p-2 shadow-sm transition-colors ${
                    selected
                      ? 'border-l-4 border-brand-accent bg-brand-accent/10'
                      : 'border border-outline-variant bg-white hover:bg-canvas'
                  }`}
                >
                  <span className="text-sm font-medium text-brand-text">{item.name}</span>
                  <span
                    className={`rounded border px-2 py-0.5 font-mono font-label-md ${
                      selected
                        ? 'border-brand-accent/30 bg-canvas text-brand-accent'
                        : 'border-outline-variant/50 bg-canvas text-on-surface-variant'
                    }`}
                  >
                    {pct}%
                  </span>
                </button>
              )
            })}
          </div>
        </div>
      </div>

      <div className="border-t border-outline-variant bg-shell-surface p-4">
        <button
          type="button"
          disabled={!selectedRoad || loading}
          onClick={onRunSimulation}
          className="flex w-full items-center justify-center gap-2 rounded-[6px] bg-brand-accent py-3 font-label-md uppercase tracking-wide text-white shadow-sm transition-colors hover:bg-brand-accent-hover disabled:opacity-50"
        >
          <Icon name="play_circle" className="text-[18px]" filled />
          {loading ? 'Simulating…' : 'Run Simulation'}
        </button>
      </div>
    </aside>
  )
}

function KpiCard({
  label,
  value,
  suffix,
  icon,
  iconColor = 'text-on-surface-variant',
}: {
  label: string
  value: string
  suffix?: string
  icon: string
  iconColor?: string
}) {
  return (
    <div className="group rounded-[6px] border border-outline-variant bg-white p-3 shadow-sm transition-colors hover:border-brand-accent/50">
      <div className="mb-1 flex items-center justify-between font-label-sm text-on-surface-variant">
        {label}
        <Icon name={icon} className={`text-[14px] ${iconColor}`} />
      </div>
      <div className="font-mono text-2xl font-semibold text-brand-text transition-colors group-hover:text-brand-accent">
        {value}
        {suffix && (
          <span className="text-lg text-on-surface-variant">{suffix}</span>
        )}
      </div>
    </div>
  )
}
