// Contratos de Uniswap V3 en Base Network (direcciones oficiales)
export const UNISWAP_V3_ADDRESSES = {
  FACTORY: "0x33128a8fC17869897dcE68Ed026d694621f6FDfD" as `0x${string}`,
  QUOTER_V2: "0x3d4e44Eb1374240CE5F1B871ab261CD16335B76a" as `0x${string}`, 
  SWAP_ROUTER: "0x2626664c2603336E57B271c5C0b26F421741e481" as `0x${string}`,
  POSITION_MANAGER: "0x03a520b32C04BF3bEEf7BF5754b9BE75BF78c0A4" as `0x${string}`
};

// Tu token DOBI
export const DOBI_TOKEN = {
  chainId: 8453, // Base network
  address: "0x931ef8053e997b1bab68d1e900a061305c0ff4fb" as `0x${string}`,
  decimals: 18,
  symbol: "DOBI",
  name: "DOBI Token"
};

// WETH en Base
export const WETH_BASE = {
  chainId: 8453,
  address: "0x4200000000000000000000000000000000000006" as `0x${string}`,
  decimals: 18,
  symbol: "WETH",
  name: "Wrapped Ether"
};

// USDC en Base  
export const USDC_BASE = {
  chainId: 8453,
  address: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913" as `0x${string}`,
  decimals: 6,
  symbol: "USDC",
  name: "USD Coin"
};

// ETH (native token)
export const ETH_TOKEN = {
  chainId: 8453,
  address: "0x0000000000000000000000000000000000000000" as `0x${string}`,
  decimals: 18,
  symbol: "ETH",
  name: "Ethereum"
};

// Base Network Configuration
export const BASE_NETWORK = {
  chainId: 8453,
  chainName: "Base",
  rpcUrl: "https://mainnet.base.org",
  blockExplorerUrl: "https://basescan.org",
  nativeCurrency: {
    name: "Ethereum",
    symbol: "ETH",
    decimals: 18,
  },
};

// ABIs necesarios para el swap
export const QUOTER_ABI = [
  {
    "inputs": [
      {
        "components": [
          {"internalType": "address", "name": "tokenIn", "type": "address"},
          {"internalType": "address", "name": "tokenOut", "type": "address"},
          {"internalType": "uint24", "name": "fee", "type": "uint24"},
          {"internalType": "uint256", "name": "amountIn", "type": "uint256"},
          {"internalType": "uint160", "name": "sqrtPriceLimitX96", "type": "uint160"}
        ],
        "internalType": "struct IQuoterV2.QuoteExactInputSingleParams",
        "name": "params",
        "type": "tuple"
      }
    ],
    "name": "quoteExactInputSingle",
    "outputs": [
      {"internalType": "uint256", "name": "amountOut", "type": "uint256"},
      {"internalType": "uint160", "name": "sqrtPriceX96After", "type": "uint160"},
      {"internalType": "uint32", "name": "initializedTicksCrossed", "type": "uint32"},
      {"internalType": "uint256", "name": "gasEstimate", "type": "uint256"}
    ],
    "stateMutability": "nonpayable",
    "type": "function"
  }
] as const;

export const SWAP_ROUTER_ABI = [
  {
    "inputs": [
      {
        "components": [
          {"internalType": "address", "name": "tokenIn", "type": "address"},
          {"internalType": "address", "name": "tokenOut", "type": "address"},
          {"internalType": "uint24", "name": "fee", "type": "uint24"},
          {"internalType": "address", "name": "recipient", "type": "address"},
          {"internalType": "uint256", "name": "deadline", "type": "uint256"},
          {"internalType": "uint256", "name": "amountIn", "type": "uint256"},
          {"internalType": "uint256", "name": "amountOutMinimum", "type": "uint256"},
          {"internalType": "uint160", "name": "sqrtPriceLimitX96", "type": "uint160"}
        ],
        "internalType": "struct ISwapRouter.ExactInputSingleParams",
        "name": "params",
        "type": "tuple"
      }
    ],
    "name": "exactInputSingle",
    "outputs": [
      {"internalType": "uint256", "name": "amountOut", "type": "uint256"}
    ],
    "stateMutability": "payable",
    "type": "function"
  }
] as const;

export const ERC20_ABI = [
  "function approve(address spender, uint256 amount) external returns (bool)",
  "function allowance(address owner, address spender) external view returns (uint256)",
  "function balanceOf(address account) external view returns (uint256)",
  "function decimals() external view returns (uint8)",
  "function symbol() external view returns (string)",
  "function name() external view returns (string)"
];

// ABI del Factory para verificar existencia de pools
export const FACTORY_ABI = [
  {
    "inputs": [
      {"internalType": "address", "name": "tokenA", "type": "address"},
      {"internalType": "address", "name": "tokenB", "type": "address"},
      {"internalType": "uint24", "name": "fee", "type": "uint24"}
    ],
    "name": "getPool",
    "outputs": [
      {"internalType": "address", "name": "pool", "type": "address"}
    ],
    "stateMutability": "view",
    "type": "function"
  }
] as const;
