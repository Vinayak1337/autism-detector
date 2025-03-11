import React, { useEffect, useRef, useState } from 'react';

export interface Point {
  x: number;
  y: number;
}

export type TrackingPattern = 'square';

interface AnimatedBallProps {
  size: number;
  ballSize: number;
  duration: number;
  pattern: TrackingPattern;
  onPositionChange?: (position: Point) => void;
  onComplete?: () => void;
}

export const AnimatedBall: React.FC<AnimatedBallProps> = ({
  size,
  ballSize,
  duration,
  pattern,
  onPositionChange,
  onComplete,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState<Point>({ x: 0, y: 0 });
  const [timeRemaining, setTimeRemaining] = useState(duration);
  const requestRef = useRef<number | null>(null);
  const startTimeRef = useRef<number | null>(null);

  // Calculate ball position based on pattern and progress
  const calculatePosition = (progress: number, pattern: TrackingPattern): Point => {
    // For square pattern, we move left → down → right → up → left
    // We'll divide the progress into 4 segments (0-0.25, 0.25-0.5, 0.5-0.75, 0.75-1)

    const maxOffset = size - ballSize;

    if (progress < 0.25) {
      // Left to bottom-left (top-left to bottom-left)
      const segmentProgress = progress / 0.25;
      return { x: 0, y: maxOffset * segmentProgress };
    } else if (progress < 0.5) {
      // Bottom-left to bottom-right
      const segmentProgress = (progress - 0.25) / 0.25;
      return { x: maxOffset * segmentProgress, y: maxOffset };
    } else if (progress < 0.75) {
      // Bottom-right to top-right
      const segmentProgress = (progress - 0.5) / 0.25;
      return { x: maxOffset, y: maxOffset * (1 - segmentProgress) };
    } else {
      // Top-right to top-left
      const segmentProgress = (progress - 0.75) / 0.25;
      return { x: maxOffset * (1 - segmentProgress), y: 0 };
    }
  };

  // Animation loop
  useEffect(() => {
    const animate = (timestamp: number) => {
      if (startTimeRef.current === null) {
        startTimeRef.current = timestamp;
      }

      const elapsed = timestamp - startTimeRef.current;
      const progress = Math.min(elapsed / (duration * 1000), 1);
      const timeLeft = Math.max(0, Math.ceil(duration - elapsed / 1000));

      // Calculate new position
      const newPosition = calculatePosition(progress, pattern);
      setPosition(newPosition);
      setTimeRemaining(timeLeft);

      // Notify about position change
      if (onPositionChange) {
        onPositionChange(newPosition);
      }

      // Continue animation if not complete
      if (progress < 1) {
        requestRef.current = requestAnimationFrame(animate);
      } else {
        // Animation complete
        if (onComplete) {
          onComplete();
        }
      }
    };

    requestRef.current = requestAnimationFrame(animate);

    return () => {
      if (requestRef.current !== null) {
        cancelAnimationFrame(requestRef.current);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div
      className="relative bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden"
      style={{ width: size, height: size }}
      ref={containerRef}
    >
      {/* Timer display */}
      <div className="absolute top-2 right-2 bg-black bg-opacity-30 text-white px-2 py-1 rounded-md text-sm font-medium">
        {timeRemaining}s
      </div>

      {/* Animated ball */}
      <div
        className="absolute bg-blue-500 rounded-full transition-transform duration-100 ease-linear"
        style={{
          width: ballSize,
          height: ballSize,
          transform: `translate(${position.x}px, ${position.y}px)`,
        }}
        role="presentation"
        aria-hidden="true"
      />

      {/* Visual markers for the corners */}
      <div className="absolute top-0 left-0 w-2 h-2 bg-red-500 rounded-full" />
      <div className="absolute bottom-0 left-0 w-2 h-2 bg-red-500 rounded-full" />
      <div className="absolute bottom-0 right-0 w-2 h-2 bg-red-500 rounded-full" />
      <div className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full" />
    </div>
  );
};
