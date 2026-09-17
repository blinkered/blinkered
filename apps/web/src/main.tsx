import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { App } from './App.js'
import { pinViewportInShell } from './viewport.js'
import './styles.css'

// Before the first render, because the viewport is what everything is measured against.
pinViewportInShell()

const host = document.getElementById('root')
if (host === null) throw new Error('no #root to mount into')

createRoot(host).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
