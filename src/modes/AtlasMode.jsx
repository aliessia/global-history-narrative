import { useState, useCallback } from 'react'
import '../styles/atlas.css'
import RegionsLayer      from '../components/shared/RegionsLayer'
import TemporalSlider    from '../components/shared/TemporalSlider'
import MapUIPortal       from '../components/shared/MapUIPortal'
import WorldLayer        from '../components/atlas/WorldLayer'
import RegionLabelsLayer from '../components/atlas/RegionLabelsLayer'
import MapObjectsLayer   from '../components/atlas/MapObjectsLayer'

/**
 * AtlasMode — world-entry historical atlas
 *
 * LAYER STACK (bottom → top):
 *   Stamen Watercolor tile layer
 *   RegionsLayer (ghost borders + faint fill — temporal slider makes these appear/disappear)
 *   RegionLabelsLayer (cartographic italic text)
 *   MapObjectsLayer (pinned Met Museum objects as map cards)
 *   MapUIPortal (topbar, WorldLayer panel, slider)
 *
 * No Cabinet. Museum objects pin directly onto the map when clicked.
 * Multiple objects from different regions can be pinned simultaneously.
 * Click a pin to remove it.
 */
export default function AtlasMode({
  geojson, regions, allRegions, selectedSlug, year,
  onRegionClick, onYearChange,
  objects, curriculum, sources, interpretations,
}) {
  const [whisper, setWhisper]           = useState(null)
  const [pinnedObjects, setPinned]      = useState([])

  const handleWhisper = useCallback((slug, x, y) => {
    if (!slug) { setWhisper(null); return }
    const region = regions[slug]
    if (!region) { setWhisper(null); return }
    setWhisper({ slug, x, y, region })
  }, [regions])

  // Pin a museum object to the map at this region's centroid
  const handlePinObject = useCallback((item, slug) => {
    setPinned(prev => {
      if (prev.find(p => p.id === item.id)) {
        // already pinned — unpin
        return prev.filter(p => p.id !== item.id)
      }
      // slight offset so multiple pins from same region don't overlap exactly
      const regionPins = prev.filter(p => p.slug === slug).length
      return [...prev, { ...item, slug, _offset: regionPins * 0.8 }]
    })
  }, [])

  const handleUnpin = useCallback((id) => {
    setPinned(prev => prev.filter(p => p.id !== id))
  }, [])

  const selectedRegion = selectedSlug ? regions[selectedSlug] : null

  return (
    <>
      {/* ── Leaflet layers ─────────────────────────────────────────────── */}
      <RegionsLayer
        geojson={geojson}
        regions={regions}
        curriculum={curriculum}
        year={year}
        mode="atlas"
        selectedSlug={selectedSlug}
        onRegionClick={onRegionClick}
        onWhisper={handleWhisper}
      />

      <RegionLabelsLayer regions={regions} selectedSlug={selectedSlug} />

      <MapObjectsLayer pinnedObjects={pinnedObjects} onUnpin={handleUnpin} />

      {/* ── UI overlays ────────────────────────────────────────────────── */}
      <MapUIPortal>
        <div className="atlas-vignette" style={{ pointerEvents:'none' }} />

        <div className="atlas-topbar" style={{ pointerEvents:'all' }}>
          <div className="atlas-branding">
            <div className="atlas-brand-name">Mapping Historical Silence</div>
            <div className="atlas-brand-rule"><span>✦</span></div>
            <div className="atlas-brand-sub">13th century · global history</div>
          </div>
        </div>

        {whisper && (
          <div
            className="atlas-whisper"
            style={{ left: whisper.x + 16, top: whisper.y, pointerEvents:'none' }}
          >
            <span className="atlas-whisper__name">{whisper.region?.name}</span>
            <span className="atlas-whisper__period">{whisper.region?.period}</span>
          </div>
        )}

        {selectedRegion && (
          <div style={{ pointerEvents:'all' }}>
            <WorldLayer
              region={selectedRegion}
              objectConfig={objects?.[selectedSlug] || null}
              allRegions={allRegions}
              curriculum={curriculum}
              sources={sources}
              interpretations={interpretations}
              onClose={() => onRegionClick(null)}
              onRegionClick={onRegionClick}
              onPinObject={(item) => handlePinObject(item, selectedSlug)}
              pinnedObjects={pinnedObjects}
            />
          </div>
        )}

        <div style={{ pointerEvents:'all' }}>
          <TemporalSlider year={year} onChange={onYearChange} mode="atlas" />
        </div>
      </MapUIPortal>
    </>
  )
}