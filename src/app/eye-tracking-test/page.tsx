'use client';

import React, { useState, useRef } from 'react';
import {
  EyeTrackingComponent,
  AnimatedBall,
  Point,
  analyzeEyeMovementData,
  EyeMovementData,
  AnalysisResult,
} from '@/features/eyeTracking';

export default function EyeTrackingTestPage() {
  // State for the test phases
  const [testPhase, setTestPhase] = useState<'intro' | 'ready' | 'testing' | 'results'>('intro');

  // Eye tracking data
  const [gazeData, setGazeData] = useState<{ x: number; y: number } | null>(null);
  const [targetPosition, setTargetPosition] = useState<Point | null>(null);
  const [eyeMovementData, setEyeMovementData] = useState<EyeMovementData[]>([]);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);

  // Refs for access across components
  const startTimeRef = useRef<number | null>(null);
  const testContainerRef = useRef<HTMLDivElement>(null);

  // Test parameters
  const testDuration = 60; // seconds
  const testBoxSize = 500; // pixels
  const ballSize = 20; // pixels

  // Handle gaze position data from eye tracking
  const handleGazeData = (x: number, y: number) => {
    setGazeData({ x, y });

    // Only add data during the testing phase
    if (testPhase === 'testing' && targetPosition && startTimeRef.current) {
      const timestamp = Date.now() - startTimeRef.current;

      setEyeMovementData((prev) => [
        ...prev,
        {
          timestamp,
          position: { x, y },
          targetPosition,
        },
      ]);
    }
  };

  // Handle target ball position changes
  const handleBallPositionChange = (position: Point) => {
    if (testContainerRef.current) {
      // Convert position to screen coordinates
      const rect = testContainerRef.current.getBoundingClientRect();
      setTargetPosition({
        x: rect.left + position.x + ballSize / 2,
        y: rect.top + position.y + ballSize / 2,
      });
    }
  };

  // Start the test
  const startTest = () => {
    setTestPhase('testing');
    setEyeMovementData([]);
    startTimeRef.current = Date.now();
  };

  // Handle test completion
  const handleTestComplete = () => {
    // Analyze collected data
    const result = analyzeEyeMovementData(eyeMovementData);
    setAnalysisResult(result);
    setTestPhase('results');
  };

  // Reset the test
  const resetTest = () => {
    setTestPhase('ready');
    setEyeMovementData([]);
    setAnalysisResult(null);
    startTimeRef.current = null;
  };

  // Get color based on risk assessment
  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'Low Risk':
        return 'text-green-600';
      case 'Medium Risk':
        return 'text-yellow-600';
      case 'High Risk':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Eye Tracking Test</h1>

      {/* Introduction Phase */}
      {testPhase === 'intro' && (
        <div className="bg-blue-50 p-6 rounded-lg shadow-md mb-8">
          <h2 className="text-xl font-semibold text-blue-800 mb-4">
            Welcome to the Eye Tracking Test
          </h2>
          <p className="mb-4">
            This test will track your eye movements as you follow a ball moving in a square pattern.
            The test helps assess visual attention patterns that may be relevant for autism
            screening.
          </p>

          <h3 className="text-lg font-medium text-blue-700 mt-6 mb-2">How It Works:</h3>
          <ol className="list-decimal pl-5 space-y-2 text-blue-700 mb-6">
            <li>First, we&apos;ll ask for permission to access your webcam</li>
            <li>
              You&apos;ll see a blue ball moving in a square pattern (left → down → right → up)
            </li>
            <li>Follow the ball with your eyes only, keeping your head still</li>
            <li>The test will last for {testDuration} seconds</li>
            <li>At the end, we&apos;ll show an analysis of your eye movements</li>
          </ol>

          <div className="mt-6 flex justify-center">
            <button
              className="px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 font-medium"
              onClick={() => setTestPhase('ready')}
            >
              Get Started
            </button>
          </div>
        </div>
      )}

      {/* Setup Phase */}
      {testPhase === 'ready' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="bg-white rounded-lg shadow-lg overflow-hidden">
            <div className="p-6">
              <h2 className="text-xl font-bold mb-4">Camera Setup</h2>
              <p className="mb-4">
                Position yourself approximately 50cm from the screen and make sure your face is
                clearly visible. The eye tracking component below should show your face with
                tracking points.
              </p>

              <div className="aspect-video relative rounded overflow-hidden border border-gray-200">
                <EyeTrackingComponent
                  width="100%"
                  height="100%"
                  onGazeData={handleGazeData}
                  options={{
                    drawLandmarks: true,
                    drawPath: false,
                  }}
                />
              </div>

              <div className="mt-4">
                <p className="text-sm text-gray-600 mb-2">
                  Eye position detected: {gazeData ? 'Yes' : 'No'}
                </p>
                {gazeData && (
                  <p className="text-sm text-gray-600">
                    Coordinates: ({Math.round(gazeData.x)}, {Math.round(gazeData.y)})
                  </p>
                )}
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-lg overflow-hidden">
            <div className="p-6">
              <h2 className="text-xl font-bold mb-4">Test Instructions</h2>

              <ul className="list-disc pl-5 space-y-3 text-gray-700 mb-6">
                <li>
                  Follow the blue ball with your <strong>eyes only</strong> as it moves around
                </li>
                <li>Try to keep your head relatively still during the test</li>
                <li>The ball will move in a square pattern: left → down → right → up</li>
                <li>The test will last for {testDuration} seconds</li>
                <li>For best results, ensure you are in a well-lit environment</li>
              </ul>

              <div className="bg-yellow-50 p-4 rounded-md mb-6">
                <p className="text-sm text-yellow-800">
                  <strong>Important:</strong> This test is not a medical diagnosis. It is designed
                  to help identify patterns that may warrant further professional assessment.
                </p>
              </div>

              <div className="flex justify-center">
                <button
                  className="px-6 py-3 bg-green-600 text-white rounded-md hover:bg-green-700 font-medium"
                  onClick={startTest}
                  disabled={!gazeData}
                >
                  {!gazeData ? 'Waiting for eye detection...' : 'Start Test'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Testing Phase */}
      {testPhase === 'testing' && (
        <div className="flex flex-col items-center">
          <div className="mb-6 max-w-md text-center">
            <h2 className="text-xl font-semibold mb-2">Follow the Ball</h2>
            <p className="text-gray-600">
              Keep your head still and follow the blue ball with your eyes only.
            </p>
          </div>

          <div className="flex flex-col md:flex-row items-center gap-6 mb-8">
            <div className="bg-white p-4 rounded-lg shadow-md">
              <div className="h-32 w-48 relative rounded overflow-hidden">
                <EyeTrackingComponent
                  width="100%"
                  height="100%"
                  onGazeData={handleGazeData}
                  options={{
                    drawLandmarks: true,
                    drawPath: false,
                  }}
                />
              </div>
            </div>

            <div className="bg-blue-50 p-4 rounded-lg shadow-md">
              <h3 className="font-medium text-blue-700 mb-2">Testing in Progress</h3>
              <ul className="text-sm text-blue-700 list-disc pl-5 space-y-1">
                <li>Keep your head still</li>
                <li>Follow the ball with your eyes only</li>
                <li>Try to stay focused on the ball</li>
              </ul>
            </div>
          </div>

          <div ref={testContainerRef} className="relative mb-8">
            <AnimatedBall
              size={testBoxSize}
              ballSize={ballSize}
              duration={testDuration}
              pattern="square"
              onPositionChange={handleBallPositionChange}
              onComplete={handleTestComplete}
            />
          </div>

          <button
            className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
            onClick={resetTest}
          >
            Cancel Test
          </button>
        </div>
      )}

      {/* Results Phase */}
      {testPhase === 'results' && analysisResult && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h2 className="text-2xl font-bold mb-4">Test Results</h2>
              <p className="mb-6 text-gray-600">
                Based on your eye movement patterns during the test, we&apos;ve generated the
                following analysis. These measurements help identify certain patterns that may be
                relevant for autism screening.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-8">
                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                  <h3 className="text-lg font-medium mb-2">Risk Assessment</h3>
                  <p
                    className={`text-2xl font-bold ${getRiskColor(analysisResult.riskAssessment)}`}
                  >
                    {analysisResult.riskAssessment}
                  </p>
                  <p className="mt-2 text-sm text-gray-600">
                    Based on eye movement patterns, coordination, and fixation behaviors
                  </p>
                </div>

                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                  <h3 className="text-lg font-medium mb-2">Eye Metrics</h3>
                  <ul className="space-y-2">
                    <li className="flex justify-between">
                      <span className="text-gray-600">Fixation duration:</span>
                      <span className="font-medium">
                        {Math.round(analysisResult.averageFixationDuration)}ms
                      </span>
                    </li>
                    <li className="flex justify-between">
                      <span className="text-gray-600">Saccade frequency:</span>
                      <span className="font-medium">
                        {analysisResult.saccadeFrequency.toFixed(2)}/sec
                      </span>
                    </li>
                    <li className="flex justify-between">
                      <span className="text-gray-600">Wiggle score:</span>
                      <span className="font-medium">{Math.round(analysisResult.wiggleScore)}</span>
                    </li>
                  </ul>
                </div>
              </div>

              <div className="bg-yellow-50 p-4 rounded-md mb-6">
                <p className="text-sm text-yellow-800">
                  <strong>Important:</strong> This assessment is not a medical diagnosis. It is
                  designed as a screening tool to identify patterns that may warrant further
                  professional assessment.
                </p>
              </div>

              <div className="flex flex-wrap gap-4">
                <button
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                  onClick={resetTest}
                >
                  Take Test Again
                </button>
                <a
                  href="/dashboard"
                  className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300"
                >
                  Return to Dashboard
                </a>
              </div>
            </div>
          </div>

          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h3 className="text-xl font-bold mb-4">What These Results Mean</h3>

              <div className="space-y-4">
                <div>
                  <h4 className="font-medium text-gray-800">Fixation Duration</h4>
                  <p className="text-sm text-gray-600">
                    How long your eyes typically stayed focused on a point. Shorter durations may
                    indicate difficulty maintaining visual attention.
                  </p>
                </div>

                <div>
                  <h4 className="font-medium text-gray-800">Saccade Frequency</h4>
                  <p className="text-sm text-gray-600">
                    How often your eyes made rapid movements. Higher frequencies may indicate
                    patterns of visual processing seen in some neurodivergent individuals.
                  </p>
                </div>

                <div>
                  <h4 className="font-medium text-gray-800">Wiggle Score</h4>
                  <p className="text-sm text-gray-600">
                    Measures unwanted eye movements perpendicular to the target direction. Higher
                    scores may indicate challenges with smooth pursuit eye movements.
                  </p>
                </div>

                <div className="pt-4 border-t border-gray-200">
                  <h4 className="font-medium text-gray-800">What Next?</h4>
                  <p className="text-sm text-gray-600 mb-2">
                    If your results indicate medium or high risk:
                  </p>
                  <ul className="text-sm text-gray-600 list-disc pl-5 space-y-1">
                    <li>Consider taking the test again in a well-lit, quiet environment</li>
                    <li>Take our other screening assessments</li>
                    <li>Consider consulting with a healthcare professional</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
