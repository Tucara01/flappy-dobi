/**
 * Sistema simple de estadísticas usando localStorage
 * Almacena las estadísticas del jugador de forma local y persistente
 */

import { gameDatabase } from './gameDatabase';

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
  won: boolean = false,
  gameMode: 'practice' | 'bet' = 'practice'
): PlayerStats {
  const currentStats = getPlayerStats(playerAddress);
  
  const newStats: PlayerStats = {
    totalGames: currentStats.totalGames + 1,
    bestScore: Math.max(currentStats.bestScore, score),
    gamesWon: currentStats.gamesWon + (won ? 1 : 0),
    totalScore: currentStats.totalScore + score,
    lastUpdated: Date.now()
  };
  
  // Guardar estadísticas en localStorage
  savePlayerStats(playerAddress, newStats);
  
  // También guardar la partida en la base de datos para el historial
  try {
    console.log(`🎮 Saving game to database: Player: ${playerAddress}, Score: ${score}, Won: ${won}, Mode: ${gameMode}`);
    
    // Crear un nuevo juego en la base de datos
    const game = gameDatabase.createGame(playerAddress, gameMode);
    
    // Actualizar el juego con el resultado final
    gameDatabase.updateGame(game.id, {
      status: won ? 'won' : 'lost',
      score: score
    });
    
    console.log(`✅ Game saved to database: ID ${game.id}, Score: ${score}, Won: ${won}, Mode: ${gameMode}`);
  } catch (error) {
    console.error('❌ Error saving game to database:', error);
  }
  
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
