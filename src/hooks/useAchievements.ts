import { useState, useCallback, useEffect } from 'react';

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  unlocked: boolean;
  unlockedAt?: number;
  progress: number;
  maxProgress: number;
  category: 'score' | 'powerups' | 'survival' | 'special';
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
}

const ACHIEVEMENTS: Omit<Achievement, 'unlocked' | 'unlockedAt' | 'progress'>[] = [
  // Score achievements
  {
    id: 'first_score',
    title: 'First Point',
    description: 'Get your first point',
    icon: '🎯',
    maxProgress: 1,
    category: 'score',
    rarity: 'common'
  },
  {
    id: 'score_10',
    title: 'Beginner',
    description: 'Score 10 points',
    icon: '🌟',
    maxProgress: 10,
    category: 'score',
    rarity: 'common'
  },
  {
    id: 'score_50',
    title: 'Expert',
    description: 'Score 50 points',
    icon: '🏆',
    maxProgress: 50,
    category: 'score',
    rarity: 'rare'
  },
  {
    id: 'score_100',
    title: 'Master',
    description: 'Score 100 points',
    icon: '👑',
    maxProgress: 100,
    category: 'score',
    rarity: 'epic'
  },
  {
    id: 'score_200',
    title: 'Legend',
    description: 'Score 200 points',
    icon: '💎',
    maxProgress: 200,
    category: 'score',
    rarity: 'legendary'
  },

  // Power-up achievements
  {
    id: 'first_powerup',
    title: 'First Power-up',
    description: 'Collect your first power-up',
    icon: '⚡',
    maxProgress: 1,
    category: 'powerups',
    rarity: 'common'
  },
  {
    id: 'powerup_magnet',
    title: 'Magnetic Attraction',
    description: 'Collect 5 magnet power-ups',
    icon: '🧲',
    maxProgress: 5,
    category: 'powerups',
    rarity: 'rare'
  },
  {
    id: 'powerup_shield',
    title: 'Protective Shield',
    description: 'Collect 5 shield power-ups',
    icon: '🛡️',
    maxProgress: 5,
    category: 'powerups',
    rarity: 'rare'
  },
  {
    id: 'powerup_multiplier',
    title: 'Multiplier',
    description: 'Collect 5 multiplier power-ups',
    icon: '✨',
    maxProgress: 5,
    category: 'powerups',
    rarity: 'rare'
  },

  // Survival achievements
  {
    id: 'survive_10_obstacles',
    title: 'Survivor',
    description: 'Dodge 10 obstacles',
    icon: '🏃',
    maxProgress: 10,
    category: 'survival',
    rarity: 'common'
  },
  {
    id: 'survive_50_obstacles',
    title: 'Ninja',
    description: 'Dodge 50 obstacles',
    icon: '🥷',
    maxProgress: 50,
    category: 'survival',
    rarity: 'rare'
  },
  {
    id: 'survive_100_obstacles',
    title: 'Ghost',
    description: 'Dodge 100 obstacles',
    icon: '👻',
    maxProgress: 100,
    category: 'survival',
    rarity: 'epic'
  },

  // Special achievements
  {
    id: 'perfect_game',
    title: 'Perfect Game',
    description: 'Score 20 points without using power-ups',
    icon: '💯',
    maxProgress: 1,
    category: 'special',
    rarity: 'legendary'
  },
  {
    id: 'combo_master',
    title: 'Combo Master',
    description: 'Get 5 power-ups in a single game',
    icon: '🔥',
    maxProgress: 1,
    category: 'special',
    rarity: 'epic'
  },
  {
    id: 'speed_demon',
    title: 'Speed Demon',
    description: 'Score 30 points in less than 30 seconds',
    icon: '⚡',
    maxProgress: 1,
    category: 'special',
    rarity: 'legendary'
  }
];

