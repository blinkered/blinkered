import type { Messages } from '../messages.js'

/**
 * Polish. `ruch` for flips, which is what a Polish board game calls a move — the thing you
 * spend, which is what the meter counts.
 *
 * Four plural forms, and the trap is that `other` is not a spare: Polish uses it for fractions,
 * so `2,5 słowa` needs the same form as `2 słowa` rather than the genitive `słów`.
 */
export const pl: Messages = {
  tag: 'pl',

  readingDictionary: 'Czytam słownik…',
  noWordList: 'Brak listy słów dla „{language}”. Zbuduj ją:  pnpm dictionary build',
  emptyWordList: 'Lista słów dla „{language}” jest pusta.',

  flips: 'ruchy',
  score: 'wynik',
  words: 'słowa',
  round: 'runda',
  ticksLeftLabel: 'Czas do końca rundy',
  typeAWord: 'wpisz słowo',
  tapPrompt: 'dotknij liter, aby wybrać lub cofnąć, potem {action}',

  boardOfTiles: 'Plansza z {n} płytek',
  faceDown: 'zakryta',
  wildCard: 'joker',
  wildKey: 'dowolna litera',
  letterReplaced: '{from} zmieniło się w {to}',
  letterSwap: 'ZAMIANA LITER!',
  spentTile: 'zużyta płytka',
  hiddenWhilePaused: 'ukryte na czas pauzy',
  letterInWord: '{letter}, litera {position} w słowie',

  completeWord: 'Zatwierdź słowo',

  completeShort: 'Zatwierdź',
  reset: 'Wyczyść',
  pause: 'Pauza',
  resume: 'Wznów',
  newGame: 'Nowa gra',
  paused: 'Pauza',
  outOfFlips: 'Koniec ruchów',
  finalResult: '{score} za {words} w {rounds}',
  playAgain: 'Zagraj jeszcze raz',
  share: 'Udostępnij',
  shareCopied: 'Skopiowano.',
  shareSelect: 'Skopiuj to:',

  lettersSelect: 'litery wybierają',
  keysWild: 'brany, gdy wpiszesz literę, której nie ma na planszy',
  clearsEvery: 'usuwa wszystkie wybrane {letter}',
  undoLastLetter: 'cofnij ostatnią literę',
  noWordsYet: 'Jeszcze żadnych słów.',

  wordRejected: '{word}  {reason}',
  reasonDuplicate: 'już znalezione',
  reasonTooShort: 'za krótkie',
  reasonNotAWord: 'to nie jest słowo',
  reasonAllFound: 'masz już wszystkie',
  noSuchLetterUp: 'brak odkrytego {letter}',
  nothingUp: 'nic nie odkryto',
  shuffled: 'przetasowano',
  shuffledAndBilled: 'przetasowano, policzono {flips} niewykorzystanych',

  gameLanguage: 'język',
  interfaceLanguage: 'interfejs',
  dictionarySize: '{common} codziennych z {full} słów',
  filterLanguages: 'Szukaj języka',
  noMatches: 'Brak wyników',

  nerdMode: 'tryb dla zapaleńców',
  rules: 'Zasady',
  difficulty: 'poziom',
  difficultyNames: { easy: 'łatwy', medium: 'średni', hard: 'trudny', insane: 'szalony' },
  tiles: 'płytki (N)',
  secondsPerTick: 'sekundy / takt',
  holdTicks: 'takty postoju',
  minWord: 'najkrótsze słowo',
  startingFlips: 'ruchy na start',
  wildChance: 'szansa na jokera',
  replaceChance: 'szansa na zamianę liter',
  wordCompleteMode: 'po ułożeniu słowa',
  wordCompleteNames: { shuffle: 'tasowanie', spend: 'zużycie', keep: 'zostawienie' },
  flipEconomy: 'zwrot ruchów',
  flipEconomyNames: {
    none: 'brak',
    perLetter: 'za literę',
    fibonacci: 'fibonacci',
    overMinimum: 'ponad minimum',
  },
  repeatedLetterKey: 'klawisz powtórzonej litery',
  keySchemeNames: { cycle: 'cykl', advance: 'krok' },
  keySchemeHelp: {
    cycle:
      'A bierze kolejne wolne A, a gdy wszystkie są już w słowie, usuwa je. ' +
      'Shift+A też je usuwa.',
    advance: 'A bierze kolejne wolne A. Shift+A usuwa wszystkie A ze słowa.',
  },

  whatThatMeans: 'Co to znaczy',
  factRound: 'runda',
  factWholeBoardUp: 'cała plansza odkryta przez',
  factRoundCosts: 'runda kosztuje',
  factFlipsBuy: 'ruchy na start kupują',
  factThisBoard: 'ta plansza',
  factBoardHadToAdmit: 'plansza musiała dopuścić',
  ticksAndSeconds: '{ticks}, {seconds}',
  wordsLongest: '{words}, najdłuższe {longest}',
  wordsIncludingOneOf: '{words}, w tym jedno z {ceiling}',
  scorelessRounds: '{rounds} bez punktów',

  whatAWordPays: 'Ile daje słowo',
  columnLetters: 'litery',
  columnCost: 'koszt',
  columnPoints: 'punkty',
  columnFlips: 'ruchy',
  columnNet: 'bilans',

  canonicalRules: 'Standardowe zasady poziomu {difficulty}.',
  customRules: 'Zmienione względem ustawień. Wyniki na własnych zasadach nie trafiają do rankingu.',
  applyAndStart: 'Zastosuj i zacznij nową grę',
  changesNextGame: 'Zmiany zadziałają od następnej gry.',
  presets: 'Ustawienia:',

  start: 'Start',
  restart: 'Od nowa',
  quit: 'Zakończ',
  quitTitle: 'Zakończyć tę grę?',
  restartTitle: 'Zacząć tę grę od nowa?',
  restartConfirm: 'Od nowa',
  quitConfirm: 'Zakończ',
  keepPlaying: 'Graj dalej',
  personalBest: 'Twoje najlepsze gry',
  thisGame: 'ta gra',
  newPersonalBest: 'Nowy rekord.',
  columnRank: '#',
  notRanked: 'Własne zasady, więc ta gra nie trafia do rankingu.',
  rankOfTotal: '{rank} z {total}',

  howToPlay: 'Jak grać',

  backToGame: 'Wróć do gry',
  welcomeTitle: 'Witaj w Blinkered',
  tutorialSkip: 'Pomiń',
  tutorialNext: 'Dalej',
  tutorialBack: 'Wstecz',
  tutorialStart: 'Zacznij grę',
  tutorialHideAgain: 'Nie pokazuj tego więcej',
  tutorialProgress: '{n} z {total}',
  tutorialSkipTitle: 'Pominąć wprowadzenie?',
  tutPickLetters: 'Dotykaj liter po kolei, aby ułożyć słowo.',
  tutMoreTurn: 'Płytki odkrywają się, kiedy myślisz, więc lepsza litera może dopiero nadejść.',
  tutTapBack:
    'Wzięłaś lub wziąłeś nie tę literę? Dotknij jej jeszcze raz, aby ją oddać. Dowolną, nie tylko ostatnią.',
  tutComplete: 'Naciśnij Zatwierdź, gdy słowo jest gotowe.',
  tutControlsTitle: 'Przyciski',
  tutReset: 'Wyczyść usuwa układane słowo. Płytki zostają na swoich miejscach.',
  tutPause:
    'Pauza zatrzymuje zegar i zakrywa planszę, żeby przerwa nie służyła do uczenia się jej.',
  tutRestart: 'Od nowa rozdaje planszę od początku. Najpierw pyta.',
  tutQuit: 'Zakończ kończy grę i pokazuje wynik. Najpierw pyta.',
  tutDoneTitle: 'To cała gra',
  tutDoneBody: 'Wybierz poziom i graj. Jak grać jest zawsze przy tytule, gdybyś chciał wrócić.',
  htBoardTitle: 'Plansza',
  htBoardBody:
    'Płytki odkrywają się pojedynczo, w kolejności czytania. Z odkrytych układa się słowa.',
  htWordsTitle: 'Słowa',
  htWordsBody: 'Ułóż słowo z odkrytych płytek, wpisując lub klikając litery po kolei.',
  htFlipsTitle: 'Ruchy',
  htFlipsBody:
    'Każda odkryta płytka kosztuje ruch. Ułożone słowo zwraca ruchy, a dłuższe słowa zwracają więcej. Gdy ruchy się skończą, gra dobiega końca.',
  htRoundTitle: 'Runda',
  htRoundBody:
    'Gdy odkryje się ostatnia płytka rundy, cała plansza zatrzymuje się na chwilę. Potem płytki zostają zakryte i przetasowane, i zaczyna się nowa runda.',
  htLanguagesTitle: 'Języki',
  htLanguagesBody:
    'Jest ich {n}. Każdą planszę da się rozwiązać słowami, których ludzie naprawdę używają. Rzadkie słowo też punktuje, jeśli słownik je zna.',
  htKeysTitle: 'Klawiatura',
  htWildTitle: 'Jokery',
  htWildBody:
    'Czasem zamiast litery pojawia się joker. Joker liczy się jako każda litera, która tworzy poprawne słowo. Słowo już ułożone się nie liczy.',
  htSwapTitle: 'Zmiana liter',
  htSwapBody:
    'Czasem między rundami jedna litera zostaje zastąpiona inną. Zobaczysz, która zniknęła i która się pojawiła.',
  htLevelsTitle: 'Poziomy',
  htLevelEasy:
    'Te same dwanaście liter przez całą grę, więc można je zapamiętać i nosić listę słów w głowie. Płytki odkrywają się powoli, a cała plansza jest widoczna dość długo, by dokończyć wybór.',
  htLevelMedium:
    'Co jakiś czas litera się zmienia, więc trudniej zapamiętać słowa odłożone na później. Mniej czasu na patrzenie i mniej na myślenie.',
  htLevelHard:
    'Słowa trzyliterowe przestają się liczyć, a litera zmienia się mniej więcej co drugą rundę. Plansza ledwie się pokazuje, a już się tasuje.',
  htLevelInsane:
    'Wszystko naraz i na pełnej prędkości. Plansza tasuje się niemal zaraz po ostatnim ruchu.',
  htTouchTitle: 'Ekran dotykowy',
  htTouchBody:
    'Dotknij odkrytej płytki, aby wziąć jej literę. Dotknij wziętej litery, aby ją oddać. Zatwierdź i Wyczyść są pod planszą.',

  plurals: {
    words: { one: '{n} słowo', few: '{n} słowa', many: '{n} słów', other: '{n} słowa' },
    rounds: { one: '{n} runda', few: '{n} rundy', many: '{n} rund', other: '{n} rundy' },
    flips: { one: '{n} ruch', few: '{n} ruchy', many: '{n} ruchów', other: '{n} ruchu' },
    ticks: { one: '{n} takt', few: '{n} takty', many: '{n} taktów', other: '{n} taktu' },
    points: { one: '{n} punkt', few: '{n} punkty', many: '{n} punktów', other: '{n} punktu' },
  },
}
