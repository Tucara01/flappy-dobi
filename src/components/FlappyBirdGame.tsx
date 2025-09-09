"use client";

import React, { useRef, useEffect, useState, useCallback } from 'react';
import { sdk } from '@farcaster/miniapp-sdk';
import NumberDisplay from './ui/NumberDisplay';

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

const FlappyBirdGame: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gameLoopRef = useRef<number>();
  const lastTimeRef = useRef<number>(0);
  
  // Game state
  const [gameState, setGameState] = useState<GameState>({
    isPlaying: false,
    isGameOver: false,
    score: 0,
    highScore: 0
  });

  // Game objects
  const [bird, setBird] = useState<Bird>({
    x: 100,
    y: 250,
    velocity: 0,
    rotation: 0
  });

  const [obstacles, setObstacles] = useState<Obstacle[]>([]);
  const [backgroundOffset, setBackgroundOffset] = useState(0);

  // Game constants
  const GRAVITY = 0.5;
  const JUMP_FORCE = -8;
  const OBSTACLE_SPEED = 2;
  const OBSTACLE_GAP = 200;
  const OBSTACLE_WIDTH = 60;
  const BIRD_SIZE = 30;

  // Load images
  const [images, setImages] = useState<{[key: string]: HTMLImageElement}>({});
  const [imagesLoaded, setImagesLoaded] = useState(false);

  useEffect(() => {
    const loadImages = async () => {
      const imageNames = ['bird', 'obstacle', 'background', 'sky'];
      const loadedImages: {[key: string]: HTMLImageElement} = {};

      for (const name of imageNames) {
        const img = new Image();
        img.src = `/game/sprites/${name === 'bird' ? 'personaje' : name === 'obstacle' ? 'tubo v3' : name === 'background' ? 'background' : 'sky'}.png`;
        
        await new Promise((resolve) => {
          img.onload = resolve;
        });
        
        loadedImages[name] = img;
      }

      setImages(loadedImages);
      setImagesLoaded(true);
      
      // Tell Farcaster the app is ready after images are loaded
      await sdk.actions.ready();
    };

    loadImages();
  }, []);

  // Game loop
  const gameLoop = useCallback((currentTime: number) => {
    if (!gameState.isPlaying || gameState.isGameOver) return;

    const deltaTime = currentTime - lastTimeRef.current;
    lastTimeRef.current = currentTime;

    // Update bird physics
    setBird(prevBird => {
      const newVelocity = prevBird.velocity + GRAVITY;
      const newY = prevBird.y + newVelocity;
      const newRotation = Math.min(Math.max(newVelocity * 3, -30), 30);

      // Check ground collision
      if (newY > 400 - BIRD_SIZE) {
        setGameState(prev => ({ ...prev, isGameOver: true }));
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

      // Add new obstacles
      if (newObstacles.length === 0 || newObstacles[newObstacles.length - 1].x < 300) {
        const topHeight = Math.random() * 200 + 100;
        newObstacles.push({
          x: 400,
          topHeight,
          bottomY: topHeight + OBSTACLE_GAP,
          passed: false
        });
      }

      // Check scoring
      newObstacles.forEach(obstacle => {
        if (!obstacle.passed && obstacle.x + OBSTACLE_WIDTH < bird.x) {
          obstacle.passed = true;
          setGameState(prev => ({ ...prev, score: prev.score + 1 }));
        }
      });

      return newObstacles;
    });

    // Update background
    setBackgroundOffset(prev => (prev + 1) % 400);

    // Check collisions
    obstacles.forEach(obstacle => {
      if (
        bird.x + BIRD_SIZE > obstacle.x &&
        bird.x < obstacle.x + OBSTACLE_WIDTH &&
        (bird.y < obstacle.topHeight || bird.y + BIRD_SIZE > obstacle.bottomY)
      ) {
        setGameState(prev => ({ ...prev, isGameOver: true }));
      }
    });

    gameLoopRef.current = requestAnimationFrame(gameLoop);
  }, [gameState.isPlaying, gameState.isGameOver, bird.x, bird.y, obstacles]);

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
      setBird(prev => ({ ...prev, y: 250, velocity: 0, rotation: 0 }));
      setObstacles([]);
      setGameState(prev => ({ ...prev, score: 0 }));
    } else if (!gameState.isGameOver) {
      setBird(prev => ({ ...prev, velocity: JUMP_FORCE }));
    } else {
      // Restart game
      setGameState(prev => ({ 
        ...prev, 
        isPlaying: false, 
        isGameOver: false, 
        score: 0 
      }));
      setBird({ x: 100, y: 250, velocity: 0, rotation: 0 });
      setObstacles([]);
    }
  }, [gameState.isPlaying, gameState.isGameOver]);

  // Handle keyboard
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        e.preventDefault();
        handleJump();
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [handleJump]);

  // Render game
  const render = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !imagesLoaded) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw sky background
    if (images.sky) {
      ctx.drawImage(images.sky, 0, 0, canvas.width, canvas.height);
    }

    // Draw scrolling background
    if (images.background) {
      ctx.drawImage(images.background, -backgroundOffset, 0, canvas.width, canvas.height);
      ctx.drawImage(images.background, canvas.width - backgroundOffset, 0, canvas.width, canvas.height);
    }

    // Draw obstacles
    if (images.obstacle) {
      obstacles.forEach(obstacle => {
        // Top obstacle
        ctx.drawImage(
          images.obstacle,
          obstacle.x, 0, OBSTACLE_WIDTH, obstacle.topHeight
        );
        // Bottom obstacle
        ctx.drawImage(
          images.obstacle,
          obstacle.x, obstacle.bottomY, OBSTACLE_WIDTH, canvas.height - obstacle.bottomY
        );
      });
    }

    // Draw bird
    if (images.bird) {
      ctx.save();
      ctx.translate(bird.x + BIRD_SIZE/2, bird.y + BIRD_SIZE/2);
      ctx.rotate((bird.rotation * Math.PI) / 180);
      ctx.drawImage(
        images.bird,
        -BIRD_SIZE/2, -BIRD_SIZE/2, BIRD_SIZE, BIRD_SIZE
      );
      ctx.restore();
    }
  }, [images, backgroundOffset, obstacles, bird, imagesLoaded]);

  // Render on every frame
  useEffect(() => {
    render();
  }, [render]);

  if (!imagesLoaded) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-900">
        <div className="text-white text-xl">Cargando juego...</div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-screen bg-gray-900 overflow-hidden">
      {/* Game Canvas */}
      <canvas
        ref={canvasRef}
        width={400}
        height={600}
        className="w-full h-full object-cover"
        onClick={handleJump}
      />

      {/* UI Overlay */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
        {/* Score */}
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2">
          <NumberDisplay
            value={gameState.score}
            digits={3}
            size={50}
            color="#ffffff"
            glowColor="#00ff88"
          />
        </div>

        {/* High Score */}
        {gameState.highScore > 0 && (
          <div className="absolute top-16 left-1/2 transform -translate-x-1/2">
            <div className="text-white text-sm text-center">
              <div>HIGH SCORE</div>
              <NumberDisplay
                value={gameState.highScore}
                digits={3}
                size={30}
                color="#ffff00"
                glowColor="#ffaa00"
              />
            </div>
          </div>
        )}

        {/* Game Over Screen */}
        {gameState.isGameOver && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black bg-opacity-50 pointer-events-auto">
            <div className="text-center text-white mb-8">
              <h2 className="text-4xl font-bold mb-4">GAME OVER</h2>
              <div className="text-2xl mb-2">Score: {gameState.score}</div>
              {gameState.score > gameState.highScore && (
                <div className="text-yellow-400 text-lg">¡Nuevo récord!</div>
              )}
            </div>
            <button
              onClick={handleJump}
              className="px-8 py-3 bg-green-500 hover:bg-green-600 text-white font-bold rounded-lg transition-colors"
            >
              JUGAR DE NUEVO
            </button>
          </div>
        )}

        {/* Start Screen */}
        {!gameState.isPlaying && !gameState.isGameOver && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black bg-opacity-50 pointer-events-auto">
            <div className="text-center text-white mb-8">
              <h1 className="text-5xl font-bold mb-4">DOBI BIRD</h1>
              <div className="text-xl mb-8">Toca para empezar</div>
            </div>
            <button
              onClick={handleJump}
              className="px-8 py-3 bg-green-500 hover:bg-green-600 text-white font-bold rounded-lg transition-colors"
            >
              JUGAR
            </button>
          </div>
        )}

        {/* Instructions */}
        {gameState.isPlaying && !gameState.isGameOver && (
          <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 text-white text-center text-sm opacity-70">
            Toca para saltar
          </div>
        )}
      </div>
    </div>
  );
};

export default FlappyBirdGame;
