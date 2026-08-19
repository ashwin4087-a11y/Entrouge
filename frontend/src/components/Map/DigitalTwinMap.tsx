import { useCallback, useEffect, useRef, useState } from 'react'
import * as maplibregl from 'maplibre-gl'
import type { MapLayerMouseEvent } from 'maplibre-gl'
import maplibreWorkerUrl from 'maplibre-gl/dist/maplibre-gl-worker.mjs?url'
import type { EdgeMetrics, NetworkGeoJSON, SelectedRoad } from '@/types'
import './DigitalTwinMap.css'

maplibregl.setWorkerUrl(maplibreWorkerUrl)

const CHENNAI_CENTER: [number, number] = [80.2707, 13.0827]
const DEFAULT_ZOOM = 12

export interface DigitalTwinMapProps {
  network?: NetworkGeoJSON | null
  selectedRoad?: SelectedRoad | null
  edgeMetrics?: EdgeMetrics[] | null
  onSelectRoad?: (road: SelectedRoad | null) => void
  focusEdgeId?: string | null
  diversionEdgeIds?: string[]
  className?: string
  showLegend?: boolean
}

function congestionColor(congestion: number): string {
  if (congestion < 0.3) return '#84cc16'
  if (congestion < 0.5) return '#a3c9ff'
  if (congestion < 0.7) return '#f59e0b'
  if (congestion < 0.85) return '#f97316'
  return '#ba1a1a'
}

function getMapStyle(apiKey: string): string {
  return `https://api.maptiler.com/maps/streets-v2-dark/style.json?key=${apiKey}`
}

