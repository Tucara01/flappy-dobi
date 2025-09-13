# Troubleshooting: Uniswap Widget en tu Proyecto DOBI

## Problemas Específicos de tu Configuración

### 1. Error: "Cannot resolve '@uniswap/widgets/fonts.css'"

**Síntoma**: Error de build o importación de fuentes.

**Solución**:
```tsx
// ❌ Incorrecto
import '@uniswap/widgets/fonts.css';

// ✅ Correcto - Verifica que el paquete esté instalado
npm list @uniswap/widgets

// Si no está instalado:
npm install @uniswap/widgets
```

### 2. Widget se renderiza pero no funciona en Base

**Síntoma**: Widget aparece pero no puede conectar a la red Base.

**Solución**:
```tsx
// Verifica tu configuración RPC
const jsonRpcUrlMap = {
  8453: [
    'https://mainnet.base.org', // URL principal
    'https://base-mainnet.g.alchemyapi.io/v2/YOUR_KEY', // Backup
  ],
};

// Añade logs para debugging
console.log('RPC URLs for Base:', jsonRpcUrlMap[8453]);
```

### 3. DOBI Token no aparece en la lista

**Síntoma**: No puedes seleccionar DOBI como token de salida.

**Solución**:
```tsx
// Configura el token por defecto
<SwapWidget
  jsonRpcUrlMap={jsonRpcUrlMap}
  defaultChainId={8453}
  defaultOutputTokenAddress="0x931ef8053e997b1bab68d1e900a061305c0ff4fb"
  defaultInputTokenAddress="NATIVE"
  // ... resto de props
/>
```

### 4. Error de wallet connection con wagmi

**Síntoma**: Widget no detecta tu wallet conectada.

**Solución**:
```tsx
// Pasa el provider correctamente
const getProvider = () => {
  if (typeof window !== 'undefined' && window.ethereum) {
    return window.ethereum;
  }
  return null;
};

// En el widget
<SwapWidget
  provider={getProvider()}
  // ... resto de props
/>
```

### 5. Transacciones se quedan pendientes en Base

**Síntoma**: Las transacciones no se confirman.

**Solución**:
```tsx
// Ajusta el slippage para L2
<SwapWidget
  defaultSlippage={0.5} // 0.5% para Base
  maxSlippage={5.0}     // 5% máximo
  // ... resto de props
/>
```

### 6. Error de CSS con Tailwind

**Síntoma**: Estilos del widget interfieren con Tailwind.

**Solución**:
```tsx
// Envuelve el widget en un contenedor aislado
<div className="uniswap-widget-wrapper">
  <SwapWidget {...props} />
</div>

// En tu CSS global
.uniswap-widget-wrapper {
  isolation: isolate;
  contain: layout style;
}
```

### 7. Error de build en Next.js

**Síntoma**: Error durante el build de producción.

**Solución**:
```tsx
// Usa importación dinámica
import dynamic from 'next/dynamic';

const SwapWidget = dynamic(
  () => import('@uniswap/widgets').then(mod => ({ default: mod.SwapWidget })),
  { 
    ssr: false,
    loading: () => <div>Loading widget...</div>
  }
);
```

### 8. Rate limit en RPC endpoints

**Síntoma**: Errores de "too many requests".

**Solución**:
```tsx
// Usa múltiples endpoints y tus propias keys
const jsonRpcUrlMap = {
  8453: [
    'https://base-mainnet.g.alchemy.com/v2/YOUR_ALCHEMY_KEY',
    'https://mainnet.base.org',
    'https://base.blockpi.network/v1/rpc/public',
  ],
};
```

## Debugging Avanzado

### 1. Habilitar logs detallados

```tsx
<SwapWidget
  {...props}
  onError={(error) => {
    console.group('🚨 Uniswap Widget Error');
    console.error('Error object:', error);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    console.groupEnd();
  }}
  onSwapPriceUpdate={(prices) => {
    console.log('💰 Price Update:', prices);
  }}
  onSwapAmountUpdate={(amounts) => {
    console.log('📊 Amount Update:', amounts);
  }}
/>
```

### 2. Verificar estado de la red

```tsx
// Añade este hook para monitorear la red
useEffect(() => {
  const checkNetwork = async () => {
    if (window.ethereum) {
      try {
        const chainId = await window.ethereum.request({ method: 'eth_chainId' });
        console.log('Current chain ID:', parseInt(chainId, 16));
        console.log('Expected chain ID:', 8453);
      } catch (error) {
        console.error('Error checking network:', error);
      }
    }
  };
  
  checkNetwork();
}, []);
```

### 3. Verificar balance de ETH

```tsx
// Verifica que el usuario tenga ETH para gas
useEffect(() => {
  const checkBalance = async () => {
    if (address && window.ethereum) {
      try {
        const balance = await window.ethereum.request({
          method: 'eth_getBalance',
          params: [address, 'latest'],
        });
        const ethBalance = parseInt(balance, 16) / 1e18;
        console.log('ETH Balance:', ethBalance);
        
        if (ethBalance < 0.001) {
          console.warn('⚠️ Low ETH balance for gas');
        }
      } catch (error) {
        console.error('Error checking balance:', error);
      }
    }
  };
  
  checkBalance();
}, [address]);
```

## Comandos de Debugging

### 1. Verificar instalación de dependencias

```bash
# Verificar versión de @uniswap/widgets
npm list @uniswap/widgets

# Verificar conflictos de React
npm ls react
npm ls react-dom

# Limpiar cache si hay problemas
npm cache clean --force
rm -rf node_modules package-lock.json
npm install
```

### 2. Verificar configuración de red

```bash
# Verificar conexión a Base RPC
curl -X POST \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}' \
  https://mainnet.base.org
```

### 3. Verificar token DOBI

```bash
# Verificar contrato DOBI en Base
curl -X POST \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"eth_call","params":[{"to":"0x931ef8053e997b1bab68d1e900a061305c0ff4fb","data":"0x06fdde03"},"latest"],"id":1}' \
  https://mainnet.base.org
```

## Soluciones Rápidas

### 1. Widget en blanco
```tsx
// Añade un fallback visual
{!isWidgetLoaded && (
  <div className="w-full h-96 bg-gray-800 rounded-lg flex items-center justify-center">
    <div className="text-center">
      <div className="animate-spin w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
      <p className="text-gray-400">Loading Uniswap widget...</p>
    </div>
  </div>
)}
```

### 2. Error de provider
```tsx
// Verifica que el provider esté disponible
const getProvider = () => {
  if (typeof window !== 'undefined' && window.ethereum) {
    return window.ethereum;
  }
  
  // Fallback para desarrollo
  if (process.env.NODE_ENV === 'development') {
    console.warn('No wallet provider found');
  }
  
  return null;
};
```

### 3. Error de red
```tsx
// Función para cambiar a Base automáticamente
const ensureBaseNetwork = async () => {
  try {
    await window.ethereum.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: '0x2105' }],
    });
  } catch (error: any) {
    if (error.code === 4902) {
      await window.ethereum.request({
        method: 'wallet_addEthereumChain',
        params: [BASE_NETWORK_CONFIG],
      });
    }
  }
};
```

## Contacto y Soporte

Si sigues teniendo problemas:

1. **Revisa los logs de la consola** para errores específicos
2. **Verifica tu configuración** con el archivo `uniswap-config.ts`
3. **Prueba en diferentes wallets** (MetaMask, Coinbase, etc.)
4. **Contacta al equipo** en Discord de Uniswap
5. **Revisa la documentación** oficial de Uniswap

**💡 Tip Final**: Siempre prueba en una red de test primero antes de usar mainnet.
