/**
 * The four secondary controls, as drawings rather than words.
 *
 * Five buttons have to fit one row on a 320px screen in sixteen languages, and words cannot do
 * that: "Wort abgeben" and "Lämna in ordet" are not going to share a line with three more labels.
 * So the one button whose label has to be read keeps its words, and these four lose theirs. Each
 * still carries the full localised name as its accessible label, so nothing is lost to a screen
 * reader or a tooltip.
 *
 * Inline SVG rather than emoji, which was the other option and a worse one: emoji are drawn from
 * whichever font the platform picked, at a size and a baseline the stylesheet cannot reach, in
 * colours that ignore the theme. These inherit `currentColor` and scale with the button.
 *
 * Paths are deliberately plain. At 20px nothing subtle survives.
 */
interface IconProps {
  readonly name: 'reset' | 'pause' | 'resume' | 'restart' | 'quit' | 'help'
}

export function Icon({ name }: IconProps): React.JSX.Element {
  return (
    <svg
      className="icon"
      viewBox="0 0 24 24"
      width="20"
      height="20"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      {PATHS[name]}
    </svg>
  )
}

const PATHS: Record<IconProps['name'], React.JSX.Element> = {
  /*
   * A cross, meaning "clear this". The first attempt was an eraser, and at 20px an eraser is a
   * quadrilateral with a line under it, which reads as a pen: the wrong verb entirely. A cross
   * cannot be mistaken for writing, and it does not collide with Quit, which is a door.
   */
  reset: (
    <>
      <path d="M6 6l12 12" />
      <path d="M18 6L6 18" />
    </>
  ),
  pause: (
    <>
      <path d="M9 5v14" />
      <path d="M15 5v14" />
    </>
  ),
  // Filled, because a hollow triangle at 20px reads as an arrowhead.
  resume: <path d="M7 4.5l12 7.5-12 7.5z" fill="currentColor" />,
  // A full circle broken by its own arrowhead: the same board again from the top.
  restart: (
    <>
      <path d="M20 12a8 8 0 1 1-2.4-5.7" />
      <path d="M20 3.5V7h-3.5" />
    </>
  ),
  // The one glyph nobody has to be taught.
  help: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M9.4 9.2a2.7 2.7 0 1 1 3.4 2.6c-.5.2-.8.7-.8 1.3v.6" />
      <path d="M12 17.2h.01" />
    </>
  ),
  // Out through a door, rather than a cross, which would mean "close this" instead of "leave".
  quit: (
    <>
      <path d="M14 4H6v16h8" />
      <path d="M14 12h6" />
      <path d="M17.5 8.5L21 12l-3.5 3.5" />
    </>
  ),
}
