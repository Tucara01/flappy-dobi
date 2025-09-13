"use client";

import { useState, useMemo } from "react";
import { useAccount, useChainId } from "wagmi";
import dynamic from "next/dynamic";
import "@uniswap/widgets/fonts.css";
import { Button } from "../Button";

// Importación dinámica del widget sin SSR para evitar errores de módulos Node.js
const SwapWidget = dynamic(
  () => import("@uniswap/widgets").then((mod) => ({ default: mod.SwapWidget })),
  { 
    ssr: false,
    loading: () => (
      <div className="w-full h-96 bg-gray-800 rounded-lg flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-400">Loading Uniswap widget...</p>
        </div>
      </div>
    )
  }
);

/**
 * BuyDobiTab component provides an integrated Uniswap widget for buying DOBI tokens.
 * 
 * This component integrates the Uniswap widget directly into the application,
 * allowing users to swap ETH for DOBI tokens on the Base network without
 * leaving the app. It handles wallet connection, network switching, and
 * transaction management.
 * 
 * Features:
 * - Integrated Uniswap widget
 * - Base network support
 * - Wallet connection management
 * - Real-time price updates
 * - Transaction status tracking
 * 
 * @example
 * ```tsx
 * <BuyDobiTab />
 * ```
 */
export function BuyDobiTab() {
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // DOBI Token configuration
  const DOBI_TOKEN = {
    address: "0x931ef8053e997b1bab68d1e900a061305c0ff4fb",
    symbol: "DOBI",
    name: "Dobi by Virtuals",
    decimals: 18,
    chainId: 8453, // Base
  };

  // Base network configuration
  const BASE_NETWORK = {
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

  // RPC URLs configuration for Uniswap widget
  // Nota: Base (8453) no es soportado nativamente por el widget de Uniswap
  // Usamos Ethereum (1) como cadena principal y manejamos Base por separado
  const jsonRpcUrlMap = useMemo(() => ({
    1: [
      'https://eth-mainnet.alchemyapi.io/v2/demo', // Demo key (limited)
      'https://mainnet.infura.io/v3/demo', // Demo key (limited)
      // Uncomment and add your keys for production:
      // `https://eth-mainnet.alchemyapi.io/v2/${process.env.NEXT_PUBLIC_ALCHEMY_API_KEY}`,
      // `https://mainnet.infura.io/v3/${process.env.NEXT_PUBLIC_INFURA_PROJECT_ID}`,
    ],
    // Base no está soportado nativamente por el widget de Uniswap
    // 8453: [
    //   'https://mainnet.base.org',
    //   'https://base.blockpi.network/v1/rpc/public',
    // ],
  }), []);

  // Custom theme for Uniswap widget
  const uniswapTheme = useMemo(() => ({
    primary: '#FF007A',
    secondary: '#2172E5',
    interactive: '#2172E5',
    container: '#1A1A1A',
    module: '#2D2D2D',
    accent: '#FF007A',
    outline: '#4D4D4D',
    dialog: '#000000',
    fontFamily: 'Inter, sans-serif',
  }), []);

  // Handle opening Uniswap in new tab
  const handleOpenUniswap = () => {
    const uniswapUrl = `https://app.uniswap.org/explore/tokens/base/${DOBI_TOKEN.address}?inputCurrency=0x931ef8053e997b1bab68d1e900a061305c0ff4fb`;
    window.open(uniswapUrl, '_blank', 'noopener,noreferrer');
  };

  // Handle network switching
  const handleSwitchToBase = async () => {
    try {
      setIsLoading(true);
      if (window.ethereum) {
        await window.ethereum.request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: `0x${BASE_NETWORK.chainId.toString(16)}` }],
        });
      }
    } catch (switchError: any) {
      // If the network doesn't exist, add it
      if (switchError.code === 4902) {
        try {
          await window.ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [BASE_NETWORK],
          });
        } catch (addError) {
          console.error('Error adding Base network:', addError);
          setError('Failed to add Base network. Please add it manually.');
        }
      } else {
        console.error('Error switching to Base network:', switchError);
        setError('Failed to switch to Base network.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Get provider for Uniswap widget
  const getProvider = () => {
    if (typeof window !== 'undefined' && window.ethereum) {
      return window.ethereum;
    }
    return null;
  };

  // Handle widget errors
  const handleWidgetError = (error: any) => {
    console.error('🚨 Uniswap Widget Error:', error);
    setError('Error en el widget de Uniswap. Por favor, recarga la página.');
  };

  // Handle price updates
  const handlePriceUpdate = (prices: any) => {
    console.log('💰 Price Update:', prices);
  };

  // Handle amount updates
  const handleAmountUpdate = (amounts: any) => {
    console.log('📊 Amount Update:', amounts);
  };

  return (
    <div className="w-full max-w-4xl mx-auto p-4 space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-bold text-white mb-2">
          Buy DOBI Token
        </h2>
        <p className="text-gray-300 text-lg">
          Swap ETH for DOBI tokens on Base network
        </p>
      </div>

      {/* Network Status */}
      <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className={`w-3 h-3 rounded-full ${chainId === BASE_NETWORK.chainId ? 'bg-green-500' : 'bg-red-500'}`}></div>
            <span className="text-white font-medium">
              {chainId === BASE_NETWORK.chainId ? 'Connected to Base' : 'Wrong Network'}
            </span>
          </div>
          {chainId !== BASE_NETWORK.chainId && (
            <Button
              onClick={handleSwitchToBase}
              disabled={isLoading}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white px-4 py-2 rounded-lg"
            >
              {isLoading ? 'Switching...' : 'Switch to Base'}
            </Button>
          )}
        </div>
      </div>

      {/* Wallet Connection Status */}
      {!isConnected && (
        <div className="bg-yellow-900 border border-yellow-600 rounded-lg p-4">
          <div className="flex items-center space-x-3">
            <span className="text-yellow-400">⚠️</span>
            <div>
              <p className="text-yellow-200 font-medium">Wallet Not Connected</p>
              <p className="text-yellow-300 text-sm">
                Please connect your wallet to buy DOBI.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="bg-red-900 border border-red-600 rounded-lg p-4">
          <div className="flex items-center space-x-3">
            <span className="text-red-400">❌</span>
            <div>
              <p className="text-red-200 font-medium">Error</p>
              <p className="text-red-300 text-sm">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Uniswap Widget Integration */}
      {isConnected ? (
        <div className="bg-gray-900 rounded-lg p-6 border border-gray-700">
          <div className="text-center mb-6">
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 bg-gradient-to-r from-pink-500 to-blue-500 rounded-full flex items-center justify-center">
                <span className="text-2xl">🦄</span>
              </div>
            </div>
            <h3 className="text-2xl font-semibold text-white mb-2">Buy DOBI with Uniswap</h3>
            <p className="text-gray-400">
              Swap ETH for DOBI tokens using Uniswap widget
            </p>
            <div className="bg-yellow-900 border border-yellow-600 rounded-lg p-3 mt-4">
              <p className="text-yellow-200 text-sm">
                ⚠️ <strong>Note:</strong> Uniswap widget works on Ethereum. For Base network, use the external Uniswap link below.
              </p>
            </div>
          </div>
          
          {/* Uniswap Widget */}
          <div className="uniswap-widget-container">
            <SwapWidget
              jsonRpcUrlMap={jsonRpcUrlMap}
              defaultChainId={1} // Usar Ethereum como cadena por defecto
              defaultInputTokenAddress="NATIVE"
              provider={getProvider()}
              theme={uniswapTheme}
              onError={handleWidgetError}
            />
          </div>
          
          <div className="mt-4 text-center">
            <p className="text-gray-500 text-sm">
              Powered by Uniswap • DOBI token pre-selected
            </p>
          </div>
        </div>
      ) : (
        <div className="bg-gray-900 rounded-lg p-6 border border-gray-700">
          <div className="text-center space-y-4">
            <div className="flex justify-center">
              <div className="w-16 h-16 bg-gradient-to-r from-pink-500 to-blue-500 rounded-full flex items-center justify-center">
                <span className="text-2xl">🦄</span>
              </div>
            </div>
            
            <h3 className="text-2xl font-semibold text-white">Uniswap Integration</h3>
            
            {!isConnected ? (
              <div className="space-y-4">
                <p className="text-gray-400">
                  Connect your wallet to use the integrated Uniswap widget
                </p>
                <div className="bg-yellow-900 border border-yellow-600 rounded-lg p-4">
                  <p className="text-yellow-200 text-sm">
                    💡 Connect your wallet using the Wallet tab to start trading
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-gray-400">
                  Switch to Base network to use the integrated Uniswap widget
                </p>
                <Button
                  onClick={handleSwitchToBase}
                  disabled={isLoading}
                  className="bg-gradient-to-r from-pink-500 to-blue-500 hover:from-pink-600 hover:to-blue-600 disabled:from-gray-500 disabled:to-gray-600 text-white font-bold px-8 py-4 rounded-lg transition-all duration-300"
                >
                  {isLoading ? 'Switching...' : 'Switch to Base'}
                </Button>
              </div>
            )}
            
            <div className="mt-6 pt-4 border-t border-gray-700">
              <p className="text-gray-500 text-sm mb-3">
                Or use the external Uniswap interface:
              </p>
              <Button
                onClick={handleOpenUniswap}
                className="bg-gray-700 hover:bg-gray-600 text-white px-6 py-2 rounded-lg transition-all duration-300"
              >
                Open Uniswap in New Tab
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Token Information */}
      <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
        <h3 className="text-lg font-semibold text-white mb-3">DOBI Token Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-gray-400">Name:</span>
            <span className="text-white ml-2">{DOBI_TOKEN.name}</span>
          </div>
          <div>
            <span className="text-gray-400">Symbol:</span>
            <span className="text-white ml-2">{DOBI_TOKEN.symbol}</span>
          </div>
          <div>
            <span className="text-gray-400">Decimals:</span>
            <span className="text-white ml-2">{DOBI_TOKEN.decimals}</span>
          </div>
          <div>
            <span className="text-gray-400">Network:</span>
            <span className="text-white ml-2">{BASE_NETWORK.chainName}</span>
          </div>
          <div className="md:col-span-2">
            <span className="text-gray-400">Contract Address:</span>
            <span className="text-white ml-2 font-mono text-xs break-all">
              {DOBI_TOKEN.address}
            </span>
          </div>
        </div>
      </div>

      {/* Instructions */}
      <div className="bg-blue-900 border border-blue-600 rounded-lg p-4">
        <h3 className="text-lg font-semibold text-blue-200 mb-3">How to Buy DOBI</h3>
        <ol className="text-blue-300 text-sm space-y-2 list-decimal list-inside">
          <li>Connect your wallet using the Wallet tab</li>
          <li>For Base network: Use the "Open Uniswap in New Tab" button below</li>
          <li>For Ethereum: Use the integrated Uniswap widget above</li>
          <li>Enter the amount of ETH you want to swap</li>
          <li>Review the transaction details and slippage</li>
          <li>Confirm the transaction in your wallet</li>
          <li>Wait for the transaction to be confirmed</li>
        </ol>
        
        <div className="mt-4 p-3 bg-blue-800 rounded-lg">
          <p className="text-blue-200 text-xs">
            <strong>💡 Tip:</strong> The integrated widget works on Ethereum. For Base network (where DOBI is), use the external Uniswap link for the best experience.
          </p>
        </div>
      </div>
    </div>
  );
}
