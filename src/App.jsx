import { MapContainer, TileLayer, GeoJSON, useMap } from "react-leaflet"
import { useEffect, useState, useMemo, useCallback, useRef } from "react"
import L from "leaflet"
import "leaflet/dist/leaflet.css"
import "./map.css"
import "./analytics.css"
import * as turf from "@turf/turf"

// leaflet.heat must be imported after L is available
import "leaflet.heat"

const FLAGS = {
  "Ukraine":      "🇺🇦",
  "Russia":       "🇷🇺",
  "India":        "🇮🇳",
  "South Africa": "🇿🇦",
}

// Fallback zone map for regions not in GeoJSON continental_zone
const ZONE_FALLBACK = {
  "kievan-rus":        "Europe",
  "mongol-empire":     "Asia",
  "delhi-sultanate":   "Asia",
  "mapungubwe":        "Africa",
  "mali-empire":       "Africa",
  "song-china":        "Asia",
  "kingdom-of-vungu":  "Africa",
  "ngoyo":             "Africa",
  "kakongo":           "Africa",
  "nsundi":            "Africa",
  "mpemba":            "Africa",
}

const ZONE_COLORS = {
  Africa:   "#f59e0b",
  Europe:   "#60a5fa",
  Asia:     "#4ade80",
  Americas: "#a78bfa",
  Oceania:  "#f87171",
}

// coverageStatus may be "present", "covered", or "partial" — all mean covered
// Only "absent" means not covered
function computeSI(entries) {
  return entries.filter(e => e.coverageStatus !== "absent").length
}

function regionColor(si, pending) {
  if (pending)    return { fill: "#facc15", fillOpacity: 0.25, stroke: "#facc15", weight: 2.5 }
  if (si === 0)   return { fill: "#e05252", fillOpacity: 0.35, stroke: "#e05252", weight: 2.5 }
  if (si === 1)   return { fill: "#60a5fa", fillOpacity: 0.35, stroke: "#60a5fa", weight: 2.5 }
  return                 { fill: "#4ade80", fillOpacity: 0.40, stroke: "#4ade80", weight: 2.5 }
}

// ─── Heatmap Layer ────────────────────────────────────────────────────────────
function HeatmapLayer({ geojson, regions, curriculum, mode }) {
  const map = useMap()
  const heatRef = useRef(null)

  useEffect(() => {
    if (!geojson || !map) return
    if (heatRef.current) { map.removeLayer(heatRef.current); heatRef.current = null }

    const points = []

    geojson.features.forEach(f => {
      const slug = f.properties.slug
      const regionData = regions[slug]
      if (!regionData) return

      try {
        const centroid = turf.centroid(f)
        const [lng, lat] = centroid.geometry.coordinates
        const entries = curriculum[slug] || []
        const si = computeSI(entries)
        const pending = regionData.dataStatus === "pending"
        let weight = 0

        switch (mode) {
          case "silence":
            // All absent (non-pending) regions
            weight = (si === 0 && !pending) ? 1 : 0
            break
          case "crosssilence":
            // Only confirmed real regions absent from all sources — the key finding
            weight = (si === 0 && regionData.dataStatus === "real") ? 1 : 0
            break
          case "attention":
            // Total pages devoted, normalised roughly
            weight = Math.min(entries.reduce((s, e) => s + (e.pageCount || 0), 0) / 50, 1)
            break
          case "topicdensity":
            // How many unique topics across all sources
            const topicCount = entries.reduce((s, e) => s + (e.topicsPresent?.length || 0), 0)
            weight = Math.min(topicCount / 12, 1)
            break
          default:
            weight = 0
        }

        if (weight > 0) points.push([lat, lng, weight])
      } catch (e) {
        console.warn("centroid error for", slug, e)
      }
    })

    if (points.length > 0) {
      heatRef.current = L.heatLayer(points, {
        radius:   55,
        blur:     30,
        maxZoom:  8,
        max:      1.0,
        gradient: { 0.2: "#3b82f6", 0.5: "#f59e0b", 0.8: "#ef4444" },
      })
      heatRef.current.addTo(map)
    }

    return () => {
      if (heatRef.current) { map.removeLayer(heatRef.current); heatRef.current = null }
    }
  }, [geojson, regions, curriculum, mode, map])

  return null
}

