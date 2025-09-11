import React from 'react';
import { useAccount } from 'wagmi';
import { useFlappyDobiContract } from '../../hooks/useFlappyDobiContract';

interface ContractStatusProps {
  onGameCreated?: (gameId: number) => void;
  onClaimSuccess?: () => void;
}

const ContractStatus: React.FC<ContractStatusProps> = ({ onGameCreated, onClaimSuccess }) => {
  const { address } = useAccount();
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

  const handleApprove = async () => {
    try {
      const hash = await approveDobi();
      if (hash) {
        console.log('DOBI approval transaction sent:', hash);
        // Mostrar mensaje de que se está creando el juego
        alert('Tokens aprobados! Creando juego automáticamente...');
        
        // Esperar un poco para que se confirme la transacción
        setTimeout(async () => {
          try {
            // Después de aprobar, crear el juego automáticamente
            const gameHash = await createGame();
            if (gameHash) {
              console.log('Game creation transaction sent:', gameHash);
              alert('Juego creado! Iniciando partida...');
              
              // Esperar un poco más para que se confirme la creación del juego
              setTimeout(() => {
                if (onGameCreated) {
                  // Usar el activeGameId si está disponible, o un valor por defecto
                  const gameId = activeGameId || 1; // Fallback si no se detecta
                  console.log('Calling onGameCreated with gameId:', gameId);
                  onGameCreated(gameId);
                }
              }, 2000);
            }
          } catch (error) {
            console.error('Error creating game after approval:', error);
            alert('Error creando el juego. Intenta crear el juego manualmente.');
          }
        }, 5000); // Esperar 5 segundos para que se confirme la aprobación
      }
    } catch (error) {
      console.error('Error approving DOBI:', error);
    }
  };

  const handleCreateGame = async () => {
    try {
      const hash = await createGame();
      if (hash) {
        console.log('Game creation transaction sent:', hash);
        alert('Juego creado! Iniciando partida...');
        
        // Esperar un poco para que se confirme la creación del juego
        setTimeout(() => {
          if (onGameCreated) {
            // Usar el activeGameId si está disponible, o un valor por defecto
            const gameId = activeGameId || 1; // Fallback si no se detecta
            console.log('Calling onGameCreated with gameId:', gameId);
            onGameCreated(gameId);
          }
        }, 3000);
      }
    } catch (error) {
      console.error('Error creating game:', error);
    }
  };

  const handleClaimWinnings = async () => {
    if (!activeGameId) return;
    
    try {
      const hash = await claimWinnings(activeGameId);
      if (hash) {
        console.log('Claim winnings transaction sent:', hash);
        if (onClaimSuccess) {
          onClaimSuccess();
        }
      }
    } catch (error) {
      console.error('Error claiming winnings:', error);
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
        {!hasEnoughAllowance && (
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

        {!hasActiveGame && hasEnoughAllowance && (
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


        {hasActiveGame && currentGame?.status === 'Pending' && (
          <div className="space-y-3">
            <div className="text-center text-gray-600 py-3">
              <div className="animate-pulse text-lg font-medium">⏳ Game in progress...</div>
            </div>
            <button
              onClick={() => {
                if (onGameCreated && activeGameId) {
                  console.log('Going to existing game with ID:', activeGameId);
                  onGameCreated(activeGameId);
                }
              }}
              className="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-4 px-6 rounded-lg transition-colors flex items-center justify-center gap-3 text-lg"
            >
              <span>🎮</span>
              Continue Game (ID: {activeGameId})
            </button>
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
