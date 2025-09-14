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

// Claves para localStorage
const PRACTICE_GAMES_KEY = 'flappy-dobi-practice-games';
const BET_GAMES_KEY = 'flappy-dobi-bet-games';
const NEXT_GAME_ID_KEY = 'flappy-dobi-next-game-id';
const ACTIVE_GAMES_KEY = 'flappy-dobi-active-games';

// Cargar datos desde localStorage al inicializar
function loadFromStorage() {
  // Solo ejecutar en el cliente (navegador)
  if (typeof window === 'undefined') {
    return;
  }
  
  try {
    const storedPractice = localStorage.getItem(PRACTICE_GAMES_KEY);
    const storedBet = localStorage.getItem(BET_GAMES_KEY);
    const storedNextId = localStorage.getItem(NEXT_GAME_ID_KEY);
    const storedActive = localStorage.getItem(ACTIVE_GAMES_KEY);
    
    if (storedPractice) {
      practiceGames = JSON.parse(storedPractice);
    }
    if (storedBet) {
      betGames = JSON.parse(storedBet);
    }
    if (storedNextId) {
      nextGameId = parseInt(storedNextId);
    }
    if (storedActive) {
      activeGames = JSON.parse(storedActive);
    }
    
    console.log(`📊 Loaded from storage: ${practiceGames.length} practice games, ${betGames.length} bet games, nextId: ${nextGameId}`);
  } catch (error) {
    console.warn('Error loading games from storage:', error);
  }
}

// Guardar datos en localStorage
function saveToStorage() {
  // Solo ejecutar en el cliente (navegador)
  if (typeof window === 'undefined') {
    return;
  }
  
  try {
    localStorage.setItem(PRACTICE_GAMES_KEY, JSON.stringify(practiceGames));
    localStorage.setItem(BET_GAMES_KEY, JSON.stringify(betGames));
    localStorage.setItem(NEXT_GAME_ID_KEY, nextGameId.toString());
    localStorage.setItem(ACTIVE_GAMES_KEY, JSON.stringify(activeGames));
  } catch (error) {
    console.warn('Error saving games to storage:', error);
  }
}

// Cargar datos al inicializar
loadFromStorage();

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
    
    // Guardar en localStorage
    saveToStorage();
    
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
      // Guardar en localStorage
      saveToStorage();
      return practiceGames[gameIndex];
    }

    // Buscar en bet games
    gameIndex = betGames.findIndex(game => game.id === gameId);
    if (gameIndex !== -1) {
      betGames[gameIndex] = { ...betGames[gameIndex], ...updates };
      // Guardar en localStorage
      saveToStorage();
      return betGames[gameIndex];
    }

    return null;
  },

  // Obtener juegos de un jugador (todos los modos)
  getPlayerGames(player: string, limit?: number): Game[] {
    console.log(`🔍 Searching for games for player: ${player}`);
    console.log(`📊 Practice games: ${practiceGames.length}, Bet games: ${betGames.length}`);
    
    let playerGames = [...practiceGames, ...betGames].filter(game => {
      const matches = game.player.toLowerCase() === player.toLowerCase();
      console.log(`🎮 Game ${game.id}: player="${game.player}", matches=${matches}`);
      return matches;
    });
    
    console.log(`✅ Found ${playerGames.length} games for player`);
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
              game.score >= 49
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
    // Limpiar también localStorage (solo en cliente)
    if (typeof window !== 'undefined') {
      localStorage.removeItem(PRACTICE_GAMES_KEY);
      localStorage.removeItem(BET_GAMES_KEY);
      localStorage.removeItem(NEXT_GAME_ID_KEY);
      localStorage.removeItem(ACTIVE_GAMES_KEY);
    }
  }
};
