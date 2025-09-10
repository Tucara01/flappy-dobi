"use client";

import { useState, useEffect } from "react";
import { useLeaderboard } from "../../../hooks/useLeaderboard";

/**
 * HomeTab component displays the main landing content for the Flappy DOBI game.
 * 
 * This is the default tab that users see when they first open the mini app.
 * It provides game information, leaderboard preview, and quick access to play.
 * 
 * @example
 * ```tsx
 * <HomeTab />
 * ```
 */
export function HomeTab() {
  const { leaderboard, isLoading } = useLeaderboard();
  const [highScore, setHighScore] = useState(0);

  // Get high score from localStorage
  useEffect(() => {
    const savedHighScore = localStorage.getItem('flappy-dobi-high-score');
    if (savedHighScore) {
      setHighScore(parseInt(savedHighScore, 10));
    }
  }, []);

  return (
    <div className="space-y-6 px-4">
      {/* Welcome Section */}
      <div className="text-center space-y-4">
        <div className="relative">
          <h2 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
            ¡Bienvenido a Flappy DOBI!
          </h2>
          <div className="absolute -top-2 -right-2 text-2xl">🐕</div>
        </div>
        <p className="text-gray-300 text-lg">
          Ayuda a DOBI a volar por el espacio evitando obstáculos
        </p>
      </div>

      {/* Game Preview Card */}
      <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl p-6 border border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-semibold text-white">Juego</h3>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
            <span className="text-sm text-gray-300">Disponible</span>
          </div>
        </div>
        
        <div className="space-y-4">
          <div className="bg-gray-700 rounded-lg p-4 text-center">
            <div className="text-6xl mb-2">🚀</div>
            <p className="text-gray-300 mb-3">
              Toca para saltar y evita los obstáculos espaciales
            </p>
            <div className="flex justify-center space-x-4 text-sm text-gray-400">
              <span>• Gráficos futuristas</span>
              <span>• Efectos de partículas</span>
              <span>• Sistema de puntuación</span>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Section */}
      <div className="grid grid-cols-2 gap-4">
        {/* High Score */}
        <div className="bg-gradient-to-br from-purple-600 to-purple-800 rounded-xl p-4 text-center">
          <div className="text-2xl mb-1">🏆</div>
          <div className="text-2xl font-bold text-white">{highScore}</div>
          <div className="text-sm text-purple-200">Mejor Puntuación</div>
        </div>

        {/* Games Played */}
        <div className="bg-gradient-to-br from-blue-600 to-blue-800 rounded-xl p-4 text-center">
          <div className="text-2xl mb-1">🎮</div>
          <div className="text-2xl font-bold text-white">
            {localStorage.getItem('flappy-dobi-games-played') || '0'}
          </div>
          <div className="text-sm text-blue-200">Partidas Jugadas</div>
        </div>
      </div>

      {/* Leaderboard Preview */}
      {!isLoading && leaderboard.entries.length > 0 && (
        <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl p-6 border border-gray-700">
          <h3 className="text-xl font-semibold text-white mb-4 flex items-center">
            <span className="mr-2">🏅</span>
            Top Jugadores
          </h3>
          
          <div className="space-y-2">
            {leaderboard.entries.slice(0, 3).map((entry, index) => (
              <div key={entry.fid} className="flex items-center justify-between bg-gray-700 rounded-lg p-3">
                <div className="flex items-center space-x-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                    index === 0 ? 'bg-yellow-500 text-black' :
                    index === 1 ? 'bg-gray-400 text-black' :
                    'bg-orange-600 text-white'
                  }`}>
                    {index + 1}
                  </div>
                  <div>
                    <div className="text-white font-medium">
                      {entry.displayName || `Usuario ${entry.fid}`}
                    </div>
                    <div className="text-xs text-gray-400">
                      {entry.username ? `@${entry.username}` : ''}
                    </div>
                  </div>
                </div>
                <div className="text-cyan-400 font-bold text-lg">
                  {entry.score}
                </div>
              </div>
            ))}
          </div>
          
          {leaderboard.entries.length > 3 && (
            <div className="text-center mt-3">
              <span className="text-sm text-gray-400">
                Y {leaderboard.entries.length - 3} jugadores más...
              </span>
            </div>
          )}
        </div>
      )}

      {/* Quick Actions */}
      <div className="text-center space-y-3">
        <p className="text-gray-400 text-sm">
          Desliza hacia la derecha para ver más opciones
        </p>
        <div className="flex justify-center space-x-2">
          <div className="w-2 h-2 bg-cyan-400 rounded-full"></div>
          <div className="w-2 h-2 bg-gray-600 rounded-full"></div>
          <div className="w-2 h-2 bg-gray-600 rounded-full"></div>
          <div className="w-2 h-2 bg-gray-600 rounded-full"></div>
        </div>
      </div>
    </div>
  );
} 