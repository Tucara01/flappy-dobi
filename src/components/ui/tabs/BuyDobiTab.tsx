"use client";

import React from "react";
import { DobiSwapWidget } from "../DobiSwapWidget";

/**
 * BuyDobiTab component - Complete DOBI trading implementation
 * 
 * This component provides a fully functional trading interface for DOBI tokens
 * using Uniswap V3 on Base network with direct contract integration.
 */
export function BuyDobiTab() {
  return (
    <div className="w-full max-w-4xl mx-auto p-4 space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-bold text-white mb-2">
          Buy DOBI Token
        </h2>
        <p className="text-gray-300 text-lg">
          Trade DOBI tokens directly on Base Network
        </p>
      </div>

      {/* DOBI Swap Widget */}
      <div className="flex justify-center">
        <DobiSwapWidget />
      </div>


      {/* DOBI Token Information */}
      <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
        <h3 className="text-lg font-semibold text-white mb-3">DOBI Token Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-gray-400">Name:</span>
            <span className="text-white ml-2">Dobi by Virtuals</span>
          </div>
          <div>
            <span className="text-gray-400">Symbol:</span>
            <span className="text-white ml-2">DOBI</span>
          </div>
          <div>
            <span className="text-gray-400">Decimals:</span>
            <span className="text-white ml-2">18</span>
          </div>
          <div>
            <span className="text-gray-400">Network:</span>
            <span className="text-white ml-2">Base</span>
          </div>
          <div className="md:col-span-2">
            <span className="text-gray-400">Contract Address:</span>
            <span className="text-white ml-2 font-mono text-xs break-all">
              0x931ef8053e997b1bab68d1e900a061305c0ff4fb
            </span>
          </div>
        </div>
      </div>

      {/* Trading Instructions */}
      <div className="bg-blue-900 border border-blue-600 rounded-lg p-4">
        <h3 className="text-lg font-semibold text-blue-200 mb-3">How to Trade DOBI</h3>
        <ol className="text-blue-300 text-sm space-y-2 list-decimal list-inside">
          <li>Connect your wallet using the widget above</li>
          <li>Ensure you're on Base network</li>
          <li>Select the token you want to trade (ETH, USDC, or DOBI)</li>
          <li>Enter the amount you want to swap</li>
          <li>Review the exchange rate and slippage</li>
          <li>Click "Swap" and confirm the transaction in your wallet</li>
          <li>Wait for the transaction to be confirmed on Base network</li>
        </ol>
        
        <div className="mt-4 p-3 bg-blue-800 rounded-lg">
          <p className="text-blue-200 text-xs">
            <strong>💡 Note:</strong> This widget uses direct Uniswap V3 integration on Base network. 
            Make sure you have ETH for gas fees and sufficient balance of the token you want to trade.
          </p>
        </div>
      </div>
    </div>
  );
}