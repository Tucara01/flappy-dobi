import React, { useEffect, useRef, useState } from 'react';

interface Particle {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
  color: string;
}

interface ParticleEffectProps {
  active: boolean;
  type: 'celebration' | 'explosion' | 'sparkle';
  x?: number;
  y?: number;
  count?: number;
}

const ParticleEffect: React.FC<ParticleEffectProps> = ({
  active,
  type,
  x = 0,
  y = 0,
  count = 20
}) => {
  const [particles, setParticles] = useState<Particle[]>([]);
  const animationRef = useRef<number | undefined>(undefined);

  useEffect(() => {
    if (active) {
      const newParticles: Particle[] = [];
      
      for (let i = 0; i < count; i++) {
        const angle = (Math.PI * 2 * i) / count;
        const speed = type === 'explosion' ? Math.random() * 8 + 2 : Math.random() * 4 + 1;
        
        newParticles.push({
          id: i,
          x: x + (Math.random() - 0.5) * 20,
          y: y + (Math.random() - 0.5) * 20,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          life: 1,
          maxLife: 1,
          size: Math.random() * 4 + 2,
          color: getParticleColor(type)
        });
      }
      
      setParticles(newParticles);
    }
  }, [active, type, x, y, count]);

  const getParticleColor = (type: string) => {
    switch (type) {
      case 'celebration':
        return `hsl(${Math.random() * 60 + 300}, 70%, 60%)`;
      case 'explosion':
        return `hsl(${Math.random() * 30 + 0}, 70%, 60%)`;
      case 'sparkle':
        return `hsl(${Math.random() * 60 + 45}, 70%, 60%)`;
      default:
        return '#ffffff';
    }
  };

  useEffect(() => {
    if (particles.length === 0) return;

    const animate = () => {
      setParticles(prevParticles => {
        const updated = prevParticles.map(particle => ({
          ...particle,
          x: particle.x + particle.vx,
          y: particle.y + particle.vy,
          vy: particle.vy + 0.1, // gravity
          life: particle.life - 0.02
        })).filter(particle => particle.life > 0);

        if (updated.length === 0) {
          return [];
        }

        animationRef.current = requestAnimationFrame(animate);
        return updated;
      });
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [particles.length]);

  if (particles.length === 0) return null;

  return (
    <div className="absolute inset-0 pointer-events-none">
      {particles.map(particle => (
        <div
          key={particle.id}
          className="absolute rounded-full"
          style={{
            left: particle.x,
            top: particle.y,
            width: particle.size,
            height: particle.size,
            backgroundColor: particle.color,
            opacity: particle.life,
            transform: `scale(${particle.life})`
          }}
        />
      ))}
    </div>
  );
};

export default ParticleEffect;
