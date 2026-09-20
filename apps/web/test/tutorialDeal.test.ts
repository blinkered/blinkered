import { describe, expect, it } from 'vitest'
import { configFor } from '@blinkered/engine'
import { TUTORIAL_BOARDS } from '@blinkered/words'
import { LOCALES, messagesFor } from '@blinkered/i18n'
import { FACE_DOWN, boardFor, stepsFor } from '../src/tutorialScript.js'
import type { Step } from '../src/tutorialScript.js'

/**
 * The order the tour turns tiles over in.
 *
 * The tour is where a player learns what the board does, and for a while it taught the wrong
 * thing: tiles arrived left to right while the caption beside them said "in no fixed order", and
 * the game itself picks its next tile at random from whatever is still face down. Nick, watching
 * it: "The animations show everything revealing in reading order. Fix this so that people aren't
 * surprised when the game starts playing."
 *
 * So these are the two halves of that. The deal has to scatter, and it has to keep the one piece
 * of order the rest of the script depends on -- the three tiles that spell the short word.
 */

function up(step: Step, frame: number): number[] {
  const faces = [...(step.frames[frame]?.up ?? '')]
  return faces.flatMap((face, at) => (face === FACE_DOWN ? [] : [at]))
}

/** The tile each frame turned over, in the order the tour turned them. */
function turnOrder(step: Step): number[] {
  const order: number[] = []
  for (let frame = 1; frame < step.frames.length; frame += 1) {
    const before = new Set(up(step, frame - 1))
    order.push(...up(step, frame).filter((at) => !before.has(at)))
  }
  return order
}

function tourFor(language: string): Step[] {
  const n = boardFor(language).tiles.length
  return stepsFor(messagesFor(language), language, configFor('easy', { n, language }))
}

describe('the board screen', () => {
  const [board] = tourFor('en')

  it('turns one tile at a time until the board is up', () => {
    const steps = board as Step
    expect(up(steps, 0)).toEqual([])
    expect(turnOrder(steps)).toHaveLength(steps.tiles.length)
    expect([...turnOrder(steps)].sort((a, b) => a - b)).toEqual(steps.tiles.map((_, at) => at))
  })

  it('does not turn them in reading order', () => {
    // The whole point. Reading order is the one order the game never deals in.
    const order = turnOrder(board as Step)
    expect(order).not.toEqual(order.map((_, at) => at))
    expect(order).toEqual([0, 4, 2, 1, 5, 3])
  })
})

describe('the words screen', () => {
  it('opens on the three tiles that spell the short word, then scatters the rest', () => {
    /*
     * The one ordering the scatter must not touch: the screen spells the short word off tiles
     * 0, 1 and 2, which `tutorialBoard.test.ts` holds every board to. Scattering those as well
     * would have the tour tapping tiles that are still face down.
     */
    for (const language of Object.keys(TUTORIAL_BOARDS)) {
      const words = tourFor(language)[1] as Step
      expect(up(words, 0), language).toEqual([0, 1, 2])
      const rest = turnOrder(words)
      expect(
        [...rest].sort((a, b) => a - b),
        language,
      ).toEqual(words.tiles.map((_, at) => at).slice(3))
      expect(rest, language).not.toEqual([...rest].sort((a, b) => a - b))
    }
  })

  it('has the whole board up by the time a word is completed', () => {
    const words = tourFor('en')[1] as Step
    const pressed = words.frames.findIndex((frame) => frame.pressing === true)
    expect(pressed).toBeGreaterThan(0)
    expect(up(words, pressed)).toHaveLength(words.tiles.length)
  })
})

describe('the hiding screen', () => {
  it('captions every frame with the tour text, which says nothing about the timer', () => {
    for (const { tag, messages } of LOCALES) {
      const step = tourFor(tag).find((one) => one.title === messages.htHideTitle)
      expect(step, tag).toBeDefined()
      for (const frame of step?.frames ?? []) expect(frame.caption, tag).toBe(messages.tutHideBody)
    }
  })
})
