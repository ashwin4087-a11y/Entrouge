import type { NetworkGeoJSON, RoadFeature, SimulationResult } from '@/types'
import type {
  DiversionCorridor,
  EnrichedSimulationResult,
  InterventionConfig,
  MetricDelta,
  MetricSnapshot,
  PlaybackFrame,
  RecommendationSuggestion,
} from '@/types/simulation'
import {
  buildReportTitle,
  interventionLabel,
  timeProfileLabel,
} from '@/types/simulation'

function hashConfig(config: InterventionConfig): number {
  const s = `${config.road.id}|${config.action}|${config.timeProfile}|${config.durationMinutes}|${config.reducedLanes}|${config.newSpeedKmh}|${config.newGreenPhaseSec}`
  let h = 0
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0
  return Math.abs(h)
}

function peakMultiplier(profile: InterventionConfig['timeProfile']): number {
  switch (profile) {
    case 'morning_rush':
      return 1.12
    case 'evening_rush':
      return 1.15
    case 'off_peak':
      return 0.72
    case 'all_day':
      return 1.0
  }
}

function corridorBaseLoad(feature: RoadFeature, profile: InterventionConfig['timeProfile']): number {
  const cap = feature.properties.capacity_vph ?? 2400
  const seed = (feature.properties.id.charCodeAt(0) + cap) % 17
  const base = 52 + seed + peakMultiplier(profile) * 8
  return Math.min(78, Math.round(base))
}

function findDiversionCandidates(
  network: NetworkGeoJSON,
  targetId: string,
): RoadFeature[] {
  const target = network.features.find((f) => f.properties.id === targetId)
  if (!target) return network.features.filter((f) => f.properties.id !== targetId).slice(0, 4)

  const targetTokens = target.properties.name.toLowerCase().split(/[\s()]+/)
  const others = network.features.filter((f) => f.properties.id !== targetId)

  const scored = others
    .map((f) => {
      const tokens = f.properties.name.toLowerCase().split(/[\s()]+/)
      const overlap = tokens.filter((t) => targetTokens.includes(t)).length
      return { f, score: overlap }
    })
    .sort((a, b) => b.score - a.score)

  return scored.slice(0, 4).map((s) => s.f)
}

function interventionImpact(config: InterventionConfig): {
  congestionDelta: number
  travelDeltaMin: number
  co2Delta: number
  speedDelta: number
  volumeDelta: number
  diversionStrength: number
} {
  const durationFactor = Math.min(1.4, 0.85 + config.durationMinutes / 120)
  const peak = peakMultiplier(config.timeProfile)

  switch (config.action) {
    case 'close':
      const partial = config.closureType === 'partial' ? 0.55 : 1
      return {
        congestionDelta: 7.2 * partial * durationFactor * peak,
        travelDeltaMin: 0.54 * partial * durationFactor * peak,
        co2Delta: 0.9 * partial * durationFactor,
        speedDelta: -4 * partial * durationFactor,
        volumeDelta: 900 * partial,
        diversionStrength: 1.0 * partial,
      }
    case 'restrict':
      const laneLoss = (config.currentLanes - config.reducedLanes) / config.currentLanes
      return {
        congestionDelta: 4.1 * laneLoss * durationFactor * peak,
        travelDeltaMin: 0.28 * laneLoss * durationFactor * peak,
        co2Delta: 0.42 * laneLoss * durationFactor,
        speedDelta: -2.5 * laneLoss * durationFactor,
        volumeDelta: 450 * laneLoss,
        diversionStrength: 0.55 * laneLoss,
      }
    case 'slow':
      const speedDrop = (config.currentSpeedKmh - config.newSpeedKmh) / config.currentSpeedKmh
      return {
        congestionDelta: 2.8 * speedDrop * durationFactor * peak,
        travelDeltaMin: 0.35 * speedDrop * durationFactor * peak,
        co2Delta: -0.15 * speedDrop * durationFactor,
        speedDelta: -config.currentSpeedKmh + config.newSpeedKmh,
        volumeDelta: -200 * speedDrop,
        diversionStrength: 0.25 * speedDrop,
      }
    case 'signal_timing':
      const greenGain = (config.newGreenPhaseSec - config.currentGreenPhaseSec) / 60
      return {
        congestionDelta: -4.3 * greenGain * durationFactor,
        travelDeltaMin: -0.31 * greenGain * durationFactor,
        co2Delta: -0.42 * greenGain * durationFactor,
        speedDelta: 3 * greenGain,
        volumeDelta: 180 * greenGain,
        diversionStrength: -0.3 * greenGain,
      }
  }
}

