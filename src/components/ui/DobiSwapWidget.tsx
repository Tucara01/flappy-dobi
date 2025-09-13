"use client";

import React, { useState, useEffect } from 'react';
import { useAccount, useChainId, useSwitchChain } from 'wagmi';
import { useDobiSwap } from '../../hooks/useDobiSwap';
import { 
  ETH_TOKEN, 
  DOBI_TOKEN, 
  USDC_BASE 
} from '../../lib/uniswap-config';
import { base } from 'wagmi/chains';

interface DobiSwapWidgetProps {
  className?: string;
}

export const DobiSwapWidget: React.FC<DobiSwapWidgetProps> = ({ className }) => {
  // Wagmi hooks for wallet connection
  const { address: account, isConnected } = useAccount();
  const chainId = useChainId();
  const { switchChain, isPending: isSwitchingChain } = useSwitchChain();
  
  // Local state
  const [amountIn, setAmountIn] = useState<string>('');
  const [amountOut, setAmountOut] = useState<string>('');
  const [tokenIn, setTokenIn] = useState<string>('ETH');
  const [tokenOut, setTokenOut] = useState<string>('DOBI');

  const { getQuote, executeSwap, isLoading } = useDobiSwap();

  const tokens = {
    ETH: ETH_TOKEN,
    DOBI: DOBI_TOKEN,
    USDC: USDC_BASE
  };

  // Check if we're on Base network
  const isOnBase = chainId === base.id;

  // Handle network switching
  const handleSwitchToBase = async () => {
    try {
      await switchChain({ chainId: base.id });
    } catch (error) {
      console.error('Failed to switch to Base network:', error);
    }
  };

  // Update quote in real-time
  useEffect(() => {
    if (amountIn && tokenIn && tokenOut && tokenIn !== tokenOut && isConnected && isOnBase) {
      const timer = setTimeout(async () => {
        const quote = await getQuote(amountIn, tokens[tokenIn as keyof typeof tokens], tokens[tokenOut as keyof typeof tokens]);
        setAmountOut(quote || '0');
      }, 800);

      return () => clearTimeout(timer);
    } else {
      setAmountOut('');
    }
  }, [amountIn, tokenIn, tokenOut, getQuote, isConnected, isOnBase]);

  const handleSwap = async () => {
    if (!amountIn || !isConnected || !isOnBase || tokenIn === tokenOut) return;
    
    try {
      const tx = await executeSwap(
        amountIn,
        tokens[tokenIn as keyof typeof tokens],
        tokens[tokenOut as keyof typeof tokens],
        0.5 // 0.5% slippage
      );
      
      alert(`🎉 Swap successful!\nTx Hash: ${tx?.hash}\nView on BaseScan: https://basescan.org/tx/${tx?.hash}`);
      setAmountIn('');
      setAmountOut('');
    } catch (error: any) {
      alert(`❌ Swap error: ${error.message}`);
    }
  };

  const switchTokens = () => {
    const tempIn = tokenIn;
    setTokenIn(tokenOut);
    setTokenOut(tempIn);
    setAmountIn(amountOut);
    setAmountOut(amountIn);
  };

  // Show wallet connection message if not connected
  if (!isConnected) {
    return (
      <div className={`dobi-swap-widget ${className}`}>
        <div className="widget-header">
          <h3>🚀 DOBI Swap Widget</h3>
          <p>Swap tokens with DOBI on Base Network</p>
        </div>
        
        <div className="connect-message">
          <p>Please connect your wallet in the Wallet tab to start trading DOBI tokens.</p>
        </div>
      </div>
    );
  }

  // Show network switch message if not on Base
  if (!isOnBase) {
    return (
      <div className={`dobi-swap-widget ${className}`}>
        <div className="widget-header">
          <h3>🚀 DOBI Swap Widget</h3>
          <p>Swap tokens with DOBI on Base Network</p>
        </div>
        
        <div className="network-message">
          <p>Please switch to Base Network to trade DOBI tokens.</p>
          <button 
            onClick={handleSwitchToBase} 
            className="switch-network-btn"
            disabled={isSwitchingChain}
          >
            {isSwitchingChain ? 'Switching...' : 'Switch to Base'}
          </button>
        </div>
      </div>
    );
  }

  // Main swap interface
  return (
    <div className={`dobi-swap-widget ${className}`}>
      <div className="widget-header">
        <h3>🚀 DOBI Swap Widget</h3>
        <p>Swap tokens with DOBI on Base Network</p>
      </div>
      
      <div className="swap-interface">
        <div className="account-info">
          <span>🔗 Connected: {account?.slice(0,6)}...{account?.slice(-4)}</span>
          <span className="network-badge">Base Network</span>
        </div>
        
        <SwapForm 
          tokens={tokens}
          amountIn={amountIn}
          setAmountIn={setAmountIn}
          amountOut={amountOut}
          setAmountOut={setAmountOut}
          tokenIn={tokenIn}
          setTokenIn={setTokenIn}
          tokenOut={tokenOut}
          setTokenOut={setTokenOut}
          isLoading={isLoading}
          onSwap={handleSwap}
          onSwitchTokens={switchTokens}
        />
      </div>
    </div>
  );
};

