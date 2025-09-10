// Base de datos compartida para juegos (en memoria)
// En producción esto debería ser una base de datos real como PostgreSQL o MongoDB

export type GameMode = 'practice' | 'bet';

export interface Game {
  id: number;
  player: string;
  mode: GameMode;
  status: 'pending' | 'won' | 'lost' | 'claimed';
  score: number;
  createdAt: number;
  claimedAt?: number;
}

// Base de datos en memoria - separada por modo de juego
let practiceGames: Game[] = [];
let betGames: Game[] = [];
let nextGameId = 1;
let activeGames: { [player: string]: number } = {}; // player -> gameId

export const gameDatabase = {
  // Crear un nuevo juego
  createGame(player: string, mode: GameMode = 'bet'): Game {
    const gameId = nextGameId++;
    const newGame: Game = {
      id: gameId,
      player,
      mode,
      status: 'pending',
      score: 0,
      createdAt: Date.now()
    };

    // Agregar a la colección correspondiente
    if (mode === 'practice') {
      practiceGames.push(newGame);
    } else {
      betGames.push(newGame);
    }
    
    activeGames[player] = gameId;
    return newGame;
  },

  // Obtener un juego por ID
  getGame(gameId: number): Game | undefined {
    return [...practiceGames, ...betGames].find(game => game.id === gameId);
  },

  // Actualizar un juego
  updateGame(gameId: number, updates: Partial<Game>): Game | null {
    // Buscar en practice games
    let gameIndex = practiceGames.findIndex(game => game.id === gameId);
    if (gameIndex !== -1) {
      practiceGames[gameIndex] = { ...practiceGames[gameIndex], ...updates };
      return practiceGames[gameIndex];
    }

    // Buscar en bet games
    gameIndex = betGames.findIndex(game => game.id === gameId);
    if (gameIndex !== -1) {
      betGames[gameIndex] = { ...betGames[gameIndex], ...updates };
      return betGames[gameIndex];
    }

    return null;
  },

  // Obtener juegos de un jugador (todos los modos)
  getPlayerGames(player: string, limit?: number): Game[] {
    let playerGames = [...practiceGames, ...betGames].filter(game => game.player === player);
    playerGames.sort((a, b) => b.createdAt - a.createdAt); // Más recientes primero
    
    if (limit) {
      playerGames = playerGames.slice(0, limit);
    }
    
    return playerGames;
  },

  // Obtener juegos de un jugador por modo específico
  getPlayerGamesByMode(player: string, mode: GameMode, limit?: number): Game[] {
    const games = mode === 'practice' ? practiceGames : betGames;
    let playerGames = games.filter(game => game.player === player);
    playerGames.sort((a, b) => b.createdAt - a.createdAt); // Más recientes primero
    
    if (limit) {
      playerGames = playerGames.slice(0, limit);
    }
    
    return playerGames;
  },

  // Obtener juegos reclamables de un jugador (solo bet mode)
  getClaimableGames(player: string): Game[] {
    return betGames.filter(
      game => game.player === player && 
              game.status === 'won' && 
              game.score >= 50
    );
  },

  // Obtener estadísticas combinadas para Home Tab
  getCombinedStats(player: string): {
    totalGames: number;
    totalScore: number;
    bestScore: number;
    gamesWon: number;
  } {
    const allGames = [...practiceGames, ...betGames].filter(game => game.player === player);
    
    return {
      totalGames: allGames.length,
      totalScore: allGames.reduce((sum, game) => sum + game.score, 0),
      bestScore: Math.max(...allGames.map(game => game.score), 0),
      gamesWon: allGames.filter(game => game.status === 'won').length
    };
  },

  // Verificar si un jugador tiene un juego activo
  hasActiveGame(player: string): boolean {
    return activeGames[player] !== undefined;
  },

  // Liberar juego activo
  releaseActiveGame(player: string): void {
    delete activeGames[player];
  },

  // Obtener todos los juegos (para debugging)
  getAllGames(): Game[] {
    return [...practiceGames, ...betGames];
  },

  // Obtener juegos por modo (para debugging)
  getGamesByMode(mode: GameMode): Game[] {
    return mode === 'practice' ? [...practiceGames] : [...betGames];
  },

  // Limpiar base de datos (para testing)
  clear(): void {
    practiceGames = [];
    betGames = [];
    nextGameId = 1;
    activeGames = {};
  }
};
