import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { App } from './app/App'
import { ROW_HEIGHT } from './app/constants'
import './app/theme.css'

document.documentElement.style.setProperty('--row-height', `${ROW_HEIGHT}px`)

createRoot(document.getElementById('root')!).render(
    <StrictMode>
        <App />
    </StrictMode>,
)
