#!/usr/bin/env node
// 13th Century Corpus Agent
// Usage: node corpus-agent.js path/to/textbook.pdf

import Anthropic from '@anthropic-ai/sdk'
import fs from 'fs'
import path from 'path'
import { spawnSync } from 'child_process'
import os from 'os'

const REGIONS = [
  'kievan-rus','mongol-empire','delhi-sultanate','mapungubwe','mali-empire','song-china',
  'kingdom-of-vungu','ngoyo','kakongo','nsundi','mpemba',
  'sindh-sultanate','gondwana-kingdom','rajputana',
  'byzantine-empire','holy-roman-empire','kingdom-of-france',
  'crown-of-castile','crown-of-aragon','kingdom-of-portugal','kingdom-of-navarre',
  'almohad-caliphate','second-bulgarian-empire','novgorod-republic',
  'vladimir-suzdal','galicia-volhynia','khwarezm-empire',
  'kingdom-of-georgia','armenian-kingdom',
  'khmer-empire','goryeo','pagan-empire','dai-viet','chola-empire',
  'kanem-empire','ghana-empire','great-zimbabwe','makuria','alodia',
  'takrur','ifat-sultanate','swahili-city-states',
  'chimu-empire','maya-city-states','tabasco','tetzcoco','chanka','lupaca',
  'kingdom-of-hungary','kingdom-of-poland','republic-of-venice','papal-states',
  'kingdom-of-scotland','kingdom-of-denmark','kingdom-of-norway',
  'tibet','nepal','western-xia','dali-kingdom',
]

const MAX_MB = 15
const client = new Anthropic()

function splitPdf(pdfPath) {
  const sizeMB = fs.statSync(pdfPath).size / 1024 / 1024
  if (sizeMB <= MAX_MB) return [pdfPath]

  console.log(`   File is ${sizeMB.toFixed(1)}MB — splitting into chunks...`)
  const chunks = Math.ceil(sizeMB / MAX_MB)
  const tmpDir = os.tmpdir()
  const chunkPaths = []

  // Get page count via pdfinfo or mdls
  let pages = 0
  try {
    const r = spawnSync('pdfinfo', [pdfPath], { encoding: 'utf8' })
    const m = r.stdout.match(/Pages:\s+(\d+)/)
    if (m) pages = parseInt(m[1])
  } catch(e) {}

  if (!pages) {
    // Estimate: ~30KB per page
    pages = Math.ceil(sizeMB * 1024 / 30)
    console.log(`   Estimated ~${pages} pages`)
  } else {
    console.log(`   ${pages} pages total`)
  }

  const pagesPerChunk = Math.ceil(pages / chunks)

  for (let i = 0; i < chunks; i++) {
    const start = i * pagesPerChunk + 1
    const end = Math.min((i + 1) * pagesPerChunk, pages)
    const out = path.join(tmpDir, `chunk${i}_${Date.now()}.pdf`)

    // Try ghostscript (usually available on Mac)
    const gs = spawnSync('gs', [
      '-dNOPAUSE', '-dBATCH', '-sDEVICE=pdfwrite', '-dQUIET',
      `-dFirstPage=${start}`, `-dLastPage=${end}`,
      `-sOutputFile=${out}`, pdfPath
    ], { encoding: 'utf8' })

    if (fs.existsSync(out) && fs.statSync(out).size > 0) {
      chunkPaths.push(out)
      console.log(`   Chunk ${i+1}: pages ${start}-${end}`)
    } else {
      // Try pdftk
      spawnSync('pdftk', [pdfPath, 'cat', `${start}-${end}`, 'output', out], { encoding: 'utf8' })
      if (fs.existsSync(out) && fs.statSync(out).size > 0) {
        chunkPaths.push(out)
        console.log(`   Chunk ${i+1}: pages ${start}-${end} (pdftk)`)
      }
    }
  }

  if (chunkPaths.length === 0) {
    console.log('   Could not split — install ghostscript: brew install ghostscript')
    console.log('   Trying full file anyway...')
    return [pdfPath]
  }

  return chunkPaths
}

async function callClaude(pdfB64, prompt) {
  const r = await client.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 1000,
    messages: [{ role: 'user', content: [
      { type: 'document', source: { type: 'base64', media_type: 'application/pdf', data: pdfB64 } },
      { type: 'text', text: prompt }
    ]}]
  })
  return r.content.find(b => b.type === 'text')?.text || ''
}

