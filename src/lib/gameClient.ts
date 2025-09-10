/**
 * Cliente seguro para el juego
 * Maneja la autenticación y comunicación con el backend
 */

import CryptoJS from 'crypto-js';

// Tipos para las respuestas de la API
export interface Game {
  id: number;
  player: string;
  status: string;
  score: number;
  createdAt: number;
  claimedAt?: number;
  mode: 'practice' | 'bet';
}

export interface ClaimableGamesResponse {
  recentGames: Game[];
  claimableGames: Game[];
  totalRewards: number;
}

export interface ClaimRewardResponse {
  success: boolean;
  gameId: number;
  player: string;
  rewardAmount: number;
  claimedAt: number;
  message: string;
}

// Configuración del cliente
const CLIENT_CONFIG = {
  API_KEY: 'dobi-game-secure-key-2024', // Debe coincidir con el backend
  REQUEST_SECRET: 'dobi-request-secret-2024', // Debe coincidir con el backend
  BASE_URL: process.env.NODE_ENV === 'production' 
    ? 'https://your-domain.com/api' 
    : 'http://localhost:3000/api',
};

// Store para la sesión del juego
let gameSession: {
  sessionId: string;
  playerAddress: string;
  createdAt: number;
} | null = null;

/**
 * Inicializa una sesión de juego
 */
export async function initializeGameSession(playerAddress: string): Promise<{
  success: boolean;
  sessionId?: string;
  error?: string;
}> {
  try {
    console.log('Initializing game session for:', playerAddress);
    console.log('Using BASE_URL:', CLIENT_CONFIG.BASE_URL);
    
    const response = await fetch(`${CLIENT_CONFIG.BASE_URL}/auth/session`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': CLIENT_CONFIG.API_KEY,
      },
      body: JSON.stringify({ playerAddress }),
    });

    console.log('Session response status:', response.status);
    console.log('Session response ok:', response.ok);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Session error response:', errorText);
      let errorData;
      try {
        errorData = JSON.parse(errorText);
      } catch {
        errorData = { error: errorText };
      }
      return { success: false, error: errorData.error || 'Failed to initialize session' };
    }

    const data = await response.json();
    console.log('Session created successfully:', data);
    
    gameSession = {
      sessionId: data.sessionId,
      playerAddress,
      createdAt: Date.now(),
    };

    return { success: true, sessionId: data.sessionId };
  } catch (error) {
    console.error('Error initializing game session:', error);
    return { success: false, error: `Network error: ${error instanceof Error ? error.message : 'Unknown error'}` };
  }
}

/**
 * Genera headers de seguridad para requests
 */
function generateSecurityHeaders(method: string, path: string, body: string): HeadersInit {
  if (!gameSession) {
    throw new Error('Game session not initialized');
  }

  const timestamp = Date.now().toString();
  const signature = generateRequestSignature(method, path, body, timestamp, gameSession.sessionId);

  return {
    'Content-Type': 'application/json',
    'x-api-key': CLIENT_CONFIG.API_KEY,
    'x-request-signature': signature,
    'x-timestamp': timestamp,
    'x-game-session': gameSession.sessionId,
  };
}

/**
 * Genera firma de request usando HMAC-SHA256 (igual que el backend)
 */
function generateRequestSignature(
  method: string,
  path: string,
  body: string,
  timestamp: string,
  sessionId: string
): string {
  const data = `${method}:${path}:${body}:${timestamp}:${sessionId}`;
  return CryptoJS.HmacSHA256(data, CLIENT_CONFIG.REQUEST_SECRET).toString(CryptoJS.enc.Hex);
}

/**
 * Realiza una request segura al backend
 */
async function secureRequest<T = any>(
  method: string,
  endpoint: string,
  data?: any
): Promise<{ success: boolean; data?: T; error?: string }> {
  try {
    if (!gameSession) {
      return { success: false, error: 'Game session not initialized' };
    }

    const body = data ? JSON.stringify(data) : '';
    const path = `/api${endpoint}`;
    
    const response = await fetch(`${CLIENT_CONFIG.BASE_URL}${endpoint}`, {
      method,
      headers: generateSecurityHeaders(method, path, body),
      body: data ? body : undefined,
    });

    if (!response.ok) {
      const error = await response.json();
      return { success: false, error: error.error || 'Request failed' };
    }

    const responseData = await response.json();
    return { success: true, data: responseData };
  } catch (error) {
    console.error('Secure request error:', error);
    return { success: false, error: 'Network error' };
  }
}

/**
 * API del juego con autenticación
 */
export const gameAPI = {
  /**
   * Crear un nuevo juego
   */
  async createGame(playerAddress: string, mode: 'practice' | 'bet' = 'bet') {
    return secureRequest('POST', '/games', { player: playerAddress, mode });
  },

  /**
   * Actualizar puntuación del juego
   */
  async updateGameScore(gameId: number, score: number) {
    return secureRequest('PUT', '/games', { gameId, score });
  },

  /**
   * Marcar juego como ganado
   */
  async markGameWon(gameId: number, score: number) {
    return secureRequest('PUT', '/games', { gameId, score, status: 'won' });
  },

  /**
   * Obtener estadísticas del jugador
   */
  async getPlayerStats(playerAddress: string) {
    return secureRequest('GET', `/games?player=${playerAddress}&stats=true`);
  },

  /**
   * Obtener juegos reclamables
   */
  async getClaimableGames(playerAddress: string) {
    return secureRequest<ClaimableGamesResponse>('GET', `/games/claim?player=${playerAddress}`);
  },

  /**
   * Reclamar recompensa
   */
  async claimReward(gameId: number, playerAddress: string) {
    return secureRequest<ClaimRewardResponse>('POST', '/games/claim', { gameId, player: playerAddress });
  },
};

/**
 * Verifica si la sesión está activa
 */
export function isSessionActive(): boolean {
  if (!gameSession) return false;
  
  // Verificar que la sesión no haya expirado (24 horas)
  const maxAge = 24 * 60 * 60 * 1000;
  return Date.now() - gameSession.createdAt < maxAge;
}

/**
 * Obtiene la sesión actual
 */
export function getCurrentSession() {
  return gameSession;
}

/**
 * Cierra la sesión actual
 */
export function closeSession() {
  gameSession = null;
}
