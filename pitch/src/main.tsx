import { createRoot } from 'react-dom/client'
import './tokens.css'
import './media.css'
import './deck.css'
import { Deck } from './Deck'

createRoot(document.getElementById('root')!).render(<Deck />)
