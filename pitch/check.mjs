/*
  The mechanical half of the definition of done, per KICK-PITCH-DECK-MECHANICS.md
  Section 10. Run it with npm run check.

  These rules were all broken at least once while the deck was written, and prose
  did not catch any of them. The visual half still needs eyes on a screenshot.
*/
import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'

const DESIGN_SYSTEM = '../.claude/KICK-DESIGN-SYSTEM.md'
const BANNED = ['seamless', 'leverage', 'empower', 'solution', 'unlock', 'journey', 'revolutionis', 'ecosystem']
const WORD_LIMIT = 25
const FLOODS = 2

const failures = []
const fail = (rule, detail) => failures.push(`${rule}: ${detail}`)
const read = (p) => readFileSync(p, 'utf8')
const stripComments = (css) => css.replace(/\/\*[\s\S]*?\*\//g, '')

const SOURCE = ['.ts', '.tsx', '.css']

function everyFile(dir) {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name)
    if (statSync(path).isDirectory()) return everyFile(path)
    return SOURCE.some((ext) => path.endsWith(ext)) ? [path] : []
  })
}

const files = everyFile('src')
const slides = read('src/slides/index.tsx')
const deckCss = read('src/deck.css')
const mainTsx = read('src/main.tsx')

// Tokens are copied, so a drift means the deck and the Design System disagree.
const block = read(DESIGN_SYSTEM)
  .slice(read(DESIGN_SYSTEM).indexOf('## 9. Drop-in tokens'))
  .match(/```css\n([\s\S]*?)```/)[1]
if (!read('src/tokens.css').endsWith(block)) {
  fail('tokens', 'src/tokens.css no longer matches Design System Section 9')
}

if (stripComments(deckCss).match(/#[0-9A-Fa-f]{3,8}\b|rgba?\(/)) {
  fail('layout', 'deck.css holds a colour literal. Colour belongs in tokens.css or media.css')
}

for (const path of files.filter((p) => p.endsWith('.css'))) {
  for (const query of stripComments(read(path)).match(/@media[^{]*/g) ?? []) {
    if (!query.includes('prefers-reduced-motion')) {
      fail('responsive', `${path} has a media query: ${query.trim()}`)
    }
  }
}

// Vendor CSS must load first, or reveal.css overrides our background and colour.
const revealAt = mainTsx.indexOf("'reveal.js/dist/reveal.css'")
const oursAt = mainTsx.indexOf("'./tokens.css'")
if (revealAt === -1 || oursAt === -1 || revealAt > oursAt) {
  fail('css order', 'main.tsx must import reveal.css before our own stylesheets')
}

if (!/#root\{[^}]*height/.test(stripComments(deckCss).replace(/\s/g, ''))) {
  fail('sizing', 'deck.css must give #root a height, or Reveal clamps to minScale')
}
if (!/\.reveal-viewport/.test(deckCss)) {
  fail('sizing', 'deck.css must restate the background on .reveal-viewport')
}

for (const path of files) {
  const body = read(path)
  if (body.includes('—')) fail('prose', `${path} holds an em dash`)
  if (body.includes('§')) fail('prose', `${path} holds a section symbol`)
  for (const word of BANNED) {
    if (new RegExp(word, 'i').test(body)) fail('voice', `${path} holds a banned word: ${word}`)
  }
  if (/['"]\.\.\/\.\.\//.test(body)) {
    fail('assets', `${path} imports from outside pitch/. Copy the file in instead`)
  }
}

// Nothing may position against a scaled element in pixels.
if (/left:\s*\d+\s*\*/.test(read('src/mock/index.tsx'))) {
  fail('mock', 'src/mock/index.tsx positions in pixels. Use a percentage')
}

const each = slides.split('export function ').slice(1)
let floods = 0

for (const part of each) {
  const name = part.slice(0, part.indexOf('('))

  if (!part.includes('notes=')) fail('notes', `${name} has no speaker notes`)

  if (part.includes('<Halftone') || part.includes('<Flood')) floods++

  // Section 5 of the Brand Identity: loud devices do not stack.
  const loud = ['<Macroblock', '<Sticker'].filter((d) => part.includes(d))
  if (loud.length > 1) fail('devices', `${name} stacks loud devices: ${loud.join(' and ')}`)

  for (const frame of part.match(/<Frame[^>]*>/g) ?? []) {
    if (!frame.includes('tag=')) fail('mock', `${name} has a frame with no tag`)
  }

  const visible = part
    .replace(/notes=\{[\s\S]*?\}\n/, '')
    .replace(/notes="[^"]*"/g, '')
    .replace(/\{[^{}]*\}/g, ' ')
    .replace(/<[^>]*>/g, ' ')
  const words = visible.split(/\s+/).filter((w) => /[A-Za-z0-9]/.test(w))
  if (words.length > WORD_LIMIT) {
    fail('copy', `${name} shows ${words.length} words, over the ${WORD_LIMIT} limit`)
  }
}

if (floods !== FLOODS) {
  fail('devices', `the deck has ${floods} flood surfaces. It gets ${FLOODS}: the open and the close`)
}

if (failures.length === 0) {
  console.log(`check: pass. ${each.length} slides, ${files.length} files.`)
  console.log('Now look at it. Screenshot every slide at 16:9, at 16:10 and wider.')
} else {
  console.error(`check: ${failures.length} failed\n`)
  for (const line of failures) console.error(`  ${line}`)
  process.exit(1)
}
