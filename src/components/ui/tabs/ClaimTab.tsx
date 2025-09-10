"use client";

import { useState, useEffect } from "react";
import { useAccount } from "wagmi";
import { 
  gameAPI, 
  initializeGameSession, 
  isSessionActive,
  type Game
} from "../../../lib/gameClient";
import { useFlappyDobiContract } from "../../../hooks/useFlappyDobiContract";

interface GameState {
  gameId?: number;
  canClaimReward: boolean;
  hasWon: boolean;
  score: number;
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
  const { address } = useAccount();
  const [, setGameState] = useState<GameState>({
    canClaimReward: false,
    hasWon: false,
    score: 0
  });
  const [recentGames, setRecentGames] = useState<Game[]>([]);
  const [claimableGames, setClaimableGames] = useState<Game[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [claimMessage, setClaimMessage] = useState("");
  
  // Smart contract integration
  const { 
    hasActiveGame, 
    currentGame, 
    activeGameId: contractGameId,
    claimWinnings,
    isLoading: contractLoading,
    isConfirmed: contractConfirmed,
    error: contractError 
  } = useFlappyDobiContract();

  // Check for claimable games on component mount
  useEffect(() => {
    checkClaimableGames();
  }, [address]); // Re-check when wallet address changes

  const checkClaimableGames = async () => {
    setIsLoading(true);
    try {
      const playerAddress = address || '0x0000000000000000000000000000000000000000';
      console.log('Checking claimable games for player:', playerAddress);
      
      // Inicializar sesión si no existe
      if (!isSessionActive()) {
        const sessionResult = await initializeGameSession(playerAddress);
        if (!sessionResult.success) {
          console.error('Failed to initialize game session:', sessionResult.error);
          return;
        }
      }
      
      const result = await gameAPI.getClaimableGames(playerAddress);
      console.log('Claim games result:', result);
      
      if (result.success && result.data) {
        setRecentGames(result.data.recentGames || []);
        setClaimableGames(result.data.claimableGames || []);
        
        if (result.data.claimableGames && result.data.claimableGames.length > 0) {
          setGameState(prev => ({
            ...prev,
            canClaimReward: true,
            hasWon: true
          }));
        }
      } else {
        console.error('Claim games failed:', result.error);
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
      const playerAddress = address || '0x0000000000000000000000000000000000000000';
      const result = await gameAPI.claimReward(gameId, playerAddress);

      if (result.success && result.data) {
        setClaimMessage(`Success! Claimed ${result.data.rewardAmount / 1e6} USDC`);
        
        // Refresh claimable games
        await checkClaimableGames();
      } else {
        setClaimMessage(`Error: ${result.error}`);
      }
    } catch (error) {
      console.error('Error claiming reward:', error);
      setClaimMessage('Error claiming reward');
    } finally {
      setIsLoading(false);
    }
  };

  // Reclamar premio del contrato inteligente
  const claimContractReward = async (gameId: number) => {
    setIsLoading(true);
    setClaimMessage("");
    
    try {
      const hash = await claimWinnings(gameId);
      if (hash) {
        setClaimMessage(`Success! Contract reward claimed. Transaction hash: ${String(hash).slice(0, 10)}...`);
        // Refresh contract data
        window.location.reload(); // Simple refresh to update contract state
      } else {
        setClaimMessage('Error claiming contract reward');
      }
    } catch (error) {
      console.error('Error claiming contract reward:', error);
      setClaimMessage('Error claiming contract reward');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6 px-4">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-white mb-2">Claim Rewards</h2>
        <p className="text-gray-300">Check and claim your bet mode rewards</p>
        <p className="text-gray-400 text-sm mb-2">Only bet mode games are eligible for rewards</p>
        <button
          onClick={checkClaimableGames}
          disabled={isLoading}
          className="mt-2 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-500 text-white font-bold py-2 px-4 rounded-lg transition-colors text-sm"
        >
          {isLoading ? 'Loading...' : 'Refresh Bet Games'}
        </button>
      </div>

      {/* Smart Contract Status */}
      {hasActiveGame && currentGame && (
        <div className="bg-purple-900 rounded-lg p-6 border border-purple-500">
          <h3 className="text-lg font-semibold text-white mb-4">Smart Contract Game</h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-white font-medium">Game #{contractGameId}</p>
                <p className="text-gray-300 text-sm">Status: {currentGame.status}</p>
                <p className="text-gray-400 text-xs">
                  Contract: {process.env.NEXT_PUBLIC_CONTRACT_ADDRESS?.slice(0, 10)}...{process.env.NEXT_PUBLIC_CONTRACT_ADDRESS?.slice(-8) || 'Not configured'}
                </p>
                <p className="text-gray-400 text-xs">
                  Bet: 1 USDC • Reward: 2 USDC
                </p>
              </div>
              <div className="text-right">
                {currentGame.status === 'Won' && (
                  <div className="space-y-2">
                    <p className="text-green-400 text-sm font-medium">🎉 You Won!</p>
                    <p className="text-green-300 text-xs">Eligible for 2 USDC reward</p>
                    <button
                      onClick={() => claimContractReward(contractGameId!)}
                      disabled={contractLoading || isLoading}
                      className="bg-green-500 hover:bg-green-600 disabled:bg-gray-500 text-white font-bold py-2 px-4 rounded-lg transition-colors text-sm"
                    >
                      {contractLoading ? 'Claiming...' : 'Claim 2 USDC'}
                    </button>
                  </div>
                )}
                {currentGame.status === 'Pending' && (
                  <div className="text-yellow-400 text-sm">
                    ⏳ Waiting for backend evaluation...
                  </div>
                )}
                {currentGame.status === 'Lost' && (
                  <div className="text-red-400 text-sm">
                    ❌ Game Lost - 1 USDC retained by contract
                  </div>
                )}
                {currentGame.status === 'Claimed' && (
                  <div className="text-gray-400 text-sm">
                    ✅ Already Claimed
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Statistics Summary */}
      {recentGames.length > 0 && (
        <div className="bg-gray-800 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Bet Mode Stats</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-blue-400">{recentGames.length}</p>
              <p className="text-gray-300 text-sm">Bet Games</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-green-400">{claimableGames.length}</p>
              <p className="text-gray-300 text-sm">Claimable Rewards</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-yellow-400">
                {recentGames.filter(g => g.status === 'won').length}
              </p>
              <p className="text-gray-300 text-sm">Bet Games Won</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-purple-400">
                {Math.max(...recentGames.map(g => g.score), 0)}
              </p>
              <p className="text-gray-300 text-sm">Best Bet Score</p>
            </div>
          </div>
        </div>
      )}

      {/* Recent Games */}
      <div className="bg-gray-800 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Last 10 Bet Games</h3>
        
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
            <p className="text-gray-400">No bet games found</p>
            <p className="text-gray-500 text-sm mt-1">Play some bet mode games to see your history!</p>
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
            <span className="text-blue-400">1.</span>
            <span>Deposit <strong>1 USDC</strong> to create a bet game</span>
          </li>
          <li className="flex items-start space-x-2">
            <span className="text-blue-400">2.</span>
            <span>Play the Flappy DOBI game and reach <strong>50+ points</strong></span>
          </li>
          <li className="flex items-start space-x-2">
            <span className="text-blue-400">3.</span>
            <span>Backend evaluates your score and updates the smart contract</span>
          </li>
          <li className="flex items-start space-x-2">
            <span className="text-blue-400">4.</span>
            <span>Come back to this tab to claim your <strong>2 USDC reward</strong></span>
          </li>
          <li className="flex items-start space-x-2">
            <span className="text-purple-400">•</span>
            <span><strong>Smart Contract:</strong> Secure blockchain-based rewards</span>
          </li>
          <li className="flex items-start space-x-2">
            <span className="text-red-400">•</span>
            <span><strong>Risk:</strong> If you don&apos;t reach 50 points, you lose your 1 USDC bet</span>
          </li>
          <li className="flex items-start space-x-2">
            <span className="text-yellow-400">•</span>
            <span><strong>Note:</strong> Practice mode games don&apos;t earn rewards</span>
          </li>
        </ul>
      </div>
    </div>
  );
}
