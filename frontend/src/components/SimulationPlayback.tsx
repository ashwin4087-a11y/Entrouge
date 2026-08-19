import { useEffect } from 'react'
import { Icon } from '@/components/Icon'
import { useSimulation } from '@/context/SimulationContext'
import type { EnrichedSimulationResult } from '@/types/simulation'

export function SimulationPlayback() {
  const {
    currentResult,
    playbackTimeMin,
    setPlaybackTimeMin,
    isPlaying,
    setIsPlaying,
    config,
  } = useSimulation()

  if (!currentResult || !config) return null

  const maxTime = config.durationMinutes
  const frames = currentResult.playbackFrames
  const activeFrame =
    frames.find((f, i) => {
      const next = frames[i + 1]
      return playbackTimeMin >= f.timeMin && (!next || playbackTimeMin < next.timeMin)
    }) ?? frames[0]

  useEffect(() => {
    if (!isPlaying) return
    const interval = setInterval(() => {
      if (playbackTimeMin >= maxTime) {
        setIsPlaying(false)
        return
      }
      setPlaybackTimeMin(playbackTimeMin + 1)
    }, 400)
    return () => clearInterval(interval)
  }, [isPlaying, maxTime, playbackTimeMin, setPlaybackTimeMin, setIsPlaying])

  return (
    <div className="rounded-lg border border-outline-variant bg-shell-surface/95 p-4 backdrop-blur-sm">
      <div className="mb-2 flex items-center justify-between">
        <h4 className="font-label-md font-bold uppercase text-deep-navy">Simulation Playback</h4>
        <span className="font-label-sm text-on-surface-variant">{currentResult.mode === 'api' ? 'Live Model' : 'Virtual Model'}</span>
      </div>
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => setIsPlaying(!isPlaying)}
          className="flex items-center gap-1 rounded bg-brand-accent px-3 py-1.5 font-label-md text-white hover:bg-brand-accent-hover"
        >
          <Icon name={isPlaying ? 'pause' : 'play_arrow'} className="text-[18px]" />
          {isPlaying ? 'PAUSE' : 'PLAY'}
        </button>
        <div className="flex-1">
          <input
            type="range"
            min={0}
            max={maxTime}
            value={playbackTimeMin}
            onChange={(e) => setPlaybackTimeMin(Number(e.target.value))}
            className="w-full accent-brand-accent"
          />
          <div className="mt-1 flex justify-between font-label-sm text-on-surface-variant">
            <span>00:00</span>
            <span>{String(Math.floor(playbackTimeMin / 60)).padStart(2, '0')}:{String(playbackTimeMin % 60).padStart(2, '0')}</span>
            <span>{String(Math.floor(maxTime / 60)).padStart(2, '0')}:{String(maxTime % 60).padStart(2, '0')}</span>
          </div>
        </div>
      </div>
      <p className="mt-2 text-sm text-deep-navy">{activeFrame?.label}</p>
      <div className="mt-2 flex flex-wrap gap-3 font-label-sm text-on-surface-variant">
        <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-brand-accent" /> Intervention</span>
        <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-error" /> Increased congestion</span>
        <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-[#f59e0b]" /> Traffic diversion</span>
      </div>
    </div>
  )
}

export function getPlaybackEdgeMetrics(
  result: EnrichedSimulationResult,
  playbackTimeMin: number,
): EnrichedSimulationResult['edgeMetrics'] {
  const frames = result.playbackFrames
  const frame =
    frames.find((f, i) => {
      const next = frames[i + 1]
      return playbackTimeMin >= f.timeMin && (!next || playbackTimeMin < next.timeMin)
    }) ?? frames[frames.length - 1]

  return result.edgeMetrics.map((e) => ({
    ...e,
    congestion: frame.edgeCongestion[e.edge_id] ?? e.congestion,
  }))
}
