import React, { useState, useEffect, useRef, useCallback } from 'react';

// Types for the eye tracking component
export interface Point {
  x: number;
  y: number;
}

export type TrackingPattern = 'square' | 'circle' | 'horizontal' | 'vertical' | 'random';

interface EyeTrackingBoxProps {
  size: number;
  ballSize: number;
  duration: number; // Duration in seconds
  pattern?: TrackingPattern;
  onComplete?: () => void;
  onPositionChange?: (position: Point) => void;
  className?: string;
}

export const EyeTrackingBox: React.FC<EyeTrackingBoxProps> = ({
  size,
  ballSize,
  duration,
  pattern = 'square',
  onComplete,
  onPositionChange,
  className = '',
}) => {
  const [ballPosition, setBallPosition] = useState<Point>({ x: 0, y: 0 });
  const [isRunning, setIsRunning] = useState(true);
  const [remainingTime, setRemainingTime] = useState(duration);

  const animationRef = useRef<number | null>(null);
  const boxRef = useRef<HTMLDivElement>(null);

  // Calculate position based on pattern and progress - wrapped in useCallback
  const calculatePosition = useCallback(
    (progress: number): Point => {
      let newX = 0;
      let newY = 0;

      switch (pattern) {
        case 'square':
          // Square pattern: left → down → right → up → left
          const segment = Math.floor(progress * 4); // 0, 1, 2, or 3
          const segmentProgress = (progress * 4) % 1; // Progress within segment (0 to 1)

          switch (segment) {
            case 0: // Left to bottom
              newX = 0;
              newY = segmentProgress * size;
              break;
            case 1: // Bottom to right
              newX = segmentProgress * size;
              newY = size;
              break;
            case 2: // Right to top
              newX = size;
              newY = size - segmentProgress * size;
              break;
            case 3: // Top to left
              newX = size - segmentProgress * size;
              newY = 0;
              break;
          }
          break;

        case 'circle':
          // Circle pattern using sine and cosine
          const angle = progress * 2 * Math.PI;
          const radius = size / 2 - ballSize / 2;
          newX = size / 2 + radius * Math.cos(angle);
          newY = size / 2 + radius * Math.sin(angle);
          break;

        case 'horizontal':
          // Left to right and back
          const doubleProgress = progress * 2;
          if (doubleProgress <= 1) {
            newX = doubleProgress * size;
          } else {
            newX = (2 - doubleProgress) * size;
          }
          newY = size / 2;
          break;

        case 'vertical':
          // Top to bottom and back
          const doubleProgressV = progress * 2;
          if (doubleProgressV <= 1) {
            newY = doubleProgressV * size;
          } else {
            newY = (2 - doubleProgressV) * size;
          }
          newX = size / 2;
          break;

        case 'random':
          // Generate some semi-random but smooth movement
          // Using parametric equations with multiple sine waves for more unpredictable movement
          const t = progress * 10; // Scale time for more variations
          newX = (0.5 + 0.4 * Math.sin(t) * Math.cos(2.3 * t)) * size;
          newY = (0.5 + 0.4 * Math.sin(1.5 * t) * Math.cos(0.8 * t)) * size;
          break;
      }

      return { x: newX, y: newY };
    },
    [pattern, size, ballSize]
  );

  // Animation loop
  useEffect(() => {
    if (!isRunning) return;

    const startTime = Date.now();
    const durationMs = duration * 1000;

    const animate = () => {
      const currentTime = Date.now();
      const elapsedTime = currentTime - startTime;
      const progress = Math.min(elapsedTime / durationMs, 1);

      // Calculate remaining time
      const newRemainingTime = Math.ceil((durationMs - elapsedTime) / 1000);
      if (newRemainingTime !== remainingTime) {
        setRemainingTime(newRemainingTime);
      }

      // Calculate new position
      const newPosition = calculatePosition(progress);
      setBallPosition(newPosition);

      // Call the position change callback
      if (onPositionChange) {
        onPositionChange(newPosition);
      }

      if (progress < 1) {
        animationRef.current = requestAnimationFrame(animate);
      } else {
        setIsRunning(false);
        if (onComplete) {
          onComplete();
        }
      }
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current !== null) {
        cancelAnimationFrame(animationRef.current);
        animationRef.current = null;
      }
    };
  }, [isRunning, duration, calculatePosition, onComplete, onPositionChange, remainingTime]);

  // Pause and resume functionality
  const pause = () => {
    setIsRunning(false);
  };

  const resume = () => {
    setIsRunning(true);
  };

  return (
    <div className="flex flex-col items-center">
      <div className="mb-4 text-center">
        <p className="text-gray-600 dark:text-gray-300">Time remaining: {remainingTime} seconds</p>
      </div>

      <div
        ref={boxRef}
        className={`relative bg-gray-100 dark:bg-gray-700 border-2 border-gray-300 dark:border-gray-600 rounded-lg ${className}`}
        style={{ width: `${size}px`, height: `${size}px` }}
      >
        {/* Animated ball */}
        <div
          className="absolute bg-blue-500 rounded-full transition-all duration-100"
          style={{
            width: `${ballSize}px`,
            height: `${ballSize}px`,
            left: `${ballPosition.x}px`,
            top: `${ballPosition.y}px`,
            transform: `translate(-${ballSize / 2}px, -${ballSize / 2}px)`,
          }}
        />
      </div>

      <div className="mt-4 flex space-x-4">
        {isRunning ? (
          <button
            onClick={pause}
            className="px-4 py-2 bg-yellow-500 text-white rounded-md hover:bg-yellow-600 transition-colors"
          >
            Pause
          </button>
        ) : (
          <button
            onClick={resume}
            className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 transition-colors"
          >
            Resume
          </button>
        )}
      </div>
    </div>
  );
};
