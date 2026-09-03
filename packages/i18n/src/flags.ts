/**
 * The three flags Unicode has no character for.
 *
 * Every other language here gets an emoji flag, which is a character and costs nothing. Unicode
 * has emoji flags for countries and for exactly three subdivisions — England, Scotland and Wales
 * — so Welsh is fine and Catalan, Basque and Galician are not. Falling back to 🇪🇸 for all three
 * would be both wrong and unhelpful: it says nothing about which of them a row is, and it makes
 * a claim about these languages that is not ours to make.
 *
 * So they are drawn here, as data URIs, because each one is a handful of rectangles and lines.
 * Drawn rather than fetched: the designs themselves are centuries old and carry no copyright,
 * but a particular SVG file is somebody's work, and the Ikurriña on Wikimedia Commons is
 * CC BY-SA. Nothing in this repository obliges anyone, and 300 bytes of geometry is not the
 * place to start.
 */

/** Percent-encodes the few characters a data URI cannot carry raw, and no more. */
function svg(markup: string): string {
  const encoded = markup
    .replace(/#/g, '%23')
    .replace(/"/g, "'")
    .replace(/</g, '%3C')
    .replace(/>/g, '%3E')
    .replace(/\s+/g, ' ')
    .trim()
  return `data:image/svg+xml,${encoded}`
}

/**
 * The Senyera: four red bars on gold, nine stripes in all, and the bars are exactly half the
 * height of the field's ninth.
 */
export const CATALONIA = svg(`
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 900 600">
    <rect width="900" height="600" fill="#FCDD09"/>
    <path stroke="#DA121A" stroke-width="66.7" d="M0,100H900m0,133.3H0m0,133.3H900m0,133.3H0"/>
  </svg>
`)

/** Galicia's civil flag: a blue band from the upper hoist to the lower fly, on white. */
export const GALICIA = svg(`
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 900 600">
    <rect width="900" height="600" fill="#FFFFFF"/>
    <path stroke="#0080C8" stroke-width="159" d="M0,0 900,600"/>
  </svg>
`)

/**
 * The Ikurriña: a green saltire and a white cross on red, the white over the green where they
 * meet, which is the whole of the design.
 */
export const BASQUE_COUNTRY = svg(`
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 500 280">
    <rect width="500" height="280" fill="#D52B1E"/>
    <path stroke="#009B48" stroke-width="43" d="M0,0 500,280M500,0 0,280"/>
    <path stroke="#FFFFFF" stroke-width="43" d="M250,0V280M0,140H500"/>
  </svg>
`)
