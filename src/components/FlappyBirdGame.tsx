"use client";

import React, { useRef, useEffect, useState, useCallback } from 'react';
import { sdk } from '@farcaster/miniapp-sdk';
import NumberDisplay from './ui/NumberDisplay';
import AnimatedText from './ui/AnimatedText';
import ParticleEffect from './ui/ParticleEffect';
import Leaderboard from './ui/Leaderboard';
import { useSound } from '../hooks/useSound';
import { useLeaderboard } from '../hooks/useLeaderboard';
import { gameAPI, initializeGameSession, isSessionActive } from '../lib/gameClient';

interface GameState {
  isPlaying: boolean;
  isGameOver: boolean;
  score: number;
  highScore: number;
  gameId?: number;
  canClaimReward: boolean;
  hasWon: boolean;
}

interface Bird {
  x: number;
  y: number;
  velocity: number;
  rotation: number;
}

interface Obstacle {
  x: number;
  topHeight: number;
  bottomY: number;
  passed: boolean;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  color: string;
  size: number;
}

interface PowerUp {
  x: number;
  y: number;
  type: 'magnet' | 'multiplier';
  collected: boolean;
  animation: number;
}

interface Star {
  x: number;
  y: number;
  size: number;
  speed: number;
  opacity: number;
}

interface FlappyBirdGameProps {
  gameMode?: 'practice' | 'bet';
  onBackToHome?: () => void;
  playerAddress?: string;
}

