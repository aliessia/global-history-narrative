import { useState, useEffect } from 'react'

/**
 * ObjectPresences — fetches objects from the Metropolitan Museum Open Access API
 * Uses a search query per region (from objects-curated.json) rather than hardcoded IDs.
 * Displays up to 4 objects with images, title, culture, date.
 */

const MET_BASE = 'https://collectionapi.metmuseum.org/public/collection/v1'

async function searchMet(query, department, maxResults = 4) {
  try {
    const deptParam = department ? `&departmentId=${department}` : ''
    const searchUrl = `${MET_BASE}/search?q=${encodeURIComponent(query)}&hasImages=true${deptParam}`
    const searchRes = await fetch(searchUrl)
    const searchData = await searchRes.json()

    if (!searchData.objectIDs?.length) return []

    // Take a sample of IDs (spread across results for variety)
    const ids = searchData.objectIDs.slice(0, Math.min(20, searchData.objectIDs.length))
    const picked = pickSpread(ids, maxResults * 2)

    const objects = await Promise.all(
      picked.map(id =>
        fetch(`${MET_BASE}/objects/${id}`)
          .then(r => r.json())
          .catch(() => null)
      )
    )

    return objects
      .filter(o => o && o.primaryImageSmall && o.objectID)
      .slice(0, maxResults)
  } catch {
    return []
  }
}

function pickSpread(arr, n) {
  if (arr.length <= n) return arr
  const step = Math.floor(arr.length / n)
  return Array.from({ length: n }, (_, i) => arr[i * step])
}

export default function ObjectPresences({ objectConfig, onAddToCabinet, pinnedObjects = [] }) {
  const [objects, setObjects]   = useState([])
  const [loading, setLoading]   = useState(true)
  const [error, setError]       = useState(false)

  useEffect(() => {
    if (!objectConfig) { setLoading(false); return }
    setLoading(true)
    setError(false)

    searchMet(
      objectConfig.query,
      objectConfig.department,
      objectConfig.maxResults || 4
    ).then(results => {
      if (!results.length && objectConfig.fallbackQuery) {
        return searchMet(objectConfig.fallbackQuery, null, objectConfig.maxResults || 4)
      }
      return results
    }).then(results => {
      setObjects(results)
      setLoading(false)
      if (!results.length) setError(true)
    }).catch(() => {
      setLoading(false)
      setError(true)
    })
  }, [objectConfig?.query])

  if (loading) return (
    <div style={{
      fontFamily:"'IBM Plex Mono',monospace",
      fontSize: 8, color:'rgba(200,160,72,0.30)',
      letterSpacing:'0.10em', padding:'8px 0',
    }}>
      fetching from the Met…
    </div>
  )

  if (error || !objects.length) return (
    <div style={{
      fontFamily:"'Cormorant Garamond',serif",
      fontSize: 13, fontStyle:'italic',
      color:'rgba(200,180,150,0.35)', padding:'4px 0',
    }}>
      No digitised objects found for this region.
    </div>
  )

  return (
    <div>
      {objects.map(obj => (
        <div
          key={obj.objectID}
          className="object-presence"
          onClick={() => onAddToCabinet?.({
            id:      obj.objectID,
            title:   obj.title,
            img:     obj.primaryImageSmall,
            culture: obj.culture,
            date:    obj.objectDate,
          })}
        >
          <div className="object-presence__img-wrap">
            <img
              className="object-presence__img"
              src={obj.primaryImageSmall}
              alt={obj.title}
              loading="lazy"
            />
          </div>

          <div className="object-presence__meta">
            <div className="object-presence__title">{obj.title}</div>

            {obj.culture && (
              <div className="object-presence__culture">{obj.culture}</div>
            )}

            {obj.objectDate && (
              <div className="object-presence__date">{obj.objectDate}</div>
            )}

            {obj.medium && (
              <div style={{
                fontFamily:"'IBM Plex Mono',monospace",
                fontSize: 7.5,
                color:'rgba(200,160,72,0.28)',
                marginTop: 3,
                lineHeight: 1.4,
              }}>
                {obj.medium.substring(0, 60)}{obj.medium.length > 60 ? '…' : ''}
              </div>
            )}

            <div style={{
              display:'flex', alignItems:'center', gap:6, marginTop:5,
            }}>
              <span style={{
                fontFamily:"'IBM Plex Mono',monospace",
                fontSize: 7.5,
                color:'rgba(200,160,72,0.38)',
                letterSpacing:'0.08em',
              }}>
                {pinnedObjects.find(p => p.id === obj.objectID) ? '📍 pinned' : '📍 pin to map'}
              </span>
              {obj.objectURL && (
                <a
                  href={obj.objectURL}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={e => e.stopPropagation()}
                  style={{
                    fontFamily:"'IBM Plex Mono',monospace",
                    fontSize: 7.5,
                    color:'rgba(200,160,72,0.28)',
                    textDecoration:'none',
                    letterSpacing:'0.06em',
                  }}
                >
                  ↗ Met
                </a>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}