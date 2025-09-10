import { useState, useCallback } from 'react';
import { sdk } from '@farcaster/miniapp-sdk';

interface LeaderboardEntry {
  fid: number;
  username: string;
  displayName: string;
  score: number;
  timestamp: number;
  avatar?: string;
}

interface LeaderboardData {
  entries: LeaderboardEntry[];
  userRank?: number;
  userBestScore?: number;
}

export const useLeaderboard = () => {
  const [leaderboard, setLeaderboard] = useState<LeaderboardData>({ entries: [] });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submitScore = useCallback(async (score: number) => {
    try {
      setIsLoading(true);
      setError(null);

      // Check if we're in Farcaster context
      let context;
      try {
        context = await sdk.context;
      } catch (err) {
        // If SDK fails (like in localhost), use mock data
        context = null;
      }

      // Create score entry
      const scoreEntry: LeaderboardEntry = {
        fid: context?.user?.fid || Math.floor(Math.random() * 10000),
        username: context?.user?.username || 'Jugador Local',
        displayName: context?.user?.displayName || context?.user?.username || 'Jugador Local',
        score,
        timestamp: Date.now(),
        avatar: context?.user?.pfpUrl || undefined
      };

      // Store in localStorage for now (in a real app, you'd send to a server)
      const existingScores = JSON.parse(localStorage.getItem('dobi-bird-scores') || '[]');
      existingScores.push(scoreEntry);
      
      // Keep only top 100 scores
      const sortedScores = existingScores
        .sort((a: LeaderboardEntry, b: LeaderboardEntry) => b.score - a.score)
        .slice(0, 100);
      
      localStorage.setItem('dobi-bird-scores', JSON.stringify(sortedScores));

      // Update leaderboard
      setLeaderboard({
        entries: sortedScores,
        userRank: context?.user ? sortedScores.findIndex((entry: LeaderboardEntry) => entry.fid === context.user.fid) + 1 : undefined,
        userBestScore: context?.user ? Math.max(...sortedScores.filter((entry: LeaderboardEntry) => entry.fid === context.user.fid).map(e => e.score)) : undefined
      });

      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al enviar puntuación');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const loadLeaderboard = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Check if we're in Farcaster context
      let context;
      try {
        context = await sdk.context;
      } catch (err) {
        // If SDK fails (like in localhost), use mock data
        context = null;
      }

      const existingScores = JSON.parse(localStorage.getItem('dobi-bird-scores') || '[]');
      
      setLeaderboard({
        entries: existingScores,
        userRank: context?.user ? existingScores.findIndex((entry: LeaderboardEntry) => entry.fid === context.user.fid) + 1 : undefined,
        userBestScore: context?.user ? Math.max(...existingScores.filter((entry: LeaderboardEntry) => entry.fid === context.user.fid).map(e => e.score)) : undefined
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar leaderboard');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const shareScore = useCallback(async (score: number) => {
    try {
      // Check if we're in Farcaster context
      let context;
      try {
        context = await sdk.context;
      } catch (err) {
        // If SDK fails (like in localhost), use fallback sharing
        context = null;
      }

      // Create share text
      const shareText = `¡Acabo de conseguir ${score} puntos en DOBI BIRD! 🐦\n\n¿Puedes superar mi puntuación?`;
      
      if (context?.user) {
        // Use Farcaster's share functionality
        await sdk.actions.share({
          text: shareText,
          embeds: [{
            url: window.location.origin,
            title: 'DOBI BIRD - Juego de Farcaster',
            description: 'Juega al mejor juego de pájaro volador en Farcaster',
            image: `${window.location.origin}/splash.png`
          }]
        });
      } else {
        // Fallback: copy to clipboard
        await navigator.clipboard.writeText(shareText);
        alert('¡Puntuación copiada al portapapeles! Pégalo donde quieras compartir.');
      }

      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al compartir');
      return false;
    }
  }, []);

  return {
    leaderboard,
    isLoading,
    error,
    submitScore,
    loadLeaderboard,
    shareScore
  };
};
