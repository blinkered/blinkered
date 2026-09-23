import { describe, expect, it } from 'vitest'
import { configFor } from '@blinkered/engine'
import { LOCALES, messagesFor } from '@blinkered/i18n'
import { holdFor } from '../src/Tutorial.js'
import { boardFor, stepsFor } from '../src/tutorialScript.js'
import type { Step } from '../src/tutorialScript.js'

/**
 * How long the tour holds each frame.
 *
 * Reading time used to be charged to the frame a caption changed on, and on the words screen that
 * frame is also one that turns a tile over. So the first tile of a sentence sat there for three
 * and a half seconds and the two after it went by in nine hundred milliseconds each -- three
 * tiles arriving at three different speeds while the caption said tiles keep turning. Nick:
 * "What's up with the very long, dramatic pauses on slide 2? The timing between reveals is very
 * inconsistent."
 *
 * The fix is one line of arithmetic and easy to lose, so what it produced is asserted here rather
 * than described in a comment: a sentence's frames hold for the same length as each other.
 */

function tourFor(tag: string): Step[] {
  const n = boardFor(tag).tiles.length
  return stepsFor(messagesFor(tag), tag, configFor('easy', { n, language: tag }))
}

/** Consecutive frames showing one caption, as [index, hold] pairs. */
function sentences(step: Step): { caption: string; holds: number[] }[] {
  const runs: { caption: string; holds: number[] }[] = []
  step.frames.forEach((frame, at) => {
    const last = runs.at(-1)
    const hold = holdFor(step.frames, at)
    if (last !== undefined && last.caption === frame.caption) last.holds.push(hold)
    else runs.push({ caption: frame.caption, holds: [hold] })
  })
  return runs
}

describe('the pace of a screen', () => {
  it('holds every frame of a sentence for the same length', () => {
    for (const { tag } of LOCALES) {
      for (const step of tourFor(tag)) {
        for (const run of sentences(step)) {
          // The frame that pays a word is the one exception, and it is the last of its sentence:
          // two badges have to finish arriving, which takes longer than anything being read.
          const beats = new Set(
            run.holds.slice(0, step.frames.some((f) => f.gain) ? -1 : undefined),
          )
          expect(beats.size, `${tag} / ${step.title} / ${run.caption.slice(0, 24)}`).toBeLessThan(2)
        }
      }
    }
  })

  it('gives the words screen one pace per sentence rather than a pause and a scramble', () => {
    // The screen Nick was watching, in the language he was watching it in.
    const words = tourFor('en')[2] as Step
    const runs = sentences(words)
    expect(runs.map((run) => run.holds)).toEqual([
      [900, 900, 900, 900],
      [1150, 1150, 1150],
      [1950, 1950],
      [900, 900, 900, 900],
      [1170, 1800],
      // The used letters going face down, which is one frame and a whole sentence to read.
      [4620],
    ])
  })

  it('leaves a screen that says one thing at the pace of the thing it says', () => {
    // The board screen deals at `DEAL_MS` throughout and always did: one caption for the whole
    // loop, so the loop is the reading time and dividing it would slow down the one screen whose
    // subject is how fast the game deals.
    const board = tourFor('en')[1] as Step
    expect(new Set(sentences(board)[0]?.holds)).toEqual(new Set([520]))
  })
})
