"use client";

import React, { useMemo, useState } from 'react';
import { useAccount, useChainId } from 'wagmi';
import { SwapWidget } from '@uniswap/widgets';
import '@uniswap/widgets/fonts.css';
import { Button } from '../Button';

/**
 * Ejemplo de integración completa del Swap Widget de Uniswap
 * para comprar DOBI tokens en la red Base.
 * 
 * Este ejemplo muestra cómo integrar el widget directamente
 * en tu aplicación React con manejo de errores, temas personalizados
 * y configuración específica para DOBI.
 */
export function UniswapWidgetIntegration() {
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Configuración de DOBI Token
  const DOBI_TOKEN = {
    address: "0x931ef8053e997b1bab68d1e900a061305c0ff4fb",
    symbol: "DOBI",
    name: "Dobi by Virtuals",
    decimals: 18,
    chainId: 8453, // Base
  };

  // Configuración de redes RPC (usa tus propias keys)
  const jsonRpcUrlMap = useMemo(() => ({
    // Base network (principal)
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
  }), []);

  // Tema personalizado que combina con tu diseño
  const customTheme = useMemo(() => ({
    // Colores principales
    primary: '#FF007A',           // Rosa de Uniswap
    secondary: '#2172E5',         // Azul para elementos secundarios
    interactive: '#2172E5',       // Color para elementos interactivos
    
    // Fondos (adaptados a tu tema oscuro)
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
    
    // Estilo
    borderRadius: '12px',         // Radio de bordes
  }), []);

  // Función para obtener el provider de wagmi
  const getProvider = () => {
    if (typeof window !== 'undefined' && window.ethereum) {
      return window.ethereum;
    }
    return null;
  };

  // Manejo de errores del widget
  const handleWidgetError = (error: any) => {
    console.error('🚨 Uniswap Widget Error:', error);
    setError('Error en el widget de Uniswap. Por favor, recarga la página.');
  };

  // Manejo de actualizaciones de precio
  const handlePriceUpdate = (prices: any) => {
    console.log('💰 Price Update:', prices);
  };

  // Manejo de actualizaciones de cantidad
  const handleAmountUpdate = (amounts: any) => {
    console.log('📊 Amount Update:', amounts);
  };

  // Función para cambiar a la red Base
  const handleSwitchToBase = async () => {
    try {
      setIsLoading(true);
      if (window.ethereum) {
        await window.ethereum.request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: '0x2105' }], // 8453 en hex
        });
      }
    } catch (switchError: any) {
      if (switchError.code === 4902) {
        // Si la red no existe, añadirla
        try {
          await window.ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [{
              chainId: '0x2105',
              chainName: 'Base',
              rpcUrls: ['https://mainnet.base.org'],
              blockExplorerUrls: ['https://basescan.org'],
              nativeCurrency: {
                name: 'Ethereum',
                symbol: 'ETH',
                decimals: 18,
              },
            }],
          });
        } catch (addError) {
          console.error('Error añadiendo red Base:', addError);
          setError('Error al añadir la red Base. Añádela manualmente.');
        }
      } else {
        console.error('Error cambiando a Base:', switchError);
        setError('Error al cambiar a la red Base.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Si no está conectado, mostrar mensaje
  if (!isConnected) {
    return (
      <div className="w-full max-w-md mx-auto p-6 bg-gray-800 rounded-lg border border-gray-700">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 bg-gradient-to-r from-pink-500 to-blue-500 rounded-full flex items-center justify-center mx-auto">
            <span className="text-2xl">🦄</span>
          </div>
          <h3 className="text-xl font-semibold text-white">Wallet No Conectada</h3>
          <p className="text-gray-400">
            Conecta tu wallet para usar el widget de Uniswap
          </p>
          <Button
            onClick={() => {/* Tu lógica de conexión */}}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg"
          >
            Conectar Wallet
          </Button>
        </div>
      </div>
    );
  }

  // Si está en la red incorrecta
  if (chainId !== 8453) {
    return (
      <div className="w-full max-w-md mx-auto p-6 bg-gray-800 rounded-lg border border-gray-700">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 bg-yellow-500 rounded-full flex items-center justify-center mx-auto">
            <span className="text-2xl">⚠️</span>
          </div>
          <h3 className="text-xl font-semibold text-white">Red Incorrecta</h3>
          <p className="text-gray-400">
            Cambia a la red Base para comprar DOBI
          </p>
          <Button
            onClick={handleSwitchToBase}
            disabled={isLoading}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white px-6 py-2 rounded-lg"
          >
            {isLoading ? 'Cambiando...' : 'Cambiar a Base'}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md mx-auto space-y-4">
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

      {/* Widget de Uniswap */}
      <div className="bg-gray-900 rounded-lg p-4 border border-gray-700">
        <div className="text-center mb-4">
          <h3 className="text-lg font-semibold text-white mb-2">
            Compra DOBI con Uniswap
          </h3>
          <p className="text-gray-400 text-sm">
            Intercambia ETH por DOBI directamente en la app
          </p>
        </div>
        
        <SwapWidget
          jsonRpcUrlMap={jsonRpcUrlMap}
          defaultChainId={8453}
          defaultOutputTokenAddress={DOBI_TOKEN.address}
          defaultInputTokenAddress="NATIVE" // ETH
          provider={getProvider()}
          theme={customTheme}
          onError={handleWidgetError}
          onSwapPriceUpdate={handlePriceUpdate}
          onSwapAmountUpdate={handleAmountUpdate}
          // Configuración específica para L2
          defaultSlippage={0.5} // 0.5% para Base
          maxSlippage={5.0}     // 5% máximo
          // Opcional: convenience fee
          // convenienceFee={250} // 0.25%
          // convenienceFeeRecipient="0xYourAddress"
        />
      </div>

      {/* Información del Token */}
      <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
        <h4 className="text-sm font-semibold text-white mb-2">Información DOBI</h4>
        <div className="space-y-1 text-xs">
          <div className="flex justify-between">
            <span className="text-gray-400">Símbolo:</span>
            <span className="text-white">{DOBI_TOKEN.symbol}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Red:</span>
            <span className="text-white">Base</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Contrato:</span>
            <span className="text-white font-mono text-xs">
              {DOBI_TOKEN.address.slice(0, 6)}...{DOBI_TOKEN.address.slice(-4)}
            </span>
          </div>
        </div>
      </div>

      {/* Instrucciones */}
      <div className="bg-blue-900 border border-blue-600 rounded-lg p-4">
        <h4 className="text-sm font-semibold text-blue-200 mb-2">Cómo usar</h4>
        <ol className="text-blue-300 text-xs space-y-1 list-decimal list-inside">
          <li>Selecciona la cantidad de ETH a intercambiar</li>
          <li>DOBI aparecerá automáticamente como token de salida</li>
          <li>Revisa el precio y las comisiones</li>
          <li>Confirma la transacción en tu wallet</li>
          <li>Espera la confirmación en la red Base</li>
        </ol>
      </div>
    </div>
  );
}

// Hook personalizado para manejar el estado del widget
export function useUniswapWidget() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [transactionHash, setTransactionHash] = useState<string | null>(null);

  const handleTransaction = (hash: string) => {
    setTransactionHash(hash);
    setIsLoading(false);
  };

  const handleError = (error: any) => {
    setError(error.message || 'Error desconocido');
    setIsLoading(false);
  };

  const resetState = () => {
    setError(null);
    setTransactionHash(null);
    setIsLoading(false);
  };

  return {
    isLoading,
    error,
    transactionHash,
    handleTransaction,
    handleError,
    resetState,
  };
}

export default UniswapWidgetIntegration;
