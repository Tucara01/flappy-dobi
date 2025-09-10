"use client";

import React from 'react';

interface NumberDisplayProps {
  value: number;
  digits?: number;
  size?: number;
  color?: string;
  glowColor?: string;
  className?: string;
}

// Definición de los segmentos para cada dígito (7-segment display)
const digitSegments: { [key: string]: string[] } = {
  '0': ['a', 'b', 'c', 'd', 'e', 'f'],
  '1': ['b', 'c'],
  '2': ['a', 'b', 'g', 'e', 'd'],
  '3': ['a', 'b', 'g', 'c', 'd'],
  '4': ['f', 'g', 'b', 'c'],
  '5': ['a', 'f', 'g', 'c', 'd'],
  '6': ['a', 'f', 'g', 'e', 'd', 'c'],
  '7': ['a', 'b', 'c'],
  '8': ['a', 'b', 'c', 'd', 'e', 'f', 'g'],
  '9': ['a', 'b', 'c', 'd', 'f', 'g']
};

const NumberDisplay: React.FC<NumberDisplayProps> = ({
  value,
  digits = 3,
  size = 40,
  color = '#00ff00',
  glowColor = '#00ff88',
  className = ''
}) => {
  const valueStr = value.toString().padStart(digits, '0');
  const digitWidth = size * 0.6;
  const digitHeight = size;
  const segmentWidth = size * 0.08;
  const segmentLength = size * 0.4;
  const spacing = size * 0.1;

  // Función para crear un segmento SVG
  const createSegment = (segment: string, x: number, y: number) => {
    const segments: { [key: string]: { x1: number; y1: number; x2: number; y2: number } } = {
      'a': { x1: x + segmentWidth, y1: y, x2: x + segmentLength, y2: y },
      'b': { x1: x + segmentLength, y1: y + segmentWidth, x2: x + segmentLength, y2: y + segmentLength },
      'c': { x1: x + segmentLength, y1: y + segmentLength + segmentWidth, x2: x + segmentLength, y2: y + digitHeight - segmentWidth },
      'd': { x1: x + segmentWidth, y1: y + digitHeight, x2: x + segmentLength, y2: y + digitHeight },
      'e': { x1: x, y1: y + segmentLength + segmentWidth, x2: x, y2: y + digitHeight - segmentWidth },
      'f': { x1: x, y1: y + segmentWidth, x2: x, y2: y + segmentLength },
      'g': { x1: x + segmentWidth, y1: y + digitHeight / 2, x2: x + segmentLength, y2: y + digitHeight / 2 }
    };

    const coords = segments[segment];
    if (!coords) return null;

    return (
      <line
        key={segment}
        x1={coords.x1}
        y1={coords.y1}
        x2={coords.x2}
        y2={coords.y2}
        stroke={color}
        strokeWidth={segmentWidth}
        strokeLinecap="round"
      />
    );
  };

  // Función para crear un dígito completo
  const createDigit = (digit: string, index: number) => {
    const x = index * (digitWidth + spacing);
    const y = 0;
    const activeSegments = digitSegments[digit] || [];

    return (
      <g key={index}>
        {/* Segmentos activos */}
        {activeSegments.map(segment => createSegment(segment, x, y))}
      </g>
    );
  };

  return (
    <div className={`inline-block ${className}`}>
      <svg
        width={digits * (digitWidth + spacing) - spacing}
        height={digitHeight}
        viewBox={`0 0 ${digits * (digitWidth + spacing) - spacing} ${digitHeight}`}
        className="drop-shadow-lg"
      >
        {valueStr.split('').map((digit, index) => createDigit(digit, index))}
      </svg>
    </div>
  );
};

export default NumberDisplay;
