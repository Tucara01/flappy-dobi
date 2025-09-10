"use client";

import { useState, useEffect } from "react";

interface GameState {
  gameId?: number;
  canClaimReward: boolean;
  hasWon: boolean;
  score: number;
}

interface Game {
  id: number;
  player: string;
  status: string;
  score: number;
  createdAt: number;
  claimedAt?: number;
}

/**
 * ClaimTab component handles reward claiming functionality.
 * 
 * Users can check if they have any claimable rewards and claim them.
 * Shows different states based on whether the user has won a game or not.
 * 
 * @example
 * ```tsx
 * <ClaimTab />
 * ```
 */
export function ClaimTab() {
  const [gameState, setGameState] = useState<GameState>({
    canClaimReward: false,
    hasWon: false,
    score: 0
  });
  const [recentGames, setRecentGames] = useState<Game[]>([]);
  const [claimableGames, setClaimableGames] = useState<Game[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [claimMessage, setClaimMessage] = useState("");

  // Check for claimable games on component mount
  useEffect(() => {
    checkClaimableGames();
  }, []);

  const checkClaimableGames = async () => {
    setIsLoading(true);
    try {
      const playerAddress = '0x1234567890123456789012345678901234567890'; // Mock address for testing
      console.log('Checking claimable games for player:', playerAddress);
      
      const response = await fetch(`/api/games/claim?player=${playerAddress}`);
      console.log('Claim games response:', response.status, response.ok);
      
      if (response.ok) {
        const data = await response.json();
        console.log('Claim games data:', data);
        setRecentGames(data.recentGames || []);
        setClaimableGames(data.claimableGames || []);
        
        if (data.claimableGames && data.claimableGames.length > 0) {
          setGameState(prev => ({
            ...prev,
            canClaimReward: true,
            hasWon: true
          }));
        }
      } else {
        const errorData = await response.json();
        console.error('Claim games failed:', errorData);
      }
    } catch (error) {
      console.error('Error checking claimable games:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const claimReward = async (gameId: number) => {
    setIsLoading(true);
    setClaimMessage("");
    
    try {
      const playerAddress = '0x1234567890123456789012345678901234567890'; // Mock address for testing
      const response = await fetch('/api/games/claim', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          gameId, 
          player: playerAddress 
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setClaimMessage(`Success! Claimed ${data.rewardAmount / 1e6} USDC`);
        
        // Refresh claimable games
        await checkClaimableGames();
      } else {
        const error = await response.json();
        setClaimMessage(`Error: ${error.error}`);
      }
    } catch (error) {
      console.error('Error claiming reward:', error);
      setClaimMessage('Error claiming reward');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6 px-4">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-white mb-2">Claim Rewards</h2>
        <p className="text-gray-300">Check and claim your game rewards</p>
        <button
          onClick={checkClaimableGames}
          disabled={isLoading}
          className="mt-2 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-500 text-white font-bold py-2 px-4 rounded-lg transition-colors text-sm"
        >
          {isLoading ? 'Loading...' : 'Refresh Games'}
        </button>
      </div>

      {/* Statistics Summary */}
      {recentGames.length > 0 && (
        <div className="bg-gray-800 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Your Stats</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-blue-400">{recentGames.length}</p>
              <p className="text-gray-300 text-sm">Total Games</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-green-400">{claimableGames.length}</p>
              <p className="text-gray-300 text-sm">Claimable Rewards</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-yellow-400">
                {recentGames.filter(g => g.status === 'won').length}
              </p>
              <p className="text-gray-300 text-sm">Games Won</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-purple-400">
                {Math.max(...recentGames.map(g => g.score), 0)}
              </p>
              <p className="text-gray-300 text-sm">Best Score</p>
            </div>
          </div>
        </div>
      )}

      {/* Recent Games */}
      <div className="bg-gray-800 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Last 10 Games</h3>
        
        {isLoading ? (
          <div className="text-center py-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
            <p className="text-gray-300 mt-2">Loading...</p>
          </div>
        ) : recentGames.length > 0 ? (
          <div className="space-y-3">
            {recentGames.map((game) => (
              <div key={game.id} className={`rounded-lg p-4 ${
                game.status === 'won' && game.score >= 50 
                  ? 'bg-green-900 border border-green-500' 
                  : game.status === 'won' 
                    ? 'bg-yellow-900 border border-yellow-500'
                    : 'bg-gray-700'
              }`}>
                <div className="flex justify-between items-center">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                      <p className="text-white font-medium">Game #{game.id}</p>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        game.status === 'won' && game.score >= 50
                          ? 'bg-green-600 text-white'
                          : game.status === 'won'
                            ? 'bg-yellow-600 text-white'
                            : 'bg-red-600 text-white'
                      }`}>
                        {game.status === 'won' && game.score >= 50 ? 'WINNER' : 
                         game.status === 'won' ? 'WON' : 'LOST'}
                      </span>
                    </div>
                    <p className="text-gray-300 text-sm">Score: {game.score} points</p>
                    <p className="text-gray-400 text-xs">
                      {new Date(game.createdAt).toLocaleString()}
                    </p>
                    {game.status === 'won' && game.score >= 50 && (
                      <p className="text-green-400 text-xs mt-1">
                        🎁 Eligible for 2 USDC reward
                      </p>
                    )}
                  </div>
                  {game.status === 'won' && game.score >= 50 && (
                    <button
                      onClick={() => claimReward(game.id)}
                      disabled={isLoading}
                      className="bg-green-500 hover:bg-green-600 disabled:bg-gray-500 text-white font-bold py-2 px-4 rounded-lg transition-colors text-sm"
                    >
                      Claim
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-4">
            <p className="text-gray-400">No games found</p>
            <p className="text-gray-500 text-sm mt-1">Play some games to see your history!</p>
          </div>
        )}

        {/* Claim Message */}
        {claimMessage && (
          <div className={`mt-4 p-3 rounded-lg ${
            claimMessage.includes('Success') 
              ? 'bg-green-900 text-green-300' 
              : 'bg-red-900 text-red-300'
          }`}>
            {claimMessage}
          </div>
        )}
      </div>

      {/* Instructions */}
      <div className="bg-blue-900 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-white mb-3">How to Earn Rewards</h3>
        <ul className="space-y-2 text-gray-300 text-sm">
          <li className="flex items-start space-x-2">
            <span className="text-blue-400">•</span>
            <span>Play the Flappy DOBI game</span>
          </li>
          <li className="flex items-start space-x-2">
            <span className="text-blue-400">•</span>
            <span>Reach 50 points in a single game</span>
          </li>
          <li className="flex items-start space-x-2">
            <span className="text-blue-400">•</span>
            <span>Come back to this tab to claim your 2 USDC reward</span>
          </li>
        </ul>
      </div>
    </div>
  );
}
