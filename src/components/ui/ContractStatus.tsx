import React, { useState, useEffect } from 'react';
import { useAccount, useWaitForTransactionReceipt } from 'wagmi';
import { useFlappyDobiContract } from '../../hooks/useFlappyDobiContract';

interface ContractStatusProps {
  onGameCreated?: (gameId: number) => void;
  onClaimSuccess?: () => void;
  gameResult?: 'won' | 'lost' | null;
}

const ContractStatus: React.FC<ContractStatusProps> = ({ onGameCreated, onClaimSuccess, gameResult }) => {
  const { address } = useAccount();
  const [isCreatingGame, setIsCreatingGame] = useState(false);
  const [hasCalledOnGameCreated, setHasCalledOnGameCreated] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('');
  const [loadingStep, setLoadingStep] = useState(0);
  const [showGameResult, setShowGameResult] = useState(false);
  const [isClaiming, setIsClaiming] = useState(false);
  const [claimHash, setClaimHash] = useState<string | null>(null);
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

  // Hook para detectar cuando la transacción de claim se confirma
  const { data: claimReceipt, isSuccess: isClaimConfirmed } = useWaitForTransactionReceipt({
    hash: claimHash as `0x${string}`,
    enabled: !!claimHash,
  });


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
          }
        } catch (error) {
          setIsCreatingGame(false);
        }
      };
      // Reducir delay a 1 segundo en lugar de esperar el useEffect
      setTimeout(createGameAfterApproval, 1000);
    }
  }, [isConfirmed, hasEnoughAllowance, hasActiveGame, isCreatingGame, createGame]);

  // Resetear estado cuando el juego termina (gana o pierde)
  useEffect(() => {
    if (hasActiveGame && currentGame?.status && (currentGame.status === 'Won' || currentGame.status === 'Lost')) {
      // El juego terminó (ganó o perdió), mostrar resultado
      setHasCalledOnGameCreated(false);
      setShowGameResult(true);
    } else {
      // No mostrar resultado si no hay juego activo o está pendiente
      setShowGameResult(false);
    }
  }, [hasActiveGame, currentGame?.status]);

  // Efecto adicional para detectar cuando el juego cambia a Lost
  useEffect(() => {
    if (currentGame?.status === 'Lost') {
      setShowGameResult(true);
    }
  }, [currentGame?.status]);

  // Efecto para detectar gameResult del componente padre
  useEffect(() => {
    if (gameResult === 'won' || gameResult === 'lost') {
      setShowGameResult(true);
    }
  }, [gameResult]);

  // Efecto para detectar cuando el claim se confirma
  useEffect(() => {
    if (isClaimConfirmed && claimReceipt) {
      console.log('✅ Claim transaction confirmed!');
      setIsClaiming(false);
      setClaimHash(null);
      
      // Resetear toda la UI para volver al estado inicial
      setShowGameResult(false);
      setIsCreatingGame(false);
      setHasCalledOnGameCreated(false);
      setLoadingMessage('');
      setLoadingStep(0);
      
      // Llamar callback de éxito si existe
      if (onClaimSuccess) {
        onClaimSuccess();
      }
    }
  }, [isClaimConfirmed, claimReceipt, onClaimSuccess]);

  // Activar loading cuando la transacción de creación se confirma
  useEffect(() => {
    if (isConfirmed && !hasActiveGame && hasEnoughAllowance) {
      // La transacción de creación se confirmó pero aún no hay juego activo, activar loading
      setIsCreatingGame(true);
      setLoadingStep(0);
      setLoadingMessage('Initializing game...');
    } else if (hasActiveGame && isCreatingGame) {
      // Ya hay juego activo, desactivar loading y llamar callback inmediatamente
      setIsCreatingGame(false);
      if (onGameCreated && activeGameId) {
        // Llamar inmediatamente sin delay
        onGameCreated(activeGameId);
      }
    }
  }, [isConfirmed, hasActiveGame, isCreatingGame, activeGameId, onGameCreated, hasEnoughAllowance]);

  // Mensajes dinámicos durante la carga
  useEffect(() => {
    if (!isCreatingGame) return;

    const messages = [
      'Initializing game...',
      'Setting up blockchain...',
      'Preparing DOBI tokens...',
      'Creating game instance...',
      'Loading game assets...',
      'Almost ready...',
      'Finalizing setup...'
    ];

    const interval = setInterval(() => {
      setLoadingStep(prev => {
        const nextStep = prev + 1;
        if (nextStep < messages.length) {
          setLoadingMessage(messages[nextStep]);
          return nextStep;
        }
        return prev;
      });
    }, 800); // Cambiar mensaje cada 800ms

    return () => clearInterval(interval);
  }, [isCreatingGame]);

  const handleApprove = async () => {
    try {
      // Resetear estado para nuevo juego
      setHasCalledOnGameCreated(false);
      const hash = await approveDobi();
      if (hash) {
        
        // El useEffect detectará cuando isConfirmed cambie y hasEnoughAllowance sea true
        // Reducido delay para respuesta más rápida
      }
    } catch (error) {
    }
  };

  const handleCreateGame = async () => {
    try {
      // Resetear estado para nuevo juego
      setHasCalledOnGameCreated(false);
      const hash = await createGame();
      if (hash) {
        // No activar loading aquí, se activará cuando isConfirmed sea true
      }
    } catch (error) {
      setIsCreatingGame(false);
    }
  };

  const handleClaimWinnings = async () => {
    if (!activeGameId) return;
    
    try {
      const hash = await claimWinnings(activeGameId);
      if (hash) {
        if (onClaimSuccess) {
          onClaimSuccess();
        }
      }
    } catch (error) {
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

  // Función para verificar el estado real del juego en el backend
  const checkGameStatus = async () => {
    if (!address) return null;
    
    try {
      const response = await fetch(`/api/games/check-status?playerAddress=${address}`);
      const result = await response.json();
      return result;
    } catch (error) {
      console.error('Error checking game status:', error);
      return null;
    }
  };

  // Función para limpiar el estado del juego y resetear a bet mode
  const clearGameState = async () => {
    if (!address) return;
    
    try {
      const response = await fetch('/api/games/clear-active-game', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ playerAddress: address })
      });
      const result = await response.json();
      
      if (result.success) {
        // Resetear el estado del componente para volver al menú de bet
        setShowGameResult(false);
        setIsCreatingGame(false);
        setHasCalledOnGameCreated(false);
        setLoadingMessage('');
        setLoadingStep(0);
      }
    } catch (error) {
      console.error('Error clearing game state:', error);
    }
  };

  // Función para manejar el claim
  const handleClaim = async () => {
    if (!address) return;
    
    // Verificar el estado real del juego
    const gameStatus = await checkGameStatus();
    
    if (!gameStatus || !gameStatus.betGame) {
      // No hay juego en el backend, limpiar estado y volver a bet mode
      console.log('🔄 No game found in backend, resetting to bet mode...');
      await clearGameState();
      return;
    }
    
    if (gameStatus.betGame.status === 'Won') {
      // Hay un juego ganado, proceder con el claim del smart contract
      console.log('💰 Claiming winnings from smart contract...');
      setIsClaiming(true);
      try {
        const hash = await claimWinnings(gameStatus.betGame.gameId);
        if (hash) {
          setClaimHash(hash);
          console.log('🔄 Claim transaction sent:', hash);
        } else {
          setIsClaiming(false);
        }
      } catch (error) {
        console.error('Error claiming winnings:', error);
        setIsClaiming(false);
      }
    } else {
      // El juego no está marcado como ganado, limpiar estado y volver a bet mode
      console.log('🔄 Game not won, resetting to bet mode...');
      await clearGameState();
    }
  };

  // Función para volver al contrato (botón "Back to Contract")
  const handleBackToContract = async () => {
    if (!address) return;
    
    
    // Limpiar estado y ir a home
    await clearGameState();
    
    // Navegar a home
    window.location.href = '/';
  };

  // Componente para mostrar resultado del juego
  const GameResultDisplay = () => {
    if (!showGameResult) return null;

    // Usar gameResult del padre si está disponible, sino usar currentGame
    const isWon = gameResult ? gameResult === 'won' : currentGame?.status === 'Won';
    
    return (
      <div className="mb-8">
        {/* Resultado Principal */}
        <div className={`text-center py-10 px-8 rounded-3xl shadow-2xl mb-8 relative overflow-hidden ${
          isWon 
            ? 'bg-gradient-to-br from-yellow-400 via-yellow-500 to-orange-500' 
            : 'bg-gradient-to-br from-red-400 via-red-500 to-pink-500'
        }`}>
          {/* Efectos de partículas para victoria */}
          {isWon && (
            <div className="absolute inset-0 overflow-hidden">
              <div className="absolute top-4 left-4 text-2xl animate-bounce">✨</div>
              <div className="absolute top-8 right-8 text-xl animate-pulse">⭐</div>
              <div className="absolute bottom-6 left-8 text-lg animate-bounce delay-300">🎉</div>
              <div className="absolute bottom-4 right-4 text-xl animate-pulse delay-500">🌟</div>
            </div>
          )}
          
          <div className={`text-8xl mb-6 ${isWon ? 'animate-bounce' : 'animate-pulse'}`}>
            {isWon ? '🏆' : '💔'}
          </div>
          <h2 className={`text-5xl font-black mb-4 text-white drop-shadow-lg ${
            isWon ? 'animate-pulse' : ''
          }`}>
            {isWon ? 'YOU WON!' : 'YOU LOST'}
          </h2>
          <p className={`text-2xl font-semibold ${
            isWon ? 'text-yellow-100' : 'text-red-100'
          }`}>
            {isWon ? 'Congratulations! You achieved victory!' : 'Better luck next time!'}
          </p>
          
          {/* Efecto de brillo para victoria */}
          {isWon && (
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent transform -skew-x-12 animate-pulse"></div>
          )}
        </div>

        {/* Botón de Claim Inteligente */}
        <div className="bg-gradient-to-r from-gray-50 to-gray-100 p-6 rounded-2xl border border-gray-200 shadow-lg">
          <div className="text-center">
            <div className="text-lg font-semibold text-gray-700 mb-4">
              {isWon ? 'Ready to claim your winnings!' : 'Game completed'}
            </div>
            <button
              onClick={handleClaim}
              disabled={isClaiming}
              className={`px-8 py-4 rounded-2xl font-bold text-lg transition-all duration-300 transform hover:scale-105 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none ${
                isWon
                  ? isClaiming
                    ? 'bg-gradient-to-r from-yellow-500 to-orange-600 text-white'
                    : 'bg-gradient-to-r from-green-500 to-emerald-600 text-white hover:from-green-600 hover:to-emerald-700'
                  : 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white hover:from-blue-600 hover:to-indigo-700'
              }`}
            >
              {isWon 
                ? isClaiming 
                  ? '⏳ Claiming...' 
                  : '💰 Claim Winnings'
                : '🎮 Reset Bet Mode'
              }
            </button>
            <p className="text-sm text-gray-500 mt-3">
              {isWon 
                ? isClaiming
                  ? 'Please wait while your transaction is being processed...'
                  : 'Click to claim your rewards from the smart contract'
                : 'Click to reset and return to bet mode'
              }
            </p>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="bg-gradient-to-br from-white to-gray-50 rounded-2xl p-8 shadow-2xl border border-gray-100">
      <div className="flex items-center gap-4 mb-8">
        <div className="bg-gradient-to-r from-blue-500 to-purple-600 p-4 rounded-2xl shadow-lg">
          <span className="text-3xl">🎮</span>
        </div>
        <div>
          <h3 className="text-3xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
            Contract Status
          </h3>
          <p className="text-sm text-gray-500 mt-1">Smart Contract Game Interface</p>
        </div>
      </div>

      {/* Mostrar resultado del juego si aplica */}
      <GameResultDisplay />


      {/* Contract Info - Solo mostrar si no hay resultado del juego */}
      {!showGameResult && (
        <div className="grid grid-cols-2 gap-6 mb-8">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-6 rounded-2xl border border-blue-200 shadow-lg hover:shadow-xl transition-shadow">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-lg">💰</span>
            <div className="text-sm font-semibold text-blue-700 uppercase tracking-wide">Bet Amount</div>
          </div>
          <div className="text-2xl font-bold text-blue-900">{formatTokenAmount(betAmount)} DOBI</div>
        </div>
        <div className="bg-gradient-to-br from-green-50 to-green-100 p-6 rounded-2xl border border-green-200 shadow-lg hover:shadow-xl transition-shadow">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-lg">💎</span>
            <div className="text-sm font-semibold text-green-700 uppercase tracking-wide">Your Balance</div>
          </div>
          <div className="text-2xl font-bold text-green-900">{formatTokenAmount(userDobiBalance)} DOBI</div>
        </div>
        <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-6 rounded-2xl border border-purple-200 shadow-lg hover:shadow-xl transition-shadow">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-lg">🔐</span>
            <div className="text-sm font-semibold text-purple-700 uppercase tracking-wide">Allowance</div>
          </div>
          <div className="text-2xl font-bold text-purple-900">{formatTokenAmount(userDobiAllowance)} DOBI</div>
        </div>
        <div className="bg-gradient-to-br from-orange-50 to-orange-100 p-6 rounded-2xl border border-orange-200 shadow-lg hover:shadow-xl transition-shadow">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-lg">⚡</span>
            <div className="text-sm font-semibold text-orange-700 uppercase tracking-wide">Status</div>
          </div>
          <div className={`text-2xl font-bold ${hasEnoughAllowance ? 'text-green-600' : 'text-orange-600'}`}>
            {hasEnoughAllowance ? 'Ready' : 'Need Approval'}
          </div>
        </div>
      </div>
      )}

      {/* Current Game Status - Solo mostrar si no hay resultado del juego y NO está pendiente */}
      {!showGameResult && hasActiveGame && currentGame && currentGame.status !== 'Pending' && (
        <div className="mb-8 p-6 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-2xl shadow-lg">
          <div className="flex items-center gap-3 mb-4">
            <div className="bg-gradient-to-r from-blue-500 to-indigo-600 p-2 rounded-xl">
              <span className="text-xl">🎯</span>
            </div>
            <h4 className="text-xl font-bold bg-gradient-to-r from-blue-800 to-indigo-800 bg-clip-text text-transparent">
              Active Game
            </h4>
          </div>
          <div className="grid grid-cols-2 gap-6">
            <div className="bg-white/60 p-4 rounded-xl border border-blue-100">
              <div className="text-sm font-semibold text-blue-700 mb-1">Game ID</div>
              <div className="font-mono font-bold text-blue-900 text-lg">{activeGameId}</div>
            </div>
            <div className="bg-white/60 p-4 rounded-xl border border-blue-100">
              <div className="text-sm font-semibold text-blue-700 mb-1">Status</div>
              <div className={`font-bold text-lg ${
                currentGame.status === 'Won' ? 'text-green-600' :
                currentGame.status === 'Lost' ? 'text-red-600' :
                'text-orange-600'
              }`}>{currentGame.status}</div>
            </div>
          </div>
        </div>
      )}

      {/* Action Buttons - Solo mostrar si no hay resultado del juego */}
      {!showGameResult && (
        <div className="space-y-4">
        {/* Show approve/create buttons only when no active game OR when game is lost, AND not creating game */}
        {(!hasActiveGame || (hasActiveGame && currentGame?.status === 'Lost')) && !hasEnoughAllowance && !isCreatingGame && (
          <button
            onClick={handleApprove}
            disabled={isLoading}
            className="w-full bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 disabled:from-gray-400 disabled:to-gray-500 text-white font-bold py-5 px-8 rounded-2xl transition-all duration-300 flex items-center justify-center gap-4 text-xl shadow-lg hover:shadow-xl transform hover:scale-105 disabled:transform-none disabled:scale-100"
          >
            {isLoading ? (
              <div className="animate-spin rounded-full h-7 w-7 border-b-2 border-white"></div>
            ) : (
              <>
                <span className="text-2xl">🔓</span>
                <span>Approve & Create Game</span>
              </>
            )}
          </button>
        )}

        {(!hasActiveGame || (hasActiveGame && currentGame?.status === 'Lost')) && hasEnoughAllowance && !isCreatingGame && (
          <button
            onClick={handleCreateGame}
            disabled={isLoading}
            className="w-full bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 disabled:from-gray-400 disabled:to-gray-500 text-white font-bold py-5 px-8 rounded-2xl transition-all duration-300 flex items-center justify-center gap-4 text-xl shadow-lg hover:shadow-xl transform hover:scale-105 disabled:transform-none disabled:scale-100"
          >
            {isLoading ? (
              <div className="animate-spin rounded-full h-7 w-7 border-b-2 border-white"></div>
            ) : (
              <>
                <span className="text-2xl">🎮</span>
                <span>Create Bet Game</span>
              </>
            )}
          </button>
        )}

        {/* Show claim button only when game is won */}
        {hasActiveGame && currentGame?.status === 'Won' && (
          <button
            onClick={handleClaimWinnings}
            disabled={isLoading}
            className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 disabled:from-gray-400 disabled:to-gray-500 text-white font-bold py-5 px-8 rounded-2xl transition-all duration-300 flex items-center justify-center gap-4 text-xl shadow-lg hover:shadow-xl transform hover:scale-105 disabled:transform-none disabled:scale-100"
          >
            {isLoading ? (
              <div className="animate-spin rounded-full h-7 w-7 border-b-2 border-white"></div>
            ) : (
              <>
                <span className="text-2xl">🏆</span>
                <span>Claim Winnings</span>
              </>
            )}
          </button>
        )}


        {/* Show loading state when creating game */}
        {isCreatingGame && (
          <div className="space-y-6">
            <div className="text-center text-gray-600 py-4">
              <div className="text-xl font-bold mb-3 flex items-center justify-center gap-3">
                <span className="animate-pulse text-2xl">⏳</span> 
                <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  {loadingMessage}
                </span>
              </div>
              <div className="text-sm text-gray-500 mb-4">
                Step {loadingStep + 1} of 7 • Please wait while we set up your game
              </div>
              {/* Progress bar */}
              <div className="w-full bg-gray-200 rounded-full h-3 shadow-inner">
                <div 
                  className="bg-gradient-to-r from-blue-500 to-purple-600 h-3 rounded-full transition-all duration-500 ease-out shadow-lg"
                  style={{ width: `${((loadingStep + 1) / 7) * 100}%` }}
                ></div>
              </div>
            </div>
            <div className="w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white font-bold py-6 px-8 rounded-2xl flex items-center justify-center gap-4 text-xl shadow-2xl">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
              <span className="animate-pulse">Setting up your adventure...</span>
            </div>
          </div>
        )}


        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="mt-6 p-6 bg-gradient-to-r from-red-50 to-pink-50 border border-red-200 rounded-2xl shadow-lg">
          <div className="flex items-center gap-3">
            <div className="bg-red-500 p-2 rounded-xl">
              <span className="text-white text-lg">⚠️</span>
            </div>
            <div>
              <div className="text-red-800 text-sm font-bold">Error:</div>
              <div className="text-red-700 text-sm">{error}</div>
            </div>
          </div>
        </div>
      )}

      {/* Success Message */}
      {isConfirmed && (
        <div className="mt-6 p-6 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-2xl shadow-lg">
          <div className="flex items-center gap-3">
            <div className="bg-green-500 p-2 rounded-xl">
              <span className="text-white text-lg">✅</span>
            </div>
            <div className="text-green-800 font-bold">Transaction confirmed!</div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ContractStatus;
