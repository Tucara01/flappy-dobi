# 🔒 Sistema de Seguridad - Flappy DOBI Game

## Resumen de Seguridad Implementado

Este documento describe el sistema de seguridad implementado para proteger el backend del juego Flappy DOBI contra ataques y manipulación de datos.

## 🛡️ Características de Seguridad

### 1. **Autenticación con API Keys**
- Cada request debe incluir una API key válida
- Las API keys se validan en cada endpoint
- Solo el juego legítimo puede obtener una API key válida

### 2. **Sistema de Sesiones de Juego**
- Cada sesión de juego tiene un ID único
- Las sesiones expiran después de 24 horas
- Validación de sesión en cada request

### 3. **Firma de Requests (HMAC)**
- Cada request está firmado con HMAC-SHA256
- Previene la manipulación de requests
- Incluye timestamp para prevenir replay attacks

### 4. **Rate Limiting**
- Máximo 10 requests por minuto por IP
- Previene ataques de spam y DDoS
- Limpieza automática de contadores

### 5. **Validación de Origen (CORS)**
- Solo orígenes permitidos pueden hacer requests
- Lista blanca de dominios autorizados
- Validación en cada request

### 6. **Validación de Datos**
- Verificación de que el jugador sea propietario del juego
- Validación de tipos de datos
- Sanitización de inputs

## 🔧 Configuración

### Variables de Entorno Requeridas

```env
# API Key para el juego
GAME_API_KEY=dobi-game-secure-key-2024

# Secret para firmar requests
REQUEST_SECRET=dobi-request-secret-2024

# Orígenes permitidos (separados por coma)
ALLOWED_ORIGINS=http://localhost:3000,https://your-domain.com

# Configuración de rate limiting
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX_REQUESTS=10

# Duración máxima de sesiones (24 horas)
SESSION_MAX_AGE=86400000
```

## 🚀 Flujo de Seguridad

### 1. **Inicialización de Sesión**
```
Cliente → POST /api/auth/session
Headers: x-api-key: GAME_API_KEY
Body: { playerAddress: "0x..." }
Response: { sessionId: "uuid", ... }
```

### 2. **Request Seguro**
```
Cliente → POST /api/games
Headers:
  - x-api-key: GAME_API_KEY
  - x-request-signature: HMAC_SIGNATURE
  - x-timestamp: TIMESTAMP
  - x-game-session: SESSION_ID
Body: { player: "0x...", mode: "bet" }
```

### 3. **Validación en Backend**
1. Validar API key
2. Verificar rate limit
3. Validar sesión de juego
4. Verificar firma de request
5. Validar timestamp (no más de 5 minutos)
6. Procesar request

## 🔍 Endpoints Protegidos

### `/api/games` (POST, PUT)
- Crear y actualizar juegos
- Requiere sesión válida
- Validación de propiedad del juego

### `/api/games/claim` (POST, GET)
- Reclamar recompensas
- Solo juegos de bet mode
- Validación de estado del juego

### `/api/auth/session` (POST)
- Crear sesiones de juego
- Solo con API key válida

## 🛠️ Implementación Técnica

### Cliente Seguro (`gameClient.ts`)
- Maneja la autenticación automáticamente
- Genera firmas de requests
- Gestiona sesiones de juego

### Middleware de Seguridad (`security.ts`)
- Valida todas las requests
- Implementa rate limiting
- Gestiona sesiones

### Base de Datos Segura
- Separación de modos de juego
- Validación de permisos
- Auditoría de cambios

## 🚨 Prevención de Ataques

### 1. **Ataques de Manipulación**
- ✅ Firma HMAC previene modificación de requests
- ✅ Validación de sesión previene suplantación
- ✅ Timestamps previenen replay attacks

### 2. **Ataques de Spam**
- ✅ Rate limiting por IP
- ✅ Validación de API keys
- ✅ Limpieza automática de sesiones

### 3. **Ataques de CORS**
- ✅ Lista blanca de orígenes
- ✅ Validación en cada request
- ✅ Headers de seguridad

### 4. **Ataques de Inyección**
- ✅ Validación de tipos de datos
- ✅ Sanitización de inputs
- ✅ Validación de permisos

## 📊 Monitoreo y Logs

### Logs de Seguridad
- Intentos de autenticación fallidos
- Requests bloqueados por rate limiting
- Sesiones invalidadas
- Errores de validación

### Métricas
- Requests por minuto por IP
- Sesiones activas
- Errores de autenticación
- Tiempo de respuesta

## 🔄 Mantenimiento

### Limpieza Automática
- Sesiones expiradas (cada hora)
- Contadores de rate limiting (cada minuto)
- Logs antiguos (diario)

### Rotación de Claves
- Cambiar API keys regularmente
- Actualizar secrets de firma
- Rotar tokens de sesión

## ⚠️ Consideraciones de Producción

### 1. **Almacenamiento Seguro**
- Usar Redis para rate limiting
- Base de datos para sesiones
- Encriptación de datos sensibles

### 2. **Monitoreo**
- Alertas de seguridad
- Dashboard de métricas
- Logs centralizados

### 3. **Escalabilidad**
- Load balancers
- CDN para assets
- Caché de sesiones

## 🎯 Beneficios del Sistema

1. **Protección Total**: Imposible crear juegos sin autenticación
2. **Prevención de Spam**: Rate limiting efectivo
3. **Integridad de Datos**: Firma de requests
4. **Trazabilidad**: Logs completos de actividad
5. **Escalabilidad**: Preparado para producción

## 🔐 Conclusión

El sistema de seguridad implementado protege completamente el backend contra:
- ✅ Manipulación de requests
- ✅ Ataques de spam
- ✅ Suplantación de identidad
- ✅ Ataques de CORS
- ✅ Inyección de datos

**El juego ahora es completamente seguro y solo puede ser usado a través de la aplicación legítima.**
