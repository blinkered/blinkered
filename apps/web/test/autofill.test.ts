import { readFileSync, readdirSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { ignoredByManagers, notACredential } from '../src/autofill.js'

/**
 * One rule about every control in the app, checked over the source.
 *
 * **Every `<input>`, `<textarea>` and `<select>` carries the password-manager opt-out except the
 * address on the email sign-in flow.** That is the whole rule, and it is checked structurally for
 * the reason the i18n suite checks its locales that way: a type cannot express it, and the
 * alternative is trusting that whoever adds the next field remembers.
 *
 * It is a source scan rather than a rendered-DOM test because there is no renderer here -- the web
 * app has no component tests, which STATUS.md item 1 records. A scan is the cheap half that would
 * otherwise not exist, and it catches the thing that actually goes wrong: somebody adds a field
 * and does not know the rule.
 */

const SOURCE = fileURLToPath(new URL('../src', import.meta.url))

/**
 * The one field a password manager should speak up on.
 *
 * Named by file and by the attribute that makes it what it is, so that moving it does not quietly
 * widen the exception to whatever ends up on that line.
 */
const ALLOWED = { file: 'SignInDialog.tsx', marker: 'autoComplete="email"' }

interface Control {
  readonly file: string
  readonly line: number
  readonly tag: string
  readonly attributes: string
}

/**
 * Every control in the source, with the text of its opening tag.
 *
 * Read line by line and accumulated to the end of the opening tag, because the attributes are
 * spread over several lines and prettier decides how many.
 */
function controls(): readonly Control[] {
  const found: Control[] = []
  for (const file of readdirSync(SOURCE).filter((name) => name.endsWith('.tsx'))) {
    const lines = readFileSync(`${SOURCE}/${file}`, 'utf8').split('\n')
    lines.forEach((line, at) => {
      const opened = /<(input|textarea|select)\b/.exec(line)
      if (opened === null) return
      let attributes = ''
      for (let cursor = at; cursor < Math.min(at + 40, lines.length); cursor += 1) {
        const text = lines[cursor] as string
        attributes += `${text}\n`
        if (cursor > at && /\/>|^\s*>/.test(text)) break
        if (cursor === at && /\/>|>\s*$/.test(text)) break
      }
      found.push({ file, line: at + 1, tag: opened[1] as string, attributes })
    })
  }
  return found
}

describe('every field in the app', () => {
  const all = controls()

  it('finds the controls at all, so a silent zero cannot pass this suite', () => {
    // The failure mode of a source scan is matching nothing and reporting success.
    expect(all.length).toBeGreaterThan(15)
    expect(new Set(all.map((one) => one.tag))).toEqual(new Set(['input', 'textarea', 'select']))
  })

  it('tells password managers to leave it alone, with exactly one exception', () => {
    const without = all.filter((one) => !/ignoredByManagers|notACredential/.test(one.attributes))
    // Reported by name, because the useful failure names the field somebody just added.
    expect(without.map((one) => `${one.file}:${String(one.line)} <${one.tag}>`)).toEqual([
      `${ALLOWED.file}:${String(without[0]?.line ?? 0)} <input>`,
    ])
    // And it is the address, rather than whatever else may have moved onto that line.
    expect(without[0]?.attributes).toContain(ALLOWED.marker)
  })

  it('never says `username` about a field that is not one', () => {
    /*
     * The bug this whole module exists for.
     *
     * The profile rename field said `autoComplete="username"`, which is not a description of a
     * display handle -- it is the hint meaning "the username of a login form". LastPass read it
     * as written and offered an email address on a field nobody had focused.
     */
    for (const one of all) {
      expect(one.attributes, `${one.file}:${String(one.line)}`).not.toContain(
        'autoComplete="username"',
      )
      expect(one.attributes, `${one.file}:${String(one.line)}`).not.toContain(
        'autoComplete="current-password"',
      )
      expect(one.attributes, `${one.file}:${String(one.line)}`).not.toContain(
        'autoComplete="new-password"',
      )
    }
  })
})

describe('what the opt-out is', () => {
  it('names all four vendors, because a person has one and we do not know which', () => {
    expect(ignoredByManagers).toEqual({
      'data-lpignore': 'true',
      'data-1p-ignore': '',
      'data-bwignore': 'true',
      'data-form-type': 'other',
    })
  })

  it('turns autofill off by default, and takes a truthful token when there is one', () => {
    expect(notACredential().autoComplete).toBe('off')
    // `nickname` is a real autofill token and is what a public handle actually is.
    expect(notACredential('nickname').autoComplete).toBe('nickname')
    expect(notACredential('nickname')).toMatchObject(ignoredByManagers)
  })
})
