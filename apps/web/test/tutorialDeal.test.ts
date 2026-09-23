import { describe, expect, it } from 'vitest'
import { configFor, flipReward } from '@blinkered/engine'
import { TUTORIAL_BOARDS } from '@blinkered/words'
import { LOCALES, messagesFor } from '@blinkered/i18n'
import {
  FACE_DOWN,
  FACE_SPENT,
  boardFor,
  showsTicks,
  stepsFor,
  ticksAt,
} from '../src/tutorialScript.js'
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

/** The first screen's deal: the frames up to the whole board being face up. */
function dealOf(step: Step): Step {
  const done = step.frames.findIndex((frame) => !frame.up.includes(FACE_DOWN))
  return { ...step, frames: step.frames.slice(0, done + 1) }
}

describe('the deal, on the first screen', () => {
  const board = dealOf(tourFor('en')[0] as Step)

  it('turns one tile at a time until the board is up', () => {
    const steps = board
    expect(up(steps, 0)).toEqual([])
    expect(turnOrder(steps)).toHaveLength(steps.tiles.length)
    expect([...turnOrder(steps)].sort((a, b) => a - b)).toEqual(steps.tiles.map((_, at) => at))
  })

  it('does not turn them in reading order', () => {
    // The whole point. Reading order is the one order the game never deals in.
    const order = turnOrder(board)
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

describe('the letters-that-change screen', () => {
  it('hides with the tour text, which says nothing about the timer, then swaps over the board', () => {
    for (const { tag, messages } of LOCALES) {
      const step = tourFor(tag).find((one) => one.title === messages.tutChangeTitle)
      expect(step, tag).toBeDefined()
      const frames = step?.frames ?? []
      const swap = frames.at(-1)
      for (const frame of frames.slice(0, -1)) {
        expect(frame.caption, tag).toBe(messages.tutHideBody)
        expect(frame.swap, tag).toBeUndefined()
      }
      expect(swap?.caption, tag).toBe(messages.htSwapBody)
      expect(swap?.swap, tag).toBe(true)
      // The board under the cover already holds the new letter, so it is there when it lifts.
      const { from, to } = boardFor(tag).swap
      const tiles = boardFor(tag).tiles
      expect(swap?.tiles?.[tiles.indexOf(from)], tag).toBe(to)
    }
  })
})

describe('the tour', () => {
  it('is five screens: the goal, words, wild cards, letters that change, and the account', () => {
    for (const { tag, messages } of LOCALES) {
      expect(
        tourFor(tag).map((step) => step.title),
        tag,
      ).toEqual([
        messages.tutGoalTitle,
        messages.htWordsTitle,
        messages.htWildTitle,
        messages.tutChangeTitle,
        messages.tutAccountTitle,
      ])
    }
  })
})

describe('the goal screen', () => {
  it('comes first, and runs the flips down a tile at a time before a word buys some back', () => {
    for (const { tag, messages } of LOCALES) {
      const [goal] = tourFor(tag)
      const n = boardFor(tag).tiles.length
      const config = configFor('easy', { n, language: tag })
      expect(goal?.title, tag).toBe(messages.tutGoalTitle)
      const frames = goal?.frames ?? []
      const flips = frames.map((frame) => frame.flips)
      expect(flips[0], tag).toBe(config.initialFlips)
      // One flip for each tile that turns, and nothing for spelling.
      for (let at = 1; at < frames.length - 1; at += 1) {
        const turned = up(goal as Step, at).length - up(goal as Step, at - 1).length
        expect((flips[at - 1] ?? 0) - (flips[at] ?? 0), `${tag} frame ${String(at)}`).toBe(turned)
      }
      const paid = frames.at(-1)
      const word = paid?.sel.length ?? 0
      expect(paid?.gain?.flips, tag).toBe(flipReward(word, config))
      expect(paid?.flips, tag).toBe(config.initialFlips - n + flipReward(word, config))
    }
  })
})

describe('the words screen, after Complete', () => {
  it('spends the letters the word used', () => {
    const words = tourFor('en')[1] as Step
    const pressed = words.frames.find((frame) => frame.pressing === true)
    const last = words.frames.at(-1)
    expect(last?.caption).toBe(messagesFor('en').tutSpentBody)
    const spent = [...(last?.up ?? '')].flatMap((face, at) => (face === FACE_SPENT ? [at] : []))
    expect(spent).toEqual([...(pressed?.sel ?? [])].sort((a, b) => a - b))
  })
})

describe('the tick bar', () => {
  const tour = tourFor('en')
  const en = messagesFor('en')
  const total = 11

  it('is over every board that turns tiles, and no other', () => {
    const shown = tour.filter(showsTicks).map((step) => step.title)
    expect(shown).toEqual([en.tutGoalTitle, en.htWordsTitle, en.tutChangeTitle])
  })

  it('spends a tick for every tile that turns', () => {
    const board = dealOf(tour[0] as Step)
    board.frames.forEach((_, at) => {
      expect(ticksAt(board, at, total).remaining).toBe(total - at)
    })
  })

  it('hands a tick back for a letter that hides, above the lowest the bar has been', () => {
    const hide = tour.find((step) => step.title === en.tutChangeTitle) as Step
    const before = ticksAt(hide, 0, total)
    const away = ticksAt(hide, 2, total)
    expect(away.floor).toBe(before.remaining)
    expect(away.remaining).toBe(before.remaining + 2)
  })
})
