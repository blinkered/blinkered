import { describe, expect, it, vi } from 'vitest'
import { configFor, isCanonical } from '@blinkered/engine'
import {
  CUSTOM_RULES,
  DIFFICULTY_NAMES,
  configOf,
  defaultSettings,
  hasCustomRules,
  loadSettings,
  offeredRulesets,
  rulesetOf,
  withNerdMode,
  withOverride,
  withRuleset,
} from '../src/settings.js'
import type { Settings } from '../src/settings.js'

/**
 * Nerd mode, the custom ruleset, and what a game is judged against.
 *
 * Three facts were tangled here and it cost a leaderboard place. `nerdMode` shows the panel,
 * `custom` says the forked rules are the ones in play, and `overrides` is the fork itself, kept
 * so that going back to a preset does not throw away numbers somebody typed. The trap was that
 * turning the panel off left `custom` alone: the checkbox read as off, the panel was gone, and
 * the game was still being played on the fork, marked not canonical and refused a place on a
 * board with nothing on screen to say why.
 *
 * Nick found it from the other end: "nerd mode remains shown as an option in the difficulty
 * levels... in many cases, the game I play is marked as not canonical and not leaderboard
 * eligible. I think (a) and (b) are related." They were the same fact.
 */

/** Somebody who opened nerd mode on insane and nudged one number. */
function forked(): Settings {
  const base = withNerdMode(defaultSettings(), true)
  return withOverride(withRuleset(base, 'insane'), { hideChance: 0.4 })
}

describe('turning the nerd panel off', () => {
  it('stops playing the forked rules, rather than only hiding them', () => {
    const playing = forked()
    expect(playing.custom).toBe(true)
    expect(configOf(playing).hideChance).toBe(0.4)

    const off = withNerdMode(playing, false)
    expect(off.nerdMode).toBe(false)
    // The rules in play are the preset's again, which is what the checkbox appears to say.
    expect(off.custom).toBe(false)
    expect(configOf(off)).toEqual(configFor('insane', { language: off.gameLanguage }))
    expect(isCanonical(configOf(off), off.difficulty)).toBe(true)
  })

  it('keeps the numbers, so turning it back on does not lose them', () => {
    // Which is the whole reason `overrides` outlives `custom`: retyping a ruleset because a
    // checkbox was toggled would be its own small insult.
    const off = withNerdMode(forked(), false)
    expect(off.overrides).toEqual({ hideChance: 0.4 })

    const again = withRuleset(withNerdMode(off, true), CUSTOM_RULES)
    expect(configOf(again).hideChance).toBe(0.4)
  })
})

describe('which rulesets are offered', () => {
  it('offers the four presets and nothing else while the panel is closed', () => {
    /*
     * The fifth chip used to appear whenever a fork was *stored*, panel open or shut, which is
     * how a player who had finished with nerd mode was still offered it. Worse, pressing it put
     * them back on the fork with no panel visible to explain the rules they were now playing.
     */
    const off = withNerdMode(forked(), false)
    expect(hasCustomRules(off)).toBe(true)
    expect(offeredRulesets(off)).toEqual(DIFFICULTY_NAMES)
  })

  it('offers it while the panel is open and the rules really differ', () => {
    const open = forked()
    expect(offeredRulesets(open)).toEqual([...DIFFICULTY_NAMES, CUSTOM_RULES])
    expect(rulesetOf(open)).toBe(CUSTOM_RULES)
  })

  it('does not offer it for a fork that matches the preset anyway', () => {
    // Nerd mode writes a field the moment it is touched, so nudging a number and putting it back
    // must not leave a chip offering a ruleset identical to the one beside it.
    const same = withOverride(withNerdMode(defaultSettings(), true), {
      hideChance: configFor(defaultSettings().difficulty).hideChance,
    })
    expect(hasCustomRules(same)).toBe(false)
    expect(offeredRulesets(same)).toEqual(DIFFICULTY_NAMES)
  })

  it('always lights a chip that is actually on offer', () => {
    // The pairing that matters: `rulesetOf` says which chip is lit and `offeredRulesets` says
    // which exist, and a lit chip that is not offered is a setup screen with nothing selected.
    for (const settings of [defaultSettings(), forked(), withNerdMode(forked(), false)]) {
      expect(offeredRulesets(settings)).toContain(rulesetOf(settings))
    }
  })
})

describe('settings restored from a browser that stored the bad state', () => {
  it('will not put a fork in play with the panel shut', () => {
    /*
     * The repair, and it is needed rather than tidy: this app could reach the bad state and then
     * save it, so a browser holding `custom` with the panel shut would restore a forked ruleset on
     * every load until somebody opened nerd mode and closed it again.
     */
    const stored = {
      difficulty: 'insane',
      custom: true,
      nerdMode: false,
      overrides: { hideChance: 0.4 },
      gameLanguage: 'en',
      uiLanguage: 'en',
    }
    vi.stubGlobal('localStorage', {
      getItem: () => JSON.stringify(stored),
      setItem: () => undefined,
      removeItem: () => undefined,
    })
    const settings = loadSettings()
    expect(settings.custom).toBe(false)
    // The numbers survive, so opening the panel gets them back.
    expect(settings.overrides).toEqual({ hideChance: 0.4 })
    expect(isCanonical(configOf(settings), 'insane')).toBe(true)
    vi.unstubAllGlobals()
  })

  it('still restores a fork that was in play with the panel open', () => {
    vi.stubGlobal('localStorage', {
      getItem: () =>
        JSON.stringify({
          difficulty: 'insane',
          custom: true,
          nerdMode: true,
          overrides: { hideChance: 0.4 },
          gameLanguage: 'en',
          uiLanguage: 'en',
        }),
      setItem: () => undefined,
      removeItem: () => undefined,
    })
    const settings = loadSettings()
    expect(settings.custom).toBe(true)
    expect(configOf(settings).hideChance).toBe(0.4)
    vi.unstubAllGlobals()
  })
})

describe('a game played after all that', () => {
  it('is canonical once the panel is shut, whatever was typed into it', () => {
    const off = withNerdMode(forked(), false)
    for (const difficulty of DIFFICULTY_NAMES) {
      const back = withRuleset(off, difficulty)
      expect(isCanonical(configOf(back), difficulty), difficulty).toBe(true)
    }
  })
})
