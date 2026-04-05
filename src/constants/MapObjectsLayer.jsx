import { Marker } from 'react-leaflet'
import L from 'leaflet'
import { REGION_CENTROIDS } from '../../constants/regionCentroids'

/**
 * MapObjectsLayer — pins museum objects directly onto the map
 *
 * When a user clicks "pin to map" on an object in ObjectPresences,
 * a floating card appears at the region's centroid on the map.
 * Cards show: sepia thumbnail, object title, culture, date.
 * Click the × to remove. Multiple pins from different regions coexist.
 *
 * Uses Leaflet DivIcon so the card is pure HTML/CSS —
 * no SVG complexity, crisp at all zoom levels.
 */

function makePinIcon(item, onRemove) {
  const id = `map-pin-${item.id}`

  const html = `
    <div class="map-object-pin" id="${id}">
      <button class="map-object-pin__close" data-id="${item.id}" aria-label="remove">×</button>
      ${item.img
        ? `<img class="map-object-pin__img" src="${item.img}" alt="${item.title}" />`
        : `<div class="map-object-pin__img map-object-pin__img--empty">◆</div>`
      }
      <div class="map-object-pin__body">
        <div class="map-object-pin__title">${item.title}</div>
        ${item.culture ? `<div class="map-object-pin__culture">${item.culture}</div>` : ''}
        ${item.date ? `<div class="map-object-pin__date">${item.date}</div>` : ''}
      </div>
      <div class="map-object-pin__stem"></div>
    </div>
  `

  return L.divIcon({
    html,
    className: '',
    iconAnchor: [68, 130],   // tip of stem points to region centroid
    iconSize:   [136, 134],
  })
}

export default function MapObjectsLayer({ pinnedObjects, onUnpin }) {
  if (!pinnedObjects?.length) return null

  return (
    <>
      {pinnedObjects.map(item => {
        const pos = REGION_CENTROIDS[item.slug]
        if (!pos) return null

        // Slight offset so multiple pins from same region don't stack exactly
        const lat = pos[0] + (item._offset || 0)
        const lng = pos[1] + (item._offset || 0) * 1.5

        const icon = makePinIcon(item)

        return (
          <Marker
            key={item.id}
            position={[lat, lng]}
            icon={icon}
            interactive={true}
            eventHandlers={{
              click: () => onUnpin(item.id),
            }}
          />
        )
      })}
    </>
  )
}
