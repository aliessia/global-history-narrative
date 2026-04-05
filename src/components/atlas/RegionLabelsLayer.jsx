import { useMemo } from 'react'
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

function makeLabelIcon(name, isSelected) {
  const words = name.split(' ')
  let line1 = name, line2 = ''
  if (words.length >= 3) {
    const mid = Math.ceil(words.length / 2)
    line1 = words.slice(0, mid).join(' ')
    line2 = words.slice(mid).join(' ')
  }
  const html = `<div style="font-family:'Cormorant Garamond',serif;font-size:${isSelected?'11px':'9.5px'};font-style:italic;font-weight:400;letter-spacing:0.14em;text-transform:uppercase;color:rgba(28,18,4,${isSelected?'0.65':'0.40'});text-align:center;white-space:nowrap;pointer-events:none;user-select:none;line-height:1.4;text-shadow:1px 1px 0 rgba(255,248,235,0.7),-1px -1px 0 rgba(255,248,235,0.7),1px -1px 0 rgba(255,248,235,0.7),-1px 1px 0 rgba(255,248,235,0.7);"><div>${line1}</div>${line2?`<div>${line2}</div>`:''}</div>`
  return L.divIcon({ html, className: '', iconAnchor: [0,0], iconSize: null })
}

export default function RegionLabelsLayer({ regions, selectedSlug }) {
  const entries = useMemo(() => (
    Object.values(regions || {})
      .filter(r => r.slug && r.name && CENTROIDS[r.slug])
      .map(r => ({ slug: r.slug, name: r.name, pos: CENTROIDS[r.slug] }))
  ), [regions])

  if (!entries.length) return null
  return (
    <>
      {entries.map(({ slug, name, pos }) => (
        <Marker
          key={slug}
          position={pos}
          icon={makeLabelIcon(name, slug === selectedSlug)}
          interactive={false}
          zIndexOffset={slug === selectedSlug ? 500 : 100}
        />
      ))}
    </>
  )
}