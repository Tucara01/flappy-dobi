// Base de datos compartida para juegos (en memoria)
// En producción esto debería ser una base de datos real como PostgreSQL o MongoDB

export interface Game {
  id: number;
  player: string;
  status: 'pending' | 'won' | 'lost' | 'claimed';
  score: number;
  createdAt: number;
  claimedAt?: number;
}

// Base de datos en memoria
let games: Game[] = [];
let nextGameId = 1;
let activeGames: { [player: string]: number } = {}; // player -> gameId

export const gameDatabase = {
  // Crear un nuevo juego
  createGame(player: string): Game {
    const gameId = nextGameId++;
    const newGame: Game = {
      id: gameId,
      player,
      status: 'pending',
      score: 0,
      createdAt: Date.now()
    };

    games.push(newGame);
    activeGames[player] = gameId;
    return newGame;
  },

  // Obtener un juego por ID
  getGame(gameId: number): Game | undefined {
    return games.find(game => game.id === gameId);
  },

  // Actualizar un juego
  updateGame(gameId: number, updates: Partial<Game>): Game | null {
    const gameIndex = games.findIndex(game => game.id === gameId);
    if (gameIndex === -1) return null;

    games[gameIndex] = { ...games[gameIndex], ...updates };
    return games[gameIndex];
  },

  // Obtener juegos de un jugador
  getPlayerGames(player: string, limit?: number): Game[] {
    let playerGames = games.filter(game => game.player === player);
    playerGames.sort((a, b) => b.createdAt - a.createdAt); // Más recientes primero
    
    if (limit) {
      playerGames = playerGames.slice(0, limit);
    }
    
    return playerGames;
  },

  // Obtener juegos reclamables de un jugador
  getClaimableGames(player: string): Game[] {
    return games.filter(
      game => game.player === player && 
              game.status === 'won' && 
              game.score >= 50
    );
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
    return [...games];
  },

  // Limpiar base de datos (para testing)
  clear(): void {
    games = [];
    nextGameId = 1;
    activeGames = {};
  }
};
