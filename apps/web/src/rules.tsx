import { StrictMode, useEffect, useState } from 'react'
import { createRoot } from 'react-dom/client'
import { messagesFor } from '@blinkered/i18n'
import { HowToPlay, howToPlayUrl, languageFromUrl } from './HowToPlay.js'
import './styles.css'

/**
 * The rules page, which is its own tab and therefore its own little app.
 *
 * It opens in the language the game was being read in, and changing the language here rewrites
 * the address rather than only the text, so the tab stays shareable and survives a reload.
 */
function Rules(): React.JSX.Element {
  const [language, setLanguage] = useState(() => languageFromUrl(globalThis.location.search))
  const messages = messagesFor(language)

  useEffect(() => {
    document.documentElement.lang = language
    document.title = `${messages.howToPlay} — Blinkered`
    globalThis.history.replaceState(null, '', howToPlayUrl(language))
  }, [language, messages])

  return <HowToPlay messages={messages} language={language} onLanguage={setLanguage} />
}

const root = document.getElementById('root')
if (root === null) throw new Error('no #root to render into')

createRoot(root).render(
  <StrictMode>
    <Rules />
  </StrictMode>,
)
