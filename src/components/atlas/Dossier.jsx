import '../../styles/atlas.css'

const FLAGS = {
  China:'🇨🇳','South Korea':'🇰🇷',Ukraine:'🇺🇦',Russia:'🇷🇺',
  India:'🇮🇳',Colombia:'🇨🇴',Chile:'🇨🇱',Uzbekistan:'🇺🇿',
  Bulgaria:'🇧🇬',Kazakhstan:'🇰🇿','South Sudan':'🇸🇸',Vietnam:'🇻🇳',
}
const flag = c => FLAGS[c] || ''

const statusColor = s => ({
  absent:  'rgba(184,80,64,0.65)',
  partial: 'rgba(72,120,160,0.65)',
  present: 'rgba(74,136,48,0.65)',
}[s] || 'rgba(200,160,72,0.4)')

const categoryColor = cat => ({
  military:   'rgba(184,80,64,0.55)',
  political:  'rgba(72,120,160,0.55)',
  economic:   'rgba(74,136,48,0.55)',
  cultural:   'rgba(200,144,58,0.55)',
  diplomacy:  'rgba(130,90,140,0.55)',
}[cat] || 'rgba(94, 181, 122, 0.35)')

/**
 * Dossier — deep-dive record for a region
 *
 * Section order (immutable — this sequence is the argument):
 *   1. Historical overview  — the world before the silence
 *   2. Key events           — what happened here
 *   3. Scholarship          — what scholars know; links to sources
 *   4. Curricular record    — how it is (or isn't) taught
 */
