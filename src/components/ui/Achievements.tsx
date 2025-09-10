import React from 'react';
import AnimatedText from './AnimatedText';
import { Achievement } from '../../hooks/useAchievements';

interface AchievementsProps {
  achievements: Achievement[];
  recentlyUnlocked: Achievement[];
  onClose: () => void;
}

const Achievements: React.FC<AchievementsProps> = ({
  achievements,
  recentlyUnlocked,
  onClose
}) => {
  const getRarityColor = (rarity: Achievement['rarity']) => {
    switch (rarity) {
      case 'common':
        return 'text-gray-400 border-gray-400';
      case 'rare':
        return 'text-blue-400 border-blue-400';
      case 'epic':
        return 'text-purple-400 border-purple-400';
      case 'legendary':
        return 'text-yellow-400 border-yellow-400';
      default:
        return 'text-gray-400 border-gray-400';
    }
  };

  const getRarityBg = (rarity: Achievement['rarity']) => {
    switch (rarity) {
      case 'common':
        return 'bg-gray-800';
      case 'rare':
        return 'bg-blue-900/20';
      case 'epic':
        return 'bg-purple-900/20';
      case 'legendary':
        return 'bg-yellow-900/20';
      default:
        return 'bg-gray-800';
    }
  };

  const categories = [
    { id: 'score', name: 'Score', icon: '🎯' },
    { id: 'powerups', name: 'Power-ups', icon: '⚡' },
    { id: 'survival', name: 'Survival', icon: '🏃' },
    { id: 'special', name: 'Special', icon: '💎' }
  ] as const;

  const [selectedCategory, setSelectedCategory] = React.useState<Achievement['category']>('score');

  const filteredAchievements = achievements.filter(a => a.category === selectedCategory);
  const unlockedCount = achievements.filter(a => a.unlocked).length;
  const totalCount = achievements.length;

  return (
    <div className="w-full max-w-2xl mx-auto">
      <AnimatedText animation="fadeIn" delay={0}>
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-white">
            🏆 Achievements ({unlockedCount}/{totalCount})
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white text-2xl"
          >
            ×
          </button>
        </div>
      </AnimatedText>

      {/* Recently Unlocked */}
      {recentlyUnlocked.length > 0 && (
        <AnimatedText animation="bounce" delay={200}>
          <div className="mb-6 p-4 bg-gradient-to-r from-yellow-500/20 to-orange-500/20 rounded-lg border border-yellow-500/30">
            <h3 className="text-lg font-semibold text-yellow-400 mb-2">
              Achievements Unlocked!
            </h3>
            <div className="space-y-2">
              {recentlyUnlocked.map(achievement => (
                <div key={achievement.id} className="flex items-center space-x-3">
                  <span className="text-2xl">{achievement.icon}</span>
                  <div>
                    <div className="text-white font-semibold">{achievement.title}</div>
                    <div className="text-gray-300 text-sm">{achievement.description}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </AnimatedText>
      )}

      {/* Category Tabs */}
      <AnimatedText animation="slideUp" delay={400}>
        <div className="flex flex-wrap gap-2 mb-6">
          {categories.map(category => (
            <button
              key={category.id}
              onClick={() => setSelectedCategory(category.id)}
              className={`px-4 py-2 rounded-lg transition-colors ${
                selectedCategory === category.id
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              {category.icon} {category.name}
            </button>
          ))}
        </div>
      </AnimatedText>

      {/* Achievements List */}
      <div className="space-y-3 max-h-96 overflow-y-auto">
        {filteredAchievements.length === 0 ? (
          <AnimatedText animation="fadeIn" delay={600}>
            <div className="text-center text-gray-400 py-8">
              No achievements in this category
            </div>
          </AnimatedText>
        ) : (
          filteredAchievements.map((achievement, index) => (
            <AnimatedText 
              key={achievement.id} 
              animation="slideUp" 
              delay={600 + index * 100}
            >
              <div className={`p-4 rounded-lg border-2 transition-all ${
                achievement.unlocked 
                  ? `${getRarityBg(achievement.rarity)} ${getRarityColor(achievement.rarity)}` 
                  : 'bg-gray-800 border-gray-600 opacity-60'
              }`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <span className="text-3xl">{achievement.icon}</span>
                    <div>
                      <div className={`font-semibold ${
                        achievement.unlocked ? 'text-white' : 'text-gray-400'
                      }`}>
                        {achievement.title}
                      </div>
                      <div className="text-sm text-gray-300">
                        {achievement.description}
                      </div>
                      {achievement.unlocked && achievement.unlockedAt && (
                        <div className="text-xs text-gray-400 mt-1">
                          Unlocked: {new Date(achievement.unlockedAt).toLocaleDateString()}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={`text-sm font-semibold ${
                      achievement.unlocked ? 'text-green-400' : 'text-gray-500'
                    }`}>
                      {achievement.progress}/{achievement.maxProgress}
                    </div>
                    <div className="w-20 bg-gray-600 rounded-full h-2 mt-1">
                      <div 
                        className={`h-2 rounded-full transition-all duration-500 ${
                          achievement.unlocked ? 'bg-green-400' : 'bg-blue-400'
                        }`}
                        style={{ 
                          width: `${Math.min((achievement.progress / achievement.maxProgress) * 100, 100)}%` 
                        }}
                      />
                    </div>
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

export default Achievements;