export function DigitalTwinMap({
  network = null,
  selectedRoad = null,
  edgeMetrics = null,
  onSelectRoad,
  focusEdgeId = null,
  diversionEdgeIds = [],
  className = '',
  showLegend = true,
}: DigitalTwinMapProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<maplibregl.Map | null>(null)
  const roadsReadyRef = useRef(false)
  const [mapError, setMapError] = useState<string | null>(null)

  const apiKey = import.meta.env.VITE_MAPTILER_API_KEY as string | undefined

  const buildGeoJSON = useCallback(
    (metrics: EdgeMetrics[] | null) => {
      if (!network) return null

      const metricsMap = new Map(metrics?.map((m) => [m.edge_id, m]) ?? [])

      return {
        type: 'FeatureCollection' as const,
        features: network.features.map((f) => {
          const id = f.properties.id
          const m = metricsMap.get(id)
          const congestion = m?.congestion ?? 0.2
          return {
            ...f,
            properties: {
              ...f.properties,
              congestion,
              color: congestionColor(congestion),
              selected: selectedRoad?.id === id,
              isDiversion: diversionEdgeIds.includes(id),
            },
          }
        }),
      }
    },
    [network, selectedRoad, diversionEdgeIds],
  )

  const attachRoadLayers = useCallback(
    (map: maplibregl.Map) => {
      const geojson = buildGeoJSON(edgeMetrics)
      if (!geojson) return

      if (!map.getSource('roads')) {
        map.addSource('roads', { type: 'geojson', data: geojson })

        map.addLayer({
          id: 'roads-glow',
          type: 'line',
          source: 'roads',
          paint: {
            'line-color': ['get', 'color'],
            'line-width': ['case', ['get', 'selected'], 14, 8],
            'line-opacity': 0.25,
            'line-blur': 2,
          },
          layout: { 'line-cap': 'round', 'line-join': 'round' },
        })

        map.addLayer({
          id: 'roads-base',
          type: 'line',
          source: 'roads',
          paint: {
            'line-color': ['get', 'color'],
            'line-width': [
              'case',
              ['get', 'selected'],
              8,
              ['case', ['get', 'isDiversion'], 7, ['interpolate', ['linear'], ['get', 'congestion'], 0, 4, 1, 10]],
            ],
            'line-opacity': 0.95,
          },
          layout: { 'line-cap': 'round', 'line-join': 'round' },
        })

        if (onSelectRoad) {
          map.on('click', 'roads-base', (e: MapLayerMouseEvent) => {
            if (!e.features?.[0]) return
            const props = e.features[0].properties
            if (!props?.id) return
            onSelectRoad({
              id: props.id,
              name: props.name ?? props.id,
              length_km: props.length_km ?? 0.5,
              capacity_vph: props.capacity_vph ?? 2000,
            })
          })

          map.on('mouseenter', 'roads-base', () => {
            map.getCanvas().style.cursor = 'pointer'
          })
          map.on('mouseleave', 'roads-base', () => {
            map.getCanvas().style.cursor = ''
          })
        }

        roadsReadyRef.current = true
      } else {
        const source = map.getSource('roads') as maplibregl.GeoJSONSource
        source.setData(geojson)
      }
    },
    [buildGeoJSON, edgeMetrics, onSelectRoad],
  )

  useEffect(() => {
    if (!containerRef.current) return

    if (!apiKey?.trim()) {
      setMapError(
        'VITE_MAPTILER_API_KEY is not set. Add your key to .env at the project root and restart npm run dev.',
      )
      return
    }

    setMapError(null)

    const center = network?.properties?.center ?? CHENNAI_CENTER
    const mapCenter: [number, number] = [center[0], center[1]]

    const map = new maplibregl.Map({
      container: containerRef.current,
      style: getMapStyle(apiKey),
      center: mapCenter,
      zoom: DEFAULT_ZOOM,
    })

    map.addControl(new maplibregl.NavigationControl({ visualizePitch: true }), 'top-right')

    map.on('error', (e) => {
      if (e.error?.message) {
        setMapError(`Map failed to load: ${e.error.message}`)
      }
    })

    map.on('load', () => {
      map.resize()
      if (network) attachRoadLayers(map)
    })

    const resizeObserver = new ResizeObserver(() => {
      map.resize()
    })
    resizeObserver.observe(containerRef.current)

    mapRef.current = map
    roadsReadyRef.current = false

    return () => {
      resizeObserver.disconnect()
      map.remove()
      mapRef.current = null
      roadsReadyRef.current = false
    }
  }, [apiKey])

  useEffect(() => {
    const map = mapRef.current
    if (!map || !network) return

    if (map.isStyleLoaded()) {
      attachRoadLayers(map)
    } else {
      map.once('load', () => attachRoadLayers(map))
    }
  }, [network, attachRoadLayers])

  useEffect(() => {
    const map = mapRef.current
    if (!map || !roadsReadyRef.current) return
    const geojson = buildGeoJSON(edgeMetrics)
    const source = map.getSource('roads') as maplibregl.GeoJSONSource | undefined
    if (source && geojson) {
      source.setData(geojson)
    }
  }, [edgeMetrics, selectedRoad, buildGeoJSON])

  useEffect(() => {
    const map = mapRef.current
    if (!map || !network || !focusEdgeId) return
    const feature = network.features.find((f) => f.properties.id === focusEdgeId)
    if (!feature) return
    const coords = feature.geometry.coordinates
    if (!coords.length) return
    let minLng = coords[0][0], maxLng = coords[0][0]
    let minLat = coords[0][1], maxLat = coords[0][1]
    for (const [lng, lat] of coords) {
      minLng = Math.min(minLng, lng)
      maxLng = Math.max(maxLng, lng)
      minLat = Math.min(minLat, lat)
      maxLat = Math.max(maxLat, lat)
    }
    map.fitBounds(
      [
        [minLng - 0.008, minLat - 0.008],
        [maxLng + 0.008, maxLat + 0.008],
      ],
      { padding: 48, duration: 800 },
    )
  }, [focusEdgeId, network])

  if (mapError) {
    return (
      <div className={`digital-twin-map ${className}`}>
        <div className="digital-twin-map__error">
          <p className="text-lg font-semibold">Digital Twin map unavailable</p>
          <p className="mt-2 max-w-md text-sm opacity-90">{mapError}</p>
          <code>VITE_MAPTILER_API_KEY=your_key_here</code>
          <p className="mt-4 text-xs opacity-70">
            Free key: cloud.maptiler.com/account/keys
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className={`digital-twin-map digital-twin-map-container ${className}`}>
      <div ref={containerRef} className="digital-twin-map__canvas" />
      {showLegend && (
      <div className="pointer-events-none absolute bottom-20 left-4 z-10 rounded-[6px] border border-outline-variant bg-shell-surface/95 p-3 text-xs shadow-sm backdrop-blur-md">
        <p className="mb-2 font-label-md font-medium text-brand-text">Congestion</p>
        <div className="flex items-center gap-1">
          {['Low', '', 'Med', '', 'High'].map((label, i) => (
            <div key={i} className="flex flex-col items-center gap-1">
              <div
                className="h-3 w-8 rounded"
                style={{ background: congestionColor(i * 0.25) }}
              />
              {label && <span className="font-label-sm text-on-surface-variant">{label}</span>}
            </div>
          ))}
        </div>
      </div>
      )}
    </div>
  )
}

export default DigitalTwinMap
