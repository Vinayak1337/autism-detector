'use client';

import React, { useState, useEffect, useRef } from 'react';
import { AnimatedBall, Point } from '@/features/eyeTracking/AnimatedBall';
import { EyeTrackingComponent } from '@/features/eyeTracking/EyeTrackingComponent';
import { useEyeTrackingStore } from '@/features/eyeTracking/store';
import Link from 'next/link';

const SquareAnimationTest: React.FC = () => {
  const { isCameraReady, eyeDetected, gazeData } = useEyeTrackingStore();

  // Animation box reference for scrolling
  const animationBoxRef = useRef<HTMLDivElement>(null);

  // Track target and gaze positions
  const [targetPosition, setTargetPosition] = useState<Point>({ x: 50, y: 50 });
  const [eyePosition, setEyePosition] = useState<Point>({ x: 50, y: 50 });

  // Test status
  const [isRunning, setIsRunning] = useState(true);
  const [timeLeft, setTimeLeft] = useState(60);

  // Stats
  const [stats, setStats] = useState({
    accuracy: 0,
    totalPoints: 0,
    onTarget: 0,
    coverage: 0,
  });

  // Timer for the test
  useEffect(() => {
    if (isRunning && timeLeft > 0) {
      const timer = setTimeout(() => {
        setTimeLeft(timeLeft - 1);
      }, 1000);

      return () => clearTimeout(timer);
    } else if (timeLeft === 0) {
      setIsRunning(false);
    }
  }, [isRunning, timeLeft]);

  // Update eye position when gaze data changes
  useEffect(() => {
    if (gazeData.length > 0 && isRunning) {
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
  }, [gazeData, targetPosition, isRunning]);

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

  // Format time display
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 py-8 px-4 sm:px-6 md:px-8">
      <div className="max-w-6xl mx-auto">
        <header className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 text-center mb-2">
            Eye Tracking Square Animation Test
          </h1>
          <p className="text-gray-600 text-center max-w-2xl mx-auto">
            Track how well your eyes can follow a moving target across the screen.
          </p>
        </header>

        <div className="bg-white rounded-2xl shadow-xl overflow-hidden mb-8">
          {/* Instructions */}
          <div className="bg-gradient-to-r from-blue-50 to-blue-100 p-6 border-b border-blue-200">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <h2 className="text-lg font-bold text-blue-800 mb-2">Test Instructions</h2>
                <p className="text-blue-700">
                  Follow the ball with your eyes as it moves in a square pattern. Try not to move
                  your head, just your eyes. The test will run for 60 seconds.
                </p>
              </div>

              <div className="shrink-0 bg-white rounded-xl p-3 shadow-sm">
                <div className="text-xl font-bold text-center mb-1">{formatTime(timeLeft)}</div>
                <div className="text-xs text-gray-500 text-center">
                  {isRunning ? 'Time Remaining' : 'Test Complete'}
                </div>
              </div>
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-4">
              <div className="flex items-center bg-white px-3 py-1 rounded-full shadow-sm">
                <div
                  className={`h-3 w-3 rounded-full ${isCameraReady ? 'bg-green-500' : 'bg-red-500'} mr-2`}
                ></div>
                <span className="text-sm font-medium">
                  {isCameraReady ? 'Camera Ready' : 'Camera Not Ready'}
                </span>
              </div>
              <div className="flex items-center bg-white px-3 py-1 rounded-full shadow-sm">
                <div
                  className={`h-3 w-3 rounded-full ${eyeDetected ? 'bg-green-500' : 'bg-red-500'} mr-2`}
                ></div>
                <span className="text-sm font-medium">
                  {eyeDetected ? 'Eyes Detected' : 'Eyes Not Detected'}
                </span>
              </div>
            </div>
          </div>

          <div className="p-6">
            {/* Webcam area */}
            <div
              className="w-full border-2 border-gray-200 rounded-xl overflow-hidden mb-6 shadow-inner bg-gray-50"
              style={{ height: '300px' }}
            >
              <EyeTrackingComponent width="100%" height="100%" onGazeData={handleGazeData} />
            </div>

            {/* Stats panel */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="p-4 bg-white border border-gray-200 rounded-xl shadow-sm transition-all hover:shadow-md">
                <div className="text-sm text-gray-500 mb-1">Accuracy</div>
                <div className="text-2xl font-bold text-blue-700">{stats.accuracy.toFixed(1)}%</div>
                <div className="mt-1 text-xs text-gray-400">Distance from target</div>
              </div>
              <div className="p-4 bg-white border border-gray-200 rounded-xl shadow-sm transition-all hover:shadow-md">
                <div className="text-sm text-gray-500 mb-1">Data Points</div>
                <div className="text-2xl font-bold text-blue-700">{stats.totalPoints}</div>
                <div className="mt-1 text-xs text-gray-400">Gaze readings</div>
              </div>
              <div className="p-4 bg-white border border-gray-200 rounded-xl shadow-sm transition-all hover:shadow-md">
                <div className="text-sm text-gray-500 mb-1">On Target</div>
                <div className="text-2xl font-bold text-blue-700">{stats.onTarget}</div>
                <div className="mt-1 text-xs text-gray-400">Accurate fixations</div>
              </div>
              <div className="p-4 bg-white border border-gray-200 rounded-xl shadow-sm transition-all hover:shadow-md">
                <div className="text-sm text-gray-500 mb-1">Coverage</div>
                <div className="text-2xl font-bold text-blue-700">{stats.coverage.toFixed(1)}%</div>
                <div className="mt-1 text-xs text-gray-400">Test completion</div>
              </div>
            </div>

            {/* Animation box */}
            <div
              ref={animationBoxRef}
              className="relative border-2 border-gray-200 rounded-xl overflow-hidden mb-8 mx-auto shadow-md"
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
              <div className="absolute bottom-2 left-2 bg-white bg-opacity-75 backdrop-blur-sm rounded-lg p-2 text-xs shadow-sm">
                <div>
                  <span className="font-medium text-gray-700">Eye:</span>
                  <span className="ml-1 text-blue-700">
                    x: {eyePosition.x.toFixed(1)}, y: {eyePosition.y.toFixed(1)}
                  </span>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Target:</span>
                  <span className="ml-1 text-green-700">
                    x: {targetPosition.x.toFixed(1)}, y: {targetPosition.y.toFixed(1)}
                  </span>
                </div>
              </div>

              {/* Test complete overlay */}
              {!isRunning && (
                <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center backdrop-blur-sm">
                  <div className="bg-white p-6 rounded-2xl shadow-lg max-w-md">
                    <h3 className="text-xl font-bold text-center mb-2">Test Complete!</h3>
                    <p className="text-gray-600 mb-4">
                      Your final accuracy score is {stats.accuracy.toFixed(1)}%.
                    </p>
                    <div className="flex justify-center gap-4">
                      <button
                        onClick={() => {
                          setIsRunning(true);
                          setTimeLeft(60);
                          setStats({
                            accuracy: 0,
                            totalPoints: 0,
                            onTarget: 0,
                            coverage: 0,
                          });
                        }}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg shadow-md hover:bg-blue-700 transition-colors"
                      >
                        Restart Test
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Action buttons */}
            <div className="flex flex-wrap justify-center gap-4">
              <button
                onClick={() => window.location.reload()}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg shadow-md hover:bg-blue-700 transition-colors"
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
              <Link
                href="/eye-tracking-test"
                className="px-6 py-3 bg-gray-200 text-gray-800 rounded-lg shadow-md hover:bg-gray-300 transition-colors"
              >
                Back to Main Test
              </Link>
            </div>
          </div>
        </div>

        <footer className="text-center text-gray-500 text-sm mt-8">
          <p>This test helps measure how accurately you can track objects with your eyes.</p>
          <p className="mt-1">Results are for informational purposes only.</p>
        </footer>
      </div>
    </div>
  );
};

export default SquareAnimationTest;
