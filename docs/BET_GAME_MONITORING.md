# Sistema de Monitoreo de Juegos Bet Mode

Este documento describe cómo funciona el sistema de monitoreo para juegos de bet mode en Flappy DOBI.

## Descripción General

Cuando un jugador crea una partida en modo bet:
1. Se deposita 1 USDC en el contrato inteligente
2. Se genera un GAME_ID único
3. El backend registra el juego para monitoreo
4. El backend monitorea el progreso del juego
5. Cuando el jugador alcanza 50+ puntos o pierde, el backend actualiza el estado

## Flujo de Trabajo

### 1. Creación de Juego Bet Mode

```typescript
// En FlappyBirdGame.tsx
const createGame = async (mode: 'bet') => {
  // 1. Depositar USDC y crear juego en contrato
  const contractHash = await depositAndCreateGame();
  
  // 2. Obtener gameId del contrato
  const gameId = contractGameId;
  
  // 3. Registrar en backend para monitoreo
  await fetch('/api/games/bet', {
    method: 'POST',
    body: JSON.stringify({
      gameId,
      playerAddress,
      contractHash,
      mode: 'bet',
      status: 'active'
    })
  });
}
```

### 2. Monitoreo de Progreso

El backend puede monitorear juegos activos usando:

```bash
# Obtener todos los juegos activos
GET /api/games/bet/monitor?status=active

# Obtener juegos completados
GET /api/games/bet/monitor?status=completed

# Obtener todos los juegos
GET /api/games/bet/monitor?status=all
```

### 3. Actualización de Estado

Cuando el jugador gana (50+ puntos) o pierde:

```typescript
// En FlappyBirdGame.tsx - Cuando gana
await fetch('/api/games/bet', {
  method: 'PUT',
  body: JSON.stringify({
    gameId: contractGameId,
    score: newScore,
    result: 'won'
  })
});

// En FlappyBirdGame.tsx - Cuando pierde
await fetch('/api/games/bet', {
  method: 'PUT',
  body: JSON.stringify({
    gameId: contractGameId,
    score: prev.score,
    result: 'lost'
  })
});
```

## Endpoints de API

### POST /api/games/bet
Registra un nuevo juego de bet mode.

**Request:**
```json
{
  "gameId": 123,
  "playerAddress": "0x...",
  "contractHash": "0x...",
  "mode": "bet",
  "status": "active"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Bet game registered for monitoring",
  "gameId": 123
}
```

### GET /api/games/bet?gameId=123
Obtiene información de un juego específico.

### PUT /api/games/bet
Actualiza el estado de un juego.

**Request:**
```json
{
  "gameId": 123,
  "score": 50,
  "result": "won"
}
```

### GET /api/games/bet/monitor
Obtiene todos los juegos para monitoreo.

**Query Parameters:**
- `status`: 'active', 'completed', 'all'

### POST /api/games/bet/monitor/control
Controla el monitor automático.

**Request:**
```json
{
  "action": "start" // o "stop", "status"
}
```

## Monitor Automático

El sistema incluye un monitor automático que puede:

1. **Verificar juegos activos** cada 30 segundos
2. **Detectar juegos expirados** (más de 5 minutos)
3. **Actualizar estados** automáticamente
4. **Proporcionar estadísticas** en tiempo real

### Iniciar Monitor

```bash
curl -X POST http://localhost:3000/api/games/bet/monitor/control \
  -H "Content-Type: application/json" \
  -d '{"action": "start"}'
```

### Obtener Estadísticas

```bash
curl http://localhost:3000/api/games/bet/monitor/control
```

## Configuración

El monitor se puede configurar en `src/lib/betGameMonitor.ts`:

```typescript
export const defaultConfig: MonitorConfig = {
  checkInterval: 30000,    // 30 segundos
  maxGameDuration: 300000, // 5 minutos
  apiBaseUrl: process.env.NEXT_PUBLIC_URL || 'http://localhost:3000'
};
```

## Integración con Contrato Inteligente

El backend debe integrarse con el contrato inteligente para:

1. **Verificar el estado del juego** en el contrato
2. **Llamar a `setResult(gameId, true)`** cuando el jugador gana
3. **Llamar a `setResult(gameId, false)`** cuando el jugador pierde
4. **Permitir que el jugador reclame recompensas** con `claimWinnings(gameId)`

## Logs y Debugging

El sistema genera logs detallados para debugging:

```
Bet game registered: ID 123, Player: 0x...
Game 123: Player 0x..., Age: 45000ms
Game 123 updated: won with score 50
```

## Consideraciones de Seguridad

1. **Validación de datos**: Todos los inputs son validados
2. **Rate limiting**: Implementar límites de velocidad para las APIs
3. **Autenticación**: Agregar autenticación para endpoints de control
4. **Logs de auditoría**: Mantener logs de todas las operaciones

## Próximos Pasos

1. **Base de datos persistente**: Reemplazar Map en memoria con base de datos
2. **Webhooks**: Implementar webhooks para notificaciones en tiempo real
3. **Métricas**: Agregar métricas detalladas y dashboards
4. **Alertas**: Sistema de alertas para juegos problemáticos
5. **Escalabilidad**: Implementar clustering para múltiples instancias
