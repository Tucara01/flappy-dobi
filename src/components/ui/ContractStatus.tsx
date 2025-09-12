import React, { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { useFlappyDobiContract } from '../../hooks/useFlappyDobiContract';

interface ContractStatusProps {
  onGameCreated?: (gameId: number) => void;
  onClaimSuccess?: () => void;
}

const ContractStatus: React.FC<ContractStatusProps> = ({ onGameCreated, onClaimSuccess }) => {
  const { address } = useAccount();
  const [isCreatingGame, setIsCreatingGame] = useState(false);
  const [hasCalledOnGameCreated, setHasCalledOnGameCreated] = useState(false);
  const {
    approveDobi,
    createGame,
    claimWinnings,
    hasActiveGame,
    currentGame,
    activeGameId,
    isLoading,
    isConfirmed,
    error,
    betAmount,
    userDobiBalance,
    userDobiAllowance,
    hasEnoughAllowance
  } = useFlappyDobiContract();

  // Debug logging
  // console.log('ContractStatus render:', {
  //   hasEnoughAllowance,
  //   userDobiAllowance,
  //   betAmount,
  //   isConfirmed,
  //   hasActiveGame,
  //   currentGame: currentGame?.status
  // });

  // Detectar cuando la aprobación se confirma y crear el juego automáticamente
  useEffect(() => {
    if (isConfirmed && hasEnoughAllowance && !hasActiveGame && !isCreatingGame) {
      // La aprobación se confirmó, crear el juego automáticamente
      const createGameAfterApproval = async () => {
        try {
          // Activar loading inmediatamente para evitar que aparezca el botón amarillo
          setIsCreatingGame(true);
          const hash = await createGame();
          if (hash) {
            // // console.log('Game creation transaction sent after approval:', hash);
          }
        } catch (error) {
          // console.error('Error creating game after approval:', error);
          setIsCreatingGame(false);
        }
      };
      createGameAfterApproval();
    }
  }, [isConfirmed, hasEnoughAllowance, hasActiveGame, isCreatingGame, createGame]);

  // Resetear estado cuando el juego termina (gana o pierde)
  useEffect(() => {
    if (hasActiveGame && currentGame?.status && currentGame.status !== 'Pending') {
      // El juego terminó (ganó o perdió), resetear estado para permitir nuevo juego
      setHasCalledOnGameCreated(false);
    }
  }, [hasActiveGame, currentGame?.status]);

  // Activar loading cuando la transacción de creación se confirma
  useEffect(() => {
    if (isConfirmed && !hasActiveGame && hasEnoughAllowance) {
      // La transacción de creación se confirmó pero aún no hay juego activo, activar loading
      setIsCreatingGame(true);
    } else if (hasActiveGame && isCreatingGame) {
      // Ya hay juego activo, desactivar loading y llamar callback
      setIsCreatingGame(false);
      if (onGameCreated && activeGameId) {
        onGameCreated(activeGameId);
      }
    }
  }, [isConfirmed, hasActiveGame, isCreatingGame, activeGameId, onGameCreated, hasEnoughAllowance]);

  const handleApprove = async () => {
    try {
      // Resetear estado para nuevo juego
      setHasCalledOnGameCreated(false);
      const hash = await approveDobi();
      if (hash) {
        // // console.log('DOBI approval transaction sent:', hash);
        
        // Esperar a que se confirme la aprobación, luego crear el juego automáticamente
        // El useEffect detectará cuando isConfirmed cambie y hasEnoughAllowance sea true
      }
    } catch (error) {
      // console.error('Error approving DOBI:', error);
    }
  };

  const handleCreateGame = async () => {
    try {
      // Resetear estado para nuevo juego
      setHasCalledOnGameCreated(false);
      const hash = await createGame();
      if (hash) {
        // // console.log('Game creation transaction sent:', hash);
        // No activar loading aquí, se activará cuando isConfirmed sea true
      }
    } catch (error) {
      // console.error('Error creating game:', error);
      setIsCreatingGame(false);
    }
  };

  const handleClaimWinnings = async () => {
    if (!activeGameId) return;
    
    try {
      const hash = await claimWinnings(activeGameId);
      if (hash) {
        // // console.log('Claim winnings transaction sent:', hash);
        if (onClaimSuccess) {
          onClaimSuccess();
        }
      }
    } catch (error) {
      // console.error('Error claiming winnings:', error);
    }
  };


  const formatTokenAmount = (amount: number) => {
    if (!amount || amount === 0) return '0.00';
    // Si el amount ya está en formato DOBI (no en wei), devolverlo directamente
    if (amount < 1e10) {
      return amount.toFixed(2);
    }
    // Si está en wei, convertir a DOBI
    return (amount / 1e18).toFixed(2);
  };

  return (
    <div className="bg-white rounded-lg p-6 shadow-lg border border-gray-200">
      <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-3">
        <span className="text-3xl">🎮</span>
        Contract Status
      </h3>

      {/* Contract Info */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-gray-50 p-4 rounded-lg">
          <div className="text-sm font-medium text-gray-700 mb-1">Bet Amount</div>
          <div className="text-xl font-bold text-gray-900">{formatTokenAmount(betAmount)} DOBI</div>
        </div>
        <div className="bg-gray-50 p-4 rounded-lg">
          <div className="text-sm font-medium text-gray-700 mb-1">Your Balance</div>
          <div className="text-xl font-bold text-gray-900">{formatTokenAmount(userDobiBalance)} DOBI</div>
        </div>
        <div className="bg-gray-50 p-4 rounded-lg">
          <div className="text-sm font-medium text-gray-700 mb-1">Allowance</div>
          <div className="text-xl font-bold text-gray-900">{formatTokenAmount(userDobiAllowance)} DOBI</div>
        </div>
        <div className="bg-gray-50 p-4 rounded-lg">
          <div className="text-sm font-medium text-gray-700 mb-1">Status</div>
          <div className="text-xl font-bold text-green-600">
            {hasEnoughAllowance ? 'Ready' : 'Need Approval'}
          </div>
        </div>
      </div>

      {/* Current Game Status */}
      {hasActiveGame && currentGame && (
        <div className="mb-6 p-5 bg-blue-50 border border-blue-200 rounded-lg">
          <h4 className="text-lg font-bold text-blue-800 mb-3">Active Game</h4>
          <div className="grid grid-cols-2 gap-4 text-base">
            <div className="font-medium text-gray-700">
              Game ID: <span className="font-mono font-bold text-gray-900">{activeGameId}</span>
            </div>
            <div className="font-medium text-gray-700">
              Status: <span className={`font-bold ${
                currentGame.status === 'Won' ? 'text-green-600' :
                currentGame.status === 'Lost' ? 'text-red-600' :
                'text-orange-600'
              }`}>{currentGame.status}</span>
            </div>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="space-y-3">
        {/* Show approve/create buttons only when no active game OR when game is lost, AND not creating game */}
        {(!hasActiveGame || (hasActiveGame && currentGame?.status === 'Lost')) && !hasEnoughAllowance && !isCreatingGame && (
          <button
            onClick={handleApprove}
            disabled={isLoading}
            className="w-full bg-yellow-500 hover:bg-yellow-600 disabled:bg-gray-400 text-white font-bold py-4 px-6 rounded-lg transition-colors flex items-center justify-center gap-3 text-lg"
          >
            {isLoading ? (
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
            ) : (
              <>
                <span>🔓</span>
                Approve & Create Game
              </>
            )}
          </button>
        )}

        {(!hasActiveGame || (hasActiveGame && currentGame?.status === 'Lost')) && hasEnoughAllowance && !isCreatingGame && (
          <button
            onClick={handleCreateGame}
            disabled={isLoading}
            className="w-full bg-green-500 hover:bg-green-600 disabled:bg-gray-400 text-white font-bold py-4 px-6 rounded-lg transition-colors flex items-center justify-center gap-3 text-lg"
          >
            {isLoading ? (
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
            ) : (
              <>
                <span>🎮</span>
                Create Bet Game
              </>
            )}
          </button>
        )}

        {/* Show claim button only when game is won */}
        {hasActiveGame && currentGame?.status === 'Won' && (
          <button
            onClick={handleClaimWinnings}
            disabled={isLoading}
            className="w-full bg-purple-500 hover:bg-purple-600 disabled:bg-gray-400 text-white font-bold py-4 px-6 rounded-lg transition-colors flex items-center justify-center gap-3 text-lg"
          >
            {isLoading ? (
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
            ) : (
              <>
                <span>💰</span>
                Claim Winnings
              </>
            )}
          </button>
        )}

        {/* Show loading state when creating game */}
        {isCreatingGame && (
          <div className="space-y-3">
            <div className="text-center text-gray-600 py-3">
              <div className="animate-pulse text-lg font-medium">⏳ Loading game...</div>
            </div>
            <button
              disabled
              className="w-full bg-gray-400 text-white font-bold py-4 px-6 rounded-lg transition-colors flex items-center justify-center gap-3 text-lg"
            >
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
              Creating Game...
            </button>
          </div>
        )}


        {/* Mostrar mensaje cuando el juego está en progreso */}
        {hasActiveGame && currentGame?.status === 'Pending' && (
          <div className="space-y-3">
            <div className="text-center text-gray-600 py-3">
              <div className="text-lg font-medium">🎮 Game is running...</div>
              <div className="text-sm text-gray-500">Complete the game to see results</div>
            </div>
          </div>
        )}
      </div>

      {/* Error Display */}
      {error && (
        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
          <div className="text-red-800 text-sm font-medium">Error:</div>
          <div className="text-red-600 text-sm">{error}</div>
        </div>
      )}

      {/* Success Message */}
      {isConfirmed && (
        <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
          <div className="text-green-800 text-sm font-medium">✅ Transaction confirmed!</div>
        </div>
      )}
    </div>
  );
};

export default ContractStatus;
