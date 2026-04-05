import { Marker } from 'react-leaflet'
import L from 'leaflet'

const CENTROIDS = {
  'mali-empire':             [14.5,  -4.0],
  'delhi-sultanate':         [26.5,  77.0],
  'golden-horde':            [49.0,  53.0],
  'japan':                   [36.5, 138.0],
  'song-china':              [29.0, 113.0],
  'novgorod-republic':       [58.5,  35.0],
  'republic-of-venice':      [45.4,  12.3],
  'republic-of-genoa':       [44.3,   9.2],
  'ilkhanate':               [34.0,  50.0],
  'yuan-dynasty':            [40.0, 108.0],
  'goryeo':                  [36.5, 127.5],
  'khmer-empire':            [13.5, 104.0],
  'pagan-empire':            [21.5,  95.5],
  'chola-empire':            [11.0,  79.0],
  'mapungubwe':              [-22.0, 29.4],
  'mamluk-sultanate':        [26.5,  30.0],
  'mongol-empire':           [48.0,  95.0],
  'kingdom-of-france':       [47.0,   2.0],
  'kingdom-of-england':      [52.5,  -1.5],
  'holy-roman-empire':       [50.5,  11.0],
  'kievan-rus':              [50.5,  30.5],
  'ghana-empire':            [16.0, -10.0],
  'kanem-empire':            [14.0,  16.0],
  'swahili-city-states':     [-6.0,  39.5],
  'srivijaya':               [-1.5, 104.5],
  'dai-viet':                [20.0, 105.5],
  'tibet':                   [31.0,  90.0],
}

function makePinIcon(item) {
  const title = (item.title||'').length > 40 ? item.title.slice(0,38)+'…' : (item.title||'')
  const html = `
    <div class="map-object-pin">
      <button class="map-object-pin__close">×</button>
      ${item.img
        ? `<img class="map-object-pin__img" src="${item.img}" alt="" />`
        : `<div class="map-object-pin__img map-object-pin__img--empty">◆</div>`}
      <div class="map-object-pin__body">
        <div class="map-object-pin__title">${title}</div>
        ${item.culture ? `<div class="map-object-pin__culture">${item.culture}</div>` : ''}
        ${item.date    ? `<div class="map-object-pin__date">${item.date}</div>` : ''}
      </div>
      <div class="map-object-pin__stem"></div>
    </div>`
  return L.divIcon({ html, className: '', iconAnchor: [68, 130], iconSize: [136, 130] })
}

export default function MapObjectsLayer({ pinnedObjects, onUnpin }) {
  if (!pinnedObjects?.length) return null
  return (
    <>
      {pinnedObjects.map(item => {
        const base = CENTROIDS[item.slug]
        if (!base) return null
        const offset = item._offset || 0
        return (
          <Marker
            key={item.id}
            position={[base[0] + offset * 0.5, base[1] + offset * 1.2]}
            icon={makePinIcon(item)}
            eventHandlers={{ click: () => onUnpin(item.id) }}
          />
        )
      })}
    </>
  )
}