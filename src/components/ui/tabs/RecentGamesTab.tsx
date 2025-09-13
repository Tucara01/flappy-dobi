import React, { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';

interface GameHistory {
  gameId: number;
  mode: 'bet' | 'practice';
  result: 'won' | 'lost';
  score: number;
  timestamp: string;
  betAmount?: number;
  rewardAmount?: number;
}

interface RecentGamesTabProps {
  setActiveTab?: (tab: string) => void;
}

export function RecentGamesTab({ setActiveTab }: RecentGamesTabProps) {
  const { address } = useAccount();
  const [games, setGames] = useState<GameHistory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(0);
  const gamesPerPage = 4;

  // Calcular juegos para la página actual
  const totalPages = Math.ceil(games.length / gamesPerPage);
  const startIndex = currentPage * gamesPerPage;
  const endIndex = startIndex + gamesPerPage;
  const currentGames = games.slice(startIndex, endIndex);

  // Navegación de páginas
  const goToNextPage = () => {
    if (currentPage < totalPages - 1) {
      setCurrentPage(currentPage + 1);
    }
  };

  const goToPrevPage = () => {
    if (currentPage > 0) {
      setCurrentPage(currentPage - 1);
    }
  };

  // Resetear página cuando se cargan nuevos juegos
  useEffect(() => {
    setCurrentPage(0);
  }, [games.length]);

  // Fetch game history
  const fetchGameHistory = async () => {
    if (!address) return;
    
    try {
      setIsLoading(true);
      setError(null);
      
      console.log(`🔍 Fetching game history for address: ${address}`);
      
      // Cargar juegos directamente desde localStorage del frontend
      const PRACTICE_GAMES_KEY = 'flappy-dobi-practice-games';
      const BET_GAMES_KEY = 'flappy-dobi-bet-games';
      
      let practiceGames = [];
      let betGames = [];
      
      try {
        const storedPractice = localStorage.getItem(PRACTICE_GAMES_KEY);
        const storedBet = localStorage.getItem(BET_GAMES_KEY);
        
        if (storedPractice) {
          practiceGames = JSON.parse(storedPractice);
        }
        if (storedBet) {
          betGames = JSON.parse(storedBet);
        }
      } catch (error) {
        console.warn('Error loading from localStorage:', error);
      }
      
      console.log(`📊 Loaded from localStorage: ${practiceGames.length} practice, ${betGames.length} bet games`);
      
      // Filtrar juegos del jugador actual
      const allGames = [...practiceGames, ...betGames].filter(game => 
        game.player.toLowerCase() === address.toLowerCase() &&
        (game.status === 'won' || game.status === 'lost' || game.status === 'claimed')
      );
      
      // Ordenar por fecha (más recientes primero)
      const sortedGames = allGames
        .sort((a, b) => b.createdAt - a.createdAt)
        .slice(0, 15);
      
      console.log(`✅ Found ${sortedGames.length} completed games for player`);
      
      // Transformar al formato esperado
      const gameHistory = sortedGames.map(game => ({
        gameId: game.id,
        mode: game.mode,
        result: (game.status === 'won' ? 'won' : 'lost') as 'won' | 'lost',
        score: game.score,
        timestamp: new Date(game.createdAt).toISOString(),
        betAmount: game.mode === 'bet' ? 3500 : undefined,
        rewardAmount: game.status === 'won' && game.mode === 'bet' ? 7000 : undefined,
      }));
      
      console.log(`🎮 Setting ${gameHistory.length} games in UI`);
      setGames(gameHistory);
      
    } catch (err) {
      console.error('❌ Error loading game history:', err);
      setError('Error loading game history');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchGameHistory();
  }, [address]);

  // Refrescar historial cada 5 segundos para detectar nuevos juegos
  useEffect(() => {
    const interval = setInterval(() => {
      if (address) {
        fetchGameHistory();
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [address]);

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) {
      return 'Just now';
    } else if (diffInHours < 24) {
      return `${diffInHours}h ago`;
    } else {
      const diffInDays = Math.floor(diffInHours / 24);
      return `${diffInDays}d ago`;
    }
  };

  const getResultIcon = (result: 'won' | 'lost') => {
    return result === 'won' ? '🏆' : '💔';
  };

  const getResultColor = (result: 'won' | 'lost') => {
    return result === 'won' ? 'text-green-600' : 'text-red-600';
  };

  const getModeColor = (mode: 'bet' | 'practice') => {
    return mode === 'bet' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800';
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-400 mx-auto mb-4"></div>
          <p className="text-white text-lg">Loading game history...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-400 text-6xl mb-4">⚠️</div>
          <p className="text-white text-lg mb-4">Error loading game history</p>
          <p className="text-gray-400 text-sm mb-6">{error}</p>
          <button
            onClick={fetchGameHistory}
            className="px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold rounded-lg transition-all duration-300 transform hover:scale-105"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900 p-4">
      {/* Header */}
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-4 mb-8">
          <button
            onClick={() => setActiveTab?.('home')}
            className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
          >
            <span className="text-xl">←</span>
            <span>Back to Home</span>
          </button>
        </div>

        <div className="bg-white rounded-2xl p-8 shadow-2xl">
          <div className="flex items-center gap-4 mb-8">
            <div className="bg-gradient-to-r from-purple-500 to-pink-600 p-4 rounded-2xl shadow-lg">
              <span className="text-3xl">📊</span>
            </div>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
                Recent Games
              </h1>
              <p className="text-sm text-gray-500 mt-1">Your game history ({games.length} total games)</p>
            </div>
          </div>

          {currentGames.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-gray-400 text-6xl mb-4">🎮</div>
              <h3 className="text-xl font-semibold text-gray-700 mb-2">No Games Yet</h3>
              <p className="text-gray-500 mb-6">Start playing to see your game history here!</p>
              <button
                onClick={() => setActiveTab?.('home')}
                className="px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold rounded-lg transition-all duration-300 transform hover:scale-105"
              >
                Start Playing
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {currentGames.map((game, index) => (
                <div
                  key={game.gameId}
                  className={`p-6 rounded-xl border shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02] ${
                    game.mode === 'bet' 
                      ? 'bg-gradient-to-r from-yellow-100 to-yellow-200 border-yellow-300' 
                      : 'bg-gradient-to-r from-gray-50 to-gray-100 border-gray-200'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      {/* Game Number */}
                      <div className={`font-bold text-lg px-3 py-2 rounded-lg ${
                        game.mode === 'bet' 
                          ? 'bg-yellow-200 text-gray-800' 
                          : 'bg-gray-200 text-gray-700'
                      }`}>
                        #{startIndex + index + 1}
                      </div>
                      
                      {/* Game Info */}
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <span className="text-2xl">{getResultIcon(game.result)}</span>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className={`text-2xl font-bold ${getResultColor(game.result)}`}>
                                {game.result === 'won' ? 'Victory' : 'Defeat'}
                              </span>
                              <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getModeColor(game.mode)}`}>
                                {game.mode === 'bet' ? 'Bet Game' : 'Practice'}
                              </span>
                            </div>
                          </div>
                        </div>
                        
                        {/* Game Details */}
                        <div className="flex items-center gap-4 text-sm text-gray-600">
                          <span>Game ID: {game.gameId}</span>
                          {game.mode === 'bet' && game.betAmount && (
                            <>
                              <span>•</span>
                              <span>Bet: {game.betAmount} DOBI</span>
                            </>
                          )}
                          {game.rewardAmount && game.rewardAmount > 0 && (
                            <>
                              <span>•</span>
                              <span className="text-green-600 font-semibold">
                                Reward: {game.rewardAmount} DOBI
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    {/* Score Badge */}
                    <div className="text-right">
                      <div className={`font-bold text-2xl px-4 py-2 rounded-xl shadow-lg ${
                        game.result === 'won' 
                          ? 'bg-gradient-to-r from-yellow-400 to-yellow-500 text-yellow-900' 
                          : 'bg-gray-200 text-gray-700'
                      }`}>
                        {game.score}
                      </div>
                      <div className="text-xs text-gray-500 mt-1 text-center">points</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Pagination Controls */}
          {games.length > gamesPerPage && (
            <div className="mt-6 flex items-center justify-between">
              <button
                onClick={goToPrevPage}
                disabled={currentPage === 0}
                className={`px-4 py-2 rounded-lg font-semibold transition-all duration-300 ${
                  currentPage === 0
                    ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                    : 'bg-gray-600 text-white hover:bg-gray-700 transform hover:scale-105'
                }`}
              >
                ← Previous
              </button>
              
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">
                  Page {currentPage + 1} of {totalPages}
                </span>
                <div className="flex gap-1">
                  {Array.from({ length: totalPages }, (_, i) => (
                    <div
                      key={i}
                      className={`w-2 h-2 rounded-full ${
                        i === currentPage ? 'bg-blue-500' : 'bg-gray-300'
                      }`}
                    />
                  ))}
                </div>
              </div>
              
              <button
                onClick={goToNextPage}
                disabled={currentPage === totalPages - 1}
                className={`px-4 py-2 rounded-lg font-semibold transition-all duration-300 ${
                  currentPage === totalPages - 1
                    ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                    : 'bg-gray-600 text-white hover:bg-gray-700 transform hover:scale-105'
                }`}
              >
                Next →
              </button>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