export const useAchievements = () => {
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [recentlyUnlocked, setRecentlyUnlocked] = useState<Achievement[]>([]);

  // Load achievements from localStorage
  useEffect(() => {
    const savedAchievements = localStorage.getItem('dobi-bird-achievements');
    if (savedAchievements) {
      setAchievements(JSON.parse(savedAchievements));
    } else {
      // Initialize with default achievements
      const initialAchievements = ACHIEVEMENTS.map(achievement => ({
        ...achievement,
        unlocked: false,
        progress: 0
      }));
      setAchievements(initialAchievements);
      localStorage.setItem('dobi-bird-achievements', JSON.stringify(initialAchievements));
    }
  }, []);

  // Save achievements to localStorage
  useEffect(() => {
    if (achievements.length > 0) {
      localStorage.setItem('dobi-bird-achievements', JSON.stringify(achievements));
    }
  }, [achievements]);

  const updateAchievement = useCallback((achievementId: string, progress: number) => {
    setAchievements(prev => {
      const updated = prev.map(achievement => {
        if (achievement.id === achievementId) {
          const newProgress = Math.min(progress, achievement.maxProgress);
          const wasUnlocked = achievement.unlocked;
          const isNowUnlocked = newProgress >= achievement.maxProgress && !wasUnlocked;
          
          if (isNowUnlocked) {
            setRecentlyUnlocked(prev => [...prev, { ...achievement, unlocked: true, unlockedAt: Date.now(), progress: newProgress }]);
            setTimeout(() => {
              setRecentlyUnlocked(prev => prev.filter(a => a.id !== achievementId));
            }, 5000);
          }

          return {
            ...achievement,
            progress: newProgress,
            unlocked: isNowUnlocked || wasUnlocked,
            unlockedAt: isNowUnlocked ? Date.now() : achievement.unlockedAt
          };
        }
        return achievement;
      });
      return updated;
    });
  }, []);

  const checkScoreAchievements = useCallback((score: number) => {
    updateAchievement('first_score', score >= 1 ? 1 : 0);
    updateAchievement('score_10', score);
    updateAchievement('score_50', score);
    updateAchievement('score_100', score);
    updateAchievement('score_200', score);
  }, [updateAchievement]);

  const checkPowerUpAchievements = useCallback((powerUpType: string, totalPowerUps: number) => {
    updateAchievement('first_powerup', totalPowerUps >= 1 ? 1 : 0);
    
    if (powerUpType === 'magnet') {
      updateAchievement('powerup_magnet', totalPowerUps);
    } else if (powerUpType === 'shield') {
      updateAchievement('powerup_shield', totalPowerUps);
    } else if (powerUpType === 'multiplier') {
      updateAchievement('powerup_multiplier', totalPowerUps);
    }
  }, [updateAchievement]);

  const checkSurvivalAchievements = useCallback((obstaclesPassed: number) => {
    updateAchievement('survive_10_obstacles', obstaclesPassed);
    updateAchievement('survive_50_obstacles', obstaclesPassed);
    updateAchievement('survive_100_obstacles', obstaclesPassed);
  }, [updateAchievement]);

  const checkSpecialAchievements = useCallback((gameData: {
    score: number;
    powerUpsUsed: number;
    gameTime: number;
    obstaclesPassed: number;
  }) => {
    // Perfect game: 20+ points without power-ups
    if (gameData.score >= 20 && gameData.powerUpsUsed === 0) {
      updateAchievement('perfect_game', 1);
    }

    // Combo master: 5+ power-ups in one game
    if (gameData.powerUpsUsed >= 5) {
      updateAchievement('combo_master', 1);
    }

    // Speed demon: 30+ points in less than 30 seconds
    if (gameData.score >= 30 && gameData.gameTime < 30000) {
      updateAchievement('speed_demon', 1);
    }
  }, [updateAchievement]);

  const getAchievementsByCategory = useCallback((category: Achievement['category']) => {
    return achievements.filter(achievement => achievement.category === category);
  }, [achievements]);

  const getUnlockedAchievements = useCallback(() => {
    return achievements.filter(achievement => achievement.unlocked);
  }, [achievements]);

  const getAchievementProgress = useCallback((achievementId: string) => {
    const achievement = achievements.find(a => a.id === achievementId);
    return achievement ? (achievement.progress / achievement.maxProgress) * 100 : 0;
  }, [achievements]);

  return {
    achievements,
    recentlyUnlocked,
    checkScoreAchievements,
    checkPowerUpAchievements,
    checkSurvivalAchievements,
    checkSpecialAchievements,
    getAchievementsByCategory,
    getUnlockedAchievements,
    getAchievementProgress
  };
};
