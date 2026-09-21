import { cite } from './update.js'
import type { Outcome, Plan, Verdict } from './update.js'

/** How each verdict reads in the table, and the order the table groups them in. */
const ORDER: readonly Verdict[] = [
  'lost',
  'withdrawn',
  'failing',
  'added',
  'updated',
  'unchanged',
  'held',
  'unusable',
  'absent',
]

const LABEL: Record<Verdict, string> = {
  lost: 'LOST',
  withdrawn: 'WITHDRAWN',
  held: 'held',
  failing: 'FAILING',
  added: 'added',
  updated: 'updated',
  unchanged: 'unchanged',
  unusable: 'unusable',
  absent: 'absent',
}

const HEADING: Record<Verdict, string> = {
  lost: 'Regressions: a list this repository has, and upstream no longer does',
  withdrawn: 'Regressions: a language this repository plays, which upstream has stopped shipping',
  failing: 'Regressions: a list that used to deal a playable board and no longer does',
  held: 'Built upstream, and held back there on purpose',
  added: 'Newly playable',
  updated: 'Updated',
  unchanged: 'Already current',
  unusable: 'Built upstream, not playable yet',
  absent: 'Nothing to borrow yet',
}

function pad(text: string, width: number): string {
  return text.length >= width ? text : text + ' '.repeat(width - text.length)
}

/** Wraps a reason to something a terminal can read, which a held language's `why` is not. */
function wrap(text: string, width: number, indent: string): string[] {
  const lines: string[] = []
  let row = ''
  for (const word of text.split(/\s+/)) {
    if (row === '') row = word
    else if (`${row} ${word}`.length <= width) row = `${row} ${word}`
    else {
      lines.push(indent + row)
      row = word
    }
  }
  if (row !== '') lines.push(indent + row)
  return lines
}

/** One line in a table, so a reason that runs to a paragraph does not become the table. */
function brief(note: string, width: number): string {
  const flat = note.replace(/\s+/g, ' ').trim()
  return flat.length <= width ? flat : `${flat.slice(0, width - 1)}\u2026`
}

function line(outcome: Outcome): string {
  const { floor } = outcome
  const words =
    floor === undefined
      ? ''
      : `wMin ${String(floor.wMin)}, boards ${floor.draws.map((draw) => String(draw.words)).join('/')}`
  const detail = outcome.note === undefined ? words : brief(outcome.note, 52)
  return `  ${pad(outcome.tag, 6)}${pad(outcome.endonym, 20)}${detail}`
}

/** Languages whose first-run tour would not survive being dealt from the borrowed list. */
function tourTrouble(plan: Plan): Outcome[] {
  return plan.outcomes.filter(
    (outcome) =>
      (outcome.verdict === 'added' || outcome.verdict === 'updated') &&
      outcome.tour !== undefined &&
      (!outcome.tour.known || outcome.tour.missing.length > 0),
  )
}

/**
 * The tour notes, which are advice rather than a gate.
 *
 * Kept out of the verdict table on purpose: a language here still plays, and reporting it beside
 * the regressions would read as a fourth way to lose a language when it is a demonstration that
 * needs rebuilding.
 */
function tours(plan: Plan): string[] {
  const trouble = tourTrouble(plan)
  if (trouble.length === 0) return []
  const out = ['', 'The first-run tour needs attention (these languages still play):']
  for (const outcome of trouble) {
    const tour = outcome.tour
    const why =
      tour?.known === false
        ? 'no tour board yet; add one to packages/words/src/tutorialBoards.ts'
        : `the list no longer holds ${tour?.missing.join(', ') ?? ''}`
    out.push(`  ${pad(outcome.tag, 6)}${why}`)
    out.push(`        pnpm dictionary board --language=${outcome.tag} --top=4`)
  }
  return out
}

/**
 * The full reason for every language its own repository decided against.
 *
 * Printed at length, unwrapped by anything but the terminal width, because this is the one place
 * in the run where a person wrote a sentence for another person to read. Japanese is held back
 * over what its reader can and cannot build out of compound words, which is an argument rather
 * than a measurement, and abbreviating it in a table column would throw away the only part of
 * the decision that could be disagreed with.
 */
