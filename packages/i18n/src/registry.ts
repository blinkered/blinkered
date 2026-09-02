import { af } from './locales/af.js'
import { ar } from './locales/ar.js'
import { de } from './locales/de.js'
import { el } from './locales/el.js'
import { en } from './locales/en.js'
import { es } from './locales/es.js'
import { fi } from './locales/fi.js'
import { fr } from './locales/fr.js'
import { he } from './locales/he.js'
import { hr } from './locales/hr.js'
import { id } from './locales/id.js'
import { it } from './locales/it.js'
import { ko } from './locales/ko.js'
import { la } from './locales/la.js'
import { ms } from './locales/ms.js'
import { nl } from './locales/nl.js'
import { no } from './locales/no.js'
import { pt } from './locales/pt.js'
import { ptBR } from './locales/pt-BR.js'
import { ru } from './locales/ru.js'
import { sv } from './locales/sv.js'
import { sw } from './locales/sw.js'
import { tl } from './locales/tl.js'
import { tr } from './locales/tr.js'
import type { Messages } from './messages.js'

export interface Locale {
  /** BCP 47 tag, and the same id the engine uses for the alphabet. */
  readonly tag: string
  /** The language's own name for itself, so a speaker can find it. */
  readonly endonym: string
  /**
   * A flag, which is a compromise and worth naming as one. A flag is a country and these are
   * languages, so the pairing is arbitrary wherever a language has more than one home. It is
   * here because it makes a picker scannable at a glance in a way a column of names in as many
   * scripts is not, and the endonym next to it carries the actual meaning.
   */
  readonly flag: string
  readonly messages: Messages
}

/**
 * Every language the interface is translated into, in the order a picker shows them.
 *
 * Not the same as the languages that can be *played*: that also needs a word list, and the
 * app offers only the intersection. Keeping the two lists separate is deliberate, because the
 * game language and the interface language are separate settings.
 */
export const LOCALES: readonly Locale[] = [
  // English takes the Union flag for the language's origin rather than for a dialect: the
  // English word list is the union of en-US and en-GB, so COLOR and COLOR both play.
  { tag: 'en', endonym: 'English', flag: '🇬🇧', messages: en },
  { tag: 'fr', endonym: 'Français', flag: '🇫🇷', messages: fr },
  { tag: 'es', endonym: 'Español', flag: '🇪🇸', messages: es },
  { tag: 'it', endonym: 'Italiano', flag: '🇮🇹', messages: it },
  { tag: 'de', endonym: 'Deutsch', flag: '🇩🇪', messages: de },
  { tag: 'nl', endonym: 'Nederlands', flag: '🇳🇱', messages: nl },
  { tag: 'af', endonym: 'Afrikaans', flag: '🇿🇦', messages: af },
  { tag: 'sw', endonym: 'Kiswahili', flag: '🇹🇿', messages: sw },
  // The two that read the other way. Israel for Hebrew; Saudi Arabia for Arabic, which is a
  // flag for a language spoken across twenty-odd countries and the usual compromise.
  { tag: 'he', endonym: 'עברית', flag: '🇮🇱', messages: he },
  { tag: 'ar', endonym: 'العربية', flag: '🇸🇦', messages: ar },
  { tag: 'pt', endonym: 'Português', flag: '🇵🇹', messages: pt },
  { tag: 'pt-BR', endonym: 'Português (Brasil)', flag: '🇧🇷', messages: ptBR },
  { tag: 'hr', endonym: 'Hrvatski', flag: '🇭🇷', messages: hr },
  { tag: 'ms', endonym: 'Bahasa Melayu', flag: '🇲🇾', messages: ms },
  { tag: 'id', endonym: 'Bahasa Indonesia', flag: '🇮🇩', messages: id },
  { tag: 'ko', endonym: '한국어', flag: '🇰🇷', messages: ko },
  // Filipino by law and Tagalog by name: the flag is the country, the endonym the language.
  { tag: 'tl', endonym: 'Tagalog', flag: '🇵🇭', messages: tl },
  { tag: 'ru', endonym: 'Русский', flag: '🇷🇺', messages: ru },
  { tag: 'sv', endonym: 'Svenska', flag: '🇸🇪', messages: sv },
  { tag: 'no', endonym: 'Norsk', flag: '🇳🇴', messages: no },
  { tag: 'fi', endonym: 'Suomi', flag: '🇫🇮', messages: fi },
  { tag: 'el', endonym: 'Ελληνικά', flag: '🇬🇷', messages: el },
  { tag: 'tr', endonym: 'Türkçe', flag: '🇹🇷', messages: tr },
  // Last, and the one flag here that is a country nobody lives in.
  { tag: 'la', endonym: 'Latina', flag: '🇻🇦', messages: la },
]

export const DEFAULT_LOCALE = 'en'

const BY_TAG: ReadonlyMap<string, Locale> = new Map(
  LOCALES.map((locale) => [locale.tag, locale] as const),
)

export function localeFor(tag: string): Locale | undefined {
  return BY_TAG.get(tag)
}

/**
 * The messages for a tag, falling back to English.
 *
 * Falls back rather than throwing because the interface language can come from a stale
 * setting or a browser preference, and an untranslated interface is a far better outcome than
 * a blank screen.
 */
export function messagesFor(tag: string): Messages {
  return BY_TAG.get(tag)?.messages ?? en
}

/**
 * Best interface language for a set of browser preferences.
 *
 * Matches the exact tag first, then the base language, so `pt-PT` finds Portuguese and
 * `pt-BR` finds Brazilian rather than both landing on whichever came first. A regional tag we
 * have no entry for still finds its language.
 */
export function preferredLocale(preferences: readonly string[]): string {
  for (const preference of preferences) {
    const exact = LOCALES.find((locale) => locale.tag.toLowerCase() === preference.toLowerCase())
    if (exact !== undefined) return exact.tag
    const base = preference.split('-')[0]?.toLowerCase()
    const loose = LOCALES.find((locale) => locale.tag.split('-')[0]?.toLowerCase() === base)
    if (loose !== undefined) return loose.tag
  }
  return DEFAULT_LOCALE
}
