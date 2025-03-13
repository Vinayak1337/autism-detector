'use client';

import React, { useEffect, useRef, useState } from 'react';
import { EyeTrackingComponent } from '../EyeTrackingComponent';
import { useEyeTrackingStore } from '../store';
import { Point } from '../AnimatedBall';

interface LiveEyeTrackerProps {
  width?: number;
  height?: number;
  className?: string;
}

/**
 * A component that shows a live view of eye tracking with a simple visualization
 * of the current eye position. This is useful on intro screens to ensure
 * eye tracking is working before starting the actual test.
 */
export const LiveEyeTracker: React.FC<LiveEyeTrackerProps> = ({
  width = 320,
  height = 240,
  className = '',
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [currentPosition, setCurrentPosition] = useState<Point>({ x: 50, y: 50 });
  const [isTracking, setIsTracking] = useState(false);

  // Access eye detection status from the store
  const eyeDetected = useEyeTrackingStore((state) => state.eyeDetected);

  // Handle gaze data updates
  const handleGazeData = (data: Point) => {
    setCurrentPosition(data);
    setIsTracking(true);
  };

  // Draw the eye position visualization
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear the canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw a grid
    ctx.strokeStyle = 'rgba(200, 200, 200, 0.3)';
    ctx.lineWidth = 1;

    // Vertical lines
    for (let x = 0; x <= canvas.width; x += 20) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, canvas.height);
      ctx.stroke();
    }

    // Horizontal lines
    for (let y = 0; y <= canvas.height; y += 20) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(canvas.width, y);
      ctx.stroke();
    }

    // Draw crosshair at center
    ctx.strokeStyle = 'rgba(150, 150, 150, 0.5)';
    ctx.lineWidth = 1;

    // Vertical line
    ctx.beginPath();
    ctx.moveTo(canvas.width / 2, 0);
    ctx.lineTo(canvas.width / 2, canvas.height);
    ctx.stroke();

    // Horizontal line
    ctx.beginPath();
    ctx.moveTo(0, canvas.height / 2);
    ctx.lineTo(canvas.width, canvas.height / 2);
    ctx.stroke();

    // Draw the gaze position if tracking
    if (isTracking) {
      // Convert from percentage (0-100) to canvas coordinates
      const x = (currentPosition.x / 100) * canvas.width;
      const y = (currentPosition.y / 100) * canvas.height;

      // Draw a circle at the gaze position
      ctx.beginPath();
      ctx.arc(x, y, 8, 0, Math.PI * 2);
      ctx.fillStyle = eyeDetected ? 'rgba(39, 174, 96, 0.8)' : 'rgba(231, 76, 60, 0.8)';
      ctx.fill();

      // Add glow effect
      ctx.beginPath();
      ctx.arc(x, y, 12, 0, Math.PI * 2);
      ctx.strokeStyle = eyeDetected ? 'rgba(39, 174, 96, 0.4)' : 'rgba(231, 76, 60, 0.4)';
      ctx.lineWidth = 2;
      ctx.stroke();
    }
  }, [currentPosition, isTracking, eyeDetected]);

  return (
    <div className={`relative ${className}`} style={{ width: `${width}px`, height: `${height}px` }}>
      {/* Eye tracking component */}
      <div className="absolute inset-0 z-10 opacity-0 pointer-events-auto">
        <EyeTrackingComponent
          width="100%"
          height="100%"
          onGazeData={handleGazeData}
          testPhase="intro"
        />
      </div>

      {/* Visualization canvas */}
      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        className="absolute inset-0 z-0 bg-white rounded-lg shadow-sm"
      />

      {/* Status indicator */}
      <div className="absolute bottom-2 left-2 right-2 flex items-center justify-center text-xs">
        <div
          className={`h-2 w-2 rounded-full mr-2 ${eyeDetected ? 'bg-green-500' : 'bg-red-500'}`}
        ></div>
        <span className={eyeDetected ? 'text-green-600' : 'text-red-600'}>
          {eyeDetected ? 'Eyes detected' : 'Eyes not detected'}
        </span>
      </div>
    </div>
  );
};
