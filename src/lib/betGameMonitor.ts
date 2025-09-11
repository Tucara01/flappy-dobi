/**
 * Monitor para juegos de bet mode
 * Este módulo puede ser usado por el backend para monitorear juegos activos
 */

export interface BetGame {
  gameId: number;
  playerAddress: string;
  contractHash: string;
  mode: string;
  status: string;
  createdAt: number;
  score?: number;
  result?: 'won' | 'lost';
}

export interface MonitorConfig {
  checkInterval: number; // milisegundos
  maxGameDuration: number; // milisegundos
  apiBaseUrl: string;
}

export class BetGameMonitor {
  private config: MonitorConfig;
  private isRunning: boolean = false;
  private intervalId: NodeJS.Timeout | null = null;

  constructor(config: MonitorConfig) {
    this.config = config;
  }

  /**
   * Inicia el monitoreo de juegos de bet mode
   */
  start(): void {
    if (this.isRunning) {
      console.warn('Bet game monitor is already running');
      return;
    }

    this.isRunning = true;
    console.log('Starting bet game monitor...');

    this.intervalId = setInterval(async () => {
      await this.checkGames();
    }, this.config.checkInterval);
  }

  /**
   * Detiene el monitoreo
   */
  stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this.isRunning = false;
    console.log('Bet game monitor stopped');
  }

  /**
   * Verifica todos los juegos activos
   */
  private async checkGames(): Promise<void> {
    try {
      const response = await fetch(`${this.config.apiBaseUrl}/api/games/bet/monitor?status=active`);
      
      if (!response.ok) {
        console.error('Failed to fetch active games:', response.statusText);
        return;
      }

      const data = await response.json();
      const activeGames: BetGame[] = data.games || [];

      console.log(`Checking ${activeGames.length} active bet games...`);

      for (const game of activeGames) {
        await this.checkGame(game);
      }

    } catch (error) {
      console.error('Error checking games:', error);
    }
  }

  /**
   * Verifica un juego específico
   */
  private async checkGame(game: BetGame): Promise<void> {
    try {
      const now = Date.now();
      const gameAge = now - game.createdAt;

      // Verificar si el juego ha expirado por tiempo
      if (gameAge > this.config.maxGameDuration) {
        console.log(`Game ${game.gameId} expired after ${gameAge}ms`);
        await this.updateGameStatus(game.gameId, 0, 'lost');
        return;
      }

      // Verificar el estado del juego en el contrato inteligente
      // Aquí podrías hacer una llamada al contrato para verificar el estado
      // Por ahora, solo logueamos la información
      console.log(`Game ${game.gameId}: Player ${game.playerAddress}, Age: ${gameAge}ms`);

    } catch (error) {
      console.error(`Error checking game ${game.gameId}:`, error);
    }
  }

  /**
   * Actualiza el estado de un juego
   */
  private async updateGameStatus(gameId: number, score: number, result: 'won' | 'lost'): Promise<void> {
    try {
      const response = await fetch(`${this.config.apiBaseUrl}/api/games/bet`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          gameId,
          score,
          result
        })
      });

      if (response.ok) {
        console.log(`Game ${gameId} updated: ${result} with score ${score}`);
      } else {
        console.error(`Failed to update game ${gameId}:`, await response.text());
      }

    } catch (error) {
      console.error(`Error updating game ${gameId}:`, error);
    }
  }

  /**
   * Obtiene estadísticas del monitor
   */
  async getStats(): Promise<{ active: number; completed: number; total: number }> {
    try {
      const [activeResponse, completedResponse] = await Promise.all([
        fetch(`${this.config.apiBaseUrl}/api/games/bet/monitor?status=active`),
        fetch(`${this.config.apiBaseUrl}/api/games/bet/monitor?status=completed`)
      ]);

      const activeData = await activeResponse.json();
      const completedData = await completedResponse.json();

      return {
        active: activeData.total || 0,
        completed: completedData.total || 0,
        total: (activeData.total || 0) + (completedData.total || 0)
      };

    } catch (error) {
      console.error('Error getting monitor stats:', error);
      return { active: 0, completed: 0, total: 0 };
    }
  }
}

// Configuración por defecto
export const defaultConfig: MonitorConfig = {
  checkInterval: 30000, // 30 segundos
  maxGameDuration: 300000, // 5 minutos
  apiBaseUrl: process.env.NEXT_PUBLIC_URL || 'http://localhost:3000'
};

// Instancia por defecto del monitor
export const betGameMonitor = new BetGameMonitor(defaultConfig);
