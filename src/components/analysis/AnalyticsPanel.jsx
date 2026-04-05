import { useMemo, useState } from 'react'

const P = {
  bg:     'rgba(12, 16, 42, 0.98)',
  border: 'rgba(100, 110, 200, 0.16)',
  text:   'rgba(220, 225, 245, 0.88)',
  dim:    'rgba(180, 188, 220, 0.48)',
  accent: '#76a66f',
  adim:   'rgba(118, 166, 111, 0.40)',
}

function PieChart({ slices, size = 110 }) {
  const r = size / 2
  let angle = -Math.PI / 2
  const paths = slices.map(s => {
    const a0 = angle
    const a1 = angle + s.pct * 2 * Math.PI
    angle = a1
    const laf = s.pct > 0.5 ? 1 : 0
    const x0 = r + r * 0.82 * Math.cos(a0)
    const y0 = r + r * 0.82 * Math.sin(a0)
    const x1 = r + r * 0.82 * Math.cos(a1)
    const y1 = r + r * 0.82 * Math.sin(a1)
    return { d: `M${r},${r} L${x0},${y0} A${r*0.82},${r*0.82} 0 ${laf} 1 ${x1},${y1} Z`, color: s.color }
  })
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      {paths.map((p, i) => <path key={i} d={p.d} fill={p.color} opacity={0.85} />)}
      <circle cx={r} cy={r} r={r * 0.38} fill={P.bg} />
    </svg>
  )
}

function HBar({ label, value, max, color, sub }) {
  const pct = max ? Math.max(0, Math.min(1, value / max)) : 0
  return (
    <div style={{ marginBottom: 8 }}>
      <div style={{ display:'flex', justifyContent:'space-between', marginBottom: 3 }}>
        <span style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:8, color:P.dim, letterSpacing:'0.04em' }}>{label}</span>
        <span style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:8, color, letterSpacing:'0.04em' }}>{sub}</span>
      </div>
      <div style={{ height: 5, background:'rgba(255,255,255,0.06)', borderRadius: 3, overflow:'hidden' }}>
        <div style={{ height:'100%', width:`${pct*100}%`, background: color, borderRadius: 3, transition:'width 400ms ease' }} />
      </div>
    </div>
  )
}

function StackedBar({ label, segments, total }) {
  return (
    <div style={{ marginBottom: 7 }}>
      <div style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:7.5, color:P.dim, marginBottom: 3, letterSpacing:'0.03em' }}>
        {label}
      </div>
      <div style={{ display:'flex', height: 8, borderRadius: 3, overflow:'hidden', background:'rgba(255,255,255,0.05)' }}>
        {segments.map((s, i) => (
          <div key={i} title={`${s.label}: ${s.value}`} style={{ width:`${(s.value / total) * 100}%`, background:s.color, opacity:0.80 }} />
        ))}
      </div>
    </div>
  )
}

const TABS = ['CCSR', 'SI', 'CAS', 'PTA']

