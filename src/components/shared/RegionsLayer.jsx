import { useRef } from 'react'
import { GeoJSON } from 'react-leaflet'

const ATLAS_INVISIBLE = {
  fillColor:'transparent', fillOpacity:0, color:'transparent', weight:0, opacity:0
}

const ATLAS_GHOST = {
  fillColor:   'rgba(160, 100, 30, 1)',
  fillOpacity: 0.06,
  color:       'rgba(55, 32, 8, 0.50)',
  weight:      1.1,
  opacity:     0.75,
  lineCap:     'round',
  lineJoin:    'round',
}

const ATLAS_SELECTED = {
  fillColor:   'rgba(200, 150, 50, 1)',
  fillOpacity: 0.15,
  color:       'rgba(150, 95, 15, 0.90)',
  weight:      2.0,
  opacity:     0.95,
  lineCap:     'round',
  lineJoin:    'round',
}

const ATLAS_HOVER = {
  fillColor:   'rgba(180, 130, 35, 1)',
  fillOpacity: 0.10,
  color:       'rgba(80, 48, 10, 0.70)',
  weight:      1.5,
  opacity:     0.85,
  lineCap:     'round',
  lineJoin:    'round',
}

/* analysis-only palette */
const ANALYSIS = {
  covered: {
    fillColor:'#7388A3',
    fillOpacity:0.26,
    color:'rgba(150,170,195,0.18)',
    weight:0.5,
    opacity:0.18,
  },
  partial: {
    fillColor:'#6E998C',
    fillOpacity:0.28,
    color:'rgba(140,175,165,0.18)',
    weight:0.5,
    opacity:0.18,
  },
  absent: {
    fillColor:'#7AA56F',
    fillOpacity:0.30,
    color:'rgba(150,190,145,0.18)',
    weight:0.5,
    opacity:0.18,
  },
  pending: {
    fillColor:'#40485D',
    fillOpacity:0.14,
    color:'rgba(95,105,130,0.14)',
    weight:0.4,
    opacity:0.12,
  },
}

function analysisStyle(status, isSelected) {
  const base = ANALYSIS[status] || ANALYSIS.pending
  if (isSelected) {
    return {
      ...base,
      fillOpacity: Math.min(base.fillOpacity + 0.10, 0.42),
      color: 'rgba(240,244,250,0.55)',
      weight: 1.1,
      opacity: 0.52,
      lineCap: 'round',
      lineJoin: 'round',
    }
  }
  return { ...base, lineCap:'round', lineJoin:'round' }
}

function analysisHover(status) {
  const base = ANALYSIS[status] || ANALYSIS.pending
  return {
    ...base,
    fillOpacity: Math.min(base.fillOpacity + 0.08, 0.40),
    color: 'rgba(240,244,250,0.34)',
    weight: 0.8,
    opacity: 0.34,
    lineCap: 'round',
    lineJoin: 'round',
  }
}

function isWorldShape(f) {
  const p = f.properties || {}
  return !p.slug && (p.NAME || p.ADMIN || p.sovereignt)
}

function coverageStatus(slug, curriculum, selectedSource) {
  const entries = curriculum[slug] || []

  if (selectedSource) {
    const entry = entries.find(e => e.sourceId === selectedSource)
    if (!entry) return 'pending'
    if (entry.coverageStatus === 'present') return 'covered'
    if (entry.coverageStatus === 'partial') return 'partial'
    if (entry.coderID !== 'formula') return 'absent'
    return 'pending'
  }

  const si = entries.filter(
    x => x.coverageStatus === 'present' || x.coverageStatus === 'partial'
  ).length

  if (si >= 2) return 'covered'
  if (si === 1) return 'partial'
  if (entries.some(x => x.coderID !== 'formula')) return 'absent'
  return 'pending'
}

export default function RegionsLayer({
  geojson,
  curriculum = {},
  year,
  mode,
  selectedSlug,
  selectedSource = null,
  onRegionClick,
  onWhisper,
}) {
  const ref = useRef(null)

  const filtered = geojson?.features ? {
    ...geojson,
    features: geojson.features.filter(f => {
      const s = f.properties?.start_year
      const e = f.properties?.end_year
      if (!s && !e) return true
      return (!s || s <= year) && (!e || e >= year)
    })
  } : geojson

  function style(f) {
    const slug = f.properties?.slug

    if (mode === 'atlas') {
      if (isWorldShape(f) || !slug) return ATLAS_INVISIBLE
      if (slug === selectedSlug) return ATLAS_SELECTED
      return ATLAS_GHOST
    }

    if (!slug) return ATLAS_INVISIBLE
    return analysisStyle(coverageStatus(slug, curriculum, selectedSource), slug === selectedSlug)
  }

  function onEach(f, layer) {
    const slug = f.properties?.slug
    if (!slug) return

    if (mode === 'atlas') {
      layer.on('mouseover', e => {
        if (slug !== selectedSlug) layer.setStyle(ATLAS_HOVER)
        onWhisper?.(slug, e.originalEvent.clientX, e.originalEvent.clientY)
      })
      layer.on('mouseout', () => {
        if (slug !== selectedSlug) layer.setStyle(ATLAS_GHOST)
        onWhisper?.(null)
      })
      layer.on('click', () => {
        onWhisper?.(null)
        onRegionClick?.(slug)
      })
      return
    }

    if (mode === 'analysis') {
      const st = coverageStatus(slug, curriculum, selectedSource)
      layer.on('mouseover', e => {
        layer.setStyle(analysisHover(st))
        onWhisper?.(slug, e.originalEvent.clientX, e.originalEvent.clientY)
      })
      layer.on('mouseout', () => {
        layer.setStyle(analysisStyle(st, slug === selectedSlug))
        onWhisper?.(null)
      })
      layer.on('click', () => onRegionClick?.(slug))
    }
  }

  if (!filtered?.features?.length) return null

  return (
    <GeoJSON
      key={`${mode}-${year}-${selectedSlug}-${selectedSource || 'all'}`}
      ref={ref}
      data={filtered}
      style={style}
      onEachFeature={onEach}
    />
  )
}