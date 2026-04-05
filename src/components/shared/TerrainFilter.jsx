import { useEffect } from 'react'
import { useMap } from 'react-leaflet'

/**
 * TerrainFilter — manages pane-level CSS for atlas vs analysis mode
 *
 * In atlas mode: tile pane gets a slight warm tint to match the parchment feel
 * In analysis mode: tile pane gets desaturated + darkened for data viz context
 *
 * NO SVG displacement filter. That approach was abandoned.
 * The Stamen Watercolor tiles already have organic, hand-drawn edges.
 */
export default function TerrainFilter({ mode }) {
  const map = useMap()

  useEffect(() => {
    const tilePane    = map.getPane('tilePane')
    const overlayPane = map.getPane('overlayPane')

    if (mode === 'atlas') {
      if (tilePane)    tilePane.style.filter    = 'sepia(0.15) saturate(0.9) brightness(0.95)'
      if (overlayPane) overlayPane.style.filter = 'none'
    } else {
      if (tilePane)    tilePane.style.filter    = 'grayscale(0.55) contrast(0.82) brightness(0.68)'
      if (overlayPane) overlayPane.style.filter = 'none'
    }

    return () => {
      if (tilePane)    tilePane.style.filter    = ''
      if (overlayPane) overlayPane.style.filter = ''
    }
  }, [mode, map])

  return null
}