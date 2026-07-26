import { useEffect } from 'react';
import { useNavigate } from 'react-router';
import { shouldIgnoreShortcut } from '../keyboard';

/** The shortcuts that work from anywhere in the app: H (Home), V
 *  (Multiview), ? (toggle the shortcuts list), Esc (close it). Individual
 *  pages layer their own shortcuts on top via their own listeners. */
export function useGlobalShortcuts(helpOpen: boolean, setHelpOpen: (open: boolean) => void) {
  const navigate = useNavigate();

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape' && helpOpen) {
        setHelpOpen(false);
        return;
      }

      if (shouldIgnoreShortcut(e)) return;

      if (e.key === '?') {
        e.preventDefault();
        setHelpOpen(!helpOpen);
      } else if (e.key === 'h' || e.key === 'H') {
        navigate('/');
      } else if (e.key === 'v' || e.key === 'V') {
        navigate('/multiview');
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [navigate, helpOpen, setHelpOpen]);
}
