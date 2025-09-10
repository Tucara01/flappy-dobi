import crypto from 'crypto';

// Configuración de seguridad
const SECURITY_CONFIG = {
  // API Key para el juego (en producción esto debe estar en variables de entorno)
  GAME_API_KEY: process.env.GAME_API_KEY || 'dobi-game-secure-key-2024',
  
  // Secret para firmar requests
  REQUEST_SECRET: process.env.REQUEST_SECRET || 'dobi-request-secret-2024',
  
  // Rate limiting
  RATE_LIMIT: {
    windowMs: 60 * 1000, // 1 minuto
    maxRequests: 10, // máximo 10 requests por minuto por IP
  },
  
  // Orígenes permitidos
  ALLOWED_ORIGINS: [
    'http://localhost:3000',
    'https://your-domain.com', // Reemplazar con tu dominio de producción
  ],
};

// Store para rate limiting (en producción usar Redis)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

// Interfaces de seguridad
export interface SecurityHeaders {
  'x-api-key': string;
  'x-request-signature': string;
  'x-timestamp': string;
  'x-game-session': string;
}

export interface GameSession {
  sessionId: string;
  playerAddress: string;
  createdAt: number;
  lastActivity: number;
  isValid: boolean;
}

// Store para sesiones de juego (en producción usar Redis)
const gameSessions = new Map<string, GameSession>();

/**
 * Genera una firma HMAC para validar requests
 */
export function generateRequestSignature(
  method: string,
  path: string,
  body: string,
  timestamp: string,
  sessionId: string
): string {
  const data = `${method}:${path}:${body}:${timestamp}:${sessionId}`;
  return crypto
    .createHmac('sha256', SECURITY_CONFIG.REQUEST_SECRET)
    .update(data)
    .digest('hex');
}

/**
 * Valida la firma de un request
 */
export function validateRequestSignature(
  method: string,
  path: string,
  body: string,
  timestamp: string,
  sessionId: string,
  signature: string
): boolean {
  const expectedSignature = generateRequestSignature(method, path, body, timestamp, sessionId);
  return crypto.timingSafeEqual(
    Buffer.from(signature, 'hex'),
    Buffer.from(expectedSignature, 'hex')
  );
}

/**
 * Valida la API key
 */
export function validateApiKey(apiKey: string): boolean {
  return apiKey === SECURITY_CONFIG.GAME_API_KEY;
}

/**
 * Valida el origen de la request
 */
export function validateOrigin(origin: string | null): boolean {
  if (!origin) return false;
  return SECURITY_CONFIG.ALLOWED_ORIGINS.includes(origin);
}

/**
 * Rate limiting por IP
 */
export function checkRateLimit(ip: string): { allowed: boolean; remaining: number } {
  const now = Date.now();
  const windowStart = now - SECURITY_CONFIG.RATE_LIMIT.windowMs;
  
  const current = rateLimitStore.get(ip);
  
  if (!current || current.resetTime < windowStart) {
    // Reset o nueva IP
    rateLimitStore.set(ip, {
      count: 1,
      resetTime: now + SECURITY_CONFIG.RATE_LIMIT.windowMs
    });
    return { allowed: true, remaining: SECURITY_CONFIG.RATE_LIMIT.maxRequests - 1 };
  }
  
  if (current.count >= SECURITY_CONFIG.RATE_LIMIT.maxRequests) {
    return { allowed: false, remaining: 0 };
  }
  
  current.count++;
  return { allowed: true, remaining: SECURITY_CONFIG.RATE_LIMIT.maxRequests - current.count };
}

/**
 * Crea una nueva sesión de juego
 */
export function createGameSession(playerAddress: string): GameSession {
  const sessionId = crypto.randomUUID();
  const session: GameSession = {
    sessionId,
    playerAddress,
    createdAt: Date.now(),
    lastActivity: Date.now(),
    isValid: true
  };
  
  gameSessions.set(sessionId, session);
  return session;
}

/**
 * Valida una sesión de juego
 */
export function validateGameSession(sessionId: string): GameSession | null {
  const session = gameSessions.get(sessionId);
  
  if (!session || !session.isValid) {
    return null;
  }
  
  // Verificar si la sesión no ha expirado (24 horas)
  const maxAge = 24 * 60 * 60 * 1000; // 24 horas
  if (Date.now() - session.createdAt > maxAge) {
    session.isValid = false;
    return null;
  }
  
  // Actualizar última actividad
  session.lastActivity = Date.now();
  return session;
}

/**
 * Invalida una sesión de juego
 */
export function invalidateGameSession(sessionId: string): void {
  const session = gameSessions.get(sessionId);
  if (session) {
    session.isValid = false;
  }
}

/**
 * Limpia sesiones expiradas
 */
export function cleanupExpiredSessions(): void {
  const now = Date.now();
  const maxAge = 24 * 60 * 60 * 1000; // 24 horas
  
  for (const [sessionId, session] of gameSessions.entries()) {
    if (now - session.createdAt > maxAge) {
      gameSessions.delete(sessionId);
    }
  }
}

/**
 * Valida que un request viene del juego legítimo
 */
export function validateGameRequest(
  headers: Headers,
  method: string,
  path: string,
  body: string,
  ip: string
): { valid: boolean; session?: GameSession; error?: string } {
  // 1. Validar API Key
  const apiKey = headers.get('x-api-key');
  if (!apiKey || !validateApiKey(apiKey)) {
    return { valid: false, error: 'Invalid API key' };
  }
  
  // 2. Validar Rate Limit
  const rateLimit = checkRateLimit(ip);
  if (!rateLimit.allowed) {
    return { valid: false, error: 'Rate limit exceeded' };
  }
  
  // 3. Validar sesión de juego
  const sessionId = headers.get('x-game-session');
  if (!sessionId) {
    return { valid: false, error: 'Missing game session' };
  }
  
  const session = validateGameSession(sessionId);
  if (!session) {
    return { valid: false, error: 'Invalid or expired game session' };
  }
  
  // 4. Validar firma de request
  const signature = headers.get('x-request-signature');
  const timestamp = headers.get('x-timestamp');
  
  if (!signature || !timestamp) {
    return { valid: false, error: 'Missing request signature or timestamp' };
  }
  
  // Verificar que el timestamp no sea muy antiguo (5 minutos)
  const requestTime = parseInt(timestamp);
  const now = Date.now();
  if (now - requestTime > 5 * 60 * 1000) {
    return { valid: false, error: 'Request timestamp too old' };
  }
  
  if (!validateRequestSignature(method, path, body, timestamp, sessionId, signature)) {
    return { valid: false, error: 'Invalid request signature' };
  }
  
  return { valid: true, session };
}

/**
 * Middleware de seguridad para APIs
 */
export function createSecurityMiddleware() {
  return async (request: Request, context: { ip?: string }) => {
    const ip = context.ip || 'unknown';
    const method = request.method;
    const url = new URL(request.url);
    const path = url.pathname + url.search;
    const body = await request.text();
    
    const validation = validateGameRequest(
      request.headers,
      method,
      path,
      body,
      ip
    );
    
    if (!validation.valid) {
      return {
        error: validation.error,
        status: 401
      };
    }
    
    return {
      session: validation.session,
      body: body ? JSON.parse(body) : null
    };
  };
}

// Limpiar sesiones expiradas cada hora
setInterval(cleanupExpiredSessions, 60 * 60 * 1000);

export { SECURITY_CONFIG };
