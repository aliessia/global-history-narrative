import { useMemo } from 'react'

/**
 * SimultaneityStrip — three-layer connected histories
 *
 * Layer 1 — EXPLICIT CONNECTIONS (from regions.json `connections[]`)
 *   Documented links: trade routes, diplomatic alliances, military conflicts,
 *   religious networks, population movements.
 *   These are historically specific and labelled.
 *
 * Layer 2 — THEMATIC FORCES (from regions.json `themes[]`)
 *   Shared historical forces crossing multiple regions simultaneously.
 *   "Mongol expansion" affects Japan, Song China, Delhi Sultanate, Golden Horde.
 *   "trans-Saharan gold" connects Mali to Venice and Genoa.
 *   This is the DH argument: the 13th century as a single interconnected system.
 *
 * Layer 3 — TEMPORAL NEIGHBOURS
 *   Other regions active in 1200–1299 not yet shown above.
 *   Subrahmanyam's connected histories — the world in the same moment.
 *
 * Every chip shows a coverage dot (red/blue/green) — silent or present in corpus.
 * Clicking navigates to that region.
 */

const CONNECTION_COLORS = {
  trade:     { bg:'rgba(72,120,160,0.10)', border:'rgba(72,120,160,0.28)', text:'#6898c8', icon:'⚓' },
  diplomacy: { bg:'rgba(74,136,48,0.10)',  border:'rgba(74,136,48,0.25)',  text:'#6ab050', icon:'📜' },
  conflict:  { bg:'rgba(184,80,64,0.10)',  border:'rgba(184,80,64,0.28)',  text:'#d87060', icon:'⚔' },
  religion:  { bg:'rgba(200,160,72,0.10)', border:'rgba(200,160,72,0.28)', text:'#d4a050', icon:'✦' },
  migration: { bg:'rgba(130,90,140,0.10)', border:'rgba(130,90,140,0.28)', text:'#a070b0', icon:'↗' },
}