async function run(pdfPath) {
  console.log(`\n📚 ${path.basename(pdfPath)}`)
  console.log(`   ${(fs.statSync(pdfPath).size/1024/1024).toFixed(1)} MB`)

  const chunks = splitPdf(pdfPath)
  const firstB64 = fs.readFileSync(chunks[0]).toString('base64')

  // STEP 1: Metadata
  console.log('\n⏳ Step 1/2 — Reading metadata...')
  const metaRaw = await callClaude(firstB64, `Extract bibliographic metadata from this history textbook.
Respond ONLY with valid JSON, no markdown:
{
  "title": "full title",
  "country": "country of origin",
  "grade": 7,
  "year": 2020,
  "language": "language",
  "publisher": "publisher or null",
  "author": "author or null",
  "curriculumClaim": "what history this covers e.g. World history or National history of Chile",
  "curriculumType": "world-history or national-history",
  "suggestedId": "kebab-case id e.g. mineduc-chile-8-2020",
  "notes": "framing, ideology, or context notes"
}`)
  const meta = JSON.parse(metaRaw.replace(/```json|```/g,'').trim())
  console.log(`   ✓ "${meta.title}" · ${meta.country} · Grade ${meta.grade} · ${meta.year}`)

  // STEP 2: Scan regions
  console.log('\n⏳ Step 2/2 — Scanning 13th century content...')
  let allCovered = []
  let foundSlugs = new Set()

  for (let i = 0; i < chunks.length; i++) {
    if (chunks.length > 1) process.stdout.write(`   Chunk ${i+1}/${chunks.length}... `)
    const b64 = fs.readFileSync(chunks[i]).toString('base64')
    const raw = await callClaude(b64, `Analyse this history textbook for a project about historiographical silence in 13th century world history (1200-1300 CE).

Check for coverage of: ${REGIONS.join(', ')}

RULES:
- Only content from 1200-1300 CE counts
- "present" = full section devoted to this region
- "partial" = brief mention only
- "absent" = not mentioned at all in this century

For covered/partial regions give full details. For absent just list slugs.

Respond ONLY with valid JSON, no markdown:
{
  "covered": [{"regionSlug":"slug","coverageStatus":"present or partial","pageCount":3,"topicsPresent":["topic1"],"framingNotes":"framing notes","analystNotes":"analytical observation"}],
  "absent": ["slug1","slug2"]
}`)
    const scan = JSON.parse(raw.replace(/```json|```/g,'').trim())
    for (const e of (scan.covered || [])) {
      if (!foundSlugs.has(e.regionSlug)) {
        allCovered.push(e)
        foundSlugs.add(e.regionSlug)
      }
    }
    if (chunks.length > 1) console.log(`found ${(scan.covered||[]).length} regions`)
  }

  // Cleanup temp chunks
  if (chunks[0] !== pdfPath) chunks.forEach(c => { try { fs.unlinkSync(c) } catch(e){} })

  const allAbsent = REGIONS.filter(s => !foundSlugs.has(s))
  console.log(`   ✓ ${allCovered.length} covered · ${allAbsent.length} absent`)

  // Build output
  const sourceEntry = {
    id: meta.suggestedId, title: meta.title, grade: meta.grade,
    country: meta.country, language: meta.language,
    curriculum: meta.curriculumType, curriculumClaim: meta.curriculumClaim,
    author: meta.author, publisher: meta.publisher, year: meta.year,
    pagesConsulted: null, link: null, notes: meta.notes
  }

  const curriculumEntries = {}
  for (const e of allCovered) {
    if (!curriculumEntries[e.regionSlug]) curriculumEntries[e.regionSlug] = []
    curriculumEntries[e.regionSlug].push({
      sourceId: meta.suggestedId,
      coverageStatus: e.coverageStatus,
      pageCount: e.pageCount,
      topicsPresent: e.topicsPresent,
      framingNotes: e.framingNotes,
      analystNotes: e.analystNotes
    })
  }

  const sf = `output-${meta.suggestedId}-source.json`
  const cf = `output-${meta.suggestedId}-curriculum.json`
  fs.writeFileSync(sf, JSON.stringify(sourceEntry, null, 2))
  fs.writeFileSync(cf, JSON.stringify(curriculumEntries, null, 2))

  console.log('\n' + '─'.repeat(55))
  console.log(`✅  ${meta.title}`)
  console.log('─'.repeat(55))
  console.log(`\n📄 ${sf}`)
  console.log(`📄 ${cf}`)

  if (allCovered.length) {
    console.log('\n🟢 COVERED:')
    for (const e of allCovered)
      console.log(`   ${e.coverageStatus.padEnd(8)} ${e.regionSlug} (${e.pageCount}p)`)
  }
  console.log(`\n🔴 ABSENT: ${allAbsent.length} regions`)
  console.log('\n📋 Paste source JSON into sources.json "sources" array')
  console.log('📋 Merge curriculum JSON into curriculum.json\n')
}

const pdfPath = process.argv[2]
if (!pdfPath) { console.log('\nUsage: node corpus-agent.js path/to/textbook.pdf\n'); process.exit(1) }
if (!fs.existsSync(pdfPath)) { console.error(`\n✗ Not found: ${pdfPath}\n`); process.exit(1) }
if (!process.env.ANTHROPIC_API_KEY) {
  console.error('\n✗ Set your API key first:')
  console.error('  export ANTHROPIC_API_KEY=your-key-here\n')
  process.exit(1)
}

run(pdfPath).catch(e => { console.error('\n✗', e.message); process.exit(1) })