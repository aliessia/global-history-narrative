import { useState } from 'react'
import '../../styles/atlas.css'

import WorldSummary       from './WorldSummary'
import SimultaneityStrip  from './SimultaneityStrip'
import EventPresences     from './EventPresences'
import ObjectPresences    from './ObjectPresences'
import Dossier            from './Dossier'

/**
 * WorldLayer — slides in from right on region click in atlas mode
 *
 * Section order (never reorder):
 *   1. WorldSummary        — name, period, location
 *   2. SimultaneityStrip   — explicit connections + temporal neighbours
 *   3. EventPresences      — this region's own events
 *   4. ObjectPresences     — material culture from Met Museum
 *   5. Open dossier btn    — gateway to scholarship and curriculum evidence
 */
export default function WorldLayer({
  region,
  objectConfig,     // from objects-curated.json keyed by slug
  curriculum = {},
  sources    = {},
  interpretations = {},
  allRegions = {},
  onClose,
  onRegionClick,
  onPinObject,
  pinnedObjects = [],
}) {
  const [dossierOpen, setDossierOpen] = useState(false)

  if (!region) return null

  return (
    <>
      <div className="world-layer open">
        <button className="world-layer__close" onClick={onClose}>✕</button>

        <WorldSummary region={region} />

        <div className="world-layer__body">

          <SimultaneityStrip
            currentSlug={region.slug}
            currentPeriod={region.period}
            currentConnections={region.connections}
            allRegions={allRegions}
            onRegionClick={onRegionClick}
          />

          {region.events?.length > 0 && (
            <>
              <div className="world-section-head">Key events</div>
              <EventPresences events={region.events} />
            </>
          )}

          <div className="world-section-head">Material culture</div>
          <ObjectPresences
            objectConfig={objectConfig}
            onAddToCabinet={onPinObject}
            pinnedObjects={pinnedObjects}
          />

          <button
            className="open-dossier-btn"
            onClick={() => setDossierOpen(true)}
          >
            Open full record — scholarship &amp; representation ↗
          </button>

        </div>
      </div>

      {dossierOpen && (
        <Dossier
          region={region}
          curriculum={curriculum}
          sources={sources}
          interpretations={interpretations}
          onClose={() => setDossierOpen(false)}
        />
      )}
    </>
  )
}