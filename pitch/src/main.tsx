import { createRoot } from 'react-dom/client'
import 'reveal.js/dist/reveal.css'
import './tokens.css'
import './media.css'
import './deck.css'
import './anim.css'
import { Deck } from './Deck'

createRoot(document.getElementById('root')!).render(<Deck />)