function round1(n: number): number {
  return Math.round(n * 10) / 10
}

function round2(n: number): number {
  return Math.round(n * 100) / 100
}

function buildMetrics(
  network: NetworkGeoJSON,
  config: InterventionConfig,
  impact: ReturnType<typeof interventionImpact>,
): { baseline: MetricSnapshot; simulated: MetricSnapshot; delta: MetricDelta } {
  const feature = network.features.find((f) => f.properties.id === config.road.id)
  const baseCongestion = feature ? corridorBaseLoad(feature, config.timeProfile) : 64
  const baseTravel = round2(2.8 + (feature?.properties.free_flow_min ?? 2.5) * 0.35)
  const baseCo2 = round2(6.2 + baseCongestion * 0.022)
  const baseSpeed = 32
  const baseVolume = Math.round(14200 * peakMultiplier(config.timeProfile))

  const deltaCongestion = round1(impact.congestionDelta)
  const deltaTravel = round2(impact.travelDeltaMin)
  const deltaCo2 = round2(impact.co2Delta)
  const deltaSpeed = round1(impact.speedDelta)
  const deltaVolume = Math.round(impact.volumeDelta)

  const baseline: MetricSnapshot = {
    congestionPct: baseCongestion,
    travelTimeMin: baseTravel,
    co2Kg: baseCo2,
    avgSpeedKmh: baseSpeed,
    trafficVolumeVph: baseVolume,
  }

  const simulated: MetricSnapshot = {
    congestionPct: round1(baseCongestion + deltaCongestion),
    travelTimeMin: round2(baseTravel + deltaTravel),
    co2Kg: round2(baseCo2 + deltaCo2),
    avgSpeedKmh: round1(baseSpeed + deltaSpeed),
    trafficVolumeVph: baseVolume + deltaVolume,
  }

  const delta: MetricDelta = {
    congestionPct: deltaCongestion,
    travelTimeMin: deltaTravel,
    co2Kg: deltaCo2,
    avgSpeedKmh: deltaSpeed,
    trafficVolumeVph: deltaVolume,
  }

  return { baseline, simulated, delta }
}

function buildDiversion(
  network: NetworkGeoJSON,
  config: InterventionConfig,
  impact: ReturnType<typeof interventionImpact>,
): DiversionCorridor[] {
  const candidates = findDiversionCandidates(network, config.road.id)
  const shares = [12, 8, 5, 3]
  return candidates.map((f, i) => {
    const base = corridorBaseLoad(f, config.timeProfile)
    const change = round1(shares[i] * impact.diversionStrength)
    return {
      name: f.properties.name,
      edgeId: f.properties.id,
      baselineLoadPct: base,
      simulatedLoadPct: round1(base + change),
      changePct: change,
    }
  }).filter((d) => d.changePct > 0.5 || config.action === 'signal_timing')
}

function buildPlayback(
  network: NetworkGeoJSON,
  config: InterventionConfig,
  baselineCongestion: Record<string, number>,
  finalCongestion: Record<string, number>,
): PlaybackFrame[] {
  const duration = config.durationMinutes
  const milestones = [
    { t: 0, label: 'Baseline network conditions' },
    { t: duration * 0.25, label: 'Traffic begins diverting' },
    { t: duration * 0.5, label: 'Congestion increases on alternate corridors' },
    { t: duration * 0.75, label: 'Alternate corridors approach capacity' },
    { t: duration, label: 'Peak intervention impact' },
  ]

  return milestones.map(({ t, label }, idx) => {
    const factor = idx / (milestones.length - 1)
    const edgeCongestion: Record<string, number> = {}
    for (const f of network.features) {
      const id = f.properties.id
      const start = baselineCongestion[id] ?? 0.2
      const end = finalCongestion[id] ?? start
      edgeCongestion[id] = round2(start + (end - start) * factor)
    }
    return { timeMin: Math.round(t), label, edgeCongestion }
  })
}

