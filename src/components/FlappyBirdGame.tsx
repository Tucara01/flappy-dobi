"use client";

import React, { useRef, useEffect, useState, useCallback } from 'react';
import { sdk } from '@farcaster/miniapp-sdk';
import NumberDisplay from './ui/NumberDisplay';
import AnimatedText from './ui/AnimatedText';
import ParticleEffect from './ui/ParticleEffect';
import Leaderboard from './ui/Leaderboard';
import Achievements from './ui/Achievements';
import { useSound } from '../hooks/useSound';
import { useLeaderboard } from '../hooks/useLeaderboard';
import { useAchievements } from '../hooks/useAchievements';

interface GameState {
  isPlaying: boolean;
  isGameOver: boolean;
  score: number;
  highScore: number;
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

const FlappyBirdGame: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gameLoopRef = useRef<number | undefined>(undefined);
  const lastTimeRef = useRef<number>(0);
  
  // Sound effects
  const { playJumpSound, playScoreSound, playCollisionSound, playPowerUpSound, playGameOverSound } = useSound();
  
  // Leaderboard
  const { leaderboard, isLoading, error, submitScore, loadLeaderboard, shareScore } = useLeaderboard();
  
  // Achievements
  const { 
    achievements, 
    recentlyUnlocked, 
    checkScoreAchievements, 
    checkPowerUpAchievements, 
    checkSurvivalAchievements, 
    checkSpecialAchievements 
  } = useAchievements();
  
