import { createPortal } from 'react-dom'

/**
 * MapUIPortal — renders UI overlay elements into document.body,
 * outside Leaflet's DOM tree.
 *
 * Problem: Leaflet's MapContainer intercepts pointer events and
 * manages its own z-index stack. Regular React children inside
 * MapContainer that are not Leaflet components can have unpredictable
 * stacking and event behaviour.
 *
 * Solution: Portal non-Leaflet UI (panels, tooltips, sliders) into
 * a fixed overlay div on document.body that sits above the map.
 *
 * Usage:
 *   <MapUIPortal>
 *     <div className="world-layer open">...</div>
 *   </MapUIPortal>
 */
export default function MapUIPortal({ children }) {
  return createPortal(
    <div
      id="map-ui-portal"
      style={{
        position: 'fixed',
        inset: 0,
        pointerEvents: 'none',
        zIndex: 500,
      }}
    >
      {children}
    </div>,
    document.body
  )
}