// Theme → colour mapping — each theme has an identity across the platform
const THEME_COLORS = {
  'Mongol expansion':             { bg:'rgba(184,80,64,0.08)',  border:'rgba(184,80,64,0.22)',  text:'rgba(216,112,96,0.85)' },
  'trans-Saharan gold':           { bg:'rgba(200,160,72,0.08)', border:'rgba(200,160,72,0.25)', text:'rgba(220,175,90,0.85)' },
  'Islamic governance':           { bg:'rgba(74,136,48,0.08)',  border:'rgba(74,136,48,0.22)',  text:'rgba(106,176,80,0.85)' },
  'Islamic scholarship':          { bg:'rgba(74,136,48,0.08)',  border:'rgba(74,136,48,0.22)',  text:'rgba(106,176,80,0.85)' },
  'Islamic conversion':           { bg:'rgba(74,136,48,0.08)',  border:'rgba(74,136,48,0.22)',  text:'rgba(106,176,80,0.85)' },
  'Pax Mongolica':                { bg:'rgba(200,160,72,0.08)', border:'rgba(200,160,72,0.22)', text:'rgba(220,180,100,0.85)' },
  'proto-industrial economy':     { bg:'rgba(72,120,160,0.08)', border:'rgba(72,120,160,0.22)', text:'rgba(100,160,200,0.85)' },
  'paper money':                  { bg:'rgba(72,120,160,0.08)', border:'rgba(72,120,160,0.22)', text:'rgba(100,160,200,0.85)' },
  'ocean trade':                  { bg:'rgba(72,120,160,0.08)', border:'rgba(72,120,160,0.22)', text:'rgba(100,160,200,0.85)' },
  'Baltic commerce':              { bg:'rgba(72,120,160,0.08)', border:'rgba(72,120,160,0.22)', text:'rgba(100,160,200,0.85)' },
  'Hanseatic network':            { bg:'rgba(72,120,160,0.08)', border:'rgba(72,120,160,0.22)', text:'rgba(100,160,200,0.85)' },
  'Mediterranean commerce':       { bg:'rgba(72,120,160,0.08)', border:'rgba(72,120,160,0.22)', text:'rgba(100,160,200,0.85)' },
  'South Asian trade':            { bg:'rgba(72,120,160,0.08)', border:'rgba(72,120,160,0.22)', text:'rgba(100,160,200,0.85)' },
  'Buddhist transmission':        { bg:'rgba(130,90,140,0.08)', border:'rgba(130,90,140,0.22)', text:'rgba(170,120,180,0.85)' },
  'Persian court culture':        { bg:'rgba(130,90,140,0.08)', border:'rgba(130,90,140,0.22)', text:'rgba(170,120,180,0.85)' },
  'Eurasian steppe commerce':     { bg:'rgba(200,160,72,0.08)', border:'rgba(200,160,72,0.22)', text:'rgba(220,180,100,0.85)' },
  'slave-soldier system':         { bg:'rgba(184,80,64,0.08)',  border:'rgba(184,80,64,0.20)',  text:'rgba(210,110,90,0.85)' },
  'Mongol resistance':            { bg:'rgba(184,80,64,0.08)',  border:'rgba(184,80,64,0.20)',  text:'rgba(210,110,90,0.85)' },
  'Mongol pressure':              { bg:'rgba(184,80,64,0.08)',  border:'rgba(184,80,64,0.20)',  text:'rgba(210,110,90,0.85)' },
  'samurai culture':              { bg:'rgba(152,120,32,0.08)', border:'rgba(152,120,32,0.22)', text:'rgba(190,160,70,0.85)' },
  'feudal governance':            { bg:'rgba(152,120,32,0.08)', border:'rgba(152,120,32,0.22)', text:'rgba(190,160,70,0.85)' },
  'nomadic governance':           { bg:'rgba(152,120,32,0.08)', border:'rgba(152,120,32,0.22)', text:'rgba(190,160,70,0.85)' },
  'West African urbanism':        { bg:'rgba(184,120,48,0.08)', border:'rgba(184,120,48,0.22)', text:'rgba(210,155,80,0.85)' },
  'Saharan trade infrastructure': { bg:'rgba(200,160,72,0.08)', border:'rgba(200,160,72,0.22)', text:'rgba(220,180,100,0.85)' },
  'Orthodox culture':             { bg:'rgba(130,90,140,0.08)', border:'rgba(130,90,140,0.22)', text:'rgba(170,120,180,0.85)' },
  'Byzantine heritage':           { bg:'rgba(130,90,140,0.08)', border:'rgba(130,90,140,0.22)', text:'rgba(170,120,180,0.85)' },
  'Crusade economics':            { bg:'rgba(184,80,64,0.08)',  border:'rgba(184,80,64,0.20)',  text:'rgba(210,110,90,0.85)' },
  'trans-Saharan commerce':       { bg:'rgba(200,160,72,0.08)', border:'rgba(200,160,72,0.25)', text:'rgba(220,175,90,0.85)' },
}

const DEFAULT_THEME_COLOR = { bg:'rgba(200,160,72,0.06)', border:'rgba(200,160,72,0.18)', text:'rgba(200,160,72,0.70)' }


function parsePeriod(period) {
  const nums = (period||'').match(/\d{3,4}/g)?.map(Number)||[]
  return [nums[0]||1100, nums[1]||nums[0]||1300]
}


