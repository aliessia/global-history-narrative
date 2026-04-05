import { GeoJSON } from 'react-leaflet'

export default function SilenceMap({ zonesGeo, zoneCoverage, selectedZone, onZoneClick }) {
  if (!zonesGeo?.features?.length) return null
  const key = JSON.stringify(Object.keys(zoneCoverage || {}))
  return (
    <GeoJSON
      key={key}
      data={zonesGeo}
      style={(feature) => {
        const zoneId     = feature.properties?.id
        const isSelected = zoneId === selectedZone
        return {
          fillColor:   'transparent',
          fillOpacity: isSelected ? 0.12 : 0,
          color:       isSelected ? 'rgba(118,166,111,0.60)' : 'transparent',
          weight:      isSelected ? 1.5 : 0,
        }
      }}
      onEachFeature={(feature, layer) => {
        const zoneId = feature.properties?.id
        layer.on({
          click:     () => onZoneClick?.(zoneId),
          mouseover: () => layer.setStyle({ fillColor:'rgba(255,255,255,0.06)', fillOpacity:1, color:'rgba(255,255,255,0.20)', weight:0.8 }),
          mouseout:  () => {
            const isSelected = zoneId === selectedZone
            layer.setStyle({ fillColor:'transparent', fillOpacity:isSelected?0.12:0, color:isSelected?'rgba(118,166,111,0.60)':'transparent', weight:isSelected?1.5:0 })
          },
        })
      }}
    />
  )
}