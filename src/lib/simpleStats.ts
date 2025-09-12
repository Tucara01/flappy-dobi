/**
 * Sistema simple de estadísticas usando localStorage
 * Almacena las estadísticas del jugador de forma local y persistente
 */

export interface PlayerStats {
  totalGames: number;
  bestScore: number;
  gamesWon: number;
  totalScore: number;
  lastUpdated: number;
}

const STORAGE_KEY = 'flappy-dobi-stats';

/**
 * Obtiene las estadísticas del jugador desde localStorage
 */
export function getPlayerStats(playerAddress: string): PlayerStats {
  try {
    const stored = localStorage.getItem(`${STORAGE_KEY}-${playerAddress}`);
    if (stored) {
      const stats = JSON.parse(stored) as PlayerStats;
      return stats;
    }
  } catch (error) {
    console.warn('Error loading player stats:', error);
  }
  
  // Retornar estadísticas por defecto si no hay datos
  return {
    totalGames: 0,
    bestScore: 0,
    gamesWon: 0,
    totalScore: 0,
    lastUpdated: Date.now()
  };
}

/**
 * Guarda las estadísticas del jugador en localStorage
 */
export function savePlayerStats(playerAddress: string, stats: PlayerStats): void {
  try {
    const statsToSave = {
      ...stats,
      lastUpdated: Date.now()
    };
    localStorage.setItem(`${STORAGE_KEY}-${playerAddress}`, JSON.stringify(statsToSave));
  } catch (error) {
    console.warn('Error saving player stats:', error);
  }
}

/**
 * Actualiza las estadísticas cuando se completa un juego
 */
export function updatePlayerStats(
  playerAddress: string, 
  score: number, 
  won: boolean = false
): PlayerStats {
  const currentStats = getPlayerStats(playerAddress);
  
  const newStats: PlayerStats = {
    totalGames: currentStats.totalGames + 1,
    bestScore: Math.max(currentStats.bestScore, score),
    gamesWon: currentStats.gamesWon + (won ? 1 : 0),
    totalScore: currentStats.totalScore + score,
    lastUpdated: Date.now()
  };
  
  savePlayerStats(playerAddress, newStats);
  return newStats;
}

/**
 * Resetea las estadísticas del jugador
 */
export function resetPlayerStats(playerAddress: string): void {
  const defaultStats: PlayerStats = {
    totalGames: 0,
    bestScore: 0,
    gamesWon: 0,
    totalScore: 0,
    lastUpdated: Date.now()
  };
  
  savePlayerStats(playerAddress, defaultStats);
}

/**
 * Obtiene estadísticas globales (todos los jugadores)
 */
export function getAllPlayerStats(): { [playerAddress: string]: PlayerStats } {
  const allStats: { [playerAddress: string]: PlayerStats } = {};
  
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(STORAGE_KEY)) {
        const playerAddress = key.replace(`${STORAGE_KEY}-`, '');
        const stats = getPlayerStats(playerAddress);
        allStats[playerAddress] = stats;
      }
    }
  } catch (error) {
    console.warn('Error loading all player stats:', error);
  }
  
  return allStats;
}
