"use client";

import { useState, useEffect } from "react";
import { useLeaderboard } from "../../../hooks/useLeaderboard";
import { useAccount } from "wagmi";
import { Tab } from "../../App";
import FlappyBirdGame from "../../FlappyBirdGame";
import { gameAPI, initializeGameSession, isSessionActive } from "../../../lib/gameClient";
import { APP_SPLASH_URL } from "../../../lib/constants";
import ContractStatus from "../ContractStatus";
import { getPlayerStats, updatePlayerStats, PlayerStats } from "../../../lib/simpleStats";

interface HomeTabProps {
  setActiveTab: (tab: Tab) => void;
}

// Removed complex interfaces - using simple PlayerStats from simpleStats.ts

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
  const [gameStats, setGameStats] = useState<PlayerStats>({
    totalGames: 0,
    bestScore: 0,
    gamesWon: 0,
    totalScore: 0,
    lastUpdated: Date.now()
  });
  const { address, isConnected } = useAccount();
  const [gameMode, setGameMode] = useState<'home' | 'practice' | 'bet' | 'bet-game' | 'practice-game-over'>('home');
  const [gameResult, setGameResult] = useState<'won' | 'lost' | null>(null);
  const [practiceScore, setPracticeScore] = useState<number>(0);

  // Handle game results
  const handleGameLost = (score: number, gameMode: string) => {
    if (address) {
      updatePlayerStats(address, score, false);
      setGameStats(getPlayerStats(address));
    }
    
    // Solo ir a la pestaña de contrato si es bet mode
    if (gameMode === 'bet') {
      setGameResult('lost');
      setGameMode('bet'); // Volver a la pestaña de contrato para mostrar resultado
    } else {
      // Para practice mode, mostrar pantalla de game over
      setPracticeScore(score);
      setGameMode('practice-game-over');
    }
  };

  const handleGameWon = (score: number, gameMode: string) => {
    if (address) {
      updatePlayerStats(address, score, true);
      setGameStats(getPlayerStats(address));
    }
    
    // Solo ir a la pestaña de contrato si es bet mode
    if (gameMode === 'bet') {
      setGameResult('won');
      setGameMode('bet'); // Volver a la pestaña de contrato para mostrar resultado
    } else {
      // Para practice mode, mostrar pantalla de game over con victoria
      setPracticeScore(score);
      setGameMode('practice-game-over');
    }
  };

  // Reset game result when starting a new game
  const resetGameResult = () => {
    setGameResult(null);
  };

  // Reset game result when starting a new game
  useEffect(() => {
    if (gameMode === 'bet-game') {
      resetGameResult();
    }
  }, [gameMode]);

  // Load stats from localStorage
  useEffect(() => {
    if (address) {
      const stats = getPlayerStats(address);
      setGameStats(stats);
    }
  }, [address]);

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
          onGameLost={(score) => handleGameLost(score, gameMode)}
          onGameWon={(score) => handleGameWon(score, gameMode)}
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
          gameResult={gameResult}
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
          onGameLost={(score) => handleGameLost(score, 'bet')}
          onGameWon={(score) => handleGameWon(score, 'bet')}
        />
      </div>
    );
  }

  // Show practice mode game over screen
  if (gameMode === 'practice-game-over') {
    return (
      <div className="space-y-6 px-4">
        {/* Game Over Header */}
        <div className="text-center space-y-4">
          <div className="text-6xl">🎮</div>
          <h2 className="text-3xl font-bold text-white">
            {practiceScore >= 51 ? '🎉 VICTORY! 🎉' : 'Game Over'}
          </h2>
          <p className="text-gray-300 text-lg">
            {practiceScore >= 51 ? 'Congratulations! You reached 51 points!' : 'Better luck next time!'}
          </p>
        </div>

        {/* Score Display */}
        <div className="bg-gradient-to-br from-purple-600 to-purple-800 rounded-xl p-6 text-center">
          <div className="text-4xl font-bold text-white mb-2">
            {practiceScore}
          </div>
          <div className="text-lg text-purple-200">Final Score</div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-4">
          <button
            onClick={() => setGameMode('practice')}
            className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white font-bold py-4 px-6 rounded-xl transition-all duration-300 transform hover:scale-105 shadow-lg"
          >
            <div className="flex items-center justify-center space-x-3">
              <span className="text-2xl">🔄</span>
              <span className="text-lg">Try Again</span>
            </div>
          </button>

          <button
            onClick={() => setGameMode('home')}
            className="w-full bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-700 hover:to-gray-800 text-white font-bold py-4 px-6 rounded-xl transition-all duration-300 transform hover:scale-105 shadow-lg"
          >
            <div className="flex items-center justify-center space-x-3">
              <span className="text-2xl">🏠</span>
              <span className="text-lg">Home</span>
            </div>
          </button>
        </div>

        {/* Stats Preview */}
        <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl p-4 border border-gray-700">
          <h3 className="text-lg font-semibold text-white mb-3 text-center">Your Stats</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-cyan-400">{gameStats.bestScore}</div>
              <div className="text-sm text-gray-400">Best Score</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-400">{gameStats.totalGames}</div>
              <div className="text-sm text-gray-400">Total Games</div>
            </div>
          </div>
        </div>
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
            {gameStats.bestScore}
          </div>
          <div className="text-sm text-purple-200">Best Score</div>
        </div>

        {/* Games Played */}
        <div className="bg-gradient-to-br from-blue-600 to-blue-800 rounded-xl p-4 text-center">
          <div className="text-2xl mb-1">🎮</div>
          <div className="text-2xl font-bold text-white">
            {gameStats.totalGames}
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