function buildNarratives(
  config: InterventionConfig,
  delta: MetricDelta,
  diversion: DiversionCorridor[],
): {
  executiveSummary: string
  whatHappened: string
  whyItHappened: string
  recommendedAction: string
  recommendations: RecommendationSuggestion[]
} {
  const corridor = config.road.name
  const period = timeProfileLabel(config.timeProfile)
  const intervention = interventionLabel(config.action)
  const topDiversion = diversion.filter((d) => d.changePct > 0).slice(0, 2)
  const diversionText =
    topDiversion.length > 0
      ? topDiversion.map((d) => `${d.name} (+${d.changePct}%)`).join(' and ')
      : 'nearby parallel corridors'

  const congestionSign = delta.congestionPct >= 0 ? 'increased' : 'decreased'
  const travelSign = delta.travelTimeMin >= 0 ? 'increased' : 'decreased'

  const executiveSummary = `The simulated ${intervention.toLowerCase()} on ${corridor} during ${period.toLowerCase()} conditions ${congestionSign} network congestion by ${delta.congestionPct}% and ${travelSign} average travel time by ${Math.abs(delta.travelTimeMin)} minutes. Traffic was redistributed toward ${diversionText}, creating additional pressure on already busy corridors.`

  const whatHappened =
    config.action === 'close'
      ? `The simulated closure of ${corridor} diverted traffic toward adjacent corridors. The additional demand exceeded available capacity on parallel routes, increasing network congestion and average travel time.`
      : config.action === 'restrict'
        ? `Lane reduction on ${corridor} reduced corridor throughput. Traffic partially diverted to alternate routes, producing moderate congestion and travel-time increases across the network.`
        : config.action === 'slow'
          ? `The speed limit change on ${corridor} altered corridor throughput and travel speeds. Network travel times shifted as vehicles adjusted routes and speeds across the corridor.`
          : `Signal timing adjustment on ${corridor} changed intersection discharge rates. Delay patterns shifted across connected corridors during the ${period.toLowerCase()} period.`

  const whyItHappened =
    topDiversion.length >= 2
      ? `${Math.round(topDiversion[0].changePct + topDiversion[1].changePct)}% of affected traffic redistributed to ${topDiversion[0].name} and ${topDiversion[1].name}. Both corridors were already operating near capacity during the selected ${period.toLowerCase()} condition.`
      : `Demand on alternate corridors exceeded available capacity during the ${period.toLowerCase()} period, amplifying congestion beyond the intervention corridor.`

  const recommendedAction =
    config.action === 'close'
      ? 'Full closure should not be preferred during peak conditions without mitigation. Consider lane reduction combined with adjusted signal timing on alternate corridors.'
      : config.action === 'signal_timing'
        ? 'Signal timing adjustment shows favorable network impact. Validate with a follow-up simulation combining timing changes on stressed alternate corridors.'
        : 'Consider testing a less disruptive intervention or applying mitigation on alternate corridors before implementing during peak hours.'

  const recommendations: RecommendationSuggestion[] = []

  if (config.action === 'close') {
    recommendations.push({
      id: 'lane-reduction',
      title: 'Test Lane Reduction instead of Full Closure',
      reason: 'Could reduce diversion pressure while maintaining partial corridor access.',
      patch: { action: 'restrict', reducedLanes: 2 },
    })
    if (topDiversion[0]) {
      recommendations.push({
        id: 'signal-central',
        title: `Increase green phase on ${topDiversion[0].name}`,
        reason: 'Alternate corridor is approaching capacity and may benefit from signal optimization.',
        patch: {
          action: 'signal_timing',
          road: config.road,
          newGreenPhaseSec: 60,
        },
      })
    }
    recommendations.push({
      id: 'off-peak',
      title: 'Test intervention outside evening peak',
      reason: 'Lower baseline demand may reduce network-wide impact.',
      patch: { timeProfile: 'off_peak', durationMinutes: 60 },
    })
  } else if (config.action === 'restrict') {
    recommendations.push({
      id: 'signal-timing',
      title: 'Test Signal Timing on alternate corridor',
      reason: 'May relieve congestion without further lane reductions.',
      patch: { action: 'signal_timing', newGreenPhaseSec: 60 },
    })
    recommendations.push({
      id: 'speed-limit',
      title: 'Test Speed Limit adjustment',
      reason: 'Different throughput profile may produce lower emissions impact.',
      patch: { action: 'slow', newSpeedKmh: 40 },
    })
  } else {
    recommendations.push({
      id: 'lane-reduction',
      title: 'Compare with Lane Reduction',
      reason: 'Understand trade-offs between speed and capacity interventions.',
      patch: { action: 'restrict', reducedLanes: 2 },
    })
    recommendations.push({
      id: 'evening-peak',
      title: 'Re-test during Evening Peak',
      reason: 'Peak demand may change relative intervention performance.',
      patch: { timeProfile: 'evening_rush' },
    })
  }

  return {
    executiveSummary,
    whatHappened,
    whyItHappened,
    recommendedAction,
    recommendations,
  }
}

