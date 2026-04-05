import { useState, useEffect, useCallback } from 'react'
import { MapContainer, TileLayer } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import AtlasMode    from './modes/AtlasMode'
import AnalysisMode from './modes/AnalysisMode'
import ModeToggle   from './components/shared/ModeToggle'

const ATLAS_GEO_FILES = [
  '/geo/world.geojson',
  '/geo/africa13c_basemap.geojson',
  '/geo/americas13c_basemap.geojson',
  '/geo/asia13c_basemap.geojson',
  '/geo/europe13c_basemap.geojson',
  '/geo/easteurope13c_basemap.geojson',
  '/geo/india13c.geojson',
  '/geo/northamerica.geojson',
  '/geo/southamerica.geojson',
  '/geo/historical_regions.geojson',
]

const CURRICULUM_FILES = [
  '/data/analysis/china_curriculum.json',
  '/data/analysis/uzb_curriculum.json',
  '/data/analysis/ssd_curriculum.json',
  '/data/analysis/bulgaria_curriculum.json',
  // '/data/analysis/korea_curriculum.json',
]

const SLUG_VARIANTS = {
  'ottoman_empire':          'ottoman-empire',
  'mali_empire':             'mali-empire',
  'ghana_empire':            'ghana-empire',
  'golden_horde':            'golden-horde',
  'delhi_sultanate':         'delhi-sultanate',
  'yuan_dynasty':            'yuan-dynasty',
  'song_china':              'song-china',
  'song-dynasty':            'song-china',
  'kievan_rus':              'kievan-rus',
  'novgorod_republic':       'novgorod-republic',
  'second_bulgarian_empire': 'second-bulgarian-empire',
  'maya_city_states':        'maya-city-states',
  'aztec_empire':            'aztec-empire',
  'inca_empire':             'inca-empire',
  'ottoman-empire?':         null,
}

function normaliseSlug(raw) {
  if (!raw) return null
  const lower = raw.toLowerCase().trim().replace(/_/g, '-').replace(/\?$/, '')
  if (Object.prototype.hasOwnProperty.call(SLUG_VARIANTS, lower)) return SLUG_VARIANTS[lower]
  return lower
}