const FlappyBirdGame: React.FC<FlappyBirdGameProps> = ({ gameMode = 'bet', onBackToHome, playerAddress }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gameLoopRef = useRef<number | undefined>(undefined);
  const lastTimeRef = useRef<number>(0);
  
  // Sound effects
  const { playJumpSound, playScoreSound, playCollisionSound, playPowerUpSound, playGameOverSound } = useSound();
  
  // Leaderboard
  const { leaderboard, isLoading, error, submitScore, loadLeaderboard, shareScore } = useLeaderboard();
  
  
  // Game state
  const [gameState, setGameState] = useState<GameState>({
    isPlaying: false,
    isGameOver: false,
    score: 0,
    highScore: 0,
    canClaimReward: false,
    hasWon: false
  });

  // Game objects
  const [bird, setBird] = useState<Bird>({
    x: 200, // 2x
    y: 300, // 2x
    velocity: 0,
    rotation: 0
  });

  const [obstacles, setObstacles] = useState<Obstacle[]>([]);
  const [backgroundOffset, setBackgroundOffset] = useState(0);
  const [particles, setParticles] = useState<Particle[]>([]);
  const [powerUps, setPowerUps] = useState<PowerUp[]>([]);
  const [activePowerUps, setActivePowerUps] = useState<{[key: string]: number}>({});
  const [showCelebration, setShowCelebration] = useState(false);
  const [lastScore, setLastScore] = useState(0);
  const [stars, setStars] = useState<Star[]>([]);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  
  // Pre-create gradients for better performance
  const [starGradients, setStarGradients] = useState<{ [key: string]: CanvasGradient }>({});
  const [gameStats, setGameStats] = useState({
    powerUpsUsed: 0,
    obstaclesPassed: 0,
    gameStartTime: 0,
    powerUpCounts: { magnet: 0, multiplier: 0 }
  });
  const [obstaclesEnabled, setObstaclesEnabled] = useState(false);

  // Game constants (2x resolution)
  const GRAVITY = 0.15;
  const JUMP_FORCE = -5;
  const OBSTACLE_SPEED = 4; // 2x
  const OBSTACLE_GAP = 320; // Slightly more challenging gap - less reaction time than before
  const OBSTACLE_WIDTH = 120; // 2x
  const BIRD_SIZE = 80; // 2.67x - Hitbox size (for collisions) - Made bigger
  const BIRD_DISPLAY_SIZE = 160; // 2.67x - Visual size (for rendering) - Made bigger

  // Load images
  const [images, setImages] = useState<{[key: string]: HTMLImageElement}>({});
  const [imagesLoaded, setImagesLoaded] = useState(false);

  // Particle system functions
  const createParticles = useCallback((x: number, y: number, count: number, color: string) => {
    // Limit particles for better performance
    const limitedCount = Math.min(count, 8);
    const newParticles: Particle[] = [];
    for (let i = 0; i < limitedCount; i++) {
      newParticles.push({
        x: x + (Math.random() - 0.5) * 15,
        y: y + (Math.random() - 0.5) * 15,
        vx: (Math.random() - 0.5) * 3,
        vy: (Math.random() - 0.5) * 3,
        life: 0.8, // Shorter life for better performance
        maxLife: 0.8,
        color,
        size: Math.random() * 2 + 1
      });
    }
    setParticles(prev => [...prev, ...newParticles]);
  }, []);

  const updateParticles = useCallback(() => {
    setParticles(prev => {
      const updated = prev.map(particle => ({
        ...particle,
        x: particle.x + particle.vx,
        y: particle.y + particle.vy,
        vy: particle.vy + 0.08, // gravity
        life: particle.life - 0.03 // Faster decay
      })).filter(particle => particle.life > 0);
      
      // Limit total particles for performance
      return updated.slice(0, 20);
    });
  }, []);

  // Power-up functions
  const createPowerUp = useCallback((x: number, y: number) => {
    // No power-ups available for now
    // setPowerUps(prev => [...prev, {
    //   x,
    //   y,
    //   type: 'magnet',
    //   collected: false,
    //   animation: 0
    // }]);
  }, []);

  const createStars = useCallback((canvasWidth: number, canvasHeight: number) => {
    const newStars: Star[] = [];
    const starCount = 60; // Reduced for better mobile performance
    
    // Create a grid-based distribution for more uniform coverage
    const gridCols = Math.ceil(Math.sqrt(starCount * (canvasWidth / canvasHeight)));
    const gridRows = Math.ceil(starCount / gridCols);
    const cellWidth = (canvasWidth + 200) / gridCols; // +200 for off-screen stars
    const cellHeight = canvasHeight / gridRows;
    
    let starIndex = 0;
    
    // Fill the grid with stars
    for (let row = 0; row < gridRows && starIndex < starCount; row++) {
      for (let col = 0; col < gridCols && starIndex < starCount; col++) {
        // Add some randomness within each grid cell for natural look
        const baseX = col * cellWidth;
        const baseY = row * cellHeight;
        const randomOffsetX = (Math.random() - 0.5) * cellWidth * 0.8; // 80% of cell width
        const randomOffsetY = (Math.random() - 0.5) * cellHeight * 0.8; // 80% of cell height
        
        newStars.push({
          x: Math.max(0, baseX + randomOffsetX), // Ensure stars don't go negative
          y: Math.max(0, Math.min(canvasHeight - 1, baseY + randomOffsetY)), // Clamp to canvas height
          size: Math.random() * 2 + 1, // Size between 1-3 pixels
          speed: Math.random() * 0.5 + 0.1, // Speed between 0.1-0.6
          opacity: Math.random() * 0.8 + 0.2 // Opacity between 0.2-1.0
        });
        starIndex++;
      }
    }
    
    // Add some additional random stars for extra variety
    const remainingStars = starCount - newStars.length;
    for (let i = 0; i < remainingStars; i++) {
      newStars.push({
        x: Math.random() * (canvasWidth + 200),
        y: Math.random() * canvasHeight,
        size: Math.random() * 2 + 1,
        speed: Math.random() * 0.5 + 0.1,
        opacity: Math.random() * 0.8 + 0.2
      });
    }
    
    console.log('Created stars:', newStars.length, 'for canvas:', canvasWidth, 'x', canvasHeight, 'using grid:', gridCols, 'x', gridRows);
    return newStars;
  }, []);

  const updatePowerUps = useCallback(() => {
    setPowerUps(prev => 
      prev.map(powerUp => ({
        ...powerUp,
        x: powerUp.x - OBSTACLE_SPEED,
        animation: powerUp.animation + 0.1
      })).filter(powerUp => powerUp.x > -50)
    );
  }, []);

  const updateStars = useCallback((canvasWidth: number) => {
    setStars(prev => {
      // If no stars exist, create them
      if (prev.length === 0) {
        const canvas = canvasRef.current;
        if (canvas) {
          return createStars(canvas.width, canvas.height);
        } else {
          return createStars(800, 600);
        }
      }
      
      return prev.map(star => {
        let newX = star.x - star.speed;
        // Reset star position when it goes off screen
        if (newX < -star.size) {
          // Use a more uniform distribution for re-entry
          const canvas = canvasRef.current;
          const canvasHeight = canvas ? canvas.height : (window.innerHeight || 800);
          
          // Distribute re-entry across the full height more evenly
          const heightSections = 8; // Divide height into 8 sections
          const sectionHeight = canvasHeight / heightSections;
          const randomSection = Math.floor(Math.random() * heightSections);
          const randomY = randomSection * sectionHeight + Math.random() * sectionHeight;
          
          newX = canvasWidth + Math.random() * 200; // Randomize re-entry position
          return {
            ...star,
            x: newX,
            y: Math.max(0, Math.min(canvasHeight - 1, randomY)) // Clamp to canvas height
          };
        }
        return {
          ...star,
          x: newX
        };
      });
    });
  }, [createStars]);

  const checkPowerUpCollision = useCallback(() => {
    powerUps.forEach(powerUp => {
      if (!powerUp.collected && 
          Math.abs(bird.x - powerUp.x) < 30 && 
          Math.abs(bird.y - powerUp.y) < 30) {
        
        setPowerUps(prev => prev.map(p => 
          p === powerUp ? { ...p, collected: true } : p
        ));

        // Apply shield power-up effect
        playPowerUpSound();
        
        // Update game stats
        setGameStats(prev => ({
          ...prev,
          powerUpsUsed: prev.powerUpsUsed + 1
        }));
        
        createParticles(powerUp.x, powerUp.y, 15, '#0088ff');
      }
    });
  }, [powerUps, bird.x, bird.y, createParticles, playPowerUpSound]);

  useEffect(() => {
    const loadImages = async () => {
      const imageNames = ['bird', 'deadge2', 'sky'];
      const loadedImages: {[key: string]: HTMLImageElement} = {};

      try {
        for (const name of imageNames) {
          const img = new Image();
          let imagePath = '';
          switch (name) {
            case 'bird':
              imagePath = '/game/sprites/personaje.png';
              break;
            case 'deadge2':
              imagePath = '/game/sprites/deadge2.png';
              break;
            case 'sky':
              imagePath = '/game/backgrounds/sky.png';
              break;
          }
          img.src = imagePath;
          
          console.log(`Loading image: ${imagePath}`);
          
          await new Promise((resolve, reject) => {
            const timeout = setTimeout(() => {
              console.warn(`Image load timeout: ${imagePath}`);
              resolve(null); // Continue even if image fails to load
            }, 5000); // 5 second timeout
            
            img.onload = () => {
              clearTimeout(timeout);
              resolve(null);
            };
            
            img.onerror = () => {
              clearTimeout(timeout);
              console.warn(`Failed to load image: ${imagePath}`);
              resolve(null); // Continue even if image fails to load
            };
          });
          
          if (img.complete && img.naturalHeight !== 0) {
            loadedImages[name] = img;
          } else {
            console.warn(`Image not properly loaded: ${imagePath}`);
          }
        }

        setImages(loadedImages);
        setImagesLoaded(true);
        
        // Initialize stars for the starry background
        const canvas = canvasRef.current;
        if (canvas) {
          const initialStars = createStars(canvas.width, canvas.height);
          console.log('Creating stars:', initialStars.length);
          setStars(initialStars);
        } else {
          console.log('Canvas not available for stars initialization');
          // Fallback: create stars with default dimensions
          const fallbackStars = createStars(800, 600);
          console.log('Creating fallback stars:', fallbackStars.length);
          setStars(fallbackStars);
        }
        
        // App ready signal is now handled by the main App component
      } catch (error) {
        console.error('Error loading images:', error);
        // Set images loaded anyway to prevent infinite loading
        setImagesLoaded(true);
      }
    };

    loadImages();
    loadLeaderboard();
  }, [loadLeaderboard]);

  // Statistics tracking functions
  const updateGameStats = useCallback((score: number) => {
    // Update high score
    const currentHighScore = parseInt(localStorage.getItem('flappy-dobi-high-score') || '0', 10);
    if (score > currentHighScore) {
      localStorage.setItem('flappy-dobi-high-score', score.toString());
    }
    
    // Update games played
    const gamesPlayed = parseInt(localStorage.getItem('flappy-dobi-games-played') || '0', 10);
    localStorage.setItem('flappy-dobi-games-played', (gamesPlayed + 1).toString());
  }, []);

  // Game reward system functions
  const createGame = useCallback(async (mode: 'practice' | 'bet' = 'bet') => {
    try {
      const address = playerAddress || '0x0000000000000000000000000000000000000000';
      console.log('Creating game for player:', address, 'mode:', mode);
      
      // Inicializar sesión si no existe
      if (!isSessionActive()) {
        const sessionResult = await initializeGameSession(address);
        if (!sessionResult.success) {
          console.error('Failed to initialize game session:', sessionResult.error);
          return null;
        }
      }
      
      // Crear juego usando el cliente seguro
      const result = await gameAPI.createGame(address, mode);
      
      if (result.success && result.data) {
        // Type guard to ensure data has the expected structure
        const gameData = result.data as { gameId: number };
        if (typeof gameData === 'object' && gameData !== null && typeof gameData.gameId === 'number') {
          console.log('Game created successfully:', gameData);
          setGameState(prev => ({ ...prev, gameId: gameData.gameId }));
          return gameData.gameId;
        } else {
          console.error('Invalid game data structure:', gameData);
        }
      } else {
        console.error('Game creation failed:', result.error);
      }
    } catch (error) {
      console.error('Error creating game:', error);
    }
    return null;
  }, []);

  const updateGameScore = useCallback(async (gameId: number, score: number) => {
    try {
      const result = await gameAPI.updateGameScore(gameId, score);
      if (!result.success) {
        console.error('Error updating game score:', result.error);
      }
    } catch (error) {
      console.error('Error updating game score:', error);
    }
  }, []);

  const claimReward = useCallback(async () => {
    if (!gameState.gameId) return;

    try {
      const address = playerAddress || '0x0000000000000000000000000000000000000000';
      const result = await gameAPI.claimReward(gameState.gameId, address);
      
      if (result.success && result.data) {
        // Type guard to ensure data has the expected structure
        const claimData = result.data as { rewardAmount: number };
        if (typeof claimData === 'object' && claimData !== null && typeof claimData.rewardAmount === 'number') {
          alert(`¡Premio reclamado! Recompensa: ${claimData.rewardAmount / 1e6} USDC`);
          setGameState(prev => ({ ...prev, canClaimReward: false }));
        } else {
          console.error('Invalid claim data structure:', claimData);
          alert('Error: Datos de recompensa inválidos');
        }
      } else {
        alert(`Error: ${result.error}`);
      }
    } catch (error) {
      console.error('Error claiming reward:', error);
      alert('Error al reclamar premio');
    }
  }, [gameState.gameId]);

  // Pre-create gradients for performance
  const createStarGradients = useCallback((ctx: CanvasRenderingContext2D) => {
    const gradients: { [key: string]: CanvasGradient } = {};
    
    // Create a few different star gradients
    for (let i = 1; i <= 3; i++) {
      const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, i * 2);
      gradient.addColorStop(0, '#FFFFFF');
      gradient.addColorStop(0.5, '#00FFFF');
      gradient.addColorStop(1, 'rgba(0, 255, 255, 0)');
      gradients[`star_${i}`] = gradient;
    }
    
    return gradients;
  }, []);

  // Game loop
  const gameLoop = useCallback((currentTime: number) => {
    if (!gameState.isPlaying || gameState.isGameOver) return;

    const deltaTime = currentTime - lastTimeRef.current;
    lastTimeRef.current = currentTime;

    // Enable obstacles after 2 seconds
    if (!obstaclesEnabled && gameStats.gameStartTime > 0 && Date.now() - gameStats.gameStartTime > 2000) {
      setObstaclesEnabled(true);
    }

    // Update bird physics
    setBird(prevBird => {
      const newVelocity = prevBird.velocity + GRAVITY;
      let newY = prevBird.y + newVelocity;
      const newRotation = Math.min(Math.max(newVelocity * 3, -30), 30);

      // Check ceiling collision
      if (newY < 25) { // 2x - Ceiling at 25px from top
        newY = 25;
        return { ...prevBird, y: newY, velocity: 0, rotation: 0 };
      }

      // Check ground collision
      if (newY > 1100 - BIRD_SIZE) { // 2x
        setGameState(prev => {
          const newState = { ...prev, isGameOver: true };
          // Submit score when game ends
          if (prev.score > 0) {
            submitScore(prev.score);
            updateGameStats(prev.score);
          }
          return newState;
        });
        
        // Removed red splash effect on ground collision
        playGameOverSound();
        return { ...prevBird, y: 400 - BIRD_SIZE, velocity: 0 };
      }

      return {
        ...prevBird,
        y: newY,
        velocity: newVelocity,
        rotation: newRotation
      };
    });

    // Update obstacles
    setObstacles(prevObstacles => {
      const newObstacles = prevObstacles.map(obstacle => ({
        ...obstacle,
        x: obstacle.x - OBSTACLE_SPEED
      })).filter(obstacle => obstacle.x > -OBSTACLE_WIDTH);

      // Add new obstacles with slightly more challenging spacing
      if (obstaclesEnabled && (newObstacles.length === 0 || newObstacles[newObstacles.length - 1].x < 350)) { // Slightly more challenging threshold
        const topHeight = Math.random() * 400 + 200; // 2x
        newObstacles.push({
          x: 850, // Slightly more challenging spawn distance - less time to react
          topHeight,
          bottomY: topHeight + OBSTACLE_GAP,
          passed: false
        });

        // Occasionally add power-ups
        if (Math.random() < 0.3) {
          createPowerUp(850, topHeight + OBSTACLE_GAP / 2); // Updated to match obstacle position
        }
      }

      // Check scoring
      newObstacles.forEach(obstacle => {
        if (!obstacle.passed && obstacle.x + OBSTACLE_WIDTH < bird.x) {
          obstacle.passed = true;
          const points = 0.5; // Fixed points, divided by 2
          setGameState(prev => {
            const newScore = prev.score + points;
            if (newScore > lastScore) {
              setLastScore(newScore);
              // Removed celebration splash effect
            }

            // Check if player reached 50 points
            if (newScore >= 50 && !prev.hasWon) {
              // Player won! Mark game as won and stop the game
              setGameState(prevState => ({
                ...prevState,
                hasWon: true,
                canClaimReward: true,
                isGameOver: true,
                isPlaying: false // Stop the game
              }));

              // Update game status to won
              if (prev.gameId) {
                updateGameScore(prev.gameId, newScore);
                fetch('/api/games', {
                  method: 'PUT',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ gameId: prev.gameId, status: 'won' })
                });
              }

              // Show celebration
              setShowCelebration(true);
              setTimeout(() => setShowCelebration(false), 3000);
              
              // Stop the game loop
              if (gameLoopRef.current) {
                cancelAnimationFrame(gameLoopRef.current);
                gameLoopRef.current = undefined;
              }
            }

            return { ...prev, score: newScore };
          });
          
          // Update game stats
          setGameStats(prev => ({
            ...prev,
            obstaclesPassed: prev.obstaclesPassed + 1
          }));
          
          
          createParticles(obstacle.x + OBSTACLE_WIDTH, bird.y, 8, '#00ff88');
          playScoreSound();
        }
      });

      return newObstacles;
    });

    // Update particles
    updateParticles();

    // Update power-ups
    updatePowerUps();

    // Check power-up collisions
    checkPowerUpCollision();

    // Update active power-ups
    setActivePowerUps(prev => {
      const updated = { ...prev };
      Object.keys(updated).forEach(key => {
        updated[key] = Math.max(0, updated[key] - 1);
        if (updated[key] === 0) {
          delete updated[key];
        }
      });
      return updated;
    });

    // Update background
    setBackgroundOffset(prev => (prev + 2) % 800); // Background scroll speed

    // Update stars
    const canvas = canvasRef.current;
    if (canvas) {
      updateStars(canvas.width);
    }

    // Check collisions
    obstacles.forEach(obstacle => {
      if (
        bird.x + BIRD_SIZE > obstacle.x &&
        bird.x < obstacle.x + OBSTACLE_WIDTH &&
        (bird.y < obstacle.topHeight || bird.y + BIRD_SIZE > obstacle.bottomY)
      ) {
        setGameState(prev => {
          const newState = { ...prev, isGameOver: true };
          // Submit score when game ends
          if (prev.score > 0) {
            submitScore(prev.score);
            updateGameStats(prev.score);
          }
          return newState;
        });
        
        // Removed red splash effect on obstacle collision
        playCollisionSound();
      }
    });

    gameLoopRef.current = requestAnimationFrame(gameLoop);
  }, [gameState.isPlaying, gameState.isGameOver, bird.x, bird.y, obstacles, obstaclesEnabled, gameStats.gameStartTime, updateParticles, updatePowerUps, updateStars, checkPowerUpCollision, createParticles, createPowerUp, playGameOverSound, playScoreSound, playCollisionSound, submitScore, updateGameStats]);

  // Start game loop
  useEffect(() => {
    if (gameState.isPlaying && !gameState.isGameOver) {
      lastTimeRef.current = performance.now();
      gameLoopRef.current = requestAnimationFrame(gameLoop);
    }

    return () => {
      if (gameLoopRef.current) {
        cancelAnimationFrame(gameLoopRef.current);
      }
    };
  }, [gameState.isPlaying, gameState.isGameOver, gameLoop]);

  // Handle jump
  const handleJump = useCallback(async () => {
    if (!gameState.isPlaying) {
      // Create a new game when starting with the correct mode
      const gameId = await createGame(gameMode);
      
      setGameState(prev => ({ 
        ...prev, 
        isPlaying: true,
        isGameOver: false,
        score: 0,
        hasWon: false,
        canClaimReward: false,
        gameId: gameId || undefined
      }));
      setBird(prev => ({ ...prev, y: 300, velocity: 0, rotation: 0 })); // 2x
      setObstacles([]);
      setParticles([]);
      setPowerUps([]);
      setActivePowerUps({});
      setShowCelebration(false);
      setLastScore(0);
      setObstaclesEnabled(false);
      setGameStats({
        powerUpsUsed: 0,
        obstaclesPassed: 0,
        gameStartTime: Date.now(),
        powerUpCounts: { magnet: 0, multiplier: 0 }
      });
    } else if (!gameState.isGameOver) {
      setBird(prev => ({ ...prev, velocity: JUMP_FORCE }));
      createParticles(bird.x, bird.y, 5, '#ffffff');
      playJumpSound();
    } else {
      // Restart game
      setGameState(prev => ({ 
        ...prev, 
        isPlaying: false, 
        isGameOver: false, 
        score: 0 
      }));
      setBird({ x: 200, y: 300, velocity: 0, rotation: 0 }); // 2x
      setObstacles([]);
      setParticles([]);
      setPowerUps([]);
      setActivePowerUps({});
      setShowCelebration(false);
      setLastScore(0);
      setObstaclesEnabled(false);
      
      // Reinitialize stars for restart
      const canvas = canvasRef.current;
      if (canvas) {
        const restartStars = createStars(canvas.width, canvas.height);
        setStars(restartStars);
      }
    }
  }, [gameState.isPlaying, gameState.isGameOver, bird.x, bird.y, createParticles, playJumpSound, createStars, gameMode, createGame]);

  // Handle keyboard and touch events
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        e.preventDefault();
        handleJump();
      }
    };

    const handleTouchStart = (e: TouchEvent) => {
      e.preventDefault();
      handleJump();
    };

    const handleTouchEnd = (e: TouchEvent) => {
      e.preventDefault();
    };

    // Keyboard events
    window.addEventListener('keydown', handleKeyPress);
    
    // Touch events for mobile devices
    window.addEventListener('touchstart', handleTouchStart, { passive: false });
    window.addEventListener('touchend', handleTouchEnd, { passive: false });
    
    return () => {
      window.removeEventListener('keydown', handleKeyPress);
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchend', handleTouchEnd);
    };
  }, [handleJump]);

  // Render game
  const render = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !imagesLoaded) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw starry night sky background
    // Create dark blue gradient background
    const skyGradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    skyGradient.addColorStop(0, '#0B1426'); // Very dark blue
    skyGradient.addColorStop(0.5, '#1A1A2E'); // Dark blue
    skyGradient.addColorStop(1, '#16213E'); // Slightly lighter dark blue
    
    ctx.fillStyle = skyGradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Draw moving stars with futuristic effects (optimized)
    ctx.save();
    stars.forEach(star => {
      ctx.globalAlpha = star.opacity;
      
      // Use simple colors instead of complex gradients for better performance
      ctx.fillStyle = '#FFFFFF';
      ctx.shadowColor = '#00FFFF';
      ctx.shadowBlur = star.size * 1.5;
      
      ctx.beginPath();
      ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
      ctx.fill();
      
      // Add twinkling effect for larger stars only
      if (star.size > 1.5) {
        ctx.shadowColor = '#FFFFFF';
        ctx.shadowBlur = 2;
        ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.size * 0.4, 0, Math.PI * 2);
        ctx.fill();
      }
    });
    ctx.restore();

    // Invisible ceiling - no visual rendering, only collision detection

    // Ground removed - only collision detection remains

    // Draw futuristic pipe obstacles (optimized)
    obstacles.forEach(obstacle => {
      const pipeWidth = OBSTACLE_WIDTH;
      const pipeEndHeight = 40; // Height of the pipe mouth
      
      // Top obstacle - pipe pointing down (simplified)
      ctx.fillStyle = '#1a1a2e'; // Simple solid color instead of gradient
      ctx.fillRect(obstacle.x, 0, pipeWidth, obstacle.topHeight - pipeEndHeight);
      
      // Top pipe mouth (pointing down) - Flappy Bird style with futuristic twist
      const mouthHeight = 20; // Shorter mouth like original
      const mouthY = obstacle.topHeight - mouthHeight;
      
      // Main pipe mouth body (wider than pipe)
      const mouthWidth = pipeWidth + 8;
      const mouthX = obstacle.x - 4;
      
      // Simple mouth color
      ctx.fillStyle = '#0f3460';
      ctx.fillRect(mouthX, mouthY, mouthWidth, mouthHeight);
      
      // Add mouth rim (like original Flappy Bird)
      ctx.strokeStyle = '#00ffff';
      ctx.lineWidth = 3;
      ctx.strokeRect(mouthX, mouthY, mouthWidth, mouthHeight);
      
      // Add inner shadow for depth
      ctx.fillStyle = '#0a0a1a';
      ctx.fillRect(mouthX + 2, mouthY + 2, mouthWidth - 4, mouthHeight - 4);
      
      // Add highlight on top edge
      ctx.strokeStyle = '#4a9eff';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(mouthX + 2, mouthY + 2);
      ctx.lineTo(mouthX + mouthWidth - 2, mouthY + 2);
      ctx.stroke();
      
      // Add side highlights
      ctx.beginPath();
      ctx.moveTo(mouthX + 2, mouthY + 2);
      ctx.lineTo(mouthX + 2, mouthY + mouthHeight - 2);
      ctx.stroke();
      
      ctx.beginPath();
      ctx.moveTo(mouthX + mouthWidth - 2, mouthY + 2);
      ctx.lineTo(mouthX + mouthWidth - 2, mouthY + mouthHeight - 2);
      ctx.stroke();
      
      // Bottom obstacle - pipe pointing up (simplified)
      ctx.fillStyle = '#1a1a2e';
      ctx.fillRect(obstacle.x, obstacle.bottomY + pipeEndHeight, pipeWidth, canvas.height - obstacle.bottomY - pipeEndHeight);
      
      // Bottom pipe mouth (pointing up) - Flappy Bird style with futuristic twist
      const bottomMouthHeight = 20; // Shorter mouth like original
      const bottomMouthY = obstacle.bottomY;
      
      // Main pipe mouth body (wider than pipe)
      const bottomMouthWidth = pipeWidth + 8;
      const bottomMouthX = obstacle.x - 4;
      
      // Simple bottom mouth color
      ctx.fillStyle = '#0f3460';
      ctx.fillRect(bottomMouthX, bottomMouthY, bottomMouthWidth, bottomMouthHeight);
      
      // Add mouth rim (like original Flappy Bird)
      ctx.strokeStyle = '#00ffff';
      ctx.lineWidth = 3;
      ctx.strokeRect(bottomMouthX, bottomMouthY, bottomMouthWidth, bottomMouthHeight);
      
      // Add inner shadow for depth
      ctx.fillStyle = '#0a0a1a';
      ctx.fillRect(bottomMouthX + 2, bottomMouthY + 2, bottomMouthWidth - 4, bottomMouthHeight - 4);
      
      // Add highlight on bottom edge
      ctx.strokeStyle = '#4a9eff';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(bottomMouthX + 2, bottomMouthY + bottomMouthHeight - 2);
      ctx.lineTo(bottomMouthX + bottomMouthWidth - 2, bottomMouthY + bottomMouthHeight - 2);
      ctx.stroke();
      
      // Add side highlights
      ctx.beginPath();
      ctx.moveTo(bottomMouthX + 2, bottomMouthY + 2);
      ctx.lineTo(bottomMouthX + 2, bottomMouthY + bottomMouthHeight - 2);
      ctx.stroke();
      
      ctx.beginPath();
      ctx.moveTo(bottomMouthX + bottomMouthWidth - 2, bottomMouthY + 2);
      ctx.lineTo(bottomMouthX + bottomMouthWidth - 2, bottomMouthY + bottomMouthHeight - 2);
      ctx.stroke();
      
      // Add futuristic details
      ctx.strokeStyle = '#00ffff';
      ctx.lineWidth = 2;
      
      // Vertical lines on pipe body
      for (let i = 0; i < obstacle.topHeight - pipeEndHeight; i += 30) {
        ctx.beginPath();
        ctx.moveTo(obstacle.x + 10, i);
        ctx.lineTo(obstacle.x + 10, i + 15);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(obstacle.x + pipeWidth - 10, i);
        ctx.lineTo(obstacle.x + pipeWidth - 10, i + 15);
        ctx.stroke();
      }
      
      for (let i = obstacle.bottomY + pipeEndHeight; i < canvas.height; i += 30) {
        ctx.beginPath();
        ctx.moveTo(obstacle.x + 10, i);
        ctx.lineTo(obstacle.x + 10, i + 15);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(obstacle.x + pipeWidth - 10, i);
        ctx.lineTo(obstacle.x + pipeWidth - 10, i + 15);
        ctx.stroke();
      }
      
      // Add glow effect
      ctx.shadowColor = '#00ffff';
      ctx.shadowBlur = 10;
      ctx.strokeStyle = '#00ffff';
      ctx.lineWidth = 1;
      ctx.strokeRect(obstacle.x, 0, pipeWidth, obstacle.topHeight - pipeEndHeight);
      ctx.strokeRect(obstacle.x, obstacle.bottomY + pipeEndHeight, pipeWidth, canvas.height - obstacle.bottomY - pipeEndHeight);
      ctx.shadowBlur = 0;
    });

    // Draw power-ups
    powerUps.forEach(powerUp => {
      if (!powerUp.collected) {
        const pulse = Math.sin(powerUp.animation) * 0.2 + 0.8;
        const size = 20 * pulse;
        
        ctx.save();
        ctx.globalAlpha = 0.8;
        
        // Draw power-up based on type
        switch (powerUp.type) {
          case 'magnet':
            ctx.fillStyle = '#00ff88';
            ctx.beginPath();
            ctx.arc(powerUp.x, powerUp.y, size/2, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#ffffff';
            ctx.font = '12px Arial';
            ctx.textAlign = 'center';
            ctx.fillText('M', powerUp.x, powerUp.y + 4);
            break;
          case 'multiplier':
            ctx.fillStyle = '#ffaa00';
            ctx.beginPath();
            ctx.arc(powerUp.x, powerUp.y, size/2, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#ffffff';
            ctx.font = '12px Arial';
            ctx.textAlign = 'center';
            ctx.fillText('2x', powerUp.x, powerUp.y + 4);
            break;
        }
        
        ctx.restore();
      }
    });

    // Draw particles
    particles.forEach(particle => {
      ctx.save();
      ctx.globalAlpha = particle.life;
      ctx.fillStyle = particle.color;
      ctx.beginPath();
      ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });

    // Draw bird (or dead sprite when game over)
    const birdSprite = gameState.isGameOver && images.deadge2 ? images.deadge2 : images.bird;
    if (birdSprite) {
      ctx.save();
      
      ctx.translate(bird.x + BIRD_SIZE/2, bird.y + BIRD_SIZE/2);
      // Don't rotate when dead
      if (!gameState.isGameOver) {
        ctx.rotate((bird.rotation * Math.PI) / 180);
      }
      
      // Enable image smoothing for better quality
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      
      ctx.drawImage(
        birdSprite,
        -BIRD_DISPLAY_SIZE/2, -BIRD_DISPLAY_SIZE/2, BIRD_DISPLAY_SIZE, BIRD_DISPLAY_SIZE
      );
      ctx.restore();
    } else {
      // Fallback: simple circle for bird
      ctx.save();
      
      ctx.translate(bird.x + BIRD_SIZE/2, bird.y + BIRD_SIZE/2);
      ctx.rotate((bird.rotation * Math.PI) / 180);
      
      // Draw bird as a yellow circle
      ctx.fillStyle = '#FFD700';
      ctx.beginPath();
      ctx.arc(0, 0, BIRD_DISPLAY_SIZE/2, 0, Math.PI * 2);
      ctx.fill();
      
      // Draw eye
      ctx.fillStyle = '#000000';
      ctx.beginPath();
      ctx.arc(8, -8, 5, 0, Math.PI * 2);
      ctx.fill();
      
      ctx.restore();
    }
  }, [images, backgroundOffset, obstacles, bird, imagesLoaded, powerUps, particles, activePowerUps, stars]);

  // Canvas dimensions are now fixed for consistent gameplay

  // Initialize stars when images are loaded and canvas is ready
  useEffect(() => {
    if (imagesLoaded) {
      const canvas = canvasRef.current;
      if (canvas) {
        // Use a small delay to ensure canvas is fully rendered
        const timer = setTimeout(() => {
          const initialStars = createStars(canvas.width, canvas.height);
          console.log('Initializing stars with canvas dimensions:', canvas.width, 'x', canvas.height);
          setStars(initialStars);
        }, 100);
        
        return () => clearTimeout(timer);
      }
    }
  }, [imagesLoaded, createStars]);

  // Render on every frame
  useEffect(() => {
    render();
  }, [render]);

  if (!imagesLoaded) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-900">
        <div className="text-white text-xl">Loading game...</div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-screen bg-gradient-to-b from-gray-900 via-blue-900 to-gray-900 overflow-hidden">
      {/* Background stars for side areas */}
      <div className="absolute inset-0 opacity-30">
        <div className="absolute top-10 left-4 w-1 h-1 bg-cyan-400 rounded-full animate-pulse"></div>
        <div className="absolute top-20 right-6 w-1 h-1 bg-white rounded-full animate-pulse" style={{animationDelay: '0.5s'}}></div>
        <div className="absolute top-32 left-8 w-1 h-1 bg-cyan-300 rounded-full animate-pulse" style={{animationDelay: '1s'}}></div>
        <div className="absolute top-40 right-12 w-1 h-1 bg-white rounded-full animate-pulse" style={{animationDelay: '1.5s'}}></div>
        <div className="absolute top-60 left-6 w-1 h-1 bg-cyan-400 rounded-full animate-pulse" style={{animationDelay: '2s'}}></div>
        <div className="absolute top-80 right-8 w-1 h-1 bg-white rounded-full animate-pulse" style={{animationDelay: '2.5s'}}></div>
        <div className="absolute top-96 left-12 w-1 h-1 bg-cyan-300 rounded-full animate-pulse" style={{animationDelay: '3s'}}></div>
        <div className="absolute top-64 right-4 w-1 h-1 bg-white rounded-full animate-pulse" style={{animationDelay: '3.5s'}}></div>
      </div>
      
      {/* Game Canvas - Fixed dimensions for proper scaling */}
      <canvas
        ref={canvasRef}
        width={800}
        height={1200}
        className="w-full h-full object-cover touch-none"
        onClick={handleJump}
        style={{
          touchAction: 'none',
          userSelect: 'none',
          WebkitUserSelect: 'none',
          MozUserSelect: 'none',
          msUserSelect: 'none',
          objectFit: 'cover',
          objectPosition: 'center'
        }}
      />

      {/* UI Overlay */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
        {/* Score - Always visible */}
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-50">
          <div className="text-white text-5xl font-bold drop-shadow-[0_0_15px_rgba(0,255,255,1)] bg-black bg-opacity-30 px-4 py-2 rounded-lg font-mono">
            {gameState.score.toString().padStart(3, '0')}
          </div>
        </div>

        {/* Game Over Screen */}
        {gameState.isGameOver && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black bg-opacity-50 pointer-events-auto">
            <AnimatedText animation="futuristic" variant="title" delay={200}>
              <div className="text-center mb-8">
                <h2 className="mb-4">GAME OVER</h2>
                <div className="text-2xl mb-2">Score: {gameState.score}</div>
                {gameState.score > gameState.highScore && (
                  <div className="text-cyan-400 text-lg animate-pulse">New Record!</div>
                )}
              </div>
            </AnimatedText>
            <AnimatedText animation="cyber" delay={600}>
              <div className="flex flex-wrap gap-4 justify-center">
                <button
                  onClick={handleJump}
                  className="px-8 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold rounded-lg transition-all duration-300 transform hover:scale-105 shadow-[0_0_20px_rgba(0,255,255,0.5)] hover:shadow-[0_0_30px_rgba(0,255,255,0.8)] border border-cyan-400"
                >
                  PLAY AGAIN
                </button>
                <button
                  onClick={() => setShowLeaderboard(!showLeaderboard)}
                  className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-400 hover:to-purple-500 text-white font-bold rounded-lg transition-all duration-300 transform hover:scale-105 shadow-[0_0_15px_rgba(59,130,246,0.5)] hover:shadow-[0_0_25px_rgba(59,130,246,0.8)] border border-blue-400"
                >
                  {showLeaderboard ? 'HIDE' : 'LEADERBOARD'}
                </button>
                <button
                  onClick={() => {
                    // Go back to home tab
                    if (onBackToHome) {
                      onBackToHome();
                    } else {
                      window.location.reload();
                    }
                  }}
                  className="px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-400 hover:to-pink-500 text-white font-bold rounded-lg transition-all duration-300 transform hover:scale-105 shadow-[0_0_15px_rgba(168,85,247,0.5)] hover:shadow-[0_0_25px_rgba(168,85,247,0.8)] border border-purple-400"
                >
                  HOME
                </button>
              </div>
            </AnimatedText>
          </div>
        )}

        {/* Start Screen */}
        {!gameState.isPlaying && !gameState.isGameOver && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black bg-opacity-50 pointer-events-auto">
            <AnimatedText animation="futuristic" variant="title" delay={0}>
              <div className="text-center mb-8">
                <h1 className="mb-4">
                  Flappy DOBI
                </h1>
                <div className="text-xl mb-8">Tap to start</div>
              </div>
            </AnimatedText>
            <AnimatedText animation="cyber" variant="button" delay={500}>
              <button
                onClick={handleJump}
                className="px-8 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold rounded-lg transition-all duration-300 transform hover:scale-105 shadow-[0_0_20px_rgba(0,255,255,0.5)] hover:shadow-[0_0_30px_rgba(0,255,255,0.8)] border border-cyan-400"
              >
                PLAY
              </button>
            </AnimatedText>
          </div>
        )}


        {/* Instructions */}
        {gameState.isPlaying && !gameState.isGameOver && (
          <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 text-center text-sm">
            <AnimatedText animation="neon" variant="button">
              Tap to jump
            </AnimatedText>
          </div>
        )}

        {/* Leaderboard Modal */}
        {showLeaderboard && (
          <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-75 pointer-events-auto z-50">
            <div className="bg-gray-900 rounded-lg p-6 max-w-md w-full mx-4 max-h-[80vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold text-white">Leaderboard</h3>
                <button
                  onClick={() => setShowLeaderboard(false)}
                  className="text-gray-400 hover:text-white text-2xl"
                >
                  ×
                </button>
              </div>
              <Leaderboard
                entries={leaderboard.entries}
                userRank={leaderboard.userRank}
                userBestScore={leaderboard.userBestScore}
                isLoading={isLoading}
                error={error}
                onShare={shareScore}
                currentScore={gameState.score}
              />
            </div>
          </div>
        )}

        
        {/* Particle Effects */}
        <ParticleEffect 
          active={showCelebration} 
          type="celebration" 
          x={200} 
          y={100} 
          count={30} 
        />
        
      </div>
    </div>
  );
};

export default FlappyBirdGame;
