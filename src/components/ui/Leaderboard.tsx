import React from 'react';
import AnimatedText from './AnimatedText';

interface LeaderboardEntry {
  fid: number;
  username: string;
  displayName: string;
  score: number;
  timestamp: number;
  avatar?: string;
}

interface LeaderboardProps {
  entries: LeaderboardEntry[];
  userRank?: number;
  userBestScore?: number;
  isLoading: boolean;
  error: string | null;
  onShare: (score: number) => void;
  currentScore?: number;
}

const Leaderboard: React.FC<LeaderboardProps> = ({
  entries,
  userRank,
  userBestScore,
  isLoading,
  error,
  onShare,
  currentScore
}) => {
  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return '🥇';
      case 2:
        return '🥈';
      case 3:
        return '🥉';
      default:
        return `#${rank}`;
    }
  };

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
    
    if (diffInHours < 1) {
      return 'Hace un momento';
    } else if (diffInHours < 24) {
      return `Hace ${Math.floor(diffInHours)}h`;
    } else {
      return `Hace ${Math.floor(diffInHours / 24)}d`;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500"></div>
        <span className="ml-2 text-white">Cargando...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center p-4">
        <div className="text-red-400 mb-2">❌ {error}</div>
        <button 
          onClick={() => window.location.reload()}
          className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors"
        >
          Reintentar
        </button>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md mx-auto">
      <AnimatedText animation="fadeIn" delay={0}>
        <h2 className="text-2xl font-bold text-center text-white mb-6">
          🏆 Leaderboard
        </h2>
      </AnimatedText>

      {/* User Stats */}
      {(userRank || userBestScore) && (
        <AnimatedText animation="slideUp" delay={200}>
          <div className="bg-gray-800 rounded-lg p-4 mb-4 border border-gray-600">
            <div className="text-center text-white">
              <div className="text-lg font-semibold mb-2">Tu progreso</div>
              {userRank && (
                <div className="text-green-400 mb-1">
                  Posición: {getRankIcon(userRank)}
                </div>
              )}
              {userBestScore && (
                <div className="text-yellow-400 mb-2">
                  Mejor puntuación: {userBestScore}
                </div>
              )}
              {currentScore && currentScore > 0 && (
                <button
                  onClick={() => onShare(currentScore)}
                  className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors text-sm"
                >
                  Compartir puntuación
                </button>
              )}
            </div>
          </div>
        </AnimatedText>
      )}

      {/* Leaderboard Entries */}
      <div className="space-y-2 max-h-96 overflow-y-auto">
        {entries.length === 0 ? (
          <AnimatedText animation="fadeIn" delay={400}>
            <div className="text-center text-gray-400 py-8">
              No hay puntuaciones aún. ¡Sé el primero!
            </div>
          </AnimatedText>
        ) : (
          entries.map((entry, index) => (
            <AnimatedText 
              key={`${entry.fid}-${entry.timestamp}`} 
              animation="slideUp" 
              delay={400 + index * 100}
            >
              <div className={`flex items-center justify-between p-3 rounded-lg transition-colors ${
                index < 3 
                  ? 'bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border border-yellow-500/30' 
                  : 'bg-gray-800 hover:bg-gray-700'
              }`}>
                <div className="flex items-center space-x-3">
                  <div className="text-lg font-bold text-white min-w-[2rem]">
                    {getRankIcon(index + 1)}
                  </div>
                  {entry.avatar ? (
                    <img 
                      src={entry.avatar} 
                      alt={entry.displayName}
                      className="w-8 h-8 rounded-full"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-gray-600 flex items-center justify-center">
                      <span className="text-white text-sm font-bold">
                        {entry.displayName.charAt(0).toUpperCase()}
                      </span>
                    </div>
                  )}
                  <div>
                    <div className="text-white font-semibold">
                      {entry.displayName}
                    </div>
                    <div className="text-gray-400 text-sm">
                      @{entry.username} • {formatDate(entry.timestamp)}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-green-400 font-bold text-lg">
                    {entry.score}
                  </div>
                  <div className="text-gray-400 text-sm">
                    puntos
                  </div>
                </div>
              </div>
            </AnimatedText>
          ))
        )}
      </div>
    </div>
  );
};

export default Leaderboard;
