import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { THEMES } from '../src/settings.js'

/**
 * The arithmetic behind three palettes, which a comment in a stylesheet cannot do.
 *
 * Nick asked for a lighter theme and a high-contrast one, and to think about accessibility. The
 * thinking is here: every pairing the interface actually draws is measured against the floor WCAG
 * sets for it, and a colour cannot be changed into a failing one without this file saying so.
 *
 * A source scan rather than a rendered page, for the same reason `autofill.test.ts` is one: there
 * is no renderer in these tests. What it reads is the three token blocks at the top of
 * `styles.css`, which is also a check worth having on its own -- a theme that forgot a token would
 * inherit the traditional one's value and look almost right.
 */

const CSS = readFileSync(fileURLToPath(new URL('../src/styles.css', import.meta.url)), 'utf8')

/** The tokens every theme has to define, because every one of them is drawn on another. */
const TOKENS = [
  'bg',
  'panel',
  'line',
  'ink',
  'dim',
  'up',
  'sel',
  'on-sel',
  'good',
  'bad',
  'wild',
  'face',
  'face-down',
] as const

type Token = (typeof TOKENS)[number]

/**
 * What is drawn on what, and what each pairing has to clear.
 *
 * 4.5:1 is AA for text at the sizes this interface uses -- none of it is large by WCAG's
 * definition, which starts at 18.66px bold. 3:1 is 1.4.11 for the borders and rings that identify
 * a control, and the border is load-bearing in the light theme, where a white card on a near-white
 * page is 1.06:1 and could not be seen without one.
 */
const PAIRINGS: readonly { fg: Token; bg: Token; floor: number; what: string }[] = [
  { fg: 'ink', bg: 'bg', floor: 4.5, what: 'body text' },
  { fg: 'ink', bg: 'panel', floor: 4.5, what: 'text on a card' },
  { fg: 'dim', bg: 'bg', floor: 4.5, what: 'a caption or a label' },
  { fg: 'dim', bg: 'panel', floor: 4.5, what: 'a label on a card' },
  { fg: 'up', bg: 'face', floor: 4.5, what: 'a letter on an exposed tile' },
  { fg: 'good', bg: 'bg', floor: 4.5, what: 'an accepted word' },
  { fg: 'good', bg: 'panel', floor: 4.5, what: 'an accepted word on a card' },
  { fg: 'bad', bg: 'bg', floor: 4.5, what: 'a refusal' },
  { fg: 'bad', bg: 'panel', floor: 4.5, what: 'a refusal on a card' },
  { fg: 'wild', bg: 'bg', floor: 4.5, what: 'the wild card, drawn at eight pixels in the rail' },
  { fg: 'wild', bg: 'panel', floor: 4.5, what: 'the wild card on a card' },
  { fg: 'on-sel', bg: 'sel', floor: 4.5, what: 'the label on a primary button' },
  { fg: 'sel', bg: 'bg', floor: 3, what: 'a focus ring and a selected edge' },
  { fg: 'line', bg: 'bg', floor: 3, what: 'the border that identifies a control' },
  { fg: 'line', bg: 'panel', floor: 3, what: 'a border on a card' },
  { fg: 'line', bg: 'face-down', floor: 3, what: 'the edge of a tile still hiding' },
]

/**
 * The selector each palette lives behind. The traditional one is `:root`, because it is the
 * default and not a choice: a page with no `data-theme` at all has to be the game as it was.
 */
function selectorFor(theme: string): string {
  return theme === 'traditional' ? ':root {' : `:root[data-theme='${theme}'] {`
}

function palette(theme: string): Record<string, string> {
  const at = CSS.indexOf(selectorFor(theme))
  expect(at, `no block for the ${theme} theme`).toBeGreaterThanOrEqual(0)
  const block = CSS.slice(at, CSS.indexOf('}', at))
  const found: Record<string, string> = {}
  for (const [, name, value] of block.matchAll(/--([a-z-]+):\s*(#[0-9a-fA-F]{3,8});/g)) {
    found[String(name)] = String(value)
  }
  return found
}

/** Relative luminance, per WCAG 2.1. */
function luminance(colour: string): number {
  const hex = colour.replace('#', '')
  const full = hex.length === 3 ? [...hex].map((c) => c + c).join('') : hex
  const channels = [0, 2, 4].map((at) => Number.parseInt(full.slice(at, at + 2), 16) / 255)
  const linear = channels.map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4))
  return 0.2126 * (linear[0] ?? 0) + 0.7152 * (linear[1] ?? 0) + 0.0722 * (linear[2] ?? 0)
}

function contrast(one: string, other: string): number {
  const [hi, lo] = [luminance(one), luminance(other)].sort((a, b) => b - a)
  return ((hi ?? 0) + 0.05) / ((lo ?? 0) + 0.05)
}

describe('the three palettes', () => {
  it('has one block per theme, and no theme the settings do not offer', () => {
    expect([...THEMES]).toEqual(['traditional', 'light', 'contrast'])
    for (const theme of THEMES) expect(Object.keys(palette(theme)).length).toBeGreaterThan(0)
  })

  for (const theme of THEMES) {
    describe(theme, () => {
      it('defines every token, rather than inheriting one by accident', () => {
        // A missing token falls back to the traditional value, which in the light theme means a
        // near-black surface under near-black text and nothing in the stylesheet to say why.
        const found = palette(theme)
        expect(TOKENS.filter((token) => found[token] === undefined)).toEqual([])
      })

      it('clears the contrast floor for everything it draws', () => {
        const found = palette(theme)
        const failures = PAIRINGS.map(({ fg, bg, floor, what }) => {
          const ratio = contrast(String(found[fg]), String(found[bg]))
          return { what: `${fg} on ${bg} (${what})`, ratio: Number(ratio.toFixed(2)), floor }
        }).filter((row) => row.ratio < row.floor)
        expect(failures).toEqual([])
      })
    })
  }

  /**
   * The traditional theme used to be exempt from two of these, and is not any more.
   *
   * It missed on white over the accent, 3.75:1 where AA wants 4.5, and on its borders, 1.46:1
   * where 1.4.11 wants 3 -- both kept on the grounds that it is the game as it has always looked.
   * Nick asked for them fixed, so the accent went a shade deeper and the border a shade lighter,
   * and the loop above now holds all three themes to everything.
   *
   * This test is what remains of the exemption: an explicit assertion that there is none. It
   * would have been easy to leave the skip in place and never notice it again.
   */
  it('has no theme left with an exemption', () => {
    for (const theme of THEMES) {
      const found = palette(theme)
      const missing = PAIRINGS.filter(
        ({ fg, bg, floor }) => contrast(String(found[fg]), String(found[bg])) < floor,
      ).map(({ fg, bg }) => `${theme}: ${fg} on ${bg}`)
      expect(missing).toEqual([])
    }
  })
})
