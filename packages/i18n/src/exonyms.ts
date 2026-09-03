/**
 * What to call a language that ICU has no name for, in each language that has to name it.
 *
 * The picker orders the list by the reader's own name for each language, which comes from
 * `Intl.DisplayNames` and covers forty-nine of the fifty-one everywhere. Nigerian Pidgin and
 * Egyptian Arabic are covered only if the runtime's CLDR is recent: **Chrome 123 names neither
 * in any locale and Node 26 names both**. Left to the runtime, those two rows are blank on one
 * browser, named on another, and the list sorts differently depending on which — so these
 * override ICU rather than filling in behind it.
 *
 * These are that missing name, written the way each locale's own ICU data writes a language
 * name: capitalised in English, German and Welsh, lower case in French, Spanish, Polish and
 * Russian, `-erea` in Basque, `Tiếng` in Vietnamese, `語` in Japanese. Following the convention
 * matters more than it sounds — a list where one row is capitalised and the rest are not reads
 * as a mistake, and this row is already the odd one out.
 *
 * Nothing here is a translation of the endonym. Naijá calls itself Naijá; this is what a French
 * or Korean reader would look under.
 */

/** Nigerian Pidgin, in every interface language but its own. */
export const NAIJA: Readonly<Record<string, string>> = {
  af: 'Nigeriese Pidgin',
  ar: 'البدجن النيجيري',
  arz: 'البدجن النيجيرى',
  bg: 'нигерийски пиджин',
  ca: 'pidgin nigerià',
  cs: 'nigerijský pidžin',
  cy: 'Pidgin Nigeria',
  da: 'nigeriansk pidgin',
  de: 'Nigerianisches Pidgin',
  el: 'Νιγηριανά Πίτζιν',
  en: 'Nigerian Pidgin',
  es: 'pidgin nigeriano',
  et: 'Nigeeria pidžin',
  eu: 'Nigeriako pidgina',
  fa: 'پیجین نیجریه‌ای',
  fi: 'nigerianpidgin',
  fr: 'pidgin nigérian',
  ga: 'Pidgin na Nigéire',
  gl: 'pidgin nixeriano',
  he: 'פידג׳ין ניגרי',
  hr: 'nigerijski pidžin',
  hu: 'nigériai pidzsin',
  hy: 'նիգերիական փիջին',
  id: 'Pijin Nigeria',
  is: 'nígerísk pidgin',
  it: 'pidgin nigeriano',
  ja: 'ナイジェリア・ピジン語',
  ka: 'ნიგერიული პიჯინი',
  ko: '나이지리아 피진어',
  la: 'Pidgin Nigerianum',
  lt: 'Nigerijos pidžinas',
  lv: 'Nigērijas pidžins',
  mk: 'нигериски пиџин',
  ms: 'Pijin Nigeria',
  nl: 'Nigeriaans Pidgin',
  no: 'nigeriansk pidgin',
  pl: 'pidżyn nigeryjski',
  pt: 'pidgin nigeriano',
  'pt-BR': 'pidgin nigeriano',
  ro: 'pidgin nigerian',
  ru: 'нигерийский пиджин',
  sk: 'nigérijský pidžin',
  sl: 'nigerijska pidžinščina',
  sr: 'нигеријски пиџин',
  sv: 'nigeriansk pidgin',
  sw: 'Kipijini cha Nigeria',
  tl: 'Pidgin ng Nigeria',
  tr: 'Nijerya Pidgini',
  uk: 'нігерійський піджин',
  vi: 'Tiếng Pidgin Nigeria',
}

/** Egyptian Arabic, in every interface language but its own. */
export const EGYPTIAN_ARABIC: Readonly<Record<string, string>> = {
  af: 'Egiptiese Arabies',
  ar: 'العربية المصرية',
  arz: 'العربى المصرى',
  bg: 'египетски арабски',
  ca: 'àrab egipci',
  cs: 'egyptská arabština',
  cy: 'Arabeg yr Aifft',
  da: 'egyptisk arabisk',
  de: 'Ägyptisches Arabisch',
  el: 'Αιγυπτιακά Αραβικά',
  en: 'Egyptian Arabic',
  es: 'árabe egipcio',
  et: 'Egiptuse araabia',
  eu: 'Egiptoko arabiera',
  fa: 'عربی مصری',
  fi: 'egyptinarabia',
  fr: 'arabe égyptien',
  ga: 'Araibis na hÉigipte',
  gl: 'árabe exipcio',
  he: 'ערבית מצרית',
  hr: 'egipatski arapski',
  hu: 'egyiptomi arab',
  hy: 'եգիպտական արաբերեն',
  id: 'Arab Mesir',
  is: 'egypsk arabíska',
  it: 'arabo egiziano',
  ja: 'エジプト・アラビア語',
  ka: 'ეგვიპტური არაბული',
  ko: '이집트 아랍어',
  la: 'Arabica Aegyptia',
  lt: 'Egipto arabų',
  lv: 'Ēģiptes arābu',
  mk: 'египетски арапски',
  ms: 'Arab Mesir',
  nl: 'Egyptisch Arabisch',
  no: 'egyptisk arabisk',
  pcm: 'Egyptian Arabic',
  pl: 'arabski egipski',
  pt: 'árabe egípcio',
  'pt-BR': 'árabe egípcio',
  ro: 'arabă egipteană',
  ru: 'египетский арабский',
  sk: 'egyptská arabčina',
  sl: 'egiptovska arabščina',
  sr: 'египатски арапски',
  sv: 'egyptisk arabiska',
  sw: 'Kiarabu cha Misri',
  tl: 'Arabeng Ehipsiyo',
  tr: 'Mısır Arapçası',
  uk: 'єгипетська арабська',
  vi: 'Tiếng Ả Rập Ai Cập',
}
