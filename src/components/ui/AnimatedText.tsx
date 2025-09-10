import React, { useEffect, useState } from 'react';

interface AnimatedTextProps {
  children: React.ReactNode;
  className?: string;
  animation?: 'fadeIn' | 'slideUp' | 'bounce' | 'pulse' | 'glow' | 'futuristic' | 'neon' | 'cyber';
  delay?: number;
  duration?: number;
  variant?: 'default' | 'title' | 'score' | 'button';
}

const AnimatedText: React.FC<AnimatedTextProps> = ({
  children,
  className = '',
  animation = 'fadeIn',
  delay = 0,
  duration = 500,
  variant = 'default'
}) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, delay);

    return () => clearTimeout(timer);
  }, [delay]);

  const getVariantStyles = () => {
    switch (variant) {
      case 'title':
        return 'font-bold text-4xl md:text-6xl bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-600 bg-clip-text text-transparent drop-shadow-[0_0_20px_rgba(0,255,255,0.5)]';
      case 'score':
        return 'font-mono text-2xl md:text-4xl text-white drop-shadow-[0_0_10px_rgba(0,255,255,0.8)] font-bold tracking-wider';
      case 'button':
        return 'font-bold text-lg md:text-xl text-cyan-300 drop-shadow-[0_0_8px_rgba(0,255,255,0.6)] hover:text-cyan-100 transition-colors duration-300';
      default:
        return 'text-white drop-shadow-[0_0_5px_rgba(0,255,255,0.4)]';
    }
  };

  const getAnimationClasses = () => {
    const baseClasses = 'transition-all duration-500 ease-out';
    
    if (!isVisible) {
      switch (animation) {
        case 'fadeIn':
          return `${baseClasses} opacity-0`;
        case 'slideUp':
          return `${baseClasses} opacity-0 transform translate-y-4`;
        case 'bounce':
          return `${baseClasses} opacity-0 transform scale-50`;
        case 'pulse':
          return `${baseClasses} opacity-0`;
        case 'glow':
          return `${baseClasses} opacity-0`;
        case 'futuristic':
          return `${baseClasses} opacity-0 transform translate-y-8 scale-90 blur-sm`;
        case 'neon':
          return `${baseClasses} opacity-0 transform scale-75`;
        case 'cyber':
          return `${baseClasses} opacity-0 transform translate-x-4 skew-x-12`;
        default:
          return `${baseClasses} opacity-0`;
      }
    }

    switch (animation) {
      case 'fadeIn':
        return `${baseClasses} opacity-100`;
      case 'slideUp':
        return `${baseClasses} opacity-100 transform translate-y-0`;
      case 'bounce':
        return `${baseClasses} opacity-100 transform scale-100 animate-bounce`;
      case 'pulse':
        return `${baseClasses} opacity-100 animate-pulse`;
      case 'glow':
        return `${baseClasses} opacity-100 drop-shadow-lg`;
      case 'futuristic':
        return `${baseClasses} opacity-100 transform translate-y-0 scale-100 blur-0 animate-pulse`;
      case 'neon':
        return `${baseClasses} opacity-100 transform scale-100 drop-shadow-[0_0_20px_rgba(0,255,255,0.8)] animate-pulse`;
      case 'cyber':
        return `${baseClasses} opacity-100 transform translate-x-0 skew-x-0 drop-shadow-[0_0_15px_rgba(0,255,255,0.6)]`;
      default:
        return `${baseClasses} opacity-100`;
    }
  };

  return (
    <div 
      className={`${getAnimationClasses()} ${getVariantStyles()} ${className}`}
      style={{ transitionDuration: `${duration}ms` }}
    >
      {children}
    </div>
  );
};

export default AnimatedText;
