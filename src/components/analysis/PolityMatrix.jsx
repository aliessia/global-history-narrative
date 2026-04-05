import '../../styles/analysis.css'

/**
 * PolityMatrix — STATE 3 panel
 * The core analytical display. Source × topic category matrix.
 *
 * For each source in the corpus, shows:
 * - Whether the polity is covered
 * - Which topic categories appear
 * - Framing index (agent vs victim)
 * - Page count
 *
 * The pattern visible here — "conquest appears in 7/8 sources,
 * governance appears in 1/8" — IS the historiographical argument.
 */

const TOPIC_CATS = [
  { id: 'governance_agency',    label: 'Governance',  color: '#4a8830', short: 'GOV' },
  { id: 'trade_culture',        label: 'Trade/Culture', color: '#4878a0', short: 'TRD' },
  { id: 'military_conquest',    label: 'Military',    color: '#b85040', short: 'MIL' },
  { id: 'decline_fragmentation',label: 'Decline',     color: '#987820', short: 'DEC' },
]

const AGENCY_KW    = ['foundation','founded','established','reform','administration','governed','parliament','charter','rights','independent','institution','centrali','fiscal','market policy','sultan','dynasty','shogun','republic','senate','doge','kurultai','iqta','beylik']
const TRADE_KW     = ['trade','commerce','merchant','gold','silk','salt','caravan','route','urban','cities','architecture','religion','islam','christian','culture','technology','agriculture','craft','manufacture','monetary']
const CONQUEST_KW  = ['conquest','invasion','invaded','attack','captured','capture','defeat','defeated','battle','military','crusade','campaign','tribute','subordinat','subjugat','occupied','resistance','revolt','uprising']
const DECLINE_KW   = ['decline','fragmentation','collapse','disintegrat','weaken','divided','crisis','unrest','instabilit','burden']

function classifyTopics(topics = []) {
  const counts = { governance_agency:0, trade_culture:0, military_conquest:0, decline_fragmentation:0 }
  topics.forEach(t => {
    const tl = t.toLowerCase()
    if (CONQUEST_KW.some(k => tl.includes(k)))    counts.military_conquest++
    else if (DECLINE_KW.some(k => tl.includes(k))) counts.decline_fragmentation++
    else if (TRADE_KW.some(k => tl.includes(k)))   counts.trade_culture++
    else                                             counts.governance_agency++
  })
  return counts
}

const STATUS_COLOR = {
  present: '#4a8830',
  partial: '#4878a0',
  absent:  '#b85040',
  pending: '#987820',
}

