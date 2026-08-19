import { runSimulation } from '@/api/client'
import type { NetworkGeoJSON, ScenarioAction } from '@/types'
import type {
  EnrichedSimulationResult,
  InterventionConfig,
  SimulationProgress,
} from '@/types/simulation'
import { enrichApiResult, runVirtualSimulation } from '@/services/virtualSimulation'

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function toApiAction(config: InterventionConfig): ScenarioAction {
  return config.action === 'signal_timing' ? 'slow' : config.action
}

export async function executeSimulation(
  network: NetworkGeoJSON,
  config: InterventionConfig,
  onProgress?: (progress: SimulationProgress) => void,
): Promise<EnrichedSimulationResult> {
  onProgress?.({
    phase: 'initializing',
    progress: 0,
    message: 'SIMULATION INITIALIZING…',
  })
  await delay(350)

  onProgress?.({
    phase: 'running',
    progress: 25,
    message: 'SIMULATION RUNNING…',
  })
  await delay(400)

  onProgress?.({
    phase: 'running',
    progress: 50,
    message: 'SIMULATION RUNNING…',
  })

  let result: EnrichedSimulationResult

  if (config.action === 'signal_timing') {
    await delay(350)
    onProgress?.({
      phase: 'running',
      progress: 75,
      message: 'SIMULATION RUNNING…',
    })
    result = runVirtualSimulation(network, config)
  } else {
    try {
      const apiResult = await runSimulation({
        modifications: [
          {
            edge_id: config.road.id,
            action: toApiAction(config),
            capacity_factor:
              config.action === 'restrict'
                ? config.reducedLanes / config.currentLanes
                : undefined,
            speed_factor:
              config.action === 'slow'
                ? config.newSpeedKmh / config.currentSpeedKmh
                : undefined,
          },
        ],
        time_profile: config.timeProfile,
        duration_hours: config.durationMinutes / 60,
      })
      onProgress?.({
        phase: 'running',
        progress: 75,
        message: 'SIMULATION RUNNING…',
      })
      await delay(300)
      result = enrichApiResult(network, config, apiResult)
    } catch {
      await delay(350)
      onProgress?.({
        phase: 'running',
        progress: 75,
        message: 'SIMULATION RUNNING… (virtual model)',
      })
      result = runVirtualSimulation(network, config)
    }
  }

  onProgress?.({
    phase: 'running',
    progress: 100,
    message: 'SIMULATION COMPLETE',
  })
  await delay(200)

  onProgress?.({
    phase: 'complete',
    progress: 100,
    message: 'SIMULATION COMPLETE',
  })

  return result
}
