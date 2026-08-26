import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { App } from './App.js'
import './styles.css'

const host = document.getElementById('root')
if (host === null) throw new Error('no #root to mount into')

createRoot(host).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