export default function PolityMatrix({ slug, region, curriculum, sources, interpretations, onClose }) {
  const entries = curriculum[slug] || []
  const sourceList = Object.values(sources)
  const scholarship = interpretations?.[slug] || []

  // Compute topic category counts across all entries
  const globalTopicCounts = { governance_agency:0, trade_culture:0, military_conquest:0, decline_fragmentation:0 }
  entries.forEach(e => {
    if (e.topicsPresent?.length) {
      const cats = classifyTopics(e.topicsPresent)
      Object.keys(globalTopicCounts).forEach(k => { globalTopicCounts[k] += cats[k] })
    }
  })
  const totalTopics = Object.values(globalTopicCounts).reduce((a,b) => a+b, 0)

  return (
    <div style={{
      position:'fixed', top:0, right:0, bottom:0,
      width:480,
      background:'rgba(18, 22, 52, 0.97)',
      borderLeft:'0.5px solid rgba(100, 110, 200, 0.18)',
      display:'flex', flexDirection:'column',
      zIndex:600, overflow:'hidden',
    }}>

      {/* Header */}
      <div style={{
        flexShrink:0, padding:'20px 24px 16px',
        borderBottom:'0.5px solid rgba(100, 110, 200, 0.18)',
        display:'flex', alignItems:'flex-start', justifyContent:'space-between',
      }}>
        <div>
          <div style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:7.5, letterSpacing:'0.16em', textTransform:'uppercase', color:'rgba(200,144,58,0.38)', marginBottom:6 }}>
            polity record · {region?.zone?.replace(/_/g,' ')}
          </div>
          <h2 style={{ fontFamily:"'Playfair Display',serif", fontSize:20, fontWeight:700, color:'rgba(232,218,175,0.92)', lineHeight:1.15, marginBottom:3 }}>
            {region?.name || slug}
          </h2>
          <div style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:12, fontStyle:'italic', color:'rgba(180,188,220,0.62)' }}>
            {region?.period}
          </div>
        </div>
        <button
          onClick={onClose}
          style={{ background:'none', border:'none', color:'rgba(212,144,58,0.65)', cursor:'pointer', fontSize:16, padding:4 }}
        >✕</button>
      </div>

      <div style={{ flex:1, overflowY:'auto', scrollbarWidth:'thin', scrollbarColor:'rgba(200,144,58,0.12) transparent' }}>

        {/* Framing distribution bar */}
        {totalTopics > 0 && (
          <div style={{ padding:'16px 24px', borderBottom:'0.5px solid rgba(100,110,200,0.14)' }}>
            <div style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:7.5, letterSpacing:'0.14em', textTransform:'uppercase', color:'rgba(200,144,58,0.35)', marginBottom:10 }}>
              How this polity is framed — across all sources
            </div>
            <div style={{ display:'flex', height:10, borderRadius:3, overflow:'hidden', gap:1 }}>
              {TOPIC_CATS.map(cat => {
                const pct = totalTopics > 0 ? (globalTopicCounts[cat.id] / totalTopics * 100) : 0
                return pct > 0 && (
                  <div
                    key={cat.id}
                    title={`${cat.label}: ${Math.round(pct)}%`}
                    style={{ width:`${pct}%`, background:cat.color, opacity:0.65 }}
                  />
                )
              })}
            </div>
            <div style={{ display:'flex', gap:12, marginTop:8, flexWrap:'wrap' }}>
              {TOPIC_CATS.map(cat => (
                globalTopicCounts[cat.id] > 0 && (
                  <div key={cat.id} style={{ display:'flex', alignItems:'center', gap:4 }}>
                    <div style={{ width:6, height:6, borderRadius:1, background:cat.color, opacity:0.65 }} />
                    <span style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:7.5, color:'rgba(200,210,235,0.65)' }}>
                      {cat.label} {globalTopicCounts[cat.id]}
                    </span>
                  </div>
                )
              ))}
            </div>
          </div>
        )}

        {/* Source × topic matrix — the main analytical display */}
        <div style={{ padding:'16px 24px', borderBottom:'0.5px solid rgba(100,110,200,0.14)' }}>
          <div style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:7.5, letterSpacing:'0.14em', textTransform:'uppercase', color:'rgba(200,144,58,0.35)', marginBottom:14 }}>
            Coverage by source
          </div>

          {/* Column headers */}
          <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom:8, paddingLeft:160 }}>
            {TOPIC_CATS.map(cat => (
              <div key={cat.id} title={cat.label} style={{
                width:28, textAlign:'center',
                fontFamily:"'IBM Plex Mono',monospace", fontSize:7, letterSpacing:'0.06em',
                color: cat.color, opacity:0.55,
              }}>
                {cat.short}
              </div>
            ))}
            <div style={{ width:32, textAlign:'right', fontFamily:"'IBM Plex Mono',monospace", fontSize:7, color:'rgba(180,188,220,0.45)' }}>pp</div>
          </div>

          {/* Source rows */}
          {entries.map((entry, i) => {
            const src    = sources[entry.sourceId]
            const cats   = classifyTopics(entry.topicsPresent || [])
            const isReal = entry.coderID !== 'formula'
            return (
              <div key={i} style={{
                display:'flex', alignItems:'center', gap:6,
                marginBottom:6, padding:'6px 0',
                borderBottom:'0.5px solid rgba(100,110,200,0.10)',
                opacity: entry.coverageStatus === 'absent' ? 0.45 : 1,
              }}>
                {/* Source identifier */}
                <div style={{ width:160, flexShrink:0 }}>
                  <div style={{ display:'flex', alignItems:'center', gap:5 }}>
                    <div style={{
                      width:7, height:7, borderRadius:'50%', flexShrink:0,
                      background: STATUS_COLOR[entry.coverageStatus] || '#987820',
                      opacity:0.7,
                    }} />
                    <span style={{
                      fontFamily:"'IBM Plex Mono',monospace", fontSize:8.5,
                      color:'rgba(220,225,245,0.82)',
                      overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap',
                    }}>
                      {src?.country ? `${src.country}` : entry.sourceId.split('-').slice(0,2).join('-')}
                    </span>
                  </div>
                  <div style={{
                    fontFamily:"'IBM Plex Mono',monospace", fontSize:7,
                    color:'rgba(180,188,220,0.50)', marginTop:1, paddingLeft:12,
                    overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap',
                  }}>
                    {entry.coverageStatus}
                    {!isReal && ' (formula)'}
                  </div>
                </div>

                {/* Topic category cells */}
                {TOPIC_CATS.map(cat => (
                  <div key={cat.id} style={{
                    width:28, height:20,
                    display:'flex', alignItems:'center', justifyContent:'center',
                    borderRadius:3,
                    background: cats[cat.id] > 0
                      ? `${cat.color}22`
                      : 'rgba(255,255,255,0.02)',
                  }}>
                    {cats[cat.id] > 0 && (
                      <div style={{ width:6, height:6, borderRadius:1, background:cat.color, opacity:0.6 }} />
                    )}
                  </div>
                ))}

                {/* Page count */}
                <div style={{
                  width:32, textAlign:'right',
                  fontFamily:"'IBM Plex Mono',monospace", fontSize:8,
                  color: entry.pageCount > 0 ? 'rgba(200,220,245,0.70)' : 'rgba(255,255,255,0.12)',
                }}>
                  {entry.pageCount > 0 ? entry.pageCount : '—'}
                </div>
              </div>
            )
          })}
        </div>

        {/* Framing notes from coded sources */}
        {entries.filter(e => e.framingNotes).length > 0 && (
          <div style={{ padding:'16px 24px', borderBottom:'0.5px solid rgba(100,110,200,0.14)' }}>
            <div style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:7.5, letterSpacing:'0.14em', textTransform:'uppercase', color:'rgba(200,144,58,0.35)', marginBottom:14 }}>
              Framing notes
            </div>
            {entries.filter(e => e.framingNotes).map((entry, i) => {
              const src = sources[entry.sourceId]
              return (
                <div key={i} style={{
                  marginBottom:14, padding:'10px 14px',
                  background:'rgba(200,144,58,0.03)',
                  borderLeft:'2px solid rgba(200,144,58,0.20)',
                  borderRadius:4,
                }}>
                  <div style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:8, color:'rgba(200,144,58,0.40)', marginBottom:6 }}>
                    {src?.country || entry.sourceId}
                  </div>
                  <div style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:13, color:'rgba(210,225,245,0.75)', lineHeight:1.55, fontStyle:'italic' }}>
                    {entry.framingNotes}
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Scholarship */}
        {scholarship.length > 0 && (
          <div style={{ padding:'16px 24px 40px' }}>
            <div style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:7.5, letterSpacing:'0.14em', textTransform:'uppercase', color:'rgba(200,144,58,0.35)', marginBottom:14 }}>
              Scholarship
            </div>
            {scholarship.map((s, i) => (
              <div key={i} style={{
                marginBottom:12, padding:'10px 14px',
                background:'rgba(200,144,58,0.03)',
                borderLeft:'2px solid rgba(200,144,58,0.18)', borderRadius:4,
              }}>
                <div style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:12.5, color:'rgba(210,225,245,0.72)', fontStyle:'italic', marginBottom:4 }}>
                  {s.author} ({s.year}). <em>{s.title}</em>
                </div>
                {s.silenceNote && (
                  <div style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:7.5, color:'rgba(200,144,58,0.38)', letterSpacing:'0.06em' }}>
                    ↳ {s.silenceNote}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}