function slugToName(slug) {
  return slug
    .split('-')
    .map(w => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ')
    .replace('Of ', 'of ')
    .replace('The ', 'the ')
}

const AGENCY_KW   = ['foundation','founded','established','reform','administration','governed','parliament','charter','rights','independent','institution','centrali','fiscal','market policy','sultan','dynasty','shogun','republic','senate','doge','kurultai','iqta','beylik']
const TRADE_KW    = ['trade','commerce','merchant','gold','silk','salt','caravan','route','urban','cities','architecture','religion','islam','christian','culture','technology','agriculture','craft','manufacture','monetary']
const CONQUEST_KW = ['conquest','invasion','invaded','attack','captured','capture','defeat','defeated','battle','military','crusade','campaign','tribute','subordinat','subjugat','occupied','resistance','revolt','uprising']
const DECLINE_KW  = ['decline','fragmentation','collapse','disintegrat','weaken','divided','crisis','unrest','instabilit','burden']

function computeFramingIndex(topics = []) {
  if (!topics.length) return null
  const cats = topics.map(t => {
    const tl = t.toLowerCase()
    if (CONQUEST_KW.some(k => tl.includes(k)))  return 'military_conquest'
    if (DECLINE_KW.some(k => tl.includes(k)))   return 'decline_fragmentation'
    if (TRADE_KW.some(k => tl.includes(k)))     return 'trade_culture'
    if (AGENCY_KW.some(k => tl.includes(k)))    return 'governance_agency'
    return 'trade_culture'
  })
  const counts = {
    governance_agency:     cats.filter(c => c === 'governance_agency').length,
    trade_culture:         cats.filter(c => c === 'trade_culture').length,
    military_conquest:     cats.filter(c => c === 'military_conquest').length,
    decline_fragmentation: cats.filter(c => c === 'decline_fragmentation').length,
  }
  const score = (counts.governance_agency + counts.trade_culture) / cats.length
  return {
    score:  Math.round(score * 100) / 100,
    counts,
    total:  cats.length,
    label:  score > 0.6 ? 'agent' : score > 0.35 ? 'mixed' : 'victim',
  }
}

function computeFullCurriculum(rawCurriculum, allSlugs, sourceIds) {
  const result = {}
  allSlugs.forEach(slug => {
    result[slug] = []
    sourceIds.forEach(sourceId => {
      const coded = rawCurriculum[slug]?.find(e => e.sourceId === sourceId)
      if (coded) {
        result[slug].push({
          ...coded,
          framingIndex: computeFramingIndex(coded.topicsPresent),
        })
      } else {
        result[slug].push({
          sourceId,
          coverageStatus: 'absent',
          pageCount: 0,
          pageRefs: null,
          topicsPresent: [],
          framingNotes: null,
          analystNotes: 'Absent — not found in source during coding',
          confidence: 'formula',
          coderID: 'formula',
          framingIndex: null,
        })
      }
    })
  })
  return result
}

export default function App() {
  const [mode, setMode]         = useState('atlas')
  const [year, setYear]         = useState(1250)
  const [selectedSlug, setSlug] = useState(null)
  const [loading, setLoading]   = useState(true)

  const [atlasGeo, setAtlasGeo]      = useState(null)
  const [atlasRegions, setAtlas]     = useState({})
  const [regions, setRegions]        = useState({})
  const [sources, setSources]        = useState({})
  const [curriculum, setCurric]      = useState({})
  const [objects, setObjects]        = useState({})
  const [interpretations, setInterp] = useState({})
  const [zones, setZones]            = useState({})
  const [slugZone, setSlugZone]      = useState({})

  useEffect(() => {
    document.body.classList.toggle('atlas-mode-active', mode === 'atlas')
    document.body.classList.toggle('analysis-mode-active', mode === 'analysis')
    return () => {
      document.body.classList.remove('atlas-mode-active')
      document.body.classList.remove('analysis-mode-active')
    }
  }, [mode])

  useEffect(() => {
    const load = async () => {
      try {
        const atlasResults = await Promise.all(
          ATLAS_GEO_FILES.map(f =>
            fetch(f).then(r => r.ok ? r.json() : null).catch(() => null)
          )
        )

        setAtlasGeo({
          type: 'FeatureCollection',
          features: atlasResults.filter(Boolean).flatMap(g => g.features || [])
        })

        const atlasRaw = await fetch('/data/atlas/regions.json').then(r => r.json()).catch(() => ({}))
        const atlasBySlug = {}
        Object.values(atlasRaw).forEach(r => {
          if (r.slug) atlasBySlug[normaliseSlug(r.slug)] = r
        })
        setAtlas(atlasBySlug)

        const [zonesData, slugZoneData, src, obj, interp] = await Promise.all([
          fetch('/data/analysis/zones.json').then(r => r.json()).catch(() => ({})),
          fetch('/data/analysis/slug-zone.json').then(r => r.json()).catch(() => ({})),
          fetch('/data/analysis/sources.json').then(r => r.json()).then(d => {
            const o = {}
            ;(Array.isArray(d) ? d : Object.values(d)).forEach(s => { if (s.id) o[s.id] = s })
            return o
          }).catch(() => ({})),
          fetch('/data/analysis/objects-curated.json').then(r => r.json()).catch(() => ({})),
          fetch('/data/analysis/interpretations.json').then(r => r.json()).catch(() => ({})),
        ])

        setZones(zonesData)
        setSlugZone(slugZoneData)
        setSources(src)
        setObjects(obj)
        setInterp(interp)

        const curResults = await Promise.all(
          CURRICULUM_FILES.map(f => fetch(f).then(r => r.json()).catch(() => ({})))
        )

        const rawMerged = {}
        curResults.forEach(file => {
          Object.entries(file).forEach(([rawSlug, entries]) => {
            const slug = normaliseSlug(rawSlug)
            if (!slug) return
            if (!rawMerged[slug]) rawMerged[slug] = []
            const arr = Array.isArray(entries) ? entries : []
            rawMerged[slug] = [...rawMerged[slug], ...arr]
          })
        })

        const allSlugs = Object.keys(rawMerged)
        const sourceIds = Object.keys(src)

        const derivedRegions = {}
        allSlugs.forEach(slug => {
          derivedRegions[slug] = {
            slug,
            name: slugToName(slug),
            zone: slugZoneData[slug] || 'unknown',
          }
        })
        setRegions(derivedRegions)

        setCurric(computeFullCurriculum(rawMerged, allSlugs, sourceIds))
      } catch (err) {
        console.error('Data load error:', err)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const handleRegionClick = useCallback((slug) => {
    setSlug(prev => prev === slug ? null : slug)
  }, [])

  const handleModeSwitch = useCallback((newMode) => {
    setMode(newMode)
    setSlug(null)
  }, [])

  const handleYearChange = useCallback((y) => {
    setYear(typeof y === 'function' ? y(year) : y)
  }, [year])

  if (loading) return (
    <div style={{
      position:'fixed', inset:0, background:'#1a2208',
      display:'flex', flexDirection:'column',
      alignItems:'center', justifyContent:'center', gap:16,
    }}>
      <span style={{fontFamily:"'Playfair Display',serif",fontSize:20,color:'rgba(200,185,120,0.75)',letterSpacing:'0.03em'}}>
        Mapping Historical Silence
      </span>
      <span style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:9,letterSpacing:'0.18em',textTransform:'uppercase',color:'rgba(200,185,120,0.28)'}}>
        loading the 13th century…
      </span>
    </div>
  )

  return (
    <>
      <ModeToggle mode={mode} onSwitch={handleModeSwitch} />
      <MapContainer
        center={[20,20]}
        zoom={3}
        minZoom={2}
        maxZoom={7}
        zoomControl={false}
        attributionControl={false}
        style={{position:'fixed',inset:0,background:'transparent',zIndex:10}}
      >
        {mode === 'atlas' ? (
          <TileLayer
            url="https://tiles.stadiamaps.com/tiles/stamen_watercolor/{z}/{x}/{y}.jpg"
            opacity={0.80}
          />
        ) : (
          <TileLayer
            url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager_nolabels/{z}/{x}/{y}{r}.png"
            opacity={0.35}
          />
        )}

        {mode === 'atlas' ? (
          <AtlasMode
            geojson={atlasGeo}
            regions={atlasRegions}
            allRegions={atlasRegions}
            objects={objects}
            curriculum={curriculum}
            sources={sources}
            interpretations={interpretations}
            selectedSlug={selectedSlug}
            year={year}
            onRegionClick={handleRegionClick}
            onYearChange={handleYearChange}
          />
        ) : (
          <AnalysisMode
            geojson={atlasGeo}
            regions={regions}
            sources={sources}
            curriculum={curriculum}
            selectedSlug={selectedSlug}
            zones={zones}
            slugZone={slugZone}
            year={year}
            onRegionClick={handleRegionClick}
            onYearChange={handleYearChange}
          />
        )}
      </MapContainer>
    </>
  )
}