interface SwapFormProps {
  tokens: any;
  amountIn: string;
  setAmountIn: (value: string) => void;
  amountOut: string;
  setAmountOut: (value: string) => void;
  tokenIn: string;
  setTokenIn: (value: string) => void;
  tokenOut: string;
  setTokenOut: (value: string) => void;
  isLoading: boolean;
  onSwap: () => void;
  onSwitchTokens: () => void;
}

const SwapForm: React.FC<SwapFormProps> = ({ 
  amountIn, setAmountIn, amountOut, setAmountOut,
  tokenIn, setTokenIn, tokenOut, setTokenOut, 
  isLoading, onSwap, onSwitchTokens 
}) => {
  return (
    <div className="swap-form">
      {/* Input Token */}
      <div className="input-group">
        <label>From</label>
        <div className="token-input">
          <input
            type="number"
            value={amountIn}
            onChange={(e) => setAmountIn(e.target.value)}
            placeholder="0.0"
            step="any"
          />
          <select value={tokenIn} onChange={(e) => setTokenIn(e.target.value)}>
            <option value="ETH">ETH</option>
            <option value="DOBI">🚀 DOBI</option>
            <option value="USDC">USDC</option>
          </select>
        </div>
      </div>

      {/* Switch Button */}
      <div className="switch-container">
        <button onClick={onSwitchTokens} className="switch-btn" disabled={isLoading}>
          ⇅
        </button>
      </div>

      {/* Output Token */}
      <div className="input-group">
        <label>To</label>
        <div className="token-input">
          <input
            type="text"
            value={amountOut}
            readOnly
            placeholder="0.0"
            className="readonly-input"
          />
          <select value={tokenOut} onChange={(e) => setTokenOut(e.target.value)}>
            <option value="ETH">ETH</option>
            <option value="DOBI">🚀 DOBI</option>
            <option value="USDC">USDC</option>
          </select>
        </div>
      </div>

      {/* Swap Button */}
      <button 
        onClick={onSwap}
        disabled={isLoading || !amountIn || tokenIn === tokenOut}
        className={`swap-btn ${isLoading ? 'loading' : ''}`}
      >
        {isLoading ? '⏳ Swapping...' : `Swap ${tokenIn} → ${tokenOut}`}
      </button>

      {/* Additional Info */}
      {amountOut && amountIn && (
        <div className="swap-info">
          <small>
            💱 Rate: 1 {tokenIn} = {(parseFloat(amountOut) / parseFloat(amountIn)).toFixed(6)} {tokenOut}
          </small>
        </div>
      )}
    </div>
  );
};