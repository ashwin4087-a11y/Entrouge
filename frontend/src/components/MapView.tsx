import { useEffect, useRef, useCallback } from 'react'
import * as maplibregl from 'maplibre-gl'
import type { MapLayerMouseEvent } from 'maplibre-gl'
import type { EdgeMetrics, NetworkGeoJSON, SelectedRoad } from '@/types'

interface MapViewProps {
  network: NetworkGeoJSON | null
  selectedRoad: SelectedRoad | null
  edgeMetrics: EdgeMetrics[] | null
  onSelectRoad: (road: SelectedRoad | null) => void
}

function congestionColor(congestion: number): string {
  if (congestion < 0.3) return '#84cc16'
  if (congestion < 0.5) return '#a3c9ff'
  if (congestion < 0.7) return '#f59e0b'
  if (congestion < 0.85) return '#f97316'
  return '#ba1a1a'
}

export function MapView({
  network,
  selectedRoad,
  edgeMetrics,
  onSelectRoad,
}: MapViewProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<maplibregl.Map | null>(null)

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
            },
          }
        }),
      }
    },
    [network, selectedRoad],
  )

  useEffect(() => {
    if (!containerRef.current || !network) return

    const center = network.properties?.center ?? [80.2707, 13.0827]

    const map = new maplibregl.Map({
      container: containerRef.current,
      style: {
        version: 8,
        sources: {
          osm: {
            type: 'raster',
            tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
            tileSize: 256,
            attribution: '© OpenStreetMap',
          },
        },
        layers: [
          {
            id: 'osm',
            type: 'raster',
            source: 'osm',
            paint: { 'raster-opacity': 0.25, 'raster-saturation': -0.3, 'raster-brightness-min': 0.1 },
          },
        ],
      },
      center: [center[0], center[1]],
      zoom: 13,
    })

    map.addControl(new maplibregl.NavigationControl(), 'top-right')

    map.on('load', () => {
      const geojson = buildGeoJSON(edgeMetrics)
      if (!geojson) return

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
            ['interpolate', ['linear'], ['get', 'congestion'], 0, 4, 1, 10],
          ],
          'line-opacity': 0.95,
        },
        layout: { 'line-cap': 'round', 'line-join': 'round' },
      })

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
    })

    mapRef.current = map
    return () => {
      map.remove()
      mapRef.current = null
    }
  }, [network])

  useEffect(() => {
    const map = mapRef.current
    if (!map || !map.isStyleLoaded()) return
    const source = map.getSource('roads') as maplibregl.GeoJSONSource | undefined
    const geojson = buildGeoJSON(edgeMetrics)
    if (source && geojson) {
      source.setData(geojson)
    }
  }, [edgeMetrics, selectedRoad, buildGeoJSON])

  return (
    <div className="map-bg relative h-full w-full">
      <div ref={containerRef} className="h-full w-full" />
      <div className="absolute bottom-20 left-4 rounded-[6px] border border-outline-variant bg-shell-surface/95 p-3 text-xs shadow-sm backdrop-blur-md">
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
    </div>
  )
}
