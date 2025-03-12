'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { EyeTrackingComponent } from '@/features/eyeTracking/EyeTrackingComponent';
import { AnimatedBall, Point } from '@/features/eyeTracking/AnimatedBall';
import { useEyeTrackingStore, TestPhase } from '@/features/eyeTracking/store';
import { analyzeEyeMovementData } from '@/features/eyeTracking/dataProcessing';

const EyeTrackingTestPage: React.FC = () => {
  const router = useRouter();

  // Access the global eye tracking store
  const {
    testPhase,
    setTestPhase,
    isCameraReady,
    eyeDetected,
    gazeData,
    startTest,
    endTest,
    setAnalysisResults,
  } = useEyeTrackingStore();

  // Add ref for scrolling to animation box
  const animationBoxRef = useRef<HTMLDivElement>(null);

  // Store target positions for analysis
  const [targetPositions, setTargetPositions] = useState<Array<{ x: number; y: number }>>([]);
  const [testTimestamps, setTestTimestamps] = useState<number[]>([]);

  // Add stats tracking
  const [eyeStats, setEyeStats] = useState({
    eyesDetected: false,
    gazePointsCollected: 0,
    accuracy: 0,
    coverage: 0,
    lastPosition: { x: 50, y: 50 },
  });

  // Update stats when gaze data changes
  useEffect(() => {
    // Only update stats if we have data and are in testing phase
    if (testPhase === 'testing') {
      let accuracy = 0;
      let coverage = 0;
      let lastPoint = { x: 0, y: 0 };

      if (gazeData.length > 0 && targetPositions.length > 0) {
        lastPoint = gazeData[gazeData.length - 1];

        // Simple distance-based accuracy calculation
        const targetPoint = targetPositions[targetPositions.length - 1];
        const distance = Math.sqrt(
          Math.pow(lastPoint.x - targetPoint.x, 2) + Math.pow(lastPoint.y - targetPoint.y, 2)
        );
        accuracy = Math.max(0, 100 - distance * 2); // Lower distance = higher accuracy

        // Coverage - how much of the tracking area has been covered
        coverage = Math.min(100, (gazeData.length / 300) * 100);
      }

      // Compare with previous stats to prevent unnecessary updates
      if (
        eyeStats.eyesDetected !== eyeDetected ||
        eyeStats.gazePointsCollected !== gazeData.length ||
        Math.abs(eyeStats.accuracy - accuracy) > 1 ||
        Math.abs(eyeStats.coverage - coverage) > 1 ||
        eyeStats.lastPosition.x !== lastPoint.x ||
        eyeStats.lastPosition.y !== lastPoint.y
      ) {
        // Use requestAnimationFrame to break the synchronous update cycle
        requestAnimationFrame(() => {
          setEyeStats({
            eyesDetected: eyeDetected,
            gazePointsCollected: gazeData.length,
            accuracy,
            coverage,
            lastPosition: lastPoint,
          });
        });
      }
    }
  }, [gazeData.length, eyeDetected, testPhase, targetPositions.length, eyeStats]);

  // Auto-scroll to animation box when test starts
  useEffect(() => {
    if (testPhase === 'testing' && animationBoxRef.current) {
      // Wait a moment for the UI to render then scroll
      setTimeout(() => {
        animationBoxRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 500);
    }
  }, [testPhase]);

  // Record target position during test
  const handleBallPositionUpdate = (position: { x: number; y: number }) => {
    setTargetPositions((prev) => [...prev, position]);
    setTestTimestamps((prev) => [...prev, Date.now()]);
  };

  // Handle test completion
  const handleTestComplete = () => {
    // Make sure we have enough data to analyze
    if (gazeData.length > 10 && targetPositions.length > 10) {
      try {
        // Create consistent timestamps if missing
        const timestamps =
          testTimestamps.length === gazeData.length
            ? testTimestamps
            : Array.from(
                { length: gazeData.length },
                (_, i) => Date.now() - (gazeData.length - i) * 100
              );

        // Analyze eye movement data
        const results = analyzeEyeMovementData(gazeData, targetPositions, timestamps);

        // Update store with results
        setAnalysisResults(results);

        // Set test phase to results instead of navigating away
        setTestPhase('results');
      } catch (error) {
        console.error('Error analyzing eye movement data:', error);
        // Still show results screen even if analysis fails
        setTestPhase('results');
      }
    } else {
      console.warn('Not enough data to analyze');
      // Show results screen anyway
      setTestPhase('results');
    }
  };

  // Add a custom handler for gaze data
  const handleGazeData = (data: Point) => {
    // Update the current eye position for real-time display
    setEyeStats((prev) => ({
      ...prev,
      lastPosition: data,
    }));
  };

  // Render content based on test phase
  const renderPhaseContent = () => {
    // Cast testPhase to string to avoid TypeScript errors
    const phase = testPhase as string;

    switch (phase) {
      case 'intro':
        return (
          <div className="text-center">
            <h1 className="text-3xl font-bold mb-6">Eye Tracking Test</h1>
            <p className="mb-4">
              This test will track your eye movements as you follow a moving ball on the screen.
            </p>
            <p className="mb-8">
              Please enable your webcam when prompted and look directly at the camera.
            </p>
            <button
              onClick={() => setTestPhase('setup' as TestPhase)}
              className="px-6 py-3 bg-indigo-600 text-white rounded-lg shadow-lg hover:bg-indigo-700 transition-colors"
            >
              Get Started
            </button>
          </div>
        );

      case 'setup':
        return (
          <div className="text-center">
            <h2 className="text-2xl font-bold mb-4">Setting Up Camera</h2>
            <p className="mb-4">Please allow access to your webcam.</p>
            <div className="w-full max-w-lg mx-auto h-96 border-2 border-gray-300 rounded-lg overflow-hidden relative">
              <EyeTrackingComponent
                width="100%"
                height="100%"
                testPhase={phase as any}
                onEyeDetected={(detected) => {
                  if (detected && isCameraReady) {
                    setTestPhase('ready' as TestPhase);
                  }
                }}
              />
            </div>

            {/* Add additional status indicators and manual controls */}
            <div className="mt-6 text-center">
              <div className="flex items-center justify-center mb-4 space-x-4">
                <div className="flex items-center">
                  <div
                    className={`h-3 w-3 rounded-full ${isCameraReady ? 'bg-green-500' : 'bg-gray-300'} mr-2`}
                  ></div>
                  <span className="text-sm">Camera Ready</span>
                </div>
                <div className="flex items-center">
                  <div
                    className={`h-3 w-3 rounded-full ${eyeDetected ? 'bg-green-500' : 'bg-gray-300'} mr-2`}
                  ></div>
                  <span className="text-sm">Eyes Detected</span>
                </div>
              </div>

              {isCameraReady && !eyeDetected && (
                <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                  <p className="text-amber-800 text-sm">
                    Eyes not detected yet. Make sure your face is clearly visible in the camera view
                    and there is sufficient lighting.
                  </p>
                </div>
              )}

              {isCameraReady && (
                <button
                  onClick={() => setTestPhase('ready' as TestPhase)}
                  className="mt-4 px-4 py-2 bg-indigo-500 text-white rounded hover:bg-indigo-600 transition-colors"
                >
                  Continue Anyway
                </button>
              )}

              {!isCameraReady && (
                <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-blue-800 text-sm">
                    Waiting for camera access. If you've already allowed access but still see this
                    message, try refreshing the page.
                  </p>
                </div>
              )}
            </div>
          </div>
        );

      case 'ready':
        return (
          <div className="text-center">
            <h2 className="text-2xl font-bold mb-4">Ready to Begin</h2>
            <p className="mb-4">The test will take approximately 60 seconds to complete.</p>
            <p className="mb-4">Follow the ball with your eyes as it moves around the screen.</p>
            <p className="mb-6">Try not to move your head - just your eyes.</p>
            <button
              onClick={startTest}
              className="px-6 py-3 bg-indigo-600 text-white rounded-lg shadow-lg hover:bg-indigo-700 transition-colors"
              disabled={!eyeDetected}
            >
              Start Test
            </button>
            {!eyeDetected && (
              <p className="mt-4 text-amber-600">Please position your face in the camera view.</p>
            )}
          </div>
        );

      case 'testing':
        return (
          <div className="relative w-full h-full flex flex-col">
            {/* Status header with clear visual feedback */}
            <div className="bg-white bg-opacity-90 p-4 text-center shadow-md z-10">
              <h2 className="text-xl font-bold">Follow the Ball</h2>
              <p className="text-gray-600">
                Keep your eyes on the ball as it moves around the square pattern.
              </p>
              <div className="mt-2 flex items-center justify-center space-x-2">
                <div
                  className={`h-3 w-3 rounded-full ${eyeDetected ? 'bg-green-500' : 'bg-red-500'}`}
                ></div>
                <span className={`text-sm ${eyeDetected ? 'text-green-600' : 'text-red-600'}`}>
                  {eyeDetected ? 'Eyes detected' : 'Eyes not detected'}
                </span>
                <span className="text-xs text-gray-500">
                  ({gazeData.length} data points collected)
                </span>
              </div>
            </div>

            {/* Webcam area with fixed height */}
            <div className="w-full" style={{ height: '300px' }}>
              <EyeTrackingComponent
                width="100%"
                height="100%"
                testPhase={phase as any}
                onGazeData={handleGazeData}
              />
            </div>

            {/* Eye tracking statistics panel */}
            <div className="bg-gray-50 p-4 border-t border-b border-gray-200">
              <h3 className="text-md font-semibold text-gray-700 mb-2">Eye Tracking Stats</h3>
              <div className="grid grid-cols-4 gap-2">
                <div className="bg-white p-2 rounded border border-gray-200">
                  <div className="text-xs text-gray-500">Detection</div>
                  <div className="font-medium flex items-center">
                    <div
                      className={`h-2 w-2 rounded-full mr-1 ${eyeStats.eyesDetected ? 'bg-green-500' : 'bg-red-500'}`}
                    ></div>
                    {eyeStats.eyesDetected ? 'Active' : 'Inactive'}
                  </div>
                </div>
                <div className="bg-white p-2 rounded border border-gray-200">
                  <div className="text-xs text-gray-500">Data Points</div>
                  <div className="font-medium">{eyeStats.gazePointsCollected}</div>
                </div>
                <div className="bg-white p-2 rounded border border-gray-200">
                  <div className="text-xs text-gray-500">Accuracy</div>
                  <div className="font-medium">{eyeStats.accuracy.toFixed(1)}%</div>
                </div>
                <div className="bg-white p-2 rounded border border-gray-200">
                  <div className="text-xs text-gray-500">Coverage</div>
                  <div className="font-medium">{eyeStats.coverage.toFixed(1)}%</div>
                </div>
              </div>
            </div>

            {/* Animation box with the ball - explicitly sized */}
            <div
              ref={animationBoxRef}
              className="flex-grow relative border-2 border-gray-300 rounded-lg mx-4 my-4 overflow-hidden"
              style={{ height: '400px', background: 'white' }}
            >
              <div className="absolute inset-0">
                <AnimatedBall
                  onComplete={handleTestComplete}
                  onPositionUpdate={handleBallPositionUpdate}
                  size={36}
                  showPath={true}
                  showLabels={true}
                />
              </div>

              {/* Position indicator */}
              <div className="absolute bottom-2 left-2 bg-white bg-opacity-75 rounded p-1 text-xs">
                <span className="font-medium">Eye Position:</span>
                <span className="ml-1">
                  x: {eyeStats.lastPosition.x.toFixed(1)}, y: {eyeStats.lastPosition.y.toFixed(1)}
                </span>
              </div>
            </div>

            {/* Bottom controls in a fixed bar */}
            <div className="p-4 bg-white bg-opacity-90 border-t border-gray-200 flex justify-between items-center">
              <div className="text-sm text-gray-600">
                <span className="font-medium">Progress:</span>
                <div className="w-32 h-2 bg-gray-200 rounded-full mt-1 overflow-hidden">
                  <div
                    className="h-full bg-indigo-600 transition-all duration-100"
                    style={{
                      width: `${Math.min((gazeData.length / 300) * 100, 100)}%`,
                    }}
                  ></div>
                </div>
              </div>
              <button
                onClick={endTest}
                className="px-4 py-2 bg-red-600 text-white rounded-lg shadow-sm hover:bg-red-700 transition-colors"
              >
                Cancel Test
              </button>
            </div>
          </div>
        );

      case 'results':
        // Should normally redirect to results page
        return (
          <div className="text-center">
            <h2 className="text-2xl font-bold mb-4">Test Complete</h2>
            <p className="mb-4">Thank you for completing the eye tracking test.</p>
            <p className="mb-6">Processing your results...</p>
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600 mx-auto"></div>
          </div>
        );

      default:
        return null;
    }
  };

  // Cast testPhase to string to avoid TypeScript errors
  const phase = testPhase as string;

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Main content area - make it taller for testing phase */}
        <div
          className={`bg-white rounded-lg shadow-lg ${
            phase === 'testing' ? 'min-h-[90vh] overflow-auto p-0' : 'min-h-[70vh] p-8'
          }`}
        >
          {renderPhaseContent()}
        </div>

        {/* Instructions at bottom */}
        {phase !== 'testing' && (
          <div className="mt-6 text-center text-gray-600">
            <p>For best results, please use a computer with a good webcam in a well-lit room.</p>
            <p className="mt-2 text-sm">
              Position your face clearly in the camera view and minimize background movement.
            </p>
            <div className="mt-4">
              <a
                href="/eye-tracking-test/square-animation-test"
                className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors text-sm inline-block"
              >
                Try Dedicated Square Animation Test
              </a>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default EyeTrackingTestPage;
