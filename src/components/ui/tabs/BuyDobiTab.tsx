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

    </div>
  );
}