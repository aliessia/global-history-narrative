import { useEffect, useRef } from 'react'
import { useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet.heat'
import * as turf from '@turf/turf'

/**
 * HeatmapLayer — KDE heatmap overlay for analysis mode
 * Four modes: silence | attention | topic | confirmed
 * Uses Leaflet.heat (must be imported in index.html or via npm)
 */
export default function HeatmapLayer({
  geojson,
  regions,
  curriculum,
  sources,
  mode = 'silence',
}) {
  const map     = useMap()
  const heatRef = useRef(null)

  useEffect(() => {
    if (!geojson?.features) return

    // Remove existing heatmap
    if (heatRef.current) {
      map.removeLayer(heatRef.current)
      heatRef.current = null
    }

    // Build weighted point array from region centroids
    const points = []

    geojson.features.forEach(feature => {
      const slug    = feature.properties?.slug
      if (!slug) return

      const entries = curriculum[slug] || []
      const si      = entries.filter(
        e => e.coverageStatus === 'present' || e.coverageStatus === 'partial'
      ).length

      const region = regions[slug]
      if (!region) return

      let weight = 0

      switch (mode) {
        case 'silence':
          weight = si === 0 ? 1 : 0
          break

        case 'attention':
          // PTA aggregate — sum of normalised page counts
          weight = entries.reduce((sum, e) => {
            const src = sources[e.sourceId]
            if (!src?.totalPages || !e.pageCount) return sum
            return sum + (e.pageCount / src.totalPages)
          }, 0)
          break

        case 'topic':
          // Topic density — diversity of topics across all entries
          const allTopics = new Set(entries.flatMap(e => e.topicsPresent || []))
          weight = allTopics.size / 6  // normalise to approx max
          break

        case 'confirmed':
          // Only confirmed absent (dataStatus: real + SI = 0)
          weight = (region.dataStatus === 'real' && si === 0) ? 1 : 0
          break

        default:
          weight = si === 0 ? 1 : 0
      }

      if (weight <= 0) return

      try {
        const centroid = turf.centroid(feature)
        const [lng, lat] = centroid.geometry.coordinates
        points.push([lat, lng, weight])
      } catch {
        // Skip malformed features
      }
    })

    if (!points.length) return

    // Create heat layer — Leaflet.heat plugin required
    if (L.heatLayer) {
      heatRef.current = L.heatLayer(points, {
        radius:  38,
        blur:    28,
        maxZoom: 6,
        max:     1.0,
        gradient: mode === 'attention'
          ? { 0.0: 'rgba(72,120,160,0)', 0.5: 'rgba(72,120,160,0.5)', 1.0: 'rgba(72,120,160,0.85)' }
          : mode === 'topic'
          ? { 0.0: 'rgba(74,136,48,0)',  0.5: 'rgba(74,136,48,0.5)',  1.0: 'rgba(74,136,48,0.85)' }
          : { 0.0: 'rgba(184,80,64,0)',  0.5: 'rgba(184,80,64,0.5)',  1.0: 'rgba(184,80,64,0.9)' },
      }).addTo(map)
    }

    return () => {
      if (heatRef.current) {
        map.removeLayer(heatRef.current)
        heatRef.current = null
      }
    }
  }, [geojson, curriculum, sources, regions, mode, map])

  return null
}
