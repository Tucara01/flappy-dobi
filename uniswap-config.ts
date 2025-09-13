/**
 * Configuración centralizada para el Swap Widget de Uniswap
 * 
 * Este archivo contiene toda la configuración necesaria para integrar
 * el widget de Uniswap en tu aplicación, incluyendo temas, redes RPC,
 * y configuraciones específicas para DOBI en Base.
 */

// Configuración de redes RPC
export const RPC_URLS = {
  // Base network (principal para DOBI)
  8453: [
    'https://mainnet.base.org',
    'https://base-mainnet.g.alchemy.com/v2/YOUR_ALCHEMY_API_KEY',
    'https://base.blockpi.network/v1/rpc/public',
  ],
  // Ethereum mainnet (backup)
  1: [
    'https://eth-mainnet.alchemyapi.io/v2/YOUR_ALCHEMY_API_KEY',
    'https://mainnet.infura.io/v3/YOUR_INFURA_PROJECT_ID',
  ],
  // Polygon (opcional)
  137: [
    'https://polygon-rpc.com',
    'https://polygon-mainnet.g.alchemyapi.io/v2/YOUR_ALCHEMY_API_KEY',
  ],
  // Arbitrum (opcional)
  42161: [
    'https://arb1.arbitrum.io/rpc',
    'https://arb-mainnet.g.alchemyapi.io/v2/YOUR_ALCHEMY_API_KEY',
  ],
} as const;

// Configuración de DOBI Token
export const DOBI_CONFIG = {
  address: '0x931ef8053e997b1bab68d1e900a061305c0ff4fb',
  symbol: 'DOBI',
  name: 'Dobi by Virtuals',
  decimals: 18,
  chainId: 8453,
  logoURI: 'https://your-domain.com/dobi-logo.png', // Añade tu logo
} as const;

// Configuración de la red Base
export const BASE_NETWORK_CONFIG = {
  chainId: 8453,
  chainName: 'Base',
  rpcUrls: ['https://mainnet.base.org'],
  blockExplorerUrls: ['https://basescan.org'],
  nativeCurrency: {
    name: 'Ethereum',
    symbol: 'ETH',
    decimals: 18,
  },
  iconUrls: ['https://your-domain.com/base-icon.png'], // Opcional
} as const;

// Temas personalizados
export const UNISWAP_THEMES = {
  // Tema principal (rosa/azul de Uniswap)
  default: {
    primary: '#FF007A',
    secondary: '#2172E5',
    interactive: '#2172E5',
    container: '#1A1A1A',
    module: '#2D2D2D',
    accent: '#FF007A',
    outline: '#4D4D4D',
    dialog: '#000000',
    fontFamily: 'Inter, sans-serif',
    success: '#27AE60',
    warning: '#F39C12',
    error: '#E74C3C',
    borderRadius: '12px',
  },
  
  // Tema oscuro alternativo
  dark: {
    primary: '#FF007A',
    secondary: '#2172E5',
    interactive: '#2172E5',
    container: '#0D0D0D',
    module: '#1A1A1A',
    accent: '#FF007A',
    outline: '#333333',
    dialog: '#000000',
    fontFamily: 'Inter, sans-serif',
    success: '#27AE60',
    warning: '#F39C12',
    error: '#E74C3C',
    borderRadius: '12px',
  },
  
  // Tema claro (si lo necesitas)
  light: {
    primary: '#FF007A',
    secondary: '#2172E5',
    interactive: '#2172E5',
    container: '#FFFFFF',
    module: '#F7F8FA',
    accent: '#FF007A',
    outline: '#E1E8F0',
    dialog: '#FFFFFF',
    fontFamily: 'Inter, sans-serif',
    success: '#27AE60',
    warning: '#F39C12',
    error: '#E74C3C',
    borderRadius: '12px',
  },
} as const;

// Configuración de slippage para diferentes redes
export const SLIPPAGE_CONFIG = {
  // L2 networks (Base, Polygon, Arbitrum)
  l2: {
    default: 0.5, // 0.5%
    max: 5.0,     // 5%
    min: 0.1,     // 0.1%
  },
  // L1 networks (Ethereum)
  l1: {
    default: 1.0, // 1%
    max: 10.0,    // 10%
    min: 0.1,     // 0.1%
  },
} as const;