function buildEdgeMetrics(
  network: NetworkGeoJSON,
  finalCongestion: Record<string, number>,
): EnrichedSimulationResult['edgeMetrics'] {
  return network.features.map((f) => {
    const id = f.properties.id
    const congestion = finalCongestion[id] ?? 0.2
    const cap = f.properties.capacity_vph ?? 2400
    const freeFlow = f.properties.free_flow_min ?? 3
    return {
      edge_id: id,
      name: f.properties.name,
      congestion,
      travel_time_min: round2(freeFlow * (1 + congestion * 1.8)),
      volume: round1(cap * congestion * 0.35),
      capacity: cap,
    }
  })
}

export function runVirtualSimulation(
  network: NetworkGeoJSON,
  config: InterventionConfig,
): EnrichedSimulationResult {
  const h = hashConfig(config)
  const impact = interventionImpact(config)
  const { baseline, simulated, delta } = buildMetrics(network, config, impact)
  const diversion = buildDiversion(network, config, impact)

  const baselineCongestion: Record<string, number> = {}
  const finalCongestion: Record<string, number> = {}
  for (const f of network.features) {
    const base = corridorBaseLoad(f, config.timeProfile) / 100
    baselineCongestion[f.properties.id] = base
    let final = base
    if (f.properties.id === config.road.id) {
      final =
        config.action === 'close'
          ? Math.min(0.95, base + 0.25)
          : config.action === 'signal_timing'
            ? Math.max(0.15, base - 0.08)
            : base + delta.congestionPct / 100
    } else {
      const div = diversion.find((d) => d.edgeId === f.properties.id)
      if (div) final = div.simulatedLoadPct / 100
      else if (config.action === 'signal_timing') final = Math.max(0.12, base - 0.03)
    }
    finalCongestion[f.properties.id] = round2(final)
  }

  const playbackFrames = buildPlayback(
    network,
    config,
    baselineCongestion,
    finalCongestion,
  )

  const narratives = buildNarratives(config, delta, diversion)
  const edgeMetrics = buildEdgeMetrics(network, finalCongestion)

  const emergencyAccessScore = Math.max(
    35,
    Math.min(95, 82 - Math.abs(delta.congestionPct) * 1.4 - (config.action === 'close' ? 8 : 0)),
  )
  const equityScore = Math.max(
    40,
    Math.min(92, 78 - Math.abs(delta.congestionPct) * 0.9),
  )

  const id = `sim-${h}-${Date.now()}`
  const result: EnrichedSimulationResult = {
    id,
    title: '',
    scenarioId: `INT-${config.road.id.slice(-4).toUpperCase()}`,
    createdAt: new Date().toISOString(),
    corridor: config.road,
    intervention: config.action,
    interventionLabel: interventionLabel(config.action),
    timeProfile: config.timeProfile,
    durationMinutes: config.durationMinutes,
    mode: 'virtual',
    baseline,
    simulated,
    delta,
    affectedPopulation: Math.max(
      12,
      Math.round(18 + delta.congestionPct * 1.2 + diversion.length * 2),
    ),
    emergencyAccessScore: Math.round(emergencyAccessScore),
    emergencyAccessStatus:
      emergencyAccessScore >= 75 ? 'LOW IMPACT' : emergencyAccessScore >= 60 ? 'MODERATE IMPACT' : 'HIGH IMPACT',
    equityScore: Math.round(equityScore),
    equityStatus:
      equityScore >= 75 ? 'LOW IMPACT' : equityScore >= 60 ? 'LOW–MODERATE IMPACT' : 'MODERATE IMPACT',
    divertedTraffic: diversion,
    primaryAffectedCorridor: config.road.name,
    alternateCorridors: diversion.map((d) => d.name),
    executiveSummary: narratives.executiveSummary,
    whatHappened: narratives.whatHappened,
    whyItHappened: narratives.whyItHappened,
    recommendedAction: narratives.recommendedAction,
    recommendations: narratives.recommendations,
    playbackFrames,
    edgeMetrics,
  }

  result.title = buildReportTitle(result)
  return result
}

