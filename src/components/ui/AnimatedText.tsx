import React, { useEffect, useState } from 'react';

interface AnimatedTextProps {
  children: React.ReactNode;
  className?: string;
  animation?: 'fadeIn' | 'slideUp' | 'bounce' | 'pulse' | 'glow';
  delay?: number;
  duration?: number;
}

const AnimatedText: React.FC<AnimatedTextProps> = ({
  children,
  className = '',
  animation = 'fadeIn',
  delay = 0,
  duration = 500
}) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, delay);

    return () => clearTimeout(timer);
  }, [delay]);

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
      default:
        return `${baseClasses} opacity-100`;
    }
  };

  return (
    <div 
      className={`${getAnimationClasses()} ${className}`}
      style={{ transitionDuration: `${duration}ms` }}
    >
      {children}
    </div>
  );
};

export default AnimatedText;
