"use client";

import { useState, useEffect } from "react";
import { useLeaderboard } from "../../../hooks/useLeaderboard";
import { useAccount } from "wagmi";
import { Tab } from "../../App";
import FlappyBirdGame from "../../FlappyBirdGame";
import { gameAPI, initializeGameSession, isSessionActive } from "../../../lib/gameClient";
import { APP_SPLASH_URL } from "../../../lib/constants";
import ContractStatus from "../ContractStatus";

interface HomeTabProps {
  setActiveTab: (tab: Tab) => void;
}

interface GameStats {
  totalGames: number;
  bestScore: number;
  gamesWon: number;
  totalScore: number;
}

interface StatsResponse {
  success: boolean;
  data?: {
    stats: GameStats;
  };
  error?: string;
}

/**
 * HomeTab component displays the main landing content for the Flappy DOBI game.
 * 
 * This is the default tab that users see when they first open the mini app.
 * It provides game mode selection, leaderboard preview, and quick access to play.
 * 
 * @example
 * ```tsx
 * <HomeTab setActiveTab={setActiveTab} />
 * ```
 */
export function HomeTab({ setActiveTab }: HomeTabProps) {
  const { leaderboard, isLoading } = useLeaderboard();
  const [gameStats, setGameStats] = useState<GameStats>({
    totalGames: 0,
    bestScore: 0,
    gamesWon: 0,
    totalScore: 0
  });
  const { address, isConnected } = useAccount();
  const [gameMode, setGameMode] = useState<'home' | 'practice' | 'bet' | 'bet-game'>('home');
  const [isLoadingStats, setIsLoadingStats] = useState(false);

  // Get combined stats from API
  useEffect(() => {
    const fetchStats = async () => {
      setIsLoadingStats(true);
      try {
        // Use real wallet address if connected, otherwise use a fallback
        const playerAddress = address || '0x0000000000000000000000000000000000000000';
        
        // Inicializar sesión si no existe
        if (!isSessionActive()) {
          const sessionResult = await initializeGameSession(playerAddress);
          if (!sessionResult.success) {
            // console.error('Failed to initialize game session:', sessionResult.error);
            return;
          }
        }
        
        const result = await gameAPI.getPlayerStats(playerAddress) as StatsResponse;
        
        if (result.success && result.data && result.data.stats) {
          setGameStats(result.data.stats);
        }
      } catch (error) {
        // console.error('Error fetching stats:', error);
      } finally {
        setIsLoadingStats(false);
      }
    };

    fetchStats();
  }, [address]); // Re-fetch stats when wallet address changes

  // Function to execute bet mode smart contract
  const executeBetMode = async () => {
    if (!isConnected || !address) {
      alert('Please connect your wallet to use bet mode');
      return;
    }

    try {
      // // console.log('Starting bet mode execution...');
      
      // Simply switch to bet mode - the ContractStatus component will handle the smart contract interaction
      setGameMode('bet');
      // // console.log('Switched to bet mode');
      
    } catch (error) {
      // console.error('Error executing bet mode:', error);
      alert('Error executing bet mode. Please try again.');
    }
  };

  // Show game when a mode is selected
  if (gameMode === 'practice') {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={() => setGameMode('home')}
            className="flex items-center space-x-2 text-gray-400 hover:text-white transition-colors"
          >
            <span className="text-xl">←</span>
            <span>Back to Home</span>
          </button>
          <div className="text-sm text-gray-400">
            Practice Mode
          </div>
        </div>
        <FlappyBirdGame 
          gameMode={gameMode} 
          onBackToHome={() => setGameMode('home')} 
          playerAddress={address}
        />
      </div>
    );
  }

  // Show bet mode contract interface
  if (gameMode === 'bet') {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={() => setGameMode('home')}
            className="flex items-center space-x-2 text-gray-400 hover:text-white transition-colors"
          >
            <span className="text-xl">←</span>
            <span>Back to Home</span>
          </button>
          <div className="text-sm text-gray-400">
            Bet Mode - Smart Contract
          </div>
        </div>
        
        <ContractStatus 
          onGameCreated={(gameId) => {
            // // console.log('Game created with ID:', gameId);
            // Una vez creado el juego, iniciar el juego
            setGameMode('bet-game');
          }}
          onClaimSuccess={() => {
            // // console.log('Winnings claimed successfully');
            // Volver al home después de reclamar
            setGameMode('home');
          }}
        />
      </div>
    );
  }

  // Show actual bet game when game is created
  if (gameMode === 'bet-game') {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={() => setGameMode('bet')}
            className="flex items-center space-x-2 text-gray-400 hover:text-white transition-colors"
          >
            <span className="text-xl">←</span>
            <span>Back to Contract</span>
          </button>
          <div className="text-sm text-gray-400">
            Bet Mode - Playing
          </div>
        </div>
        <FlappyBirdGame 
          gameMode="bet" 
          onBackToHome={() => setGameMode('bet')} 
          playerAddress={address}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6 px-4">
      {/* Welcome Section */}
      <div className="text-center space-y-6">
        {/* DOBI Logo */}
        <div className="flex justify-center mb-4">
          <div className="w-20 h-20 bg-gradient-to-r from-cyan-400 to-blue-500 rounded-2xl flex items-center justify-center shadow-lg">
            <img 
              src="/splash.png" 
              alt="DOBI" 
              className="w-full h-full object-contain p-0.5"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
                e.currentTarget.parentElement!.innerHTML = '<span class="text-3xl font-bold text-white">D</span>';
              }}
            />
          </div>
        </div>
        
        {/* Title and Description */}
        <div className="space-y-3">
          <h2 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
            Welcome to Flappy DOBI!
          </h2>
          <p className="text-gray-300 text-lg">
            Help DOBI fly through space avoiding obstacles
          </p>
        </div>
      </div>

      {/* Game Mode Selection */}
      <div className="space-y-6">
        <h3 className="text-xl font-semibold text-white text-center">Select your game mode</h3>
        
        <div className="grid gap-4">
          {/* Practice Mode Button */}
        <button 
          onClick={async () => {
            // Initialize session for practice mode if wallet is connected
            if (address && !isSessionActive()) {
              try {
                const sessionResult = await initializeGameSession(address);
                if (!sessionResult.success) {
                  // console.error('Failed to initialize game session:', sessionResult.error);
                }
              } catch (error) {
                // console.error('Error initializing session for practice mode:', error);
              }
            }
            // Start practice mode
            setGameMode('practice');
          }}
          className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white font-bold py-4 px-6 rounded-xl transition-all duration-300 transform hover:scale-105 shadow-lg"
        >
          <div className="flex items-center justify-center space-x-3">
            <span className="text-2xl">🎯</span>
            <div className="text-left">
              <div className="text-lg font-semibold">Practice Mode</div>
              <div className="text-sm opacity-90">Infinite game without bets</div>
            </div>
          </div>
        </button>

        {/* Bet Mode Button */}
        <button 
          onClick={() => {
            // Execute smart contract for bet mode
            executeBetMode();
          }}
          className="w-full bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-white font-bold py-4 px-6 rounded-xl transition-all duration-300 transform hover:scale-105 shadow-lg"
        >
          <div className="flex items-center justify-center space-x-3">
            <span className="text-2xl">💰</span>
            <div className="text-left">
              <div className="text-lg font-semibold">Bet Mode</div>
              <div className="text-sm opacity-90">Play with bets and win rewards</div>
            </div>
          </div>
        </button>
        </div>
      </div>

      {/* Stats Section */}
      <div className="grid grid-cols-2 gap-4">
        {/* High Score */}
        <div className="bg-gradient-to-br from-purple-600 to-purple-800 rounded-xl p-4 text-center">
          <div className="text-2xl mb-1">🏆</div>
          <div className="text-2xl font-bold text-white">
            {isLoadingStats ? '...' : gameStats.bestScore}
          </div>
          <div className="text-sm text-purple-200">Best Score</div>
        </div>

        {/* Games Played */}
        <div className="bg-gradient-to-br from-blue-600 to-blue-800 rounded-xl p-4 text-center">
          <div className="text-2xl mb-1">🎮</div>
          <div className="text-2xl font-bold text-white">
            {isLoadingStats ? '...' : gameStats.totalGames}
          </div>
          <div className="text-sm text-blue-200">Total Games</div>
        </div>
      </div>


      {/* Leaderboard Preview */}
      {!isLoading && leaderboard.entries.length > 0 && (
        <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl p-6 border border-gray-700">
          <h3 className="text-xl font-semibold text-white mb-4 flex items-center">
            <span className="mr-2">🏅</span>
            Top Players
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
                      {entry.displayName || `User ${entry.fid}`}
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
                And {leaderboard.entries.length - 3} more players...
              </span>
            </div>
          )}
        </div>
      )}

      {/* Quick Actions */}
      <div className="text-center space-y-3">
        <p className="text-gray-400 text-sm">
          Swipe right to see more options
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
