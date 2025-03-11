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
  pattern?: TrackingPattern;
  onPositionChange?: (position: Point) => void;
  onComplete?: () => void;
}

export const AnimatedBall: React.FC<AnimatedBallProps> = ({
  size,
  ballSize,
  duration,
  pattern = 'square',
  onPositionChange,
  onComplete,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState<Point>({ x: 0, y: 0 });
  const [timeRemaining, setTimeRemaining] = useState(duration);
  const requestRef = useRef<number | null>(null);
  const startTimeRef = useRef<number | null>(null);
  const lastTimestampRef = useRef<number | null>(null);

  // Calculate ball position based on pattern and progress
  const calculatePosition = (progress: number): Point => {
    // For square pattern, we move in a square: top-left → bottom-left → bottom-right → top-right → top-left
    // We'll divide the progress into 4 segments (0-0.25, 0.25-0.5, 0.5-0.75, 0.75-1)
    const maxOffset = size - ballSize;

    if (progress <= 0.25) {
      // Top-left to bottom-left
      const segmentProgress = progress / 0.25;
      return { x: 0, y: maxOffset * segmentProgress };
    } else if (progress <= 0.5) {
      // Bottom-left to bottom-right
      const segmentProgress = (progress - 0.25) / 0.25;
      return { x: maxOffset * segmentProgress, y: maxOffset };
    } else if (progress <= 0.75) {
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
        lastTimestampRef.current = timestamp;
      }

      const elapsed = timestamp - startTimeRef.current;
      const progress = Math.min(elapsed / (duration * 1000), 1);
      const remainingTime = Math.max(0, Math.ceil(duration - elapsed / 1000));

      // Update time remaining every second
      if (lastTimestampRef.current && timestamp - lastTimestampRef.current >= 1000) {
        setTimeRemaining(remainingTime);
        lastTimestampRef.current = timestamp;
      }

      // Calculate new position
      const newPosition = calculatePosition(progress);
      setPosition(newPosition);

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

    // Start animation loop
    requestRef.current = requestAnimationFrame(animate);

    // Cleanup on unmount
    return () => {
      if (requestRef.current !== null) {
        cancelAnimationFrame(requestRef.current);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ballSize, duration, onComplete, onPositionChange, size]);

  return (
    <div
      className="relative bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden border border-gray-300"
      style={{ width: size, height: size }}
      ref={containerRef}
    >
      {/* Timer display */}
      <div className="absolute top-2 right-2 bg-black bg-opacity-50 text-white px-2 py-1 rounded-md text-sm font-bold">
        {timeRemaining}s
      </div>

      {/* Animated ball */}
      <div
        className="absolute bg-blue-600 rounded-full shadow-md transform -translate-x-1/2 -translate-y-1/2"
        style={{
          width: ballSize,
          height: ballSize,
          left: position.x,
          top: position.y,
          transition: 'left 50ms linear, top 50ms linear',
        }}
        role="presentation"
        aria-hidden="true"
      />

      {/* Visual markers for the corners */}
      <div className="absolute top-0 left-0 w-3 h-3 bg-red-500 rounded-full" />
      <div className="absolute bottom-0 left-0 w-3 h-3 bg-red-500 rounded-full" />
      <div className="absolute bottom-0 right-0 w-3 h-3 bg-red-500 rounded-full" />
      <div className="absolute top-0 right-0 w-3 h-3 bg-red-500 rounded-full" />

      {/* Path visualization */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none">
        <path
          d={`M ${ballSize / 2},${ballSize / 2} L ${ballSize / 2},${size - ballSize / 2} L ${size - ballSize / 2},${size - ballSize / 2} L ${size - ballSize / 2},${ballSize / 2} Z`}
          fill="none"
          stroke="rgba(209, 213, 219, 0.5)"
          strokeWidth="2"
          strokeDasharray="5,5"
        />
      </svg>
    </div>
  );
};
