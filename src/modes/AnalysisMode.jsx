import { useState, useCallback, useMemo } from 'react'
import '../styles/analysis.css'
import RegionsLayer     from '../components/shared/RegionsLayer'
import TemporalSlider   from '../components/shared/TemporalSlider'
import MapUIPortal      from '../components/shared/MapUIPortal'
import ZonePanel        from '../components/analysis/ZonePanel'
import PolityMatrix     from '../components/analysis/PolityMatrix'
import AnalyticsPanel   from '../components/analysis/AnalyticsPanel'

const P = {
  bg:      'rgba(18, 22, 52, 0.96)',
  border:  'rgba(100, 110, 200, 0.18)',
  text:    'rgba(220, 225, 245, 0.88)',
  dim:     'rgba(180, 188, 220, 0.52)',
  accent:  '#76a66f',
  adim:    'rgba(118, 166, 111, 0.42)',
}

function regionStatus(slug, curriculum, selectedSource) {
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
    e => e.coverageStatus === 'present' || e.coverageStatus === 'partial'
  ).length

  if (si >= 2) return 'covered'
  if (si >= 1) return 'partial'
  if (entries.some(e => e.coderID !== 'formula')) return 'absent'
  return 'pending'
}

export default function AnalysisMode({
  geojson,
  regions,
  sources,
  curriculum,
  selectedSlug,
  zones,
  slugZone,
  year,
  onRegionClick,
  onYearChange,
}) {
  const [selectedZone, setSelectedZone] = useState(null)
  const [selectedSource, setSelectedSource] = useState(null)
  const [view, setView] = useState('map')
  const [whisper, setWhisper] = useState(null)

  const sourceList = useMemo(() => Object.values(sources || {}), [sources])

  const zoneCoverage = useMemo(() => {
    if (!zones || !curriculum || !slugZone) return {}
    const result = {}

    Object.keys(zones).forEach(zoneId => {
      const polities = Object.keys(curriculum).filter(s => slugZone[s] === zoneId)
      if (!polities.length) return

      let covered = 0
      let partial = 0
      let absent = 0
      let pending = 0

      polities.forEach(slug => {
        const st = regionStatus(slug, curriculum, selectedSource)
        if (st === 'covered') covered++
        else if (st === 'partial') partial++
        else if (st === 'absent') absent++
        else pending++
      })

      result[zoneId] = {
        total: polities.length,
        covered,
        partial,
        absent,
        pending,
        silenceRate: Math.round((absent / polities.length) * 100),
        polities,
      }
    })

    return result
  }, [zones, curriculum, slugZone, selectedSource])

  const ccsr = useMemo(() => {
    const slugs = Object.keys(curriculum)
    if (!slugs.length) return 0
    const silent = slugs.filter(slug => regionStatus(slug, curriculum, selectedSource) === 'absent').length
    return Math.round((silent / slugs.length) * 100)
  }, [curriculum, selectedSource])

  const stats = useMemo(() => {
    let covered = 0
    let partial = 0
    let absent = 0
    let pending = 0

    Object.keys(curriculum).forEach(slug => {
      const st = regionStatus(slug, curriculum, selectedSource)
      if (st === 'covered') covered++
      else if (st === 'partial') partial++
      else if (st === 'absent') absent++
      else pending++
    })

    return { covered, partial, absent, pending, total: Object.keys(curriculum).length }
  }, [curriculum, selectedSource])

  const handleWhisper = useCallback((slug, x, y) => {
    if (!slug) {
      setWhisper(null)
      return
    }
    const region = regions[slug]
    if (!region) {
      setWhisper(null)
      return
    }
    setWhisper({ slug, x, y, region })
  }, [regions])

  const handleZoneClick = useCallback((zoneId) => {
    setSelectedZone(prev => prev === zoneId ? null : zoneId)
    onRegionClick(null)
  }, [onRegionClick])

  const handleSourceClick = useCallback((sourceId) => {
    setSelectedSource(prev => prev === sourceId ? null : sourceId)
    setSelectedZone(null)
    onRegionClick(null)
  }, [onRegionClick])

  const handleViewChange = useCallback((next) => {
    setView(next)
    setSelectedZone(null)
    onRegionClick(null)
    if (next === 'charts') setSelectedSource(null)
  }, [onRegionClick])

  const sourceLabel = selectedSource ? (sources[selectedSource]?.country || selectedSource) : null

  return (
    <>
      {view === 'map' && (
        <RegionsLayer
          geojson={geojson}
          curriculum={curriculum}
          year={year}
          mode="analysis"
          selectedSlug={selectedSlug}
          selectedSource={selectedSource}
          onRegionClick={onRegionClick}
          onWhisper={handleWhisper}
        />
      )}

      <MapUIPortal>
        <div style={{
          position:'fixed',
          top:0, left:0, right:0,
          zIndex:510,
          background:P.bg,
          borderBottom:`0.5px solid ${P.border}`,
          padding:'11px 28px',
          display:'flex',
          alignItems:'center',
          justifyContent:'space-between',
          pointerEvents:'all',
          backdropFilter:'blur(14px)',
        }}>
          <div>
            <div style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:10,letterSpacing:'0.16em',textTransform:'uppercase',color:P.text}}>
              Mapping Historical Silence
            </div>
            <div style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:7.5,letterSpacing:'0.12em',textTransform:'uppercase',color:P.dim,marginTop:3}}>
              {selectedSlug
                ? `polity · ${regions[selectedSlug]?.name || selectedSlug}`
                : selectedZone
                ? `zone · ${zones[selectedZone]?.name}`
                : selectedSource
                ? `source lens · ${sourceLabel}`
                : view === 'charts'
                ? 'analytics charts'
                : 'analysis map · historical polygons'}
            </div>
          </div>

          <div style={{display:'flex',alignItems:'center',gap:8}}>
            <div style={{
              display:'flex',
              background:'rgba(255,255,255,0.04)',
              border:`0.5px solid ${P.border}`,
              borderRadius:6,
              overflow:'hidden',
              marginRight:6,
            }}>
              {['map', 'charts'].map(v => (
                <button
                  key={v}
                  onClick={() => handleViewChange(v)}
                  style={{
                    padding:'7px 12px',
                    background:view === v ? 'rgba(118,166,111,0.10)' : 'transparent',
                    border:'none',
                    borderRight:v === 'map' ? `0.5px solid ${P.border}` : 'none',
                    color:view === v ? P.accent : P.dim,
                    fontFamily:"'IBM Plex Mono',monospace",
                    fontSize:8,
                    letterSpacing:'0.10em',
                    textTransform:'uppercase',
                    cursor:'pointer',
                  }}
                >
                  {v}
                </button>
              ))}
            </div>

            {[
              {n:`${stats.covered}`, l:'covered', c:'#7388A3'},
              {n:`${stats.partial}`, l:'partial', c:'#6E998C'},
              {n:`${stats.absent}`,  l:'absent',  c:'#7AA56F'},
              {n:`${ccsr}%`,         l:'ccsr',    c:P.accent},
            ].map(s => (
              <div key={s.l} style={{
                display:'flex',
                flexDirection:'column',
                alignItems:'center',
                padding:'5px 12px',
                background:'rgba(255,255,255,0.04)',
                border:`0.5px solid ${P.border}`,
                borderRadius:4,
              }}>
                <span style={{fontFamily:"'Playfair Display',serif",fontSize:16,fontWeight:600,color:s.c,lineHeight:1}}>{s.n}</span>
                <span style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:7.5,letterSpacing:'0.10em',textTransform:'uppercase',color:P.dim,marginTop:3}}>{s.l}</span>
              </div>
            ))}
          </div>
        </div>

        {selectedSlug ? (
          <div style={{pointerEvents:'all'}}>
            <PolityMatrix
              slug={selectedSlug}
              region={regions[selectedSlug]}
              curriculum={curriculum}
              sources={sources}
              interpretations={{}}
              onClose={() => onRegionClick(null)}
            />
          </div>
        ) : selectedZone ? (
          <div style={{pointerEvents:'all'}}>
            <ZonePanel
              zone={zones[selectedZone]}
              zoneId={selectedZone}
              coverage={zoneCoverage[selectedZone]}
              curriculum={curriculum}
              regions={regions}
              sources={selectedSource ? { [selectedSource]: sources[selectedSource] } : sources}
              onSelectPolity={onRegionClick}
              onClose={() => setSelectedZone(null)}
            />
          </div>
        ) : view === 'charts' ? (
          <AnalyticsPanel
            curriculum={curriculum}
            zones={zones}
            slugZone={slugZone}
            sources={sources}
            zoneCoverage={zoneCoverage}
            onClose={() => handleViewChange('map')}
          />
        ) : (
          <div style={{
            position:'fixed',
            right:24,
            top:68,
            width:280,
            display:'flex',
            flexDirection:'column',
            gap:8,
            pointerEvents:'all',
            zIndex:520,
            maxHeight:'calc(100vh - 120px)',
            overflowY:'auto',
            scrollbarWidth:'none',
          }}>
            <div style={{
              background:P.bg,
              border:`0.5px solid rgba(118,166,111,0.28)`,
              borderRadius:8,
              padding:'14px 18px',
              textAlign:'center',
              backdropFilter:'blur(14px)',
            }}>
              <div style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:7.5,letterSpacing:'0.16em',textTransform:'uppercase',color:P.adim,marginBottom:5}}>
                CCSR
              </div>
              <div style={{fontFamily:"'Playfair Display',serif",fontSize:30,fontWeight:600,color:P.accent,lineHeight:1}}>
                {ccsr}%
              </div>
              <div style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:7.5,letterSpacing:'0.06em',color:P.dim,marginTop:5,lineHeight:1.45}}>
                of coded regions are absent
                <br />
                across the corpus
              </div>
            </div>

            <div style={{
              background:P.bg,
              border:`0.5px solid ${P.border}`,
              borderRadius:8,
              padding:'12px 14px',
              backdropFilter:'blur(14px)',
            }}>
              <div style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:7.5,letterSpacing:'0.14em',textTransform:'uppercase',color:P.adim,marginBottom:10}}>
                Sources
              </div>

              {sourceList.map(src => (
                <button
                  key={src.id}
                  onClick={() => handleSourceClick(src.id)}
                  style={{
                    width:'100%',
                    display:'flex',
                    alignItems:'center',
                    justifyContent:'space-between',
                    gap:10,
                    padding:'8px 10px',
                    marginBottom:5,
                    background:selectedSource === src.id ? 'rgba(118,166,111,0.10)' : 'rgba(255,255,255,0.02)',
                    border:`0.5px solid ${selectedSource === src.id ? 'rgba(118,166,111,0.25)' : P.border}`,
                    borderRadius:6,
                    textAlign:'left',
                    cursor:'pointer',
                  }}
                >
                  <span style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:8.5,color:P.text}}>
                    {src.country || src.id}
                  </span>
                  <span style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:7.5,color:P.dim}}>
                    {selectedSource === src.id ? 'on' : '↗'}
                  </span>
                </button>
              ))}
            </div>

            <div style={{
              background:P.bg,
              border:`0.5px solid ${P.border}`,
              borderRadius:8,
              padding:'12px 14px',
              backdropFilter:'blur(14px)',
            }}>
              <div style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:7.5,letterSpacing:'0.14em',textTransform:'uppercase',color:P.adim,marginBottom:10}}>
                Zones
              </div>

              {Object.entries(zoneCoverage)
                .sort((a, b) => b[1].silenceRate - a[1].silenceRate)
                .map(([zoneId, cov]) => {
                  const z = zones[zoneId]
                  if (!z || cov.total === 0) return null
                  return (
                    <button
                      key={zoneId}
                      onClick={() => handleZoneClick(zoneId)}
                      style={{
                        width:'100%',
                        display:'flex',
                        alignItems:'center',
                        justifyContent:'space-between',
                        gap:10,
                        padding:'8px 10px',
                        marginBottom:5,
                        background:'rgba(255,255,255,0.02)',
                        border:`0.5px solid ${P.border}`,
                        borderRadius:6,
                        textAlign:'left',
                        cursor:'pointer',
                      }}
                    >
                      <span style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:8.5,color:P.text}}>
                        {z.shortName}
                      </span>
                      <span style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:7.5,color:P.dim}}>
                        {cov.silenceRate}%
                      </span>
                    </button>
                  )
                })}
            </div>
          </div>
        )}

        {whisper && view === 'map' && !selectedSlug && (
          <div style={{
            position:'fixed',
            left:whisper.x + 14,
            top:whisper.y - 18,
            background:'rgba(12, 16, 42, 0.97)',
            border:`0.5px solid ${P.border}`,
            borderRadius:8,
            padding:'10px 12px',
            maxWidth:220,
            pointerEvents:'none',
            backdropFilter:'blur(14px)',
            zIndex:600,
          }}>
            <div style={{fontFamily:"'Playfair Display',serif",fontSize:15,fontWeight:600,color:P.text,marginBottom:4}}>
              {whisper.region?.name}
            </div>
            <div style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:7.5,color:P.dim,letterSpacing:'0.06em',textTransform:'uppercase'}}>
              {regionStatus(whisper.slug, curriculum, selectedSource)}
              {selectedSource ? ` · ${sourceLabel}` : ''}
            </div>
          </div>
        )}

        <div style={{pointerEvents:'all'}}>
          <TemporalSlider year={year} onChange={onYearChange} mode="analysis" />
        </div>
      </MapUIPortal>
    </>
  )
}