// Configuración de gas para diferentes redes
export const GAS_CONFIG = {
  // Base (L2)
  8453: {
    maxFeePerGas: 'auto',
    maxPriorityFeePerGas: 'auto',
    gasLimit: 'auto',
  },
  // Ethereum (L1)
  1: {
    maxFeePerGas: 'auto',
    maxPriorityFeePerGas: 'auto',
    gasLimit: 'auto',
  },
} as const;

// Listas de tokens personalizadas
export const TOKEN_LISTS = {
  // Lista principal de tokens
  default: 'https://gateway.ipfs.io/ipns/tokens.uniswap.org',
  
  // Lista personalizada para DOBI (crea tu propia lista)
  custom: 'https://your-domain.com/dobi-tokenlist.json',
  
  // Lista de tokens de Base
  base: 'https://raw.githubusercontent.com/ethereum-optimism/ethereum-optimism.github.io/master/optimism.tokenlist.json',
} as const;

// Configuración de convenience fees (opcional)
export const CONVENIENCE_FEE_CONFIG = {
  // Fee en basis points (250 = 0.25%)
  fee: 250,
  // Dirección que recibirá el fee
  recipient: '0xYourAddress', // Cambia por tu dirección
  // Solo habilitar en mainnet
  enabled: process.env.NODE_ENV === 'production',
} as const;

// Configuración de timeouts
export const TIMEOUT_CONFIG = {
  // Timeout para requests RPC (ms)
  rpcTimeout: 10000,
  // Timeout para transacciones (ms)
  transactionTimeout: 300000, // 5 minutos
  // Timeout para price updates (ms)
  priceUpdateTimeout: 30000,
} as const;

// Configuración de debugging
export const DEBUG_CONFIG = {
  // Habilitar logs en desarrollo
  enableLogs: process.env.NODE_ENV === 'development',
  // Habilitar logs de precios
  logPrices: process.env.NODE_ENV === 'development',
  // Habilitar logs de transacciones
  logTransactions: process.env.NODE_ENV === 'development',
} as const;

// Función helper para obtener configuración de slippage basada en la red
export function getSlippageConfig(chainId: number) {
  const isL2 = [8453, 137, 42161].includes(chainId); // Base, Polygon, Arbitrum
  return isL2 ? SLIPPAGE_CONFIG.l2 : SLIPPAGE_CONFIG.l1;
}

// Función helper para obtener configuración de gas
export function getGasConfig(chainId: number) {
  return GAS_CONFIG[chainId as keyof typeof GAS_CONFIG] || GAS_CONFIG[1];
}

// Función helper para obtener tema basado en preferencias
export function getTheme(themeName: 'default' | 'dark' | 'light' = 'default') {
  return UNISWAP_THEMES[themeName];
}

// Función helper para validar configuración
export function validateConfig() {
  const errors: string[] = [];
  
  // Validar RPC URLs
  Object.entries(RPC_URLS).forEach(([chainId, urls]) => {
    if (!urls || urls.length === 0) {
      errors.push(`No RPC URLs configured for chain ${chainId}`);
    }
  });
  
  // Validar DOBI config
  if (!DOBI_CONFIG.address || !DOBI_CONFIG.symbol) {
    errors.push('DOBI token configuration is incomplete');
  }
  
  // Validar convenience fee
  if (CONVENIENCE_FEE_CONFIG.enabled && !CONVENIENCE_FEE_CONFIG.recipient) {
    errors.push('Convenience fee recipient not configured');
  }
  
  if (errors.length > 0) {
    console.warn('⚠️ Uniswap Widget Configuration Issues:', errors);
  }
  
  return errors.length === 0;
}

// Exportar configuración por defecto
export const DEFAULT_CONFIG = {
  rpcUrls: RPC_URLS,
  dobiToken: DOBI_CONFIG,
  baseNetwork: BASE_NETWORK_CONFIG,
  theme: UNISWAP_THEMES.default,
  slippage: SLIPPAGE_CONFIG.l2, // Base es L2
  gas: GAS_CONFIG[8453],
  tokenList: TOKEN_LISTS.default,
  convenienceFee: CONVENIENCE_FEE_CONFIG,
  timeouts: TIMEOUT_CONFIG,
  debug: DEBUG_CONFIG,
} as const;

// Validar configuración al importar
if (typeof window !== 'undefined') {
  validateConfig();
}