  // Game state
  const [gameState, setGameState] = useState<GameState>({
    isPlaying: false,
    isGameOver: false,
    score: 0,
    highScore: 0
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
  const [showAchievements, setShowAchievements] = useState(false);
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
  const OBSTACLE_GAP = 400; // 2x - Reduced gap between obstacles
  const OBSTACLE_WIDTH = 120; // 2x
  const BIRD_SIZE = 80; // 2.67x - Hitbox size (for collisions) - Made bigger
  const BIRD_DISPLAY_SIZE = 160; // 2.67x - Visual size (for rendering) - Made bigger

  // Load images
  const [images, setImages] = useState<{[key: string]: HTMLImageElement}>({});
  const [imagesLoaded, setImagesLoaded] = useState(false);

  // Particle system functions
  const createParticles = useCallback((x: number, y: number, count: number, color: string) => {
    const newParticles: Particle[] = [];
    for (let i = 0; i < count; i++) {
      newParticles.push({
        x: x + (Math.random() - 0.5) * 20,
        y: y + (Math.random() - 0.5) * 20,
        vx: (Math.random() - 0.5) * 4,
        vy: (Math.random() - 0.5) * 4,
        life: 1,
        maxLife: 1,
        color,
        size: Math.random() * 3 + 1
      });
    }
    setParticles(prev => [...prev, ...newParticles]);
  }, []);

  const updateParticles = useCallback(() => {
    setParticles(prev => 
      prev.map(particle => ({
        ...particle,
        x: particle.x + particle.vx,
        y: particle.y + particle.vy,
        vy: particle.vy + 0.1, // gravity
        life: particle.life - 0.02
      })).filter(particle => particle.life > 0)
    );
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
    const starCount = 100; // Number of stars
    
    for (let i = 0; i < starCount; i++) {
      newStars.push({
        x: Math.random() * canvasWidth,
        y: Math.random() * canvasHeight,
        size: Math.random() * 2 + 1, // Size between 1-3 pixels
        speed: Math.random() * 0.5 + 0.1, // Speed between 0.1-0.6
        opacity: Math.random() * 0.8 + 0.2 // Opacity between 0.2-1.0
      });
    }
    
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
    setStars(prev => 
      prev.map(star => {
        let newX = star.x - star.speed;
        // Reset star position when it goes off screen
        if (newX < -star.size) {
          newX = canvasWidth + star.size;
        }
        return {
          ...star,
          x: newX
        };
      })
    );
  }, []);

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
      const imageNames = ['bird', 'deadge2', 'obstacle', 'obstacle1', 'filler', 'sky'];
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
            case 'obstacle':
              imagePath = '/game/sprites/obstacle.png';
              break;
            case 'obstacle1':
              imagePath = '/game/sprites/obstacle1.png';
              break;
            case 'filler':
              imagePath = '/game/sprites/filler.png';
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
        }
        
        // Tell Farcaster the app is ready after images are loaded (if in Farcaster context)
        try {
          await sdk.actions.ready();
        } catch (err) {
          // If not in Farcaster context, continue without error
          console.log('Running in localhost mode - Farcaster SDK not available');
        }
      } catch (error) {
        console.error('Error loading images:', error);
        // Set images loaded anyway to prevent infinite loading
        setImagesLoaded(true);
      }
    };

    loadImages();
    loadLeaderboard();
  }, [loadLeaderboard]);

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
          }
          return newState;
        });
        
        // Check special achievements
        checkSpecialAchievements({
          score: gameState.score,
          powerUpsUsed: gameStats.powerUpsUsed,
          gameTime: Date.now() - gameStats.gameStartTime,
          obstaclesPassed: gameStats.obstaclesPassed
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
      let newObstacles = prevObstacles.map(obstacle => ({
        ...obstacle,
        x: obstacle.x - OBSTACLE_SPEED
      })).filter(obstacle => obstacle.x > -OBSTACLE_WIDTH);

      // Add new obstacles only after 2 seconds
      if (obstaclesEnabled && (newObstacles.length === 0 || newObstacles[newObstacles.length - 1].x < 400)) { // 2x
        const topHeight = Math.random() * 400 + 200; // 2x
        newObstacles.push({
          x: 800, // 2x
          topHeight,
          bottomY: topHeight + OBSTACLE_GAP,
          passed: false
        });

        // Occasionally add power-ups
        if (Math.random() < 0.3) {
          createPowerUp(800, topHeight + OBSTACLE_GAP / 2); // 2x
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
            return { ...prev, score: newScore };
          });
          
          // Update game stats
          setGameStats(prev => ({
            ...prev,
            obstaclesPassed: prev.obstaclesPassed + 1
          }));
          
          // Check achievements
          checkScoreAchievements(gameState.score + points);
          checkSurvivalAchievements(gameStats.obstaclesPassed + 1);
          
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
          }
          return newState;
        });
        
        // Check special achievements
        checkSpecialAchievements({
          score: gameState.score,
          powerUpsUsed: gameStats.powerUpsUsed,
          gameTime: Date.now() - gameStats.gameStartTime,
          obstaclesPassed: gameStats.obstaclesPassed
        });
        // Removed red splash effect on obstacle collision
        playCollisionSound();
      }
    });

    gameLoopRef.current = requestAnimationFrame(gameLoop);
  }, [gameState.isPlaying, gameState.isGameOver, bird.x, bird.y, obstacles, obstaclesEnabled, gameStats.gameStartTime, updateParticles, updatePowerUps, updateStars, checkPowerUpCollision, createParticles, createPowerUp, playGameOverSound, playScoreSound, playCollisionSound, submitScore]);

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
  const handleJump = useCallback(() => {
    if (!gameState.isPlaying) {
      setGameState(prev => ({ ...prev, isPlaying: true }));
      setBird(prev => ({ ...prev, y: 300, velocity: 0, rotation: 0 })); // 2x
      setObstacles([]);
      setGameState(prev => ({ ...prev, score: 0 }));
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
    }
  }, [gameState.isPlaying, gameState.isGameOver, bird.x, bird.y, createParticles, playJumpSound]);

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
    
    // Draw moving stars
    console.log('Rendering stars:', stars.length);
    stars.forEach(star => {
      ctx.save();
      ctx.globalAlpha = star.opacity;
      ctx.fillStyle = '#FFFFFF'; // White stars
      ctx.beginPath();
      ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
      ctx.fill();
      
      // Add a subtle glow effect for larger stars
      if (star.size > 2) {
        ctx.shadowColor = '#FFFFFF';
        ctx.shadowBlur = 3;
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.size * 0.5, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    });

    // Invisible ceiling - no visual rendering, only collision detection

    // Draw simple ground (no background image)
    const groundHeight = 80;
    const groundY = canvas.height - groundHeight;
    
    // Create a simple gradient ground
    const groundGradient = ctx.createLinearGradient(0, groundY, 0, canvas.height);
    groundGradient.addColorStop(0, '#8B4513'); // Brown
    groundGradient.addColorStop(0.5, '#A0522D'); // Saddle brown
    groundGradient.addColorStop(1, '#654321'); // Dark brown
    
    ctx.fillStyle = groundGradient;
    ctx.fillRect(0, groundY, canvas.width, groundHeight);
    
    // Grass texture lines removed - clean ground

    // Draw obstacles with new sprite system
    obstacles.forEach(obstacle => {
      // Enable image smoothing for better quality
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      
      // Top obstacle (pointing up) - use obstacle1.png
      if (images.obstacle1) {
        // Draw filler from top of canvas to the obstacle
        if (images.filler) {
          const fillerHeight = 50; // Height of each filler piece
          const obstacleHeight = 50; // Fixed height for main obstacle
          const fillerEndY = Math.max(0, obstacle.topHeight - obstacleHeight);
          
          for (let y = 0; y < fillerEndY; y += fillerHeight) {
            const currentFillerHeight = Math.min(fillerHeight, fillerEndY - y);
            ctx.drawImage(
              images.filler,
              obstacle.x, y, OBSTACLE_WIDTH, currentFillerHeight
            );
          }
        }
        
        // Draw the main top obstacle (pointing up) at the bottom of the top section
        const obstacleHeight = 50; // Fixed height for main obstacle
        ctx.drawImage(
          images.obstacle1,
          obstacle.x, obstacle.topHeight - obstacleHeight, OBSTACLE_WIDTH, obstacleHeight
        );
      }
      
      // Bottom obstacle (pointing down) - use obstacle.png
      if (images.obstacle) {
        const obstacleHeight = 50; // Fixed height for main obstacle
        
        // Draw the main bottom obstacle (pointing down) at the top of the bottom section
        ctx.drawImage(
          images.obstacle,
          obstacle.x, obstacle.bottomY, OBSTACLE_WIDTH, obstacleHeight
        );
        
        // Draw filler from the obstacle to the bottom of canvas
        if (images.filler) {
          const fillerHeight = 50; // Height of each filler piece
          for (let y = obstacle.bottomY + obstacleHeight; y < canvas.height; y += fillerHeight) {
            const currentFillerHeight = Math.min(fillerHeight, canvas.height - y);
            ctx.drawImage(
              images.filler,
              obstacle.x, y, OBSTACLE_WIDTH, currentFillerHeight
            );
          }
        }
      }
    });
    
    // Fallback: simple rectangles for obstacles if images not loaded
    if (!images.obstacle && !images.obstacle1) {
      ctx.fillStyle = '#228B22';
      obstacles.forEach(obstacle => {
        // Top obstacle
        ctx.fillRect(obstacle.x, 0, OBSTACLE_WIDTH, obstacle.topHeight);
        // Bottom obstacle
        ctx.fillRect(obstacle.x, obstacle.bottomY, OBSTACLE_WIDTH, canvas.height - obstacle.bottomY);
      });
    }

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
    <div className="relative w-full h-screen bg-gray-900 overflow-hidden">
      {/* Game Canvas - Optimized for Farcaster Mini Apps */}
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
          msUserSelect: 'none'
        }}
      />

      {/* UI Overlay */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
        {/* Score - Always visible during gameplay */}
        {gameState.isPlaying && !gameState.isGameOver && (
          <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-10">
            <NumberDisplay
              value={gameState.score}
              digits={3}
              size={50}
              color="#ffffff"
              glowColor="#00ff88"
            />
          </div>
        )}

        {/* Game Over Screen */}
        {gameState.isGameOver && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black bg-opacity-50 pointer-events-auto">
            <AnimatedText animation="bounce" delay={200}>
              <div className="text-center text-white mb-8">
                <h2 className="text-4xl font-bold mb-4">GAME OVER</h2>
                <div className="text-2xl mb-2">Score: {gameState.score}</div>
                {gameState.score > gameState.highScore && (
                  <div className="text-yellow-400 text-lg animate-pulse">¡Nuevo récord!</div>
                )}
              </div>
            </AnimatedText>
            <AnimatedText animation="slideUp" delay={600}>
              <div className="flex flex-wrap gap-4 justify-center">
                <button
                  onClick={handleJump}
                  className="px-8 py-3 bg-green-500 hover:bg-green-600 text-white font-bold rounded-lg transition-colors transform hover:scale-105"
                >
                  PLAY AGAIN
                </button>
                <button
                  onClick={() => setShowLeaderboard(!showLeaderboard)}
                  className="px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white font-bold rounded-lg transition-colors transform hover:scale-105"
                >
                  {showLeaderboard ? 'OCULTAR' : 'LEADERBOARD'}
                </button>
                <button
                  onClick={() => setShowAchievements(!showAchievements)}
                  className="px-6 py-3 bg-yellow-500 hover:bg-yellow-600 text-white font-bold rounded-lg transition-colors transform hover:scale-105"
                >
                  {showAchievements ? 'HIDE' : 'ACHIEVEMENTS'}
                </button>
                <button
                  onClick={() => shareScore(gameState.score)}
                  className="px-6 py-3 bg-purple-500 hover:bg-purple-600 text-white font-bold rounded-lg transition-colors transform hover:scale-105"
                >
                  SHARE
                </button>
              </div>
            </AnimatedText>
          </div>
        )}

        {/* Start Screen */}
        {!gameState.isPlaying && !gameState.isGameOver && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black bg-opacity-50 pointer-events-auto">
            <AnimatedText animation="bounce" delay={0}>
              <div className="text-center text-white mb-8">
                <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-green-400 to-blue-500 bg-clip-text text-transparent">
                  Flappy DOBI
                </h1>
                <div className="text-xl mb-8 animate-pulse">Tap to start</div>
              </div>
            </AnimatedText>
            <AnimatedText animation="slideUp" delay={500}>
              <button
                onClick={handleJump}
                className="px-8 py-3 bg-green-500 hover:bg-green-600 text-white font-bold rounded-lg transition-colors transform hover:scale-105 shadow-lg hover:shadow-xl"
              >
                PLAY
              </button>
            </AnimatedText>
          </div>
        )}


        {/* Instructions */}
        {gameState.isPlaying && !gameState.isGameOver && (
          <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 text-white text-center text-sm opacity-70">
            Tap to jump
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

        {/* Achievements Modal */}
        {showAchievements && (
          <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-75 pointer-events-auto z-50">
            <div className="bg-gray-900 rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
              <Achievements
                achievements={achievements}
                recentlyUnlocked={recentlyUnlocked}
                onClose={() => setShowAchievements(false)}
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
