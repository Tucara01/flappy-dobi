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
      return;
    }

    this.isRunning = true;

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
  }

  /**
   * Verifica todos los juegos activos
   */
  private async checkGames(): Promise<void> {
    try {
      const response = await fetch(`${this.config.apiBaseUrl}/api/games/bet/monitor?status=active`);
      
      if (!response.ok) {
        return;
      }

      const data = await response.json();
      const activeGames: BetGame[] = data.games || [];

      for (const game of activeGames) {
        await this.checkGame(game);
      }

    } catch (error) {
      // Silently handle errors
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
        await this.updateGameStatus(game.gameId, 0, 'lost');
        return;
      }

    } catch (error) {
      // Silently handle errors
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

      if (!response.ok) {
        // Silently handle update errors
      }

    } catch (error) {
      // Silently handle errors
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
