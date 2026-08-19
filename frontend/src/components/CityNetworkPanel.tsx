import { Icon } from '@/components/Icon'
import type { EdgeMetrics, NetworkGeoJSON, SelectedRoad, SimulationResult } from '@/types'
import type { EnrichedSimulationResult } from '@/types/simulation'
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
  enrichedResult?: EnrichedSimulationResult | null
  onSelectCorridor: (road: SelectedRoad) => void
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
  enrichedResult = null,
  onSelectCorridor,
}: CityNetworkPanelProps) {
  const corridors = useMemo(
    () => groupCorridors(network, edgeMetrics),
    [network, edgeMetrics],
  )

  const avgCongestion = enrichedResult
    ? enrichedResult.simulated.congestionPct
    : result
      ? result.scenario.congestion_index
      : edgeMetrics?.length
        ? Math.round(
            (edgeMetrics.reduce((s, e) => s + e.congestion, 0) / edgeMetrics.length) * 100,
          )
        : 64

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
    <aside className="relative z-20 hidden h-full min-w-0 shrink-0 flex-col border-r border-outline-variant bg-shell-surface shadow-sm md:flex">
      <div className="border-b border-outline-variant p-4">
        <div className="mb-1">
          <h2 className="text-lg font-semibold tracking-wide text-brand-text">DIGITAL TWIN</h2>
        </div>
        <p className="text-sm text-on-surface-variant">Chennai Urban Mobility Network</p>
      </div>

      <div className="flex flex-1 flex-col gap-6 overflow-y-auto bg-shell-bg p-4">
        <div className="rounded-[6px] border border-outline-variant bg-white p-4 shadow-sm">
          <div className="mb-2 flex items-center justify-between">
            <span className="font-label-sm uppercase text-on-surface-variant">
              Network Status
            </span>
            <span className="flex items-center gap-1 font-label-sm text-brand-accent">
              <span className="h-2 w-2 animate-pulse rounded-full bg-brand-accent" />
              Operational
            </span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <KpiCard
            label="Network Load"
            value={`${avgCongestion}%`}
            icon="trending_up"
            iconColor="text-error"
          />
          <KpiCard label="Active Corridors" value={`${corridors.length}`} icon="hub" />
          <KpiCard label="Active Incidents" value="2" icon="warning" iconColor="text-error" />
          <KpiCard label="Average Speed" value="32" suffix=" km/h" icon="speed" />
        </div>

        {(enrichedResult || result) && (
          <div className="rounded-[6px] border border-brand-accent/30 bg-brand-accent/5 p-3">
            <div className="mb-2 flex items-center gap-2 font-label-md text-brand-accent">
              <Icon name="check_circle" className="text-[16px]" />
              SIMULATION COMPLETE
            </div>
            <p className="text-sm font-medium text-brand-text">
              Congestion {enrichedResult ? `${enrichedResult.delta.congestionPct}%` : `+${result!.delta_travel_time_pct}% travel time`}
            </p>
            <p className="mt-1 text-xs text-on-surface-variant">
              {(enrichedResult?.affectedPopulation ?? result?.affected_commuters) ?? 0} commuters affected
            </p>
            {(enrichedResult?.alternateCorridors.length || result?.alternate_routes.length) ? (
              <p className="mt-2 text-xs text-on-surface-variant">
                Stress on: {(enrichedResult?.alternateCorridors ?? result?.alternate_routes ?? []).join(', ')}
              </p>
            ) : null}
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
                    {pct}% Load
                  </span>
                </button>
              )
            })}
          </div>
        </div>
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
