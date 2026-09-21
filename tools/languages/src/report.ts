import { cite } from './update.js'
import type { Outcome, Plan, Verdict } from './update.js'

/** How each verdict reads in the table, and the order the table groups them in. */
const ORDER: readonly Verdict[] = [
  'lost',
  'failing',
  'added',
  'updated',
  'unchanged',
  'unusable',
  'absent',
]

const LABEL: Record<Verdict, string> = {
  lost: 'LOST',
  failing: 'FAILING',
  added: 'added',
  updated: 'updated',
  unchanged: 'unchanged',
  unusable: 'unusable',
  absent: 'absent',
}

const HEADING: Record<Verdict, string> = {
  lost: 'Regressions: a list this repository has, and upstream no longer does',
  failing: 'Regressions: a list that used to deal a playable board and no longer does',
  added: 'Newly playable',
  updated: 'Updated',
  unchanged: 'Already current',
  unusable: 'Built upstream, not playable yet',
  absent: 'Nothing to borrow yet',
}

function pad(text: string, width: number): string {
  return text.length >= width ? text : text + ' '.repeat(width - text.length)
}

function line(outcome: Outcome): string {
  const { floor } = outcome
  const words =
    floor === undefined
      ? ''
      : `wMin ${String(floor.wMin)}, boards ${floor.draws.map((draw) => String(draw.words)).join('/')}`
  const detail = outcome.note ?? words
  return `  ${pad(outcome.tag, 6)}${pad(outcome.endonym, 20)}${detail}`
}

/** The whole run, for the operator who has to decide whether to let it write. */
export function report(plan: Plan): string {
  const out: string[] = []
  for (const verdict of ORDER) {
    const group = plan.outcomes.filter((outcome) => outcome.verdict === verdict)
    if (group.length === 0) continue
    out.push('', `${HEADING[verdict]} (${String(group.length)})`)
    for (const outcome of group) out.push(line(outcome))
  }

  if (plan.blocked.length > 0) {
    out.push(
      '',
      'REFUSING TO WRITE.',
      '',
      'Each of these is a language this repository can play today and could not play after',
      'this run. Disabling one is an edit only you can make, so nothing has been written.',
      '',
      ...plan.blocked.map(
        (outcome) => `  ${pad(outcome.tag, 6)}${LABEL[outcome.verdict]}  ${outcome.note ?? ''}`,
      ),
      '',
      'If that is right, approve them by name and run it again:',
      '',
      `  pnpm languages update --approve ${plan.blocked.map((outcome) => outcome.tag).join(',')}`,
      '',
      'Approving removes the language from the offered list and deletes its directory. Anybody',
      'with a game running in it keeps the board they were dealt and cannot start another.',
    )
  }
  return out.join('\n')
}

/**
 * The commit message for a run that wrote something.
 *
 * Every borrowed file names the commit it came from, because that is the only thing that makes
 * this copy checkable: somebody who doubts a word can follow the sha to the evidence that
 * earned it. A borrow recorded without its commit is a list with no provenance at all.
 */
export function commitMessage(plan: Plan, when: Date): string {
  const moved = plan.outcomes.filter(
    (outcome) => outcome.verdict === 'added' || outcome.verdict === 'updated',
  )
  const gone = plan.regressions
  const subject =
    moved.length > 0 && gone.length === 0
      ? `Borrow ${String(moved.length)} word list${moved.length === 1 ? '' : 's'} from the language repositories`
      : moved.length > 0
        ? 'Borrow the current word lists, and let go of the ones that stopped working'
        : 'Let go of the word lists that stopped working'

  const body: string[] = [
    subject,
    '',
    'Each list here is a copy of what its own repository publishes. That repository is where',
    'it is built, measured and argued about; this one only plays it. The commit beside each',
    'language is the one these bytes came from, so a word can be followed back to the evidence',
    'that earned it.',
  ]

  if (moved.length > 0) {
    body.push('')
    for (const outcome of moved) {
      body.push(`  ${pad(outcome.tag, 6)}${outcome.verdict === 'added' ? 'added  ' : 'updated'}  ${cite(outcome)}`)
    }
  }

  if (gone.length > 0) {
    body.push(
      '',
      'Removed, with the operator approving each one:',
      '',
      ...gone.map((outcome) => `  ${pad(outcome.tag, 6)}${outcome.note ?? LABEL[outcome.verdict]}`),
      '',
      'A language leaves the offered list only this way. Nothing automatic disables one.',
    )
  }

  const unchanged = plan.outcomes.filter((outcome) => outcome.verdict === 'unchanged').length
  const waiting = plan.outcomes.filter((outcome) => outcome.verdict === 'absent').length
  const notYet = plan.outcomes.filter((outcome) => outcome.verdict === 'unusable').length
  body.push(
    '',
    `${String(unchanged)} already current, ${String(notYet)} built but not yet playable, ` +
      `${String(waiting)} with nothing to borrow.`,
    '',
    `Checked against the usability floor on ${when.toISOString().slice(0, 10)}: three seeds per`,
    'language on the board the game opens on, each needing an accepted board holding a word of',
    'six tiles. A list that cannot do that is not offered, however well its attestation went.',
    '',
    'pnpm languages update',
  )
  return `${body.join('\n')}\n`
}