export default function AnalyticsPanel({ curriculum, zones, slugZone, sources, zoneCoverage, onClose }) {
  const [tab, setTab] = useState('CCSR')

  const allSlugs = Object.keys(curriculum)
  const sourceList = Object.values(sources || {})

  const siGroups = useMemo(() => {
    const g = { 0: 0, 1: 0, '2+': 0 }
    allSlugs.forEach(slug => {
      const si = (curriculum[slug] || []).filter(
        e => e.coverageStatus === 'present' || e.coverageStatus === 'partial'
      ).length
      if (si === 0) g[0]++
      else if (si === 1) g[1]++
      else g['2+']++
    })
    return g
  }, [curriculum, allSlugs])

  const totalPages = useMemo(() => {
    const z = {}
    allSlugs.forEach(slug => {
      const zoneId = slugZone?.[slug] || 'unknown'
      const pages = (curriculum[slug] || []).reduce((s, e) => s + (e.pageCount || 0), 0)
      z[zoneId] = (z[zoneId] || 0) + pages
    })
    return z
  }, [curriculum, slugZone, allSlugs])

  const maxPages = Math.max(...Object.values(totalPages), 1)
  const ccsr = allSlugs.length ? Math.round((siGroups[0] / allSlugs.length) * 100) : 0

  const casData = useMemo(() => {
    const zoneColors = ['#7f9db2','#76a66f','#9b8abf','#c4a052','#bf7a6a','#6a9b9b','#a8a86a','#7a7abf','#9b6a6a']
    const zoneKeys = Object.keys(zones || {})
    return sourceList.map(src => {
      const segs = zoneKeys.map((zoneId, i) => {
        const polities = allSlugs.filter(s => slugZone?.[s] === zoneId)
        const covered  = polities.filter(s => {
          const e = (curriculum[s] || []).find(x => x.sourceId === src.id)
          return e && (e.coverageStatus === 'present' || e.coverageStatus === 'partial')
        }).length
        return { label: zones[zoneId]?.shortName || zoneId, value: covered, color: zoneColors[i % zoneColors.length] }
      }).filter(s => s.value > 0)
      const total = segs.reduce((s, x) => s + x.value, 0)
      return { src, segs, total }
    }).filter(d => d.total > 0)
  }, [sourceList, curriculum, zones, slugZone, allSlugs])

  return (
    <div style={{
      position:'fixed',
      right:24,
      top:68,
      width:340,
      maxHeight:'calc(100vh - 92px)',
      background:P.bg,
      border:`0.5px solid ${P.border}`,
      borderRadius:10,
      backdropFilter:'blur(18px)',
      display:'flex',
      flexDirection:'column',
      overflow:'hidden',
      zIndex:530,
      pointerEvents:'all',
    }}>
      <div style={{
        display:'flex',
        alignItems:'center',
        justifyContent:'space-between',
        padding:'14px 18px 10px',
        borderBottom:`0.5px solid ${P.border}`,
        flexShrink:0
      }}>
        <span style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:8, letterSpacing:'0.16em', textTransform:'uppercase', color:P.adim }}>
          Analytics
        </span>
        <button onClick={onClose} style={{ background:'none', border:'none', color:P.dim, cursor:'pointer', fontSize:14, padding:'2px 4px' }}>
          ✕
        </button>
      </div>

      <div style={{ display:'flex', borderBottom:`0.5px solid ${P.border}`, flexShrink:0 }}>
        {TABS.map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            style={{
              flex:1,
              padding:'8px 4px',
              background: tab === t ? 'rgba(118,166,111,0.10)' : 'transparent',
              border:'none',
              borderBottom:`2px solid ${tab === t ? P.accent : 'transparent'}`,
              fontFamily:"'IBM Plex Mono',monospace",
              fontSize:8,
              letterSpacing:'0.10em',
              color: tab === t ? P.accent : P.dim,
              cursor:'pointer',
              transition:'all 140ms',
            }}
          >
            {t}
          </button>
        ))}
      </div>

      <div style={{ flex:1, overflowY:'auto', padding:'18px 18px 20px', scrollbarWidth:'none' }}>
        {tab === 'CCSR' && (
          <div>
            <div style={{ display:'flex', alignItems:'center', gap:20, marginBottom:20 }}>
              <PieChart slices={[
                { pct: siGroups[0] / Math.max(allSlugs.length, 1), color:'rgba(118,166,111,0.75)' },
                { pct: (allSlugs.length - siGroups[0]) / Math.max(allSlugs.length, 1), color:'rgba(80,80,120,0.45)' },
              ]} />
              <div>
                <div style={{ fontFamily:"'Playfair Display',serif", fontSize:36, fontWeight:700, color:P.accent, lineHeight:1 }}>
                  {ccsr}%
                </div>
                <div style={{ fontFamily:"'Cormorant Garamond',serif", fontStyle:'italic', fontSize:13, color:P.dim, marginTop:6, lineHeight:1.5 }}>
                  of coded regions absent<br />across all sources
                </div>
              </div>
            </div>

            {[
              { label:'Silent (SI = 0)', value:siGroups[0], color:'rgba(118,166,111,0.75)' },
              { label:'Partial (SI = 1)', value:siGroups[1], color:'rgba(110,153,140,0.75)' },
              { label:'Covered (SI ≥ 2)', value:siGroups['2+'], color:'rgba(115,136,163,0.75)' },
            ].map(s => (
              <HBar key={s.label} label={s.label} value={s.value} max={allSlugs.length} color={s.color} sub={`${s.value} / ${allSlugs.length}`} />
            ))}
          </div>
        )}

        {tab === 'SI' && (
          <div>
            {[
              { label:'0 sources — absent', value:siGroups[0], color:'rgba(118,166,111,0.70)' },
              { label:'1 source — partial', value:siGroups[1], color:'rgba(110,153,140,0.70)' },
              { label:'2+ sources — covered', value:siGroups['2+'], color:'rgba(115,136,163,0.70)' },
            ].map(s => (
              <div key={s.label} style={{ marginBottom:16 }}>
                <HBar label={s.label} value={s.value} max={allSlugs.length} color={s.color} sub={`${s.value} polities`} />
              </div>
            ))}

            <div style={{ marginTop:10 }}>
              {Object.entries(zoneCoverage || {}).map(([zoneId, cov]) => (
                <HBar
                  key={zoneId}
                  label={zones?.[zoneId]?.shortName || zoneId}
                  value={cov.absent}
                  max={cov.total}
                  color='rgba(118,166,111,0.65)'
                  sub={`${cov.silenceRate}% silent`}
                />
              ))}
            </div>
          </div>
        )}

        {tab === 'CAS' && (
          <div>
            {casData.map(({ src, segs, total }) => (
              <div key={src.id} style={{ marginBottom:10 }}>
                <StackedBar label={src.country || src.id} segments={segs} total={Math.max(total, 1)} />
              </div>
            ))}
            {casData.length === 0 && (
              <div style={{ fontFamily:"'Cormorant Garamond',serif", fontStyle:'italic', fontSize:13, color:P.dim }}>
                No coverage data yet.
              </div>
            )}
          </div>
        )}

        {tab === 'PTA' && (
          <div>
            {Object.entries(totalPages)
              .sort((a, b) => b[1] - a[1])
              .map(([zoneId, pages]) => (
                <HBar
                  key={zoneId}
                  label={zones?.[zoneId]?.shortName || zoneId}
                  value={pages}
                  max={maxPages}
                  color='rgba(115,136,163,0.70)'
                  sub={`${pages} pp`}
                />
              ))}
            {maxPages <= 1 && (
              <div style={{ fontFamily:"'Cormorant Garamond',serif", fontStyle:'italic', fontSize:13, color:P.dim }}>
                No page count data in curriculum files yet.
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}