// ─── Regions Layer ────────────────────────────────────────────────────────────
function RegionsLayer({ geojson, curriculum, regions, onRegionClick, selectedSlug }) {
  const getStyle = useCallback((feature) => {
    const slug = feature.properties.slug
    const entries = curriculum[slug] || []
    const pending = regions[slug]?.dataStatus === "pending"
    const si = computeSI(entries)
    const { fill, fillOpacity, stroke, weight } = regionColor(si, pending)
    const selected = selectedSlug === slug
    return {
      fillColor:   fill,
      fillOpacity: selected ? Math.min(fillOpacity * 2.8, 0.6) : fillOpacity,
      color:       stroke,
      opacity:     0.9,
      weight:      selected ? weight + 1.2 : weight,
    }
  }, [curriculum, regions, selectedSlug])

  const key = useMemo(() => {
    const slugs = geojson?.features?.map(f => f.properties.slug).join("") || ""
    return `${slugs}-${selectedSlug}-${Object.keys(curriculum).length}`
  }, [geojson, selectedSlug, curriculum])

  if (!geojson) return null

  return (
    <GeoJSON
      key={key}
      data={geojson}
      style={getStyle}
      onEachFeature={(feature, layer) => {
        const slug = feature.properties.slug
        const entries = curriculum[slug] || []
        const pending = regions[slug]?.dataStatus === "pending"
        const si = computeSI(entries)
        const statusText = pending
          ? "pending sources"
          : si === 0
            ? "absent from all corpus sources"
            : `${si} source${si > 1 ? "s" : ""} in corpus`
        layer.bindTooltip(`
          <div class="map-tooltip">
            <strong>${regions[slug]?.name || feature.properties.name || slug}</strong>
            <span>${regions[slug]?.period || feature.properties.period || ""}</span>
            <span>${statusText}</span>
          </div>
        `, { sticky: true, className: "custom-tooltip" })
        layer.on({
          click: () => onRegionClick(slug),
          mouseover: e => {
            const { fillOpacity } = regionColor(si, pending)
            e.target.setStyle({ fillOpacity: Math.min(fillOpacity * 3, 0.65), weight: 2.8 })
          },
          mouseout: e => layer.setStyle(getStyle(feature)),
        })
      }}
    />
  )
}