export default function Dossier({
  region, curriculum={}, sources={}, interpretations={}, onClose,
}) {
  const slug        = region?.slug
  const entries     = curriculum[slug] || []
  const scholarship = interpretations[slug] || []

  // Separate coded entries (real analysis) from formula-generated absences
  const codedEntries  = entries.filter(e => e.coderID !== 'formula')
  const presentCount  = entries.filter(e => e.coverageStatus === 'present' || e.coverageStatus === 'partial').length
  const totalSources  = Object.keys(sources).length

  return (
    <div className="dossier-sheet open">

      {/* Sticky header */}
      <div className="dossier-close">
        <span className="dossier-close__label">Full record · {region?.name}</span>
        <button className="dossier-close__btn" onClick={onClose}>✕</button>
      </div>

      <div className="dossier-body">

        {/* ── 1. HISTORICAL OVERVIEW ── */}
        <div className="dossier-section">
          <div className="dossier-section__head">Historical overview</div>
          <div style={{
            fontFamily:"'Cormorant Garamond',serif",
            fontSize:8, letterSpacing:'0.14em', textTransform:'uppercase',
            color:'rgba(200,160,72,0.50)', marginBottom:12,
          }}>
            {region?.period} · {region?.modernLocation}
          </div>

          {/* Use narrative if available, fall back to description */}
          {(region?.narrative || region?.description) && (
            <p style={{
              fontFamily:"'Cormorant Garamond',serif",
              fontSize:15, lineHeight:1.75,
              color:'rgba(235,220,190,0.82)', margin:0,
            }}>
              {region?.narrative || region?.description}
            </p>
          )}
        </div>

        {/* ── 2. KEY EVENTS ── */}
        {region?.events?.length > 0 && (
          <div className="dossier-section">
            <div className="dossier-section__head">Key events</div>
            {region.events.map((ev, i) => (
              <div key={i} style={{
                display:'flex', gap:14, marginBottom:10, paddingBottom:10,
                borderBottom:'0.5px solid rgba(255,255,255,0.04)',
              }}>
                {/* Year seal */}
                <div style={{
                  flexShrink:0, width:44, height:44, borderRadius:'50%',
                  border:`1px solid ${categoryColor(ev.category)}`,
                  background: categoryColor(ev.category).replace('0.55','0.08'),
                  display:'flex', alignItems:'center', justifyContent:'center',
                  fontFamily:"'IBM Plex Mono',monospace",
                  fontSize:8.5, color:categoryColor(ev.category),
                  fontWeight:500, letterSpacing:'0.04em',
                }}>
                  {ev.year}
                </div>
                <div style={{flex:1}}>
                  <div style={{
                    fontFamily:"'Cormorant Garamond',serif",
                    fontSize:14, lineHeight:1.5,
                    color:'rgba(230,214,186,0.80)',
                  }}>
                    {ev.label}
                  </div>
                  {ev.category && (
                    <div style={{
                      fontFamily:"'IBM Plex Mono',monospace",
                      fontSize:7.5, letterSpacing:'0.10em', textTransform:'uppercase',
                      color: categoryColor(ev.category), marginTop:3, opacity:0.75,
                    }}>
                      {ev.category}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── 3. SCHOLARSHIP ── */}
        <div className="dossier-section">
          <div className="dossier-section__head">Scholarship</div>

          {scholarship.length === 0 ? (
            <div style={{
              fontFamily:"'Cormorant Garamond',serif",
              fontSize:13, fontStyle:'italic',
              color:'rgba(210,195,165,0.42)',
            }}>
              No scholarship entries indexed yet.
            </div>
          ) : scholarship.map((s, i) => (
            <div key={i} style={{
              marginBottom:20, paddingBottom:20,
              borderBottom:'0.5px solid rgba(255,255,255,0.04)',
            }}>

              {/* Citation line */}
              <div style={{
                fontFamily:"'Cormorant Garamond',serif",
                fontSize:13.5, lineHeight:1.5,
                color:'rgba(235,220,190,0.84)',
                marginBottom:6,
              }}>
                {s.author} ({s.year}). <em>{s.title}</em>
                {s.journal ? `. ${s.journal}.` : '.'}
                {/* Link — prefer url, fall back to doi */}
                {(s.url || s.doi) && (
                  <a
                    href={s.url || `https://doi.org/${s.doi}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      fontFamily:"'IBM Plex Mono',monospace",
                      fontSize:8, color:'rgba(200,160,72,0.62)',
                      marginLeft:8, textDecoration:'none',
                      letterSpacing:'0.06em',
                    }}
                  >
                    ↗ {s.openAccess ? 'open access' : 'link'}
                  </a>
                )}
              </div>

              {/* Summary */}
              {s.summary && (
                <div style={{
                  fontFamily:"'Cormorant Garamond',serif",
                  fontSize:13, lineHeight:1.6,
                  color:'rgba(220,205,175,0.66)',
                  marginBottom:8,
                }}>
                  {s.summary}
                </div>
              )}

              {/* Key claims */}
              {s.keyClaims?.length > 0 && (
                <div style={{marginBottom:8}}>
                  {s.keyClaims.map((claim, j) => (
                    <div key={j} style={{
                      fontFamily:"'Cormorant Garamond',serif",
                      fontSize:12.5, lineHeight:1.5,
                      color:'rgba(215,200,170,0.60)',
                      paddingLeft:10, marginBottom:5,
                      borderLeft:'1.5px solid rgba(200,160,72,0.26)',
                    }}>
                      {claim}
                    </div>
                  ))}
                </div>
              )}

              {/* Silence note — the methodological punch */}
              {s.silenceNote && (
                <div style={{
                  fontFamily:"'IBM Plex Mono',monospace",
                  fontSize:8.5, lineHeight:1.6, letterSpacing:'0.04em',
                  color:'rgba(215,185,110,0.62)',
                  padding:'8px 12px',
                  background:'rgba(200,160,72,0.08)',
                  borderLeft:'2px solid rgba(200,160,72,0.34)',
                  borderRadius:3, marginTop:4,
                }}>
                  ↳ {s.silenceNote}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* ── 4. CURRICULAR RECORD ── */}
        <div className="dossier-section">
          <div className="dossier-section__head">Curricular representation</div>

          {/* Headline metric */}
          <div style={{
            display:'flex', alignItems:'baseline', gap:8, marginBottom:14,
          }}>
            <span style={{
              fontFamily:"'Playfair Display',serif",
              fontSize:28, fontWeight:600,
              color: presentCount === 0 ? 'rgba(184,80,64,0.75)' : 'rgba(200,160,72,0.75)',
            }}>
              {presentCount}
            </span>
            <span style={{
              fontFamily:"'IBM Plex Mono',monospace",
              fontSize:8.5, color:'rgba(200,180,140,0.40)',
              letterSpacing:'0.08em',
            }}>
              of {totalSources} sources
            </span>
          </div>

          {/* Source rows — only show coded entries (not formula absences) */}
          {codedEntries.length === 0 ? (
            <div style={{
              fontFamily:"'Cormorant Garamond',serif",
              fontSize:13, fontStyle:'italic',
              color:'rgba(210,195,165,0.42)', marginBottom:16,
            }}>
              This region has not yet been coded in any source in this corpus.
            </div>
          ) : codedEntries.map((entry, i) => {
            const src = sources[entry.sourceId]
            return (
              <div key={i} style={{
                display:'flex', alignItems:'flex-start', gap:12,
                marginBottom:12, paddingBottom:12,
                borderBottom:'0.5px solid rgba(255,255,255,0.04)',
              }}>
                <div style={{
                  flexShrink:0, width:8, height:8, borderRadius:'50%', marginTop:5,
                  background: statusColor(entry.coverageStatus),
                }}/>
                <div style={{flex:1}}>
                  <div style={{
                    fontFamily:"'IBM Plex Mono',monospace",
                    fontSize:8.5, color:'rgba(230,212,182,0.76)',
                    marginBottom:3, letterSpacing:'0.04em',
                  }}>
                    {flag(src?.country)} {src?.country} — {src?.title}
                    <span style={{
                      color:'rgba(200,160,72,0.54)', marginLeft:8,
                      fontStyle:'normal',
                    }}>
                      {entry.pageCount > 0 ? `${entry.pageCount}p` : entry.coverageStatus}
                    </span>
                  </div>
                  {entry.framingNotes && (
                    <div style={{
                      fontFamily:"'Cormorant Garamond',serif",
                      fontSize:12, lineHeight:1.5, fontStyle:'italic',
                      color:'rgba(210,190,160,0.56)',
                    }}>
                      {entry.framingNotes}
                    </div>
                  )}
                </div>
              </div>
            )
          })}

          {/* Prompt to analysis mode */}
          <div style={{
            marginTop:16, padding:'12px 14px',
            background:'rgba(200,160,72,0.07)',
            border:'0.5px solid rgba(200,160,72,0.22)',
            borderRadius:5,
            fontFamily:"'IBM Plex Mono',monospace",
            fontSize:8.5, lineHeight:1.7,
            color:'rgba(215,185,110,0.58)', letterSpacing:'0.04em',
          }}>
            Switch to Analysis mode to see this region's framing patterns across all sources — topic categories, coverage rates, and comparison with scholarship.
          </div>
        </div>

      </div>
    </div>
  )
}