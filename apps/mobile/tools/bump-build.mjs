import { readFileSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

/**
 * The next build number, because App Store Connect will not take the same one twice.
 *
 * A rejected upload costs an archive, which is several minutes, and the rejection arrives after
 * all of them. `CURRENT_PROJECT_VERSION` is the number in question -- Xcode shows it as Build,
 * beside the Version, which is `MARKETING_VERSION` and means something to people rather than to
 * the store. Only this one has to move.
 *
 * Written rather than left to `agvtool`, which does the same job and wants
 * `VERSIONING_SYSTEM = apple-generic` set on every configuration first. That is a change to the
 * project to gain a tool that edits the project, and this file is smaller than the change.
 *
 * Both configurations are bumped together and are asserted to agree beforehand: a debug build
 * numbered differently from a release build is a build number that says nothing.
 */
const PROJECT = fileURLToPath(new URL('../ios/App/App.xcodeproj/project.pbxproj', import.meta.url))
const SETTING = /CURRENT_PROJECT_VERSION = (\d+);/g

const before = readFileSync(PROJECT, 'utf8')
const found = [...before.matchAll(SETTING)].map((match) => Number(match[1]))

if (found.length === 0) {
  console.error('no CURRENT_PROJECT_VERSION in the project; nothing to bump')
  process.exit(1)
}
if (new Set(found).size !== 1) {
  console.error(`the configurations disagree: ${found.join(', ')}. Set them to one number first.`)
  process.exit(1)
}

const next = (found[0] ?? 0) + 1
writeFileSync(PROJECT, before.replaceAll(SETTING, `CURRENT_PROJECT_VERSION = ${String(next)};`))
console.log(`build ${String(found[0])} -> ${String(next)} (${String(found.length)} configurations)`)
