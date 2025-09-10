# 🧪 Pruebas del Smart Contract FlappyDobiVsScore

Este documento explica cómo probar el smart contract usando una red local con Hardhat.

## 📋 Prerrequisitos

1. **Node.js** (versión 18 o superior)
2. **npm** o **yarn**

## 🚀 Instalación

1. **Instalar dependencias de Hardhat:**
```bash
npm install
```

2. **Compilar los contratos:**
```bash
npm run compile
```

## 🏗️ Despliegue en Red Local

1. **Iniciar la red local de Hardhat:**
```bash
npx hardhat node
```
Esto iniciará una red local en `http://127.0.0.1:8545`

2. **En otra terminal, desplegar los contratos:**
```bash
npm run deploy:contract
```

3. **Copiar las direcciones generadas al archivo `.env`:**
```bash
# Ejemplo de salida:
NEXT_PUBLIC_CONTRACT_ADDRESS=0x5FbDB2315678afecb367f032d93F642f64180aa3
NEXT_PUBLIC_USDC_ADDRESS=0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512
CONTRACT_ADDRESS=0x5FbDB2315678afecb367f032d93F642f64180aa3
PRIVATE_KEY=0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80
RPC_URL=http://127.0.0.1:8545
```

## 🧪 Ejecutar Pruebas

1. **Probar el contrato:**
```bash
npm run test:contract
```

2. **Verificar que todo funciona:**
   - ✅ Aprobación de USDC
   - ✅ Creación de juego
   - ✅ Establecimiento de resultado
   - ✅ Reclamación de premio

## 🔧 Flujo de Prueba

1. **Depositar 1 USDC** → Se crea la partida
2. **Jugar** → Frontend maneja la lógica del juego
3. **Alcanzar 50+ puntos** → Backend evalúa y llama al contrato
4. **Reclamar 2 USDC** → Usuario reclama el premio

## 📁 Estructura de Archivos

```
contracts/
├── FlappyDobiVsScore.sol    # Contrato principal
└── MockUSDC.sol             # Token USDC simulado

scripts/
├── deploy.js                # Script de despliegue
└── test.js                  # Script de pruebas

hardhat.config.js            # Configuración de Hardhat
```

## 🎮 Integración con el Frontend

Una vez desplegado el contrato:

1. **Actualizar `.env`** con las direcciones del contrato
2. **Iniciar el frontend:**
```bash
npm run dev
```

3. **Probar el flujo completo:**
   - Ir a modo "Bet"
   - Depositar 1 USDC
   - Jugar y alcanzar 50+ puntos
   - Ir a pestaña "Claim" para reclamar premio

## 🐛 Solución de Problemas

### Error: "Cannot find module 'hardhat'"
```bash
npm install hardhat @nomicfoundation/hardhat-toolbox
```

### Error: "Contract not deployed"
```bash
# Asegúrate de que la red local esté corriendo
npx hardhat node
```

### Error: "Insufficient balance"
```bash
# El script de despliegue mintea 1000 USDC automáticamente
# Si necesitas más, modifica el script deploy.js
```

## 📊 Estados del Juego

- **0**: Pending (Esperando resultado)
- **1**: Won (Ganó, puede reclamar)
- **2**: Lost (Perdió, pierde el USDC)
- **3**: Claimed (Ya reclamó el premio)

## 🔐 Seguridad

- **NUNCA** uses la clave privada de Hardhat en producción
- **Siempre** usa claves privadas reales solo en redes de prueba
- **Verifica** que el contrato esté desplegado correctamente antes de usar

## 🎉 ¡Listo!

Con estos pasos puedes probar completamente el smart contract en una red local sin necesidad de Sepolia o mainnet.
