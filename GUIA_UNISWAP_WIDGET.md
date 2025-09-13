# Guía Completa: Integración del Swap Widget de Uniswap en React

## Tabla de Contenidos
1. [Requisitos Previos](#requisitos-previos)
2. [Instalación Correcta](#instalación-correcta)
3. [Configuración Básica](#configuración-básica)
4. [Integración con Provider Externo](#integración-con-provider-externo)
5. [Personalización de Tema y Lista de Tokens](#personalización-de-tema-y-lista-de-tokens)
6. [Prevención y Resolución de Conflictos](#prevención-y-resolución-de-conflictos)
7. [Buenas Prácticas de Rendimiento y Seguridad](#buenas-prácticas-de-rendimiento-y-seguridad)
8. [FAQ y Troubleshooting](#faq-y-troubleshooting)
9. [Recursos de Apoyo](#recursos-de-apoyo)

---

## Requisitos Previos

### Versiones Mínimas Recomendadas
- **Node.js**: >= 18.0.0
- **React**: >= 18.0.0
- **Next.js**: >= 13.0.0 (si usas Next.js)

### Herramientas de Wallet Compatibles
- **MetaMask**: Versión más reciente
- **WalletConnect**: v2.x
- **Web3Auth**: v6.x+
- **Coinbase Wallet**: Versión más reciente
- **Rainbow Wallet**: Versión más reciente

**💡 Tip de Experto**: Siempre usa la versión más reciente de MetaMask para evitar problemas de compatibilidad.

---

## Instalación Correcta

### Comandos de Instalación

```bash
# Con npm
npm install @uniswap/widgets

# Con yarn
yarn add @uniswap/widgets

# Con pnpm
pnpm add @uniswap/widgets
```

### Importación de Estilos

```typescript
// En tu archivo principal (App.tsx, layout.tsx, o globals.css)
import '@uniswap/widgets/fonts.css'
```

### ⚠️ Advertencia Importante

El repositorio de GitHub de `@uniswap/widgets` está **archivado**, pero el paquete de npm sigue funcionando perfectamente. Esto significa:

- ✅ El paquete npm sigue actualizándose
- ✅ Soporte oficial continúa
- ❌ No hagas pull requests al repo archivado
- ✅ Reporta bugs en Discord de Uniswap

**💡 Tip de Experto**: Ignora los warnings de "archived repository" - el paquete es completamente funcional.

---

## Configuración Básica

### Ejemplo Completo en JSX

```tsx
"use client";

import React, { useMemo } from 'react';
import { SwapWidget } from '@uniswap/widgets';
import '@uniswap/widgets/fonts.css';

export default function UniswapWidget() {
  // Configuración de redes RPC
  const jsonRpcUrlMap = useMemo(() => ({
    // Mainnet
    1: ['https://eth-mainnet.alchemyapi.io/v2/YOUR_API_KEY'],
    // Base (recomendado para tu proyecto)
    8453: ['https://mainnet.base.org'],
    // Polygon
    137: ['https://polygon-rpc.com'],
    // Arbitrum
    42161: ['https://arb1.arbitrum.io/rpc'],
  }), []);

  return (
    <div className="w-full max-w-md mx-auto">
      <SwapWidget
        jsonRpcUrlMap={jsonRpcUrlMap}
        defaultChainId={8453} // Base network
        theme={{
          primary: '#FF007A',
          secondary: '#2172E5',
          interactive: '#2172E5',
          container: '#1A1A1A',
          module: '#2D2D2D',
          accent: '#FF007A',
          outline: '#4D4D4D',
          dialog: '#000000',
          fontFamily: 'Inter, sans-serif',
        }}
      />
    </div>
  );
}
```

**💡 Tip de Experto**: Siempre usa `useMemo` para `jsonRpcUrlMap` para evitar re-renders innecesarios.

---

## Integración con Provider Externo

### Con Ethers.js

```tsx
"use client";

import { ethers } from 'ethers';
import { SwapWidget } from '@uniswap/widgets';
import '@uniswap/widgets/fonts.css';

export default function UniswapWithEthers() {
  const jsonRpcUrlMap = useMemo(() => ({
    1: ['https://eth-mainnet.alchemyapi.io/v2/YOUR_API_KEY'],
    8453: ['https://mainnet.base.org'],
  }), []);

  // Función para obtener el provider
  const getProvider = () => {
    if (typeof window !== 'undefined' && window.ethereum) {
      return new ethers.providers.Web3Provider(window.ethereum);
    }
    return null;
  };

  return (
    <div className="w-full max-w-md mx-auto">
      <SwapWidget
        jsonRpcUrlMap={jsonRpcUrlMap}
        defaultChainId={8453}
        provider={getProvider()}
        theme={{
          primary: '#FF007A',
          secondary: '#2172E5',
          interactive: '#2172E5',
          container: '#1A1A1A',
          module: '#2D2D2D',
          accent: '#FF007A',
          outline: '#4D4D4D',
          dialog: '#000000',
          fontFamily: 'Inter, sans-serif',
        }}
      />
    </div>
  );
}
```

### Con Web3Auth (Login por Email)

```tsx
"use client";

import { useEffect, useState } from 'react';
import { Web3Auth } from '@web3auth/modal';
import { SwapWidget } from '@uniswap/widgets';
import '@uniswap/widgets/fonts.css';

export default function UniswapWithWeb3Auth() {
  const [web3auth, setWeb3auth] = useState<Web3Auth | null>(null);
  const [provider, setProvider] = useState<any>(null);

  useEffect(() => {
    const init = async () => {
      try {
        const web3auth = new Web3Auth({
          clientId: "YOUR_WEB3AUTH_CLIENT_ID",
          chainConfig: {
            chainNamespace: "eip155",
            chainId: "0x2105", // Base (8453)
            rpcTarget: "https://mainnet.base.org",
            displayName: "Base Mainnet",
            blockExplorerUrl: "https://basescan.org",
            ticker: "ETH",
            tickerName: "Ethereum",
          },
        });

        await web3auth.initModal();
        setWeb3auth(web3auth);

        if (web3auth.provider) {
          setProvider(web3auth.provider);
        }
      } catch (error) {
        console.error(error);
      }
    };

    init();
  }, []);

  const jsonRpcUrlMap = useMemo(() => ({
    8453: ['https://mainnet.base.org'],
  }), []);

  const login = async () => {
    if (!web3auth) return;
    
    try {
      const web3authProvider = await web3auth.connect();
      setProvider(web3authProvider);
    } catch (error) {
      console.error('Login failed:', error);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto space-y-4">
      {!provider && (
        <button
          onClick={login}
          className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700"
        >
          Login with Email
        </button>
      )}
      
      {provider && (
        <SwapWidget
          jsonRpcUrlMap={jsonRpcUrlMap}
          defaultChainId={8453}
          provider={provider}
          theme={{
            primary: '#FF007A',
            secondary: '#2172E5',
            interactive: '#2172E5',
            container: '#1A1A1A',
            module: '#2D2D2D',
            accent: '#FF007A',
            outline: '#4D4D4D',
            dialog: '#000000',
            fontFamily: 'Inter, sans-serif',
          }}
        />
      )}
    </div>
  );
}
```

**💡 Tip de Experto**: Web3Auth es ideal para usuarios que no tienen wallet instalada.

---

## Personalización de Tema y Lista de Tokens

### Objeto de Tema Completo

```tsx
const customTheme = {
  // Colores principales
  primary: '#FF007A',           // Color principal de Uniswap
  secondary: '#2172E5',         // Azul para elementos secundarios
  interactive: '#2172E5',       // Color para elementos interactivos
  
  // Fondos
  container: '#1A1A1A',         // Fondo del contenedor
  module: '#2D2D2D',            // Fondo de módulos
  accent: '#FF007A',            // Color de acento
  
  // Bordes y líneas
  outline: '#4D4D4D',           // Color de bordes
  dialog: '#000000',            // Fondo de diálogos
  
  // Tipografía
  fontFamily: 'Inter, sans-serif',
  
  // Estados
  success: '#27AE60',           // Verde para éxito
  warning: '#F39C12',           // Naranja para advertencias
  error: '#E74C3C',             // Rojo para errores
  
  // Opcional: Modo oscuro/claro
  borderRadius: '12px',         // Radio de bordes
  fontFamilyCode: 'Monaco, monospace',
};
```

### Lista de Tokens Personalizada

```tsx
// Usando URL de token list
const tokenList = 'https://raw.githubusercontent.com/your-org/your-token-list/main/tokenlist.json';

// O usando IPFS CID
const tokenList = 'QmYourIPFSCidHere';

// En el widget
<SwapWidget
  jsonRpcUrlMap={jsonRpcUrlMap}
  defaultChainId={8453}
  tokenList={tokenList}
  theme={customTheme}
/>
```

### Ejemplo con DOBI Token (Basado en tu proyecto)

```tsx
const DOBI_TOKEN_CONFIG = {
  tokenList: 'https://your-domain.com/dobi-tokenlist.json',
  defaultOutputTokenAddress: '0x931ef8053e997b1bab68d1e900a061305c0ff4fb', // DOBI
  defaultInputTokenAddress: 'NATIVE', // ETH
};

<SwapWidget
  jsonRpcUrlMap={jsonRpcUrlMap}
  defaultChainId={8453}
  tokenList={DOBI_TOKEN_CONFIG.tokenList}
  defaultOutputTokenAddress={DOBI_TOKEN_CONFIG.defaultOutputTokenAddress}
  defaultInputTokenAddress={DOBI_TOKEN_CONFIG.defaultInputTokenAddress}
  theme={customTheme}
/>
```

**💡 Tip de Experto**: Usa `NATIVE` como `defaultInputTokenAddress` para que ETH aparezca por defecto.

---

## Prevención y Resolución de Conflictos

### 1. Error de Dependencias Duplicadas de React

**Problema**: Múltiples versiones de React en node_modules.

**Solución**:

```json
// En package.json, añade:
{
  "overrides": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0"
  },
  "resolutions": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0"
  }
}
```

```bash
# Limpia e reinstala
rm -rf node_modules package-lock.json
npm install
```

### 2. Conflictos de CSS

**Problema**: Estilos del widget interfieren con tu aplicación.

**Solución**:

```tsx
// Envuelve el widget en un contenedor con clase específica
<div className="uniswap-widget-container">
  <SwapWidget {...props} />
</div>

// En tu CSS global
.uniswap-widget-container {
  isolation: isolate; /* Crea un nuevo stacking context */
}

.uniswap-widget-container * {
  box-sizing: border-box;
}
```

### 3. Problemas de Build en Vite/CRA

**Para Vite** (`vite.config.ts`):

```typescript
export default defineConfig({
  define: {
    global: 'globalThis',
  },
  resolve: {
    alias: {
      buffer: 'buffer',
    },
  },
  optimizeDeps: {
    include: ['buffer'],
  },
});
```

**Para Create React App** (si usas eject o CRACO):

```javascript
// webpack.config.js
module.exports = {
  resolve: {
    fallback: {
      "buffer": require.resolve("buffer"),
      "crypto": require.resolve("crypto-browserify"),
      "stream": require.resolve("stream-browserify"),
      "util": require.resolve("util"),
    }
  },
  plugins: [
    new webpack.ProvidePlugin({
      Buffer: ['buffer', 'Buffer'],
    }),
  ],
};
```

### 4. Fallback para SSR en Next.js

```tsx
import dynamic from 'next/dynamic';

// Importación dinámica sin SSR
const SwapWidget = dynamic(
  () => import('@uniswap/widgets').then((mod) => ({ default: mod.SwapWidget })),
  { 
    ssr: false,
    loading: () => <div>Loading swap widget...</div>
  }
);

export default function SwapPage() {
  return (
    <div>
      <SwapWidget {...props} />
    </div>
  );
}
```

**💡 Tip de Experto**: Siempre usa `ssr: false` para widgets de Web3 en Next.js.

---

## Buenas Prácticas de Rendimiento y Seguridad

### 1. Endpoints RPC Propios

```tsx
// ❌ Malo - Usar endpoints públicos
const jsonRpcUrlMap = {
  1: ['https://eth-mainnet.alchemyapi.io/v2/demo'],
};

// ✅ Bueno - Usar tus propios endpoints
const jsonRpcUrlMap = {
  1: [
    'https://eth-mainnet.alchemyapi.io/v2/YOUR_ACTUAL_API_KEY',
    'https://mainnet.infura.io/v3/YOUR_INFURA_PROJECT_ID',
  ],
  8453: [
    'https://mainnet.base.org',
    'https://base-mainnet.g.alchemy.com/v2/YOUR_ALCHEMY_API_KEY',
  ],
};
```

### 2. Manejo de Convenience Fees

```tsx
<SwapWidget
  jsonRpcUrlMap={jsonRpcUrlMap}
  defaultChainId={8453}
  convenienceFee={250} // 0.25% fee
  convenienceFeeRecipient="0xYourAddress"
  theme={customTheme}
/>
```

**⚠️ Importante**: Revisa las regulaciones locales antes de implementar fees.

### 3. Configuración de Slippage y Gas para L2

```tsx
const L2_CONFIG = {
  defaultSlippage: 0.5, // 0.5% para L2
  maxSlippage: 5.0,     // 5% máximo
  defaultGasPrice: 'auto', // Dejar que el widget calcule
};

<SwapWidget
  jsonRpcUrlMap={jsonRpcUrlMap}
  defaultChainId={8453}
  defaultSlippage={L2_CONFIG.defaultSlippage}
  maxSlippage={L2_CONFIG.maxSlippage}
  theme={customTheme}
/>
```

### 4. Optimización de Rendimiento

```tsx
// Usar React.memo para evitar re-renders
const MemoizedSwapWidget = React.memo(SwapWidget);

// Lazy loading del widget
const LazySwapWidget = React.lazy(() => 
  import('@uniswap/widgets').then(module => ({ 
    default: module.SwapWidget 
  }))
);

// En tu componente
<Suspense fallback={<div>Loading...</div>}>
  <LazySwapWidget {...props} />
</Suspense>
```

**💡 Tip de Experto**: En L2 como Base, usa slippage más bajo (0.5%) ya que las transacciones son más rápidas.

---

## FAQ y Troubleshooting

### Q: El widget renderiza en blanco
**A**: 
```tsx
// Verifica que tengas las fuentes importadas
import '@uniswap/widgets/fonts.css';

// Verifica que el jsonRpcUrlMap esté correcto
console.log('RPC URLs:', jsonRpcUrlMap);

// Añade un fallback visual
<SwapWidget
  {...props}
  onError={(error) => console.error('Widget error:', error)}
/>
```

### Q: Provider undefined
**A**:
```tsx
// Verifica que window.ethereum existe
if (typeof window !== 'undefined' && window.ethereum) {
  const provider = new ethers.providers.Web3Provider(window.ethereum);
  // Usar provider
} else {
  console.error('No wallet detected');
}
```

### Q: El swap se queda pendiente
**A**:
```tsx
// Añade event listeners
<SwapWidget
  {...props}
  onSwapPriceUpdate={(prices) => {
    console.log('Price update:', prices);
  }}
  onSwapAmountUpdate={(amounts) => {
    console.log('Amount update:', amounts);
  }}
  onTransactionDeadlineUpdate={(deadline) => {
    console.log('Deadline update:', deadline);
  }}
/>
```

### Q: Cómo depurar con la consola
**A**:
```tsx
// Añade logs detallados
<SwapWidget
  {...props}
  onError={(error) => {
    console.group('🚨 Uniswap Widget Error');
    console.error('Error:', error);
    console.log('Props:', props);
    console.groupEnd();
  }}
  onSwapPriceUpdate={(prices) => {
    console.log('💰 Price Update:', prices);
  }}
/>
```

### Q: Error de red en Base
**A**:
```tsx
// Usa múltiples RPC endpoints
const baseRpcUrls = [
  'https://mainnet.base.org',
  'https://base-mainnet.g.alchemy.com/v2/YOUR_KEY',
  'https://base.blockpi.network/v1/rpc/public',
];

const jsonRpcUrlMap = {
  8453: baseRpcUrls,
};
```

**💡 Tip de Experto**: Siempre incluye logs detallados en desarrollo para facilitar el debugging.

---

## Recursos de Apoyo

### Documentación Oficial
- **Uniswap Widgets**: docs.uniswap.org > Swap Widget
- **Widgets Demo**: widgets.uniswap.org
- **GitHub (archivado)**: github.com/Uniswap/widgets

### Comunidad
- **Discord**: discord.gg/uniswap
- **Twitter**: @Uniswap
- **Forum**: forum.uniswap.org

### Herramientas Útiles
- **Token Lists**: tokenlists.org
- **Base Explorer**: basescan.org
- **Gas Tracker**: gasnow.org

### Ejemplos de Implementación
- **Widgets Demo**: widgets.uniswap.org
- **Uniswap Interface**: app.uniswap.org
- **Tu proyecto**: Basado en tu `BuyDobiTab.tsx`

**💡 Tip de Experto**: Únete al Discord de Uniswap para soporte directo de la comunidad y el equipo.

---

## Conclusión

Esta guía te proporciona todo lo necesario para integrar exitosamente el Swap Widget de Uniswap en tu aplicación React. Recuerda:

1. **Siempre usa endpoints RPC propios** para evitar rate limits
2. **Importa las fuentes** antes que cualquier otra cosa
3. **Maneja errores graciosamente** con fallbacks visuales
4. **Optimiza para L2** con configuración de slippage apropiada
5. **Prueba en múltiples wallets** antes de hacer deploy

¡Tu integración con DOBI en Base debería funcionar perfectamente siguiendo estos pasos!
