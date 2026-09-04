/**
 * The country a player says they are from, as a list they can read.
 *
 * ISO 3166-1 alpha-2, self-declared, optional, never geo-IP. docs/ACCOUNTS.md gives the reason
 * for that last one: geo-IP is wrong often enough to be insulting, and it is a tracking signal we
 * would otherwise not be collecting.
 *
 * The names are **not** in this file, and that is the point. `Intl.DisplayNames` reads them out
 * of ICU in the reader's own language, so nobody hand-translates two hundred and fifty names per
 * locale and then keeps them in step; `Intl.Collator` sorts them in that language too, which is
 * the difference between an alphabetized list and an English one. Alphabetical by the English
 * name in a Greek interface is not a list, it is a shuffle.
 *
 * The flags docs/ACCOUNTS.md settles on are not here yet. They are `flag-icons` SVGs emitted
 * beside their own LICENSE, the way the word lists already are, and that is its own piece of
 * work; a name on its own is a complete control in the meantime, and the code the name comes from
 * is what gets stored either way.
 */

/**
 * Every alpha-2 code currently assigned.
 *
 * A list rather than a runtime enumeration because there is no runtime enumeration:
 * `Intl.supportedValuesOf` covers calendars, currencies and time zones, and not regions. It is
 * self-correcting rather than authoritative — `Intl.DisplayNames.of` hands back the code itself
 * when ICU has no name for it, and `countriesIn` drops those — so a code that is later withdrawn
 * simply stops appearing.
 */
const CODES = `AD AE AF AG AI AL AM AO AQ AR AS AT AU AW AX AZ BA BB BD BE BF BG BH BI BJ BL BM BN
BO BQ BR BS BT BV BW BY BZ CA CC CD CF CG CH CI CK CL CM CN CO CR CU CV CW CX CY CZ DE DJ DK DM DO
DZ EC EE EG EH ER ES ET FI FJ FK FM FO FR GA GB GD GE GF GG GH GI GL GM GN GP GQ GR GS GT GU GW GY
HK HM HN HR HT HU ID IE IL IM IN IO IQ IR IS IT JE JM JO JP KE KG KH KI KM KN KP KR KW KY KZ LA LB
LC LI LK LR LS LT LU LV LY MA MC MD ME MF MG MH MK ML MM MN MO MP MQ MR MS MT MU MV MW MX MY MZ NA
NC NE NF NG NI NL NO NP NR NU NZ OM PA PE PF PG PH PK PL PM PN PR PS PT PW PY QA RE RO RS RU RW SA
SB SC SD SE SG SH SI SJ SK SL SM SN SO SR SS ST SV SX SY SZ TC TD TF TG TH TJ TK TL TM TN TO TR TT
TV TW TZ UA UG UM US UY UZ VA VC VE VG VI VN VU WF WS YE YT ZA ZM ZW`
  .split(/\s+/u)
  .filter((code) => code !== '')

export interface Country {
  readonly code: string
  readonly name: string
}

/**
 * The countries, named and ordered for one reader.
 *
 * Cached per locale, because building it is two hundred and fifty `Intl` calls and a sort, and
 * the list is rebuilt every time a dropdown renders otherwise.
 */
const cache = new Map<string, readonly Country[]>()

export function countriesIn(locale: string): readonly Country[] {
  const held = cache.get(locale)
  if (held !== undefined) return held

  const names = new Intl.DisplayNames([locale, 'en'], { type: 'region' })
  const collator = new Intl.Collator(locale)
  const list = CODES.map((code) => ({ code, name: names.of(code) ?? code }))
    // A code ICU cannot name comes back as the code. Showing `XK` between two real names is
    // worse than not offering it, and it self-corrects when ICU learns the name.
    .filter((country) => country.name !== country.code)
    .sort((a, b) => collator.compare(a.name, b.name))
  cache.set(locale, list)
  return list
}

/** What to show beside a username, for a country somebody has chosen. The code, if ICU cannot. */
export function countryName(code: string, locale: string): string {
  return countriesIn(locale).find((country) => country.code === code)?.name ?? code
}
