import { useEffect, useState } from 'react';

/**
 * Petit délai de 30 ms avant de passer à l'état « révélé » : les transitions
 * d'entrée (barres, arcs du graphique) partent bien de zéro au premier rendu.
 */
export function useReveal(delay = 30): boolean {
  const [revealed, setRevealed] = useState(false);
  useEffect(() => {
    const timer = window.setTimeout(() => setRevealed(true), delay);
    return () => window.clearTimeout(timer);
  }, [delay]);
  return revealed;
}
