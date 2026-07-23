import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

// no StrictMode: double-mounted effects fight the webcam + MediaPipe lifecycle,
// and demo stability beats dev-mode lint here
createRoot(document.getElementById('root')!).render(<App />)
