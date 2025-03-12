'use client';

import React, { useState, useEffect, useRef } from 'react';
import { AnimatedBall, Point } from '@/features/eyeTracking/AnimatedBall';
import { EyeTrackingComponent } from '@/features/eyeTracking/EyeTrackingComponent';
import { useEyeTrackingStore } from '@/features/eyeTracking/store';

const SquareAnimationTest: React.FC = () => {
  const { isCameraReady, eyeDetected, gazeData } = useEyeTrackingStore();

  // Animation box reference for scrolling
  const animationBoxRef = useRef<HTMLDivElement>(null);

  // Track target and gaze positions
  const [targetPosition, setTargetPosition] = useState<Point>({ x: 50, y: 50 });
  const [eyePosition, setEyePosition] = useState<Point>({ x: 50, y: 50 });

  // Stats
  const [stats, setStats] = useState({
    accuracy: 0,
    totalPoints: 0,
    onTarget: 0,
    coverage: 0,
  });

  // Update eye position when gaze data changes
  useEffect(() => {
    if (gazeData.length > 0) {
      const lastGaze = gazeData[gazeData.length - 1];
      setEyePosition(lastGaze);

      // Calculate distance to target
      const distance = Math.sqrt(
        Math.pow(lastGaze.x - targetPosition.x, 2) + Math.pow(lastGaze.y - targetPosition.y, 2)
      );

      // Update stats
      setStats((prev) => {
        const onTarget = distance < 15 ? prev.onTarget + 1 : prev.onTarget;
        return {
          accuracy: Math.max(0, 100 - distance * 1.5),
          totalPoints: prev.totalPoints + 1,
          onTarget: onTarget,
          coverage: Math.min(100, (gazeData.length / 300) * 100),
        };
      });
    }
  }, [gazeData, targetPosition]);

  // Auto-scroll to animation box when loaded
  useEffect(() => {
    if (animationBoxRef.current) {
      // Scroll after a delay to ensure everything is rendered
      setTimeout(() => {
        animationBoxRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 1000);
    }
  }, []);

  // Handle ball position updates
  const handleBallPositionUpdate = (position: Point) => {
    setTargetPosition(position);
  };

  // Handle gaze data updates
  const handleGazeData = (point: Point) => {
    setEyePosition(point);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-6 text-center">Eye Tracking Square Animation Test</h1>

        <div className="bg-white rounded-lg shadow-lg overflow-auto p-4">
          {/* Instructions */}
          <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h2 className="text-lg font-bold text-blue-800 mb-2">Instructions</h2>
            <p className="text-blue-700">
              Follow the ball with your eyes as it moves in a square pattern. Try not to move your
              head, just your eyes. The test will run for 60 seconds.
            </p>

            <div className="mt-4 flex items-center space-x-4">
              <div className="flex items-center">
                <div
                  className={`h-3 w-3 rounded-full ${isCameraReady ? 'bg-green-500' : 'bg-red-500'} mr-2`}
                ></div>
                <span className="text-sm">Camera Ready</span>
              </div>
              <div className="flex items-center">
                <div
                  className={`h-3 w-3 rounded-full ${eyeDetected ? 'bg-green-500' : 'bg-red-500'} mr-2`}
                ></div>
                <span className="text-sm">Eyes Detected</span>
              </div>
            </div>
          </div>

          {/* Webcam area */}
          <div
            className="w-full border-2 border-gray-300 rounded-lg overflow-hidden mb-6"
            style={{ height: '300px' }}
          >
            <EyeTrackingComponent width="100%" height="100%" onGazeData={handleGazeData} />
          </div>

          {/* Stats panel */}
          <div className="grid grid-cols-4 gap-4 mb-6">
            <div className="p-4 bg-white border border-gray-200 rounded-lg shadow-sm">
              <div className="text-sm text-gray-500">Accuracy</div>
              <div className="text-2xl font-bold">{stats.accuracy.toFixed(1)}%</div>
            </div>
            <div className="p-4 bg-white border border-gray-200 rounded-lg shadow-sm">
              <div className="text-sm text-gray-500">Data Points</div>
              <div className="text-2xl font-bold">{stats.totalPoints}</div>
            </div>
            <div className="p-4 bg-white border border-gray-200 rounded-lg shadow-sm">
              <div className="text-sm text-gray-500">On Target</div>
              <div className="text-2xl font-bold">{stats.onTarget}</div>
            </div>
            <div className="p-4 bg-white border border-gray-200 rounded-lg shadow-sm">
              <div className="text-sm text-gray-500">Coverage</div>
              <div className="text-2xl font-bold">{stats.coverage.toFixed(1)}%</div>
            </div>
          </div>

          {/* Animation box */}
          <div
            ref={animationBoxRef}
            className="relative border-2 border-gray-300 rounded-lg overflow-hidden mb-8 mx-auto"
            style={{ height: '500px', maxWidth: '800px', background: 'white' }}
          >
            {/* Ball animation */}
            <AnimatedBall
              onPositionUpdate={handleBallPositionUpdate}
              size={40}
              showPath={true}
              showLabels={true}
            />

            {/* Eye gaze visualization */}
            <div
              className="absolute z-10 w-16 h-16 pointer-events-none transform -translate-x-1/2 -translate-y-1/2"
              style={{
                left: `${eyePosition.x}%`,
                top: `${eyePosition.y}%`,
                transition: 'all 0.1s ease-out',
              }}
            >
              <div className="w-full h-full rounded-full bg-blue-500 bg-opacity-20 border-2 border-blue-500 flex items-center justify-center">
                <div className="w-2 h-2 rounded-full bg-blue-600"></div>
              </div>
            </div>

            {/* Target visualization */}
            <div
              className="absolute z-5 w-20 h-20 pointer-events-none transform -translate-x-1/2 -translate-y-1/2"
              style={{
                left: `${targetPosition.x}%`,
                top: `${targetPosition.y}%`,
                transition: 'all 0.1s linear',
              }}
            >
              <div className="w-full h-full rounded-full border-2 border-dashed border-green-500 opacity-50"></div>
            </div>

            {/* Position indicators */}
            <div className="absolute bottom-2 left-2 bg-white bg-opacity-75 rounded p-2 text-xs">
              <div>
                <span className="font-medium">Eye:</span>
                <span className="ml-1">
                  x: {eyePosition.x.toFixed(1)}, y: {eyePosition.y.toFixed(1)}
                </span>
              </div>
              <div>
                <span className="font-medium">Target:</span>
                <span className="ml-1">
                  x: {targetPosition.x.toFixed(1)}, y: {targetPosition.y.toFixed(1)}
                </span>
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex justify-center space-x-4">
            <button
              onClick={() => window.location.reload()}
              className="px-6 py-3 bg-indigo-600 text-white rounded-lg shadow-md hover:bg-indigo-700 transition-colors"
            >
              Restart Test
            </button>
            <button
              onClick={() => {
                if (typeof window !== 'undefined') {
                  window._useDummyDetector = true;
                  window.location.reload();
                }
              }}
              className="px-6 py-3 bg-amber-600 text-white rounded-lg shadow-md hover:bg-amber-700 transition-colors"
            >
              Use Test Detector
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SquareAnimationTest;
