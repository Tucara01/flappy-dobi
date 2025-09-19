"use client";

import React from "react";

/**
 * BuyDobiTab component - Stylized Uniswap link for DOBI trading
 * 
 * This component provides a direct link to Uniswap for trading DOBI tokens
 * on Base network with enhanced styling and animations.
 */
export function BuyDobiTab() {
  return (
    <div className="w-full max-w-5xl mx-auto p-6 space-y-8">
      {/* Hero Section */}
      <div className="text-center space-y-4">
        <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full mb-4 shadow-lg">
          <span className="text-4xl">🦄</span>
        </div>
        <h2 className="text-4xl font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent mb-2">
          Buy DOBI Token
        </h2>
        <p className="text-gray-300 text-xl max-w-2xl mx-auto">
          Trade DOBI tokens on the world&apos;s leading decentralized exchange
        </p>
        <div className="flex items-center justify-center space-x-2 text-sm text-gray-400">
          <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
          <span>Base Network</span>
        </div>
      </div>

      {/* Main CTA Button */}
      <div className="flex justify-center">
        <a
          href="https://app.uniswap.org/explore/tokens/base/0x931ef8053e997b1bab68d1e900a061305c0ff4fb?inputCurrency=0x931ef8053e997b1bab68d1e900a061305c0ff4fb"
          target="_blank"
          rel="noopener noreferrer"
          className="group relative bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 hover:from-blue-700 hover:via-purple-700 hover:to-pink-700 text-white font-bold py-6 px-12 rounded-2xl text-2xl transition-all duration-300 flex items-center space-x-4 shadow-2xl hover:shadow-blue-500/25 hover:scale-105 transform"
        >
          <span className="text-3xl group-hover:animate-bounce">🦄</span>
          <span>Trade on Uniswap</span>
          <span className="text-lg opacity-75 group-hover:translate-x-1 transition-transform">→</span>
        </a>
      </div>

      {/* Content Grid */}
      <div className="flex justify-center">
        {/* DOBI Token Information */}
        <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl p-6 border border-gray-700 shadow-xl max-w-2xl w-full">
          <div className="flex items-center space-x-3 mb-6">
            <div className="w-10 h-10 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-lg flex items-center justify-center">
              <span className="text-xl">💰</span>
            </div>
            <h3 className="text-2xl font-bold text-white">Token Information</h3>
          </div>
          <div className="space-y-4">
            <div className="flex justify-between items-center py-3 border-b border-gray-700">
              <span className="text-gray-400 font-medium">Name</span>
              <span className="text-white font-semibold">Dobi by Virtuals</span>
            </div>
            <div className="flex justify-between items-center py-3 border-b border-gray-700">
              <span className="text-gray-400 font-medium">Symbol</span>
              <span className="text-white font-semibold bg-gradient-to-r from-yellow-400 to-orange-500 bg-clip-text text-transparent font-bold">DOBI</span>
            </div>
            <div className="flex justify-between items-center py-3 border-b border-gray-700">
              <span className="text-gray-400 font-medium">Decimals</span>
              <span className="text-white font-semibold">18</span>
            </div>
            <div className="flex justify-between items-center py-3 border-b border-gray-700">
              <span className="text-gray-400 font-medium">Network</span>
              <span className="text-white font-semibold bg-blue-600 px-3 py-1 rounded-full text-sm">Base</span>
            </div>
            <div className="pt-3">
              <span className="text-gray-400 font-medium block mb-2">Contract Address</span>
              <div className="bg-gray-900 rounded-lg p-3 border border-gray-600">
                <span className="text-white font-mono text-sm break-all">
                  0x931ef8053e997b1bab68d1e900a061305c0ff4fb
                </span>
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* Additional Info */}
      <div className="bg-gradient-to-r from-blue-900/20 to-purple-900/20 rounded-2xl p-6 border border-blue-500/20">
        <div className="text-center">
          <h4 className="text-lg font-semibold text-blue-300 mb-2">💡 Pro Tips</h4>
          <p className="text-gray-300 text-sm">
            Make sure you have enough ETH for gas fees and always double-check the contract address before trading.
          </p>
        </div>
      </div>
    </div>
  );
}