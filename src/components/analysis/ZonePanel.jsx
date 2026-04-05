/**
 * ZonePanel — STATE 2 panel
 * Zone-level drill-down. Shows all polities in the selected zone.
 * Coloured by SI. Click a polity → STATE 3 (PolityMatrix).
 */

const STATUS_COLOR = {
  present: '#4a8830',
  partial: '#4878a0',
  absent:  '#b85040',
  pending: '#987820',
}

function getSI(slug, curriculum) {
  return (curriculum[slug] || []).filter(
    e => e.coverageStatus === 'present' || e.coverageStatus === 'partial'
  ).length
}

function getFramingLabel(slug, curriculum) {
  const entries = curriculum[slug] || []
  const fi = entries.find(e => e.framingIndex)?.framingIndex
  return fi?.label || null
}

export default function ZonePanel({
  zone, zoneId, coverage, curriculum, regions, sources, onSelectPolity, onClose
}) {
  if (!zone || !coverage) return null

  const polities = (coverage.polities || [])
    .filter(slug => regions[slug])
    .sort((a, b) => getSI(b, curriculum) - getSI(a, curriculum))

  const sourceList = Object.values(sources)

  return (
    <div style={{
      position:'fixed', top:0, right:0, bottom:0,
      width:420,
      background:'rgba(18, 22, 52, 0.97)',
      borderLeft:'0.5px solid rgba(100, 110, 200, 0.18)',
      display:'flex', flexDirection:'column',
      zIndex:580, overflow:'hidden',
    }}>

      {/* Header */}
      <div style={{
        flexShrink:0, padding:'20px 24px 16px',
        borderBottom:'0.5px solid rgba(100, 110, 200, 0.18)',
        display:'flex', alignItems:'flex-start', justifyContent:'space-between',
      }}>
        <div>
          <div style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:7.5, letterSpacing:'0.16em', textTransform:'uppercase', color:'rgba(200,144,58,0.38)', marginBottom:6 }}>
            zone analysis
          </div>
          <h2 style={{ fontFamily:"'Playfair Display',serif", fontSize:20, fontWeight:700, color:'rgba(232,218,175,0.92)', lineHeight:1.15, marginBottom:3 }}>
            {zone.name}
          </h2>
          <div style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:12, fontStyle:'italic', color:'rgba(180,188,220,0.58)' }}>
            {zone.description}
          </div>
        </div>
        <button
          onClick={onClose}
          style={{
            background:'none',
            border:'none',
            color:'rgba(200,144,58,0.45)',
            cursor:'pointer',
            fontFamily:"'IBM Plex Mono',monospace",
            fontSize:8,
            letterSpacing:'0.12em',
            textTransform:'uppercase',
            padding:4,
          }}
        >
          ← back
        </button>
      </div>

      {/* Zone summary stats */}
      <div style={{
        flexShrink:0, padding:'12px 24px',
        borderBottom:'0.5px solid rgba(100,110,200,0.14)',
        display:'flex', gap:16,
      }}>
        {[
          { n: coverage.covered,     l: 'covered',  c: '#4a8830' },
          { n: coverage.partial,     l: 'partial',  c: '#4878a0' },
          { n: coverage.absent,      l: 'absent',   c: '#b85040' },
          { n: coverage.total,       l: 'total',    c: 'rgba(200,180,140,0.4)' },
        ].map(s => (
          <div key={s.l} style={{ textAlign:'center' }}>
            <div style={{ fontFamily:"'Playfair Display',serif", fontSize:18, fontWeight:600, color: s.c, lineHeight:1 }}>{s.n}</div>
            <div style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:7.5, letterSpacing:'0.10em', textTransform:'uppercase', color:'rgba(200,180,140,0.30)', marginTop:3 }}>{s.l}</div>
          </div>
        ))}

        {/* Zone silence bar */}
        <div style={{ flex:1, display:'flex', flexDirection:'column', justifyContent:'center' }}>
          <div style={{ height:6, background:'rgba(255,255,255,0.05)', borderRadius:3, overflow:'hidden' }}>
            <div style={{
              height:'100%', borderRadius:3,
              width:`${100 - coverage.silenceRate}%`,
              background: zone.color,
              opacity:0.55,
            }} />
          </div>
          <div style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:7.5, color:'rgba(180,188,220,0.55)', marginTop:4, textAlign:'right' }}>
            {coverage.silenceRate}% silent
          </div>
        </div>
      </div>

      {/* Source coverage for this zone */}
      <div style={{
        flexShrink:0, padding:'12px 24px',
        borderBottom:'0.5px solid rgba(100,110,200,0.14)',
      }}>
        <div style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:7.5, letterSpacing:'0.12em', textTransform:'uppercase', color:'rgba(212,144,58,0.50)', marginBottom:8 }}>
          Zone coverage by source
        </div>
        <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
          {sourceList.map(src => {
            const coversAny = polities.some(slug =>
              (curriculum[slug] || []).some(e =>
                e.sourceId === src.id && e.coverageStatus !== 'absent'
              )
            )
            const coversN = polities.filter(slug =>
              (curriculum[slug] || []).some(e =>
                e.sourceId === src.id && e.coverageStatus !== 'absent'
              )
            ).length
            return (
              <div key={src.id} style={{
                padding:'3px 8px',
                background: coversAny ? `${zone.color}18` : 'rgba(255,255,255,0.02)',
                border: `0.5px solid ${coversAny ? zone.color + '35' : 'rgba(255,255,255,0.05)'}`,
                borderRadius:4,
              }}>
                <span style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:8, color: coversAny ? 'rgba(220,225,245,0.82)' : 'rgba(180,188,220,0.30)' }}>
                  {src.country || src.id} {coversAny ? `(${coversN})` : '—'}
                </span>
              </div>
            )
          })}
        </div>
      </div>

      {/* Polity list — scrollable, click to open matrix */}
      <div style={{
        flex:1, overflowY:'auto',
        scrollbarWidth:'thin', scrollbarColor:'rgba(200,144,58,0.10) transparent',
        padding:'12px 24px 40px',
      }}>
        <div style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:7.5, letterSpacing:'0.12em', textTransform:'uppercase', color:'rgba(212,144,58,0.50)', marginBottom:10 }}>
          Polities — click for topic matrix
        </div>

        {polities.map(slug => {
          const region  = regions[slug]
          const si      = getSI(slug, curriculum)
          const framing = getFramingLabel(slug, curriculum)
          const status  = si >= 2 ? 'present' : si >= 1 ? 'partial' : 'absent'

          return (
            <button
              key={slug}
              onClick={() => onSelectPolity(slug)}
              style={{
                display:'flex', alignItems:'center', gap:10,
                width:'100%', padding:'9px 12px', marginBottom:5,
                background:'rgba(255,255,255,0.02)',
                border:'0.5px solid rgba(100, 110, 200, 0.18)',
                borderRadius:6, cursor:'pointer', textAlign:'left',
                transition:'all 180ms',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.background = 'rgba(200,144,58,0.06)'
                e.currentTarget.style.borderColor = 'rgba(200,144,58,0.18)'
              }}
              onMouseLeave={e => {
                e.currentTarget.style.background = 'rgba(255,255,255,0.02)'
                e.currentTarget.style.borderColor = 'rgba(255,255,255,0.05)'
              }}
            >
              <div style={{
                width:8, height:8, borderRadius:'50%', flexShrink:0,
                background: STATUS_COLOR[status], opacity:0.7,
              }} />

              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:14, color:'rgba(220,225,245,0.85)', lineHeight:1.3 }}>
                  {region?.name || slug}
                </div>
                <div style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:7.5, color:'rgba(180,188,220,0.50)', marginTop:2 }}>
                  {region?.period}
                </div>
              </div>

              {/* SI badge */}
              <div style={{
                flexShrink:0, padding:'2px 7px',
                background: si === 0 ? 'rgba(184,80,64,0.10)' : 'rgba(72,120,160,0.10)',
                border: `0.5px solid ${STATUS_COLOR[status]}35`,
                borderRadius:3,
                fontFamily:"'IBM Plex Mono',monospace", fontSize:8,
                color: STATUS_COLOR[status], opacity:0.75,
              }}>
                SI={si}
              </div>

              {/* Framing label */}
              {framing && (
                <div style={{
                  flexShrink:0,
                  fontFamily:"'IBM Plex Mono',monospace", fontSize:7.5,
                  letterSpacing:'0.06em',
                  color: framing === 'victim' ? '#b85040' : framing === 'agent' ? '#4a8830' : '#987820',
                  opacity:0.85,
                }}>
                  {framing}
                </div>
              )}

              <span style={{ flexShrink:0, color:'rgba(200,144,58,0.25)', fontSize:10 }}>↗</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}