'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useEyeTrackingStore } from './store';

// Point interface for positions
export interface Point {
  x: number;
  y: number;
}

// Ball path definitions for the square pattern
const MOVEMENT_DURATION = 60000; // 60 seconds total
const SQUARE_SIZE = 60; // Percentage of the container size

interface AnimatedBallProps {
  onComplete?: () => void;
  onPositionUpdate?: (position: Point) => void; // New prop to report position updates
  size?: number; // Ball size in pixels
  color?: string;
  showPath?: boolean; // Whether to show the path
  showLabels?: boolean; // Whether to show position labels
}

export const AnimatedBall: React.FC<AnimatedBallProps> = ({
  onComplete,
  onPositionUpdate,
  size = 30,
  color = '#4F46E5', // Indigo-600
  showPath = true,
  showLabels = true,
}) => {
  const testPhase = useEyeTrackingStore((state) => state.testPhase);
  const setTestPhase = useEyeTrackingStore((state) => state.setTestPhase);
  const endTest = useEyeTrackingStore((state) => state.endTest);

  const [position, setPosition] = useState<Point>({ x: 0, y: 0 });
  // Use refs instead of state to avoid re-renders during animation
  const animationStartTimeRef = useRef<number | null>(null);
  const progressRef = useRef<number>(0);
  const [progressForUI, setProgressForUI] = useState(0);
  const requestRef = useRef<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const lastFrameTimeRef = useRef<number | null>(null);

  // Calculate the square points based on container dimensions and SQUARE_SIZE
  const calculateSquarePoints = (): Point[] => {
    if (!containerRef.current) return [];

    const containerWidth = containerRef.current.clientWidth;
    const containerHeight = containerRef.current.clientHeight;

    // Calculate the square dimensions as a percentage of container
    const squareWidth = (containerWidth * SQUARE_SIZE) / 100;
    const squareHeight = (containerHeight * SQUARE_SIZE) / 100;

    // Position the square in the center of the container
    const offsetX = (containerWidth - squareWidth) / 2;
    const offsetY = (containerHeight - squareHeight) / 2;

    // Create the square points - Start at the left point and move clockwise
    // Left → Down → Right → Up → Left
    return [
      { x: offsetX, y: offsetY + squareHeight / 2 }, // Left middle
      { x: offsetX + squareWidth / 2, y: offsetY + squareHeight }, // Bottom middle
      { x: offsetX + squareWidth, y: offsetY + squareHeight / 2 }, // Right middle
      { x: offsetX + squareWidth / 2, y: offsetY }, // Top middle
      { x: offsetX, y: offsetY + squareHeight / 2 }, // Back to left middle
    ];
  };

  // Animation function
  const animate = (timestamp: number) => {
    // Guard against infinite recursion in test environment
    if (process.env.NODE_ENV === 'test' && lastFrameTimeRef.current === timestamp) {
      return;
    }

    // Set last frame time to detect recursion
    lastFrameTimeRef.current = timestamp;

    // Initialize animation start time using ref
    if (animationStartTimeRef.current === null) {
      animationStartTimeRef.current = timestamp;
    }

    const elapsedTime = timestamp - (animationStartTimeRef.current || timestamp);
    const progress = Math.min(elapsedTime / MOVEMENT_DURATION, 1);
    progressRef.current = progress;

    // Update progress state for UI less frequently - throttle to only update if significant change
    // Using a ref to track last update time to prevent infinite loop
    const lastProgressUpdate = progressRef.current;
    if (
      Math.floor(progress * 100) !== Math.floor(progressForUI * 100) &&
      lastProgressUpdate !== progress
    ) {
      // Use setTimeout to break the synchronous execution cycle
      requestAnimationFrame(() => {
        setProgressForUI(progress);
      });
    }

    if (progress >= 1) {
      // Animation complete
      if (onComplete) {
        onComplete();
      }
      endTest();

      // Cancel animation
      if (requestRef.current) {
        cancelAnimationFrame(requestRef.current);
        requestRef.current = null;
      }
      return;
    }

    const squarePoints = calculateSquarePoints();
    if (squarePoints.length === 0) {
      requestRef.current = requestAnimationFrame(animate);
      return;
    }

    // Determine which segment of the square we're on
    const segmentCount = squarePoints.length - 1; // Number of line segments in the square
    const totalSegmentProgress = progress * segmentCount;
    const segmentIndex = Math.min(Math.floor(totalSegmentProgress), segmentCount - 1);
    const segmentProgress = totalSegmentProgress - segmentIndex;

    if (segmentIndex < squarePoints.length - 1) {
      const startPoint = squarePoints[segmentIndex];
      const endPoint = squarePoints[segmentIndex + 1];

      // Interpolate between points
      const newX = startPoint.x + (endPoint.x - startPoint.x) * segmentProgress;
      const newY = startPoint.y + (endPoint.y - startPoint.y) * segmentProgress;

      const newPosition = { x: newX, y: newY };
      setPosition(newPosition);

      // Call the position update callback
      if (onPositionUpdate) {
        // Convert to percentage coordinates
        const containerWidth = containerRef.current?.clientWidth || 1;
        const containerHeight = containerRef.current?.clientHeight || 1;
        const percentX = (newX / containerWidth) * 100;
        const percentY = (newY / containerHeight) * 100;
        onPositionUpdate({ x: percentX, y: percentY });
      }
    }

    // Only request next frame if we're not in the test environment or if this is the first frame
    if (process.env.NODE_ENV !== 'test' || !requestRef.current) {
      requestRef.current = requestAnimationFrame(animate);
    }
  };

  // Start animation when in testing phase
  useEffect(() => {
    if (testPhase === 'testing') {
      animationStartTimeRef.current = null;
      lastFrameTimeRef.current = null;
      setProgressForUI(0);
      requestRef.current = requestAnimationFrame(animate);
    } else if (requestRef.current) {
      // Clean up animation if not in testing phase
      cancelAnimationFrame(requestRef.current);
      requestRef.current = null;
    }

    return () => {
      if (requestRef.current) {
        cancelAnimationFrame(requestRef.current);
        requestRef.current = null;
      }
    };
  }, [testPhase]);

  // Return early if not in testing phase
  if (testPhase !== 'testing') {
    return null;
  }

  const squarePoints = calculateSquarePoints();

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full"
      data-testid="animated-ball-container"
    >
      {/* Draw SVG path if enabled */}
      {showPath && squarePoints.length > 0 && (
        <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ zIndex: 1 }}>
          <path
            d={`M ${squarePoints.map((p) => `${p.x},${p.y}`).join(' L ')}`}
            stroke="#CBD5E1" // slate-300
            strokeWidth="2"
            strokeDasharray="6 4"
            fill="none"
          />

          {/* Current position indicator on the path */}
          <circle
            cx={position.x}
            cy={position.y}
            r={size / 2 + 5}
            fill="rgba(79, 70, 229, 0.1)" // Indigo with opacity
            className="animate-pulse"
          />
        </svg>
      )}

      {/* Position labels if enabled */}
      {showLabels && squarePoints.length > 0 && (
        <>
          {/* Left label */}
          <div
            style={{
              left: squarePoints[0].x - 60,
              top: squarePoints[0].y - 10,
            }}
            className="absolute text-sm font-bold text-gray-600"
          >
            Left
          </div>

          {/* Bottom label */}
          <div
            style={{
              left: squarePoints[1].x - 16,
              top: squarePoints[1].y + 10,
            }}
            className="absolute text-sm font-bold text-gray-600"
          >
            Bottom
          </div>

          {/* Right label */}
          <div
            style={{
              left: squarePoints[2].x + 10,
              top: squarePoints[2].y - 10,
            }}
            className="absolute text-sm font-bold text-gray-600"
          >
            Right
          </div>

          {/* Top label */}
          <div
            style={{
              left: squarePoints[3].x - 12,
              top: squarePoints[3].y - 30,
            }}
            className="absolute text-sm font-bold text-gray-600"
          >
            Top
          </div>
        </>
      )}

      {/* Animated ball */}
      <div
        style={{
          width: `${size}px`,
          height: `${size}px`,
          borderRadius: '50%',
          backgroundColor: color,
          transform: `translate(${position.x - size / 2}px, ${position.y - size / 2}px)`,
          transition: 'transform 0.1s linear',
          position: 'absolute',
          zIndex: 2,
          boxShadow: '0 2px 10px rgba(0, 0, 0, 0.2)',
        }}
        data-testid="animated-ball"
      />

      {/* Progress indicator */}
      <div className="absolute bottom-4 left-0 right-0 flex justify-center">
        <div className="bg-white bg-opacity-75 rounded-full px-4 py-2 shadow">
          <div className="w-64 h-2 bg-gray-200 rounded-full">
            <div
              className="h-2 bg-indigo-600 rounded-full transition-all"
              style={{
                width: `${progressForUI * 100}%`,
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