export function enrichApiResult(
  network: NetworkGeoJSON,
  config: InterventionConfig,
  api: SimulationResult,
): EnrichedSimulationResult {
  const virtual = runVirtualSimulation(network, config)
  const baselineCongestionPct = Math.round(api.baseline.congestion_index)
  const simulatedCongestionPct = Math.round(api.scenario.congestion_index)

  const baseline: MetricSnapshot = {
    congestionPct: baselineCongestionPct,
    travelTimeMin: round2(api.baseline.avg_travel_time_min),
    co2Kg: round2(api.baseline.co2_kg),
    avgSpeedKmh: virtual.baseline.avgSpeedKmh,
    trafficVolumeVph: Math.round(14200 * peakMultiplier(config.timeProfile)),
  }

  const simulated: MetricSnapshot = {
    congestionPct: simulatedCongestionPct,
    travelTimeMin: round2(api.scenario.avg_travel_time_min),
    co2Kg: round2(api.scenario.co2_kg),
    avgSpeedKmh: round2(
      virtual.baseline.avgSpeedKmh - api.delta_travel_time_pct * 0.12,
    ),
    trafficVolumeVph: baseline.trafficVolumeVph + virtual.delta.trafficVolumeVph,
  }

  const delta: MetricDelta = {
    congestionPct: round2(api.delta_congestion),
    travelTimeMin: round2(api.scenario.avg_travel_time_min - api.baseline.avg_travel_time_min),
    co2Kg: round2(api.delta_co2_kg),
    avgSpeedKmh: round2(simulated.avgSpeedKmh - baseline.avgSpeedKmh),
    trafficVolumeVph: simulated.trafficVolumeVph - baseline.trafficVolumeVph,
  }

  const diversion: DiversionCorridor[] = api.alternate_routes.map((name, i) => {
    const feature = network.features.find((f) => f.properties.name === name)
    const base = feature ? corridorBaseLoad(feature, config.timeProfile) : 58 + i * 2
    const change = round1(8 + i * 3)
    return {
      name,
      edgeId: feature?.properties.id ?? `alt-${i}`,
      baselineLoadPct: base,
      simulatedLoadPct: round1(base + change),
      changePct: change,
    }
  })

  if (diversion.length === 0) diversion.push(...virtual.divertedTraffic)

  const narratives = buildNarratives(config, delta, diversion)

  const finalCongestion: Record<string, number> = {}
  for (const e of api.edges) finalCongestion[e.edge_id] = e.congestion
  for (const f of network.features) {
    if (!finalCongestion[f.properties.id]) {
      finalCongestion[f.properties.id] = virtual.playbackFrames.at(-1)?.edgeCongestion[f.properties.id] ?? 0.2
    }
  }

  const id = `sim-api-${Date.now()}`
  const result: EnrichedSimulationResult = {
    id,
    title: '',
    scenarioId: `INT-${config.road.id.slice(-4).toUpperCase()}`,
    createdAt: new Date().toISOString(),
    corridor: config.road,
    intervention: config.action,
    interventionLabel: interventionLabel(config.action),
    timeProfile: config.timeProfile,
    durationMinutes: config.durationMinutes,
    mode: 'api',
    baseline,
    simulated,
    delta,
    affectedPopulation: api.affected_commuters,
    emergencyAccessScore: virtual.emergencyAccessScore,
    emergencyAccessStatus: virtual.emergencyAccessStatus,
    equityScore: virtual.equityScore,
    equityStatus: virtual.equityStatus,
    divertedTraffic: diversion,
    primaryAffectedCorridor: config.road.name,
    alternateCorridors: api.alternate_routes,
    executiveSummary: narratives.executiveSummary,
    whatHappened: narratives.whatHappened,
    whyItHappened: narratives.whyItHappened,
    recommendedAction: narratives.recommendedAction,
    recommendations: narratives.recommendations,
    playbackFrames: buildPlayback(
      network,
      config,
      Object.fromEntries(
        network.features.map((f) => [
          f.properties.id,
          corridorBaseLoad(f, config.timeProfile) / 100,
        ]),
      ),
      finalCongestion,
    ),
    edgeMetrics: api.edges.length > 0 ? api.edges : virtual.edgeMetrics,
    rawApiResult: api,
  }

  result.title = buildReportTitle(result)
  return result
}
