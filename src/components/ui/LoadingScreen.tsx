"use client";

import React from 'react';
import { APP_SPLASH_URL } from '../../lib/constants';

interface LoadingScreenProps {
  message?: string;
  subMessage?: string;
  showProgress?: boolean;
  progress?: number;
}

export function LoadingScreen({ 
  message = "Cargando Flappy DOBI...", 
  subMessage = "Preparando el juego espacial",
  showProgress = false,
  progress = 0
}: LoadingScreenProps) {
  return (
    <div className="flex items-center justify-center h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-violet-900">
      {/* Large DOBI image in background */}
      <div className="absolute top-8 left-1/2 transform -translate-x-1/2 opacity-20">
        <img 
          src="/splash.png" 
          alt="DOBI" 
          className="w-32 h-32 object-contain"
          onError={(e) => {
            // Hide background image if it fails to load
            e.currentTarget.style.display = 'none';
          }}
        />
      </div>
      
      <div className="text-center max-w-md mx-auto px-6 relative z-10">
        {/* Animated DOBI Logo/Icon */}
        <div className="relative mb-8">
          <div className="animate-bounce">
            <div className="w-24 h-24 mx-auto bg-gradient-to-r from-cyan-400 to-blue-500 rounded-2xl flex items-center justify-center shadow-2xl overflow-hidden border-2 border-cyan-300">
              <img 
                src="/splash.png" 
                alt="DOBI" 
                className="w-full h-full object-contain p-1"
                onError={(e) => {
                  // Fallback to text if image fails to load
                  e.currentTarget.style.display = 'none';
                  e.currentTarget.parentElement!.innerHTML = '<span class="text-4xl font-bold text-white">D</span>';
                }}
              />
            </div>
          </div>
          {/* Orbiting particles */}
          <div className="absolute inset-0 animate-spin">
            <div className="w-2 h-2 bg-cyan-300 rounded-full absolute top-0 left-1/2 transform -translate-x-1/2"></div>
            <div className="w-1 h-1 bg-blue-300 rounded-full absolute bottom-0 right-0"></div>
            <div className="w-1.5 h-1.5 bg-purple-300 rounded-full absolute top-1/2 left-0"></div>
          </div>
          {/* Additional floating elements */}
          <div className="absolute -top-4 -left-4 w-3 h-3 bg-cyan-400 rounded-full animate-pulse"></div>
          <div className="absolute -bottom-2 -right-6 w-2 h-2 bg-blue-400 rounded-full animate-pulse" style={{ animationDelay: '0.5s' }}></div>
        </div>

        {/* Main loading message */}
        <h2 className="text-2xl font-bold text-white mb-2 animate-pulse">
          {message}
        </h2>
        
        {/* Sub message */}
        <p className="text-gray-300 text-sm mb-6">
          {subMessage}
        </p>

        {/* Progress bar */}
        {showProgress && (
          <div className="w-full bg-gray-700 rounded-full h-2 mb-4">
            <div 
              className="bg-gradient-to-r from-cyan-400 to-blue-500 h-2 rounded-full transition-all duration-300 ease-out"
              style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
            ></div>
          </div>
        )}

        {/* Loading spinner */}
        <div className="flex justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-400"></div>
        </div>

        {/* Loading dots animation */}
        <div className="flex justify-center mt-4 space-x-1">
          <div className="w-2 h-2 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
          <div className="w-2 h-2 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
          <div className="w-2 h-2 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
        </div>
      </div>
    </div>
  );
}

export default LoadingScreen;