// ─── Region Panel ─────────────────────────────────────────────────────────────
function Panel({ region, curriculum, sources, onClose }) {
  const [tab, setTab] = useState("overview")
  useEffect(() => setTab("overview"), [region?.slug])
  if (!region) return null

  const slug = region.slug
  const entries = curriculum[slug] || []
  const events  = region.events || []
  const pending = region.dataStatus === "pending"
  const sourceList = Array.isArray(sources?.sources) ? sources.sources : []
  const getSource  = id => sourceList.find(s => s.id === id)

  return (
    <div className="panel">
      <div className="panel-header">
        <button className="panel-close" onClick={onClose}>✕</button>
        <div className="panel-name">{region.name}</div>
        <div className="panel-period">{region.period}</div>
        <div className="panel-location">{region.modernLocation}</div>
        <div className="panel-tabs">
          {["overview", "events", "curriculum"].map(t => (
            <button
              key={t}
              className={`tab-btn ${tab === t ? "active" : ""}`}
              onClick={() => setTab(t)}
            >
              {t === "overview" ? "Overview" : t === "events" ? "Events" : "Curriculum"}
            </button>
          ))}
        </div>
      </div>

      <div className="panel-body">
        {tab === "overview" && (
          <div>
            <p className="region-description">{region.description}</p>
            <span className={`data-status ${pending ? "pending" : "real"}`}>
              {pending ? "⚠ pending sources" : "✓ real sources"}
            </span>
            <div className="coverage-summary">
              <div className="coverage-summary-title">Corpus coverage</div>
              {sourceList.map(src => {
                const entry   = entries.find(e => e.sourceId === src.id)
                const covered = entry && entry.coverageStatus !== "absent"
                return (
                  <div className="coverage-row" key={src.id}>
                    <span className="coverage-flag">{FLAGS[src.country] || "🌐"}</span>
                    <span className="coverage-source-name">{src.title}</span>
                    {covered && entry?.pageCount &&
                      <span className="coverage-pages">{entry.pageCount}p</span>}
                    <span className={`coverage-dot ${covered ? "dot-present" : "dot-absent"}`} />
                  </div>
                )
              })}
              {computeSI(entries) === 0 && !pending && (
                <div className="no-coverage-notice">
                  This region is absent from all sources in the corpus — itself a form of historical silence.
                </div>
              )}
            </div>
          </div>
        )}

        {tab === "events" && (
          <div>
            {events.length === 0 && (
              <p className="pending-notice">No event data yet for this region.</p>
            )}
            <div className="event-list">
              {events.map((ev, i) => {
                const src = getSource(ev.source)
                return (
                  <div className="event-item" key={i}>
                    <div className="event-year">{ev.year}</div>
                    <div className="event-content">
                      <div className="event-label">{ev.label}</div>
                      <div className="event-category">{ev.category}</div>
                      {src && (
                        <div className="event-source-tag">
                          {FLAGS[src.country] || ""} {src.title}
                        </div>
                      )}
                      {!ev.source && (
                        <div className="event-source-tag">source pending</div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
            {pending && (
              <p className="pending-notice">
                Events listed are based on general historical knowledge.
                A primary textbook source for this region is not yet in the corpus.
              </p>
            )}
          </div>
        )}

        {tab === "curriculum" && (
          <div>
            {entries.length === 0 ? (
              <div className="empty-curriculum">
                <div className="big-label">Not in corpus</div>
                <p>
                  No textbook in the current corpus covers this region.
                  This absence is itself a finding — not a gap in the data,
                  but a datum about which histories are taught.
                </p>
              </div>
            ) : (
              entries.map((entry, i) => {
                const src = getSource(entry.sourceId)
                return (
                  <div className="source-block" key={i}>
                    <div className="source-title">
                      {src ? `${FLAGS[src.country] || ""} ${src.title}` : entry.sourceId}
                    </div>
                    {src && (
                      <div className="source-meta">
                        {src.country} · Grade {src.grade} · {src.year || "n.d."}
                      </div>
                    )}
                    {entry.pageCount && (
                      <div className="source-pages">{entry.pageCount} pages devoted</div>
                    )}
                    {entry.topicsPresent?.length > 0 && (
                      <div className="topics-section">
                        <div className="topics-label">Topics present</div>
                        {entry.topicsPresent.map((t, j) => (
                          <div className="topic-item" key={j}>{t}</div>
                        ))}
                      </div>
                    )}
                    {entry.framingNotes && (
                      <div className="framing-box">
                        <div className="framing-label">Framing</div>
                        <div className="framing-text">{entry.framingNotes}</div>
                      </div>
                    )}
                    {entry.analystNotes && (
                      <div className="analyst-note">{entry.analystNotes}</div>
                    )}
                  </div>
                )
              })
            )}
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Analytics Panel ──────────────────────────────────────────────────────────
function AnalyticsPanel({ geojson, regions, curriculum, sources, heatMode, setHeatMode }) {
  const sourceList = Array.isArray(sources?.sources) ? sources.sources : []
  const slugs      = Object.keys(regions)

  // Build a slug → zone map from GeoJSON properties first, fallback to hardcoded
  const zoneMap = useMemo(() => {
    const m = { ...ZONE_FALLBACK }
    if (geojson) {
      geojson.features.forEach(f => {
        if (f.properties.slug && f.properties.continental_zone) {
          m[f.properties.slug] = f.properties.continental_zone
        }
      })
    }
    return m
  }, [geojson])

  // Build slug → region_type from GeoJSON properties
  const typeMap = useMemo(() => {
    const m = {}
    if (geojson) {
      geojson.features.forEach(f => {
        if (f.properties.slug && f.properties.region_type) {
          m[f.properties.slug] = f.properties.region_type
        }
      })
    }
    return m
  }, [geojson])

  // ── CCSR ──
  const realSlugs   = slugs.filter(s => regions[s]?.dataStatus !== "pending")
  const silentSlugs = realSlugs.filter(s => computeSI(curriculum[s] || []) === 0)
  const ccsr        = realSlugs.length > 0
    ? Math.round(silentSlugs.length / realSlugs.length * 100)
    : 0

  // ── CAS — geographic focus per source ──
  const casData = useMemo(() => {
    return sourceList.map(src => {
      const counts = { Africa: 0, Europe: 0, Asia: 0, Americas: 0, Oceania: 0 }
      const coveredSlugs = slugs.filter(s => {
        const entry = (curriculum[s] || []).find(e => e.sourceId === src.id)
        return entry && entry.coverageStatus !== "absent"
      })
      coveredSlugs.forEach(s => {
        const zone = zoneMap[s]
        if (zone && counts[zone] !== undefined) counts[zone]++
      })
      return { source: src, counts, total: coveredSlugs.length }
    })
  }, [sourceList, slugs, curriculum, zoneMap])

  // ── RTCD — coverage rate per region type ──
  const rtcdData = useMemo(() => {
    const typeGroups = {}
    slugs.forEach(s => {
      const t = typeMap[s] || regions[s]?.region_type || "unknown"
      if (!typeGroups[t]) typeGroups[t] = { total: 0, covered: 0 }
      typeGroups[t].total++
      if (computeSI(curriculum[s] || []) > 0) typeGroups[t].covered++
    })
    return Object.entries(typeGroups)
      .map(([type, { total, covered }]) => ({
        type,
        rate: total > 0 ? Math.round(covered / total * 100) : 0,
        covered,
        total,
      }))
      .sort((a, b) => b.rate - a.rate)
  }, [slugs, typeMap, regions, curriculum])

  const heatModes = [
    { id: "silence",      label: "Silence density",       desc: "Where do absent regions cluster?" },
    { id: "crosssilence", label: "Cross-corpus silence",   desc: "Confirmed regions absent from all sources" },
    { id: "attention",    label: "Textual attention",      desc: "Where does the corpus concentrate pages?" },
    { id: "topicdensity", label: "Topic density",          desc: "Which regions get diverse coverage?" },
  ]

  return (
    <div className="analytics-panel">

      {/* CCSR */}
      <div className="analytics-section">
        <div className="analytics-label">Cross-corpus silence rate</div>
        <div className="ccsr-big">{ccsr}%</div>
        <div className="analytics-sub">
          {silentSlugs.length} of {realSlugs.length} confirmed regions are absent from every source in the corpus
        </div>
      </div>

      {/* Heatmap mode selector */}
      <div className="analytics-section">
        <div className="analytics-label">Heatmap mode</div>
        <div className="heatmode-list">
          {heatModes.map(m => (
            <div
              key={m.id}
              className={`heatmode-btn ${heatMode === m.id ? "active" : ""}`}
              onClick={() => setHeatMode(m.id)}
            >
              <div className="heatmode-name">{m.label}</div>
              <div className="heatmode-desc">{m.desc}</div>
            </div>
          ))}
        </div>
      </div>

      {/* CAS — geographic focus per source */}
      <div className="analytics-section">
        <div className="analytics-label">Geographic focus per source</div>
        <div className="cas-legend">
          {Object.entries(ZONE_COLORS).map(([zone, color]) => (
            <span key={zone} className="cas-legend-item">
              <span className="cas-legend-dot" style={{ background: color }} />
              {zone}
            </span>
          ))}
        </div>
        {casData.map(({ source, counts, total }) => (
          <div className="cas-row" key={source.id}>
            <div className="cas-source-name">
              {FLAGS[source.country] || "🌐"} {source.country}
            </div>
            {total === 0 ? (
              <div className="cas-empty">no coverage recorded</div>
            ) : (
              <div className="cas-bar-track">
                {Object.entries(counts)
                  .filter(([, v]) => v > 0)
                  .map(([zone, count]) => (
                    <div
                      key={zone}
                      className="cas-segment"
                      title={`${zone}: ${count} region${count > 1 ? "s" : ""}`}
                      style={{
                        width:      `${Math.round(count / total * 100)}%`,
                        background: ZONE_COLORS[zone] || "#888",
                      }}
                    />
                  ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* RTCD — coverage rate by region type */}
      {rtcdData.some(d => d.type !== "unknown") && (
        <div className="analytics-section">
          <div className="analytics-label">Coverage by region type</div>
          {rtcdData.map(({ type, rate, covered, total }) => (
            <div className="rtcd-row" key={type}>
              <div className="rtcd-type">{type}</div>
              <div className="rtcd-bar-track">
                <div
                  className="rtcd-bar-fill"
                  style={{ width: `${rate}%` }}
                />
              </div>
              <div className="rtcd-stat">{covered}/{total}</div>
            </div>
          ))}
          <div className="analytics-note">
            Proportion of each political type covered by at least one corpus source
          </div>
        </div>
      )}

    </div>
  )
}

// ─── App Root ─────────────────────────────────────────────────────────────────
export default function App() {
  const [geojson,      setGeojson]      = useState(null)
  const [regions,      setRegions]      = useState({})
  const [sources,      setSources]      = useState({})
  const [curriculum,   setCurriculum]   = useState({})
  const [selectedSlug, setSelectedSlug] = useState(null)
  const [selectedYear, setSelectedYear] = useState(1200)
  const [isPlaying,    setIsPlaying]    = useState(false)
  const [appMode,      setAppMode]      = useState("explore") // "explore" | "analytics"
  const [heatMode,     setHeatMode]     = useState("silence")
  const timerRef = useRef(null)
  const MIN_YEAR = 1200
  const MAX_YEAR = 1299

  // Load all data
  useEffect(() => {
    const GEO_FILES = [
      "/geo/india13c.geojson",
      "/geo/historical_regions.geojson",
      "/geo/africa13c.geojson",
      "/geo/europe13c.geojson",
      "/geo/southamerica.geojson",
      "/geo/northamerica.geojson",
    ]
    Promise.all(GEO_FILES.map(f => fetch(f).then(r => r.json()).catch(() => null)))
      .then(results => {
        const allFeatures = results.filter(Boolean).flatMap(g => g.features || [])
        setGeojson({ type: "FeatureCollection", features: allFeatures })
      })

    fetch("/data/regions13c.json").then(r => r.json()).then(data => {
      const bySlug = {}
      Object.values(data).forEach(r => { bySlug[r.slug] = r })
      setRegions(bySlug)
    }).catch(console.error)

    fetch("/data/sources.json").then(r => r.json()).then(setSources).catch(console.error)
    fetch("/data/curriculum.json").then(r => r.json()).then(setCurriculum).catch(console.error)
  }, [])

  // Year slider playback
  useEffect(() => {
    if (!isPlaying) { clearInterval(timerRef.current); return }
    timerRef.current = setInterval(() => {
      setSelectedYear(y => {
        if (y >= MAX_YEAR) { setIsPlaying(false); return MAX_YEAR }
        return y + 5
      })
    }, 600)
    return () => clearInterval(timerRef.current)
  }, [isPlaying])

  const selectedRegion = selectedSlug ? regions[selectedSlug] : null

  // ── Temporal filtering — uses start_year / end_year from GeoJSON properties ──
  const filteredGeojson = useMemo(() => {
    if (!geojson) return null
    return {
      ...geojson,
      features: geojson.features.filter(f => {
        const startYear = f.properties.start_year
        const endYear   = f.properties.end_year
        // If GeoJSON has no year data, always show the region
        if (!startYear && !endYear) return true
        const start = startYear || 0
        const end   = endYear   || 1299
        return start <= selectedYear && end >= selectedYear
      }),
    }
  }, [geojson, selectedYear])

  // ── Stats (recalculates automatically when curriculum changes) ──
  const stats = useMemo(() => {
    const slugs     = Object.keys(regions)
    const realSlugs = slugs.filter(s => regions[s]?.dataStatus !== "pending")
    const covered   = slugs.filter(s => computeSI(curriculum[s] || []) > 0).length
    const absent    = realSlugs.filter(s => computeSI(curriculum[s] || []) === 0).length
    const pending   = slugs.filter(s => regions[s]?.dataStatus === "pending").length
    const ccsr      = realSlugs.length > 0 ? Math.round(absent / realSlugs.length * 100) : 0
    return { total: slugs.length, covered, absent, pending, ccsr }
  }, [regions, curriculum])

  return (
    <div className="app">

      {/* ── Header ── */}
      <div className="header">
        <div className="header-left">
          <div className="header-title">Mapping Historical Silence</div>
          <div className="header-sub">13th century · curriculum analysis</div>
        </div>

        <div className="header-mode-toggle">
          <button
            className={`mode-btn ${appMode === "explore" ? "active" : ""}`}
            onClick={() => { setAppMode("explore"); setSelectedSlug(null) }}
          >
            Explore
          </button>
          <button
            className={`mode-btn ${appMode === "analytics" ? "active" : ""}`}
            onClick={() => { setAppMode("analytics"); setSelectedSlug(null) }}
          >
            Analytics
          </button>
        </div>

        <div className="header-stats">
          <span className="stat">
            <span className="stat-n" style={{ color: "#4ade80" }}>{stats.covered}</span> covered
          </span>
          <span className="stat">
            <span className="stat-n" style={{ color: "#e05252" }}>{stats.absent}</span> absent
          </span>
          <span className="stat">
            <span className="stat-n" style={{ color: "#facc15" }}>{stats.pending}</span> pending
          </span>
          <span className="stat ccsr-stat">
            <span className="stat-n" style={{ color: "#f97316" }}>{stats.ccsr}%</span> silence
          </span>
        </div>
      </div>

      {/* ── Legend (explore mode only) ── */}
      {appMode === "explore" && (
        <div className="legend">
          <div className="legend-title">Corpus coverage</div>
          <div className="legend-item"><span className="legend-dot" style={{ background: "#4ade80" }} />2+ sources</div>
          <div className="legend-item"><span className="legend-dot" style={{ background: "#60a5fa" }} />1 source</div>
          <div className="legend-item"><span className="legend-dot" style={{ background: "#e05252" }} />absent</div>
          <div className="legend-item"><span className="legend-dot" style={{ background: "#facc15" }} />pending</div>
        </div>
      )}

      {/* ── Map ── */}
      <div className="map-wrap">
        <MapContainer
          center={[20, 40]}
          zoom={2}
          minZoom={2}
          style={{ width: "100%", height: "100%" }}
          zoomControl={false}
          attributionControl={false}
        >
          <TileLayer
            url="https://{s}.basemaps.cartocdn.com/dark_nolabels/{z}/{x}/{y}{r}.png"
            attribution='&copy; <a href="https://carto.com/">CARTO</a>'
          />

          {/* Always render regions layer */}
          <RegionsLayer
            geojson={filteredGeojson}
            curriculum={curriculum}
            regions={regions}
            onRegionClick={appMode === "explore" ? setSelectedSlug : () => {}}
            selectedSlug={selectedSlug}
          />

          {/* Heatmap overlay in analytics mode */}
          {appMode === "analytics" && filteredGeojson && (
            <HeatmapLayer
              geojson={filteredGeojson}
              regions={regions}
              curriculum={curriculum}
              sources={sources}
              mode={heatMode}
            />
          )}
        </MapContainer>
      </div>

      {/* ── Map prompt ── */}
      {appMode === "explore" && !selectedSlug && Object.keys(regions).length > 0 && (
        <div className="map-prompt">click a region to explore</div>
      )}

      {/* ── Temporal controls ── */}
      <div className="controls">
        <div className="year-display">{selectedYear}</div>
        <div className="slider-row">
          <button className="play-btn" onClick={() => setIsPlaying(p => !p)}>
            {isPlaying ? "⏸" : "▶"}
          </button>
          <input
            type="range"
            className="year-slider"
            min={MIN_YEAR}
            max={MAX_YEAR}
            value={selectedYear}
            onChange={e => setSelectedYear(Number(e.target.value))}
          />
        </div>
        <div className="year-range-label">{MIN_YEAR} — {MAX_YEAR}</div>
      </div>

      {/* ── Corpus bar ── */}
      <div className="corpus-bar">
        <span className="corpus-bar-label">corpus</span>
        {(sources?.sources || []).map(src => (
          <span key={src.id} className="corpus-tag">
            {FLAGS[src.country] || "🌐"} {src.country} gr.{src.grade}
          </span>
        ))}
      </div>

      {/* ── Region panel (explore mode) ── */}
      {appMode === "explore" && selectedRegion && (
        <Panel
          region={{ ...selectedRegion, slug: selectedSlug }}
          curriculum={curriculum}
          sources={sources}
          onClose={() => setSelectedSlug(null)}
        />
      )}

      {/* ── Analytics panel (analytics mode) ── */}
      {appMode === "analytics" && (
        <AnalyticsPanel
          geojson={geojson}
          regions={regions}
          curriculum={curriculum}
          sources={sources}
          heatMode={heatMode}
          setHeatMode={setHeatMode}
        />
      )}

    </div>
  )
}