export default function SimultaneityStrip({
  currentSlug, currentPeriod, currentConnections,
  allRegions, onRegionClick,
}) {
  const [curStart] = useMemo(()=>parsePeriod(currentPeriod),[currentPeriod])
  const currentThemes = useMemo(()=>allRegions[currentSlug]?.themes||[],[currentSlug,allRegions])

  // Layer 1: Explicit connections
  const explicitConns = useMemo(()=>(
    (currentConnections||[])
      .filter(c=>allRegions[c.slug])
      .map(c=>({...c, region:allRegions[c.slug]}))
  ),[currentConnections,allRegions])

  const shownSlugs = useMemo(()=>new Set([currentSlug,...explicitConns.map(c=>c.slug)]),[currentSlug,explicitConns])

  // Layer 2: Thematic forces — find regions sharing at least one theme
  const thematicConns = useMemo(()=>{
    if (!currentThemes.length) return []
    const found = []
    Object.values(allRegions).forEach(r=>{
      if (shownSlugs.has(r.slug)) return
      const shared = (r.themes||[]).filter(t=>currentThemes.includes(t))
      if (shared.length>0) {
        found.push({ region:r, sharedThemes:shared })
        shownSlugs.add(r.slug)
      }
    })
    return found.sort((a,b)=>b.sharedThemes.length-a.sharedThemes.length).slice(0,4)
  },[currentThemes,allRegions,shownSlugs])

  // Layer 3: Temporal neighbours (fallback fill)
  const temporalNeighbours = useMemo(()=>(
    Object.values(allRegions)
      .filter(r=>{
        if (shownSlugs.has(r.slug)) return false
        const [s,e]=parsePeriod(r.period)
        return s<=1299 && e>=1200 && r.events?.length
      })
      .map(r=>{
        const ev=r.events?.filter(e=>e.year>=1200&&e.year<=1299)
                          ?.sort((a,b)=>Math.abs(a.year-1250)-Math.abs(b.year-1250))[0]
                  ||r.events?.[0]
        return {region:r, event:ev}
      })
      .filter(c=>c.event)
      .slice(0,2)
  ),[allRegions,shownSlugs])

  const hasAny = explicitConns.length||thematicConns.length||temporalNeighbours.length
  if (!hasAny) return null

  const SectionHead = ({children})=>(
    <div style={{
      display:'flex',alignItems:'center',gap:8,
      marginTop:18,marginBottom:10,
    }}>
      <span style={{
        fontFamily:"'IBM Plex Mono',monospace",fontSize:7.5,
        letterSpacing:'0.16em',textTransform:'uppercase',
        color:'rgba(200,160,72,0.38)',whiteSpace:'nowrap',
      }}>{children}</span>
      <div style={{flex:1,height:'0.5px',background:'rgba(255,255,255,0.05)'}}/>
    </div>
  )

  return (
    <div style={{
      paddingBottom:16,
      borderBottom:'0.5px solid rgba(255,255,255,0.05)',
      marginBottom:4,
    }}>

      {/* ── LAYER 1: Explicit connections ── */}
      {explicitConns.length>0 && (
        <>
          <SectionHead>Connected through</SectionHead>
          <div style={{display:'flex',flexDirection:'column',gap:6}}>
            {explicitConns.map(({slug,type,label,note,region,si})=>{
              const col=CONNECTION_COLORS[type]||CONNECTION_COLORS.trade
              return (
                <button key={slug} onClick={()=>onRegionClick?.(slug)} style={{
                  display:'flex',alignItems:'flex-start',gap:10,
                  background:col.bg, border:`0.5px solid ${col.border}`,
                  borderRadius:5, padding:'9px 11px',
                  cursor:'pointer', textAlign:'left',
                  transition:'filter 160ms', width:'100%',
                }}>
                  <div style={{
                    flexShrink:0, fontFamily:"'IBM Plex Mono',monospace",
                    fontSize:8, color:col.text,
                    padding:'2px 6px', background:'rgba(0,0,0,0.18)',
                    borderRadius:3, marginTop:1, whiteSpace:'nowrap',
                    letterSpacing:'0.05em',
                  }}>
                    {CONNECTION_COLORS[type]?.icon} {label}
                  </div>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{
                      fontFamily:"'Playfair Display',serif",
                      fontSize:12.5,fontWeight:600,
                      color:'rgba(232,218,175,0.82)',
                      marginBottom:3,lineHeight:1.2,
                    }}>{region.name}</div>
                    <div style={{
                      fontFamily:"'Cormorant Garamond',serif",
                      fontSize:12, color:'rgba(200,180,145,0.52)',
                      lineHeight:1.4,
                    }}>{note}</div>
                  </div>
                </button>
              )
            })}
          </div>
        </>
      )}

      {/* ── LAYER 2: Thematic forces ── */}
      {thematicConns.length>0 && (
        <>
          <SectionHead>Shared forces</SectionHead>
          <div style={{display:'flex',flexDirection:'column',gap:5}}>
            {thematicConns.map(({region,sharedThemes,si})=>(
              <button key={region.slug} onClick={()=>onRegionClick?.(region.slug)} style={{
                display:'flex',alignItems:'flex-start',gap:10,
                background:'rgba(255,255,255,0.02)',
                border:'0.5px solid rgba(255,255,255,0.06)',
                borderRadius:5, padding:'8px 11px',
                cursor:'pointer', textAlign:'left',
                transition:'all 180ms', width:'100%',
              }}
              onMouseEnter={e=>{e.currentTarget.style.background='rgba(200,160,72,0.04)';e.currentTarget.style.borderColor='rgba(200,160,72,0.15)'}}
              onMouseLeave={e=>{e.currentTarget.style.background='rgba(255,255,255,0.02)';e.currentTarget.style.borderColor='rgba(255,255,255,0.06)'}}
              >
                <div style={{flex:1,minWidth:0}}>
                  <div style={{
                    fontFamily:"'Playfair Display',serif",
                    fontSize:12.5,fontWeight:600,
                    color:'rgba(232,216,176,0.68)',
                    marginBottom:5,lineHeight:1.2,
                  }}>{region.name}</div>
                  {/* Theme tags */}
                  <div style={{display:'flex',flexWrap:'wrap',gap:4}}>
                    {sharedThemes.map(theme=>{
                      const tc=THEME_COLORS[theme]||DEFAULT_THEME_COLOR
                      return (
                        <span key={theme} style={{
                          fontFamily:"'IBM Plex Mono',monospace",
                          fontSize:7.5,letterSpacing:'0.05em',
                          color:tc.text,
                          padding:'2px 7px',
                          background:tc.bg,
                          border:`0.5px solid ${tc.border}`,
                          borderRadius:3,
                        }}>{theme}</span>
                      )
                    })}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </>
      )}

      {/* ── LAYER 3: Temporal neighbours ── */}
      {temporalNeighbours.length>0 && (
        <>
          <SectionHead>Simultaneously, elsewhere</SectionHead>
          <div style={{display:'flex',flexDirection:'column',gap:5}}>
            {temporalNeighbours.map(({region,event,si})=>(
              <button key={region.slug} onClick={()=>onRegionClick?.(region.slug)} style={{
                display:'flex',alignItems:'flex-start',gap:10,
                background:'rgba(255,255,255,0.015)',
                border:'0.5px solid rgba(255,255,255,0.04)',
                borderRadius:4, padding:'8px 10px',
                cursor:'pointer', textAlign:'left',
                transition:'all 180ms', width:'100%',
              }}
              onMouseEnter={e=>{e.currentTarget.style.background='rgba(200,160,72,0.04)'}}
              onMouseLeave={e=>{e.currentTarget.style.background='rgba(255,255,255,0.015)'}}
              >
                <div style={{
                  flexShrink:0,width:34,height:34,borderRadius:'50%',
                  border:"0.5px solid rgba(200,160,72,0.25)",
                  background:"rgba(200,160,72,0.06)",
                  display:'flex',alignItems:'center',justifyContent:'center',
                  fontFamily:"'IBM Plex Mono',monospace",
                  fontSize:8.5,color:"rgba(200,160,72,0.55)",lineHeight:1,
                }}>{event.year}</div>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{
                    fontFamily:"'Playfair Display',serif",
                    fontSize:12,fontWeight:600,
                    color:'rgba(232,216,176,0.55)',
                    marginBottom:2,lineHeight:1.2,
                  }}>{region.name}</div>
                  <div style={{
                    fontFamily:"'Cormorant Garamond',serif",
                    fontSize:12,color:'rgba(200,180,145,0.38)',
                    lineHeight:1.3,
                    overflow:'hidden',display:'-webkit-box',
                    WebkitLineClamp:2,WebkitBoxOrient:'vertical',
                  }}>{event.label}</div>
                </div>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  )
}