function reasons(plan: Plan): string[] {
  const decided = plan.outcomes.filter(
    (outcome) =>
      (outcome.verdict === 'held' || outcome.verdict === 'withdrawn') &&
      outcome.status != null &&
      outcome.status.why !== undefined,
  )
  if (decided.length === 0) return []

  const out = ['', 'Why each of those was held, in its own repository\u2019s words:']
  for (const outcome of decided) {
    const decidedOn = outcome.status?.decided
    out.push(
      '',
      `  ${outcome.tag}  ${outcome.endonym}${decidedOn === undefined ? '' : `  (decided ${decidedOn})`}`,
      ...wrap(outcome.status?.why ?? '', 86, '    '),
    )
  }
  return out
}

/**
 * Languages whose repository has not said what terms its list is under.
 *
 * Reported rather than defaulted. Guessing would put a licence in `manifest.json` and a LICENSE
 * file on disk that nobody upstream had agreed to, which is the one kind of wrong answer this
 * whole project exists to avoid making.
 */
function undeclared(plan: Plan): Outcome[] {
  return plan.outcomes.filter(
    (outcome) =>
      (outcome.verdict === 'added' ||
        outcome.verdict === 'updated' ||
        outcome.verdict === 'unchanged') &&
      outcome.status != null &&
      outcome.status.license === undefined,
  )
}

function terms(plan: Plan): string[] {
  const missing = undeclared(plan)
  if (missing.length === 0) return []
  return [
    '',
    `No declared terms for ${String(missing.length)} of these, so none are written here:`,
    '',
    `  ${missing.map((outcome) => outcome.tag).join(' ')}`,
    '',
    'A list says what it is under in its own status.json, beside `ships`. One line in each',
    'repository, and it arrives here on the next run:',
    '',
    '  "license": "CC0-1.0"',
  ]
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
  out.push(...terms(plan))
  out.push(...reasons(plan))
  out.push(...tours(plan))

  if (plan.blocked.length > 0) {
    out.push(
      '',
      'REFUSING TO WRITE.',
      '',
      'Each of these is a language this repository can play today and could not play after',
      'this run. Disabling one is an edit only you can make, so nothing has been written.',
      '',
      // Briefly: the full reason is printed above, under its own heading, and repeating a
      // paragraph here would bury the list of names this block exists to show.
      ...plan.blocked.map(
        (outcome) =>
          `  ${pad(outcome.tag, 6)}${pad(LABEL[outcome.verdict], 11)}${brief(outcome.note ?? '', 56)}`,
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
      body.push(
        `  ${pad(outcome.tag, 6)}${outcome.verdict === 'added' ? 'added  ' : 'updated'}  ${cite(outcome)}`,
      )
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

  const trouble = tourTrouble(plan)
  if (trouble.length > 0) {
    body.push(
      '',
      'Still playing, and the first-run tour wants rebuilding:',
      '',
      ...trouble.map(
        (outcome) =>
          `  ${pad(outcome.tag, 6)}${
            outcome.tour?.known === false
              ? 'has no tour board'
              : `lost ${outcome.tour?.missing.join(', ') ?? ''}`
          }`,
      ),
    )
  }

  const unchanged = plan.outcomes.filter((outcome) => outcome.verdict === 'unchanged').length
  const waiting = plan.outcomes.filter((outcome) => outcome.verdict === 'absent').length
  const notYet = plan.outcomes.filter((outcome) => outcome.verdict === 'unusable').length
  const heldBack = plan.outcomes.filter((outcome) => outcome.verdict === 'held').length
  body.push(
    '',
    `${String(unchanged)} already current, ${String(heldBack)} built and held back upstream, ` +
      `${String(notYet)} built but not yet playable, ${String(waiting)} with nothing to borrow.`,
    '',
    `Checked against the usability floor on ${when.toISOString().slice(0, 10)}: three seeds per`,
    'language on the board the game opens on, each needing an accepted board holding a word of',
    'six tiles. A list that cannot do that is not offered, however well its attestation went.',
    '',
    'Every list here also says `ships: true` in its own status.json. That is a separate question',
    'from the floor and a higher one: a language can deal a perfectly good board and still be a',
    'poor dictionary, and only the repository that built it is in a position to say so.',
    '',
    'pnpm languages update',
  )
  return `${body.join('\n')}\n`
}
