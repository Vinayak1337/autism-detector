'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  EyeTrackingComponent,
  AnimatedBall,
  Point,
  analyzeEyeMovementData,
  useEyeTrackingStore,
  AnalysisResult,
} from '@/features/eyeTracking';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

const EyeTrackingTestClient = () => {
  // Use the global state from Zustand store
  const {
    testPhase,
    setTestPhase,
    gazeData,
    setGazeData,
    eyeDetected,
    setEyeDetected,
    resetTestState,
  } = useEyeTrackingStore();

  // Replace any with AnalysisResult
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [progress, setProgress] = useState(0);
  const [retryCount, setRetryCount] = useState(0);
  const testDuration = 15; // seconds
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const gazePointsRef = useRef<Point[]>([]);
  const targetPositionsRef = useRef<Point[]>([]); // To store target positions

  // Handle start test button click
  const handleStartTest = () => {
    resetGazeData();
    setTestPhase('testing');
    startTimer();
  };

  // Reset gaze data
  const resetGazeData = () => {
    gazePointsRef.current = [];
    setGazeData([]);
  };

  // Handle retry button click
  const handleRetry = () => {
    resetTestState();
    setRetryCount((prev) => prev + 1);
    setResult(null);
    resetGazeData();
  };

  // Start timer for test duration
  const startTimer = () => {
    if (timerRef.current) clearTimeout(timerRef.current);

    const startTime = Date.now();

    // Update progress every 100ms
    const progressInterval = setInterval(() => {
      const elapsed = (Date.now() - startTime) / 1000;
      const newProgress = Math.min((elapsed / testDuration) * 100, 100);
      setProgress(newProgress);

      if (elapsed >= testDuration) {
        clearInterval(progressInterval);
      }
    }, 100);

    // End test after duration
    timerRef.current = setTimeout(() => {
      clearInterval(progressInterval);
      endTest();
    }, testDuration * 1000);
  };

  // End the test and analyze results
  const endTest = () => {
    setTestPhase('results');

    // Generate timestamps (one for each data point)
    const timestamps = Array.from(
      { length: gazePointsRef.current.length },
      (_, i) => Date.now() - (gazePointsRef.current.length - i) * 100
    );

    // Use target positions if available, or use eye positions as fallback
    const targetPositions =
      targetPositionsRef.current.length > 0 ? targetPositionsRef.current : gazePointsRef.current;

    // Call analyzeEyeMovementData with all required parameters
    const analysisResult = analyzeEyeMovementData(
      gazePointsRef.current, // eye positions
      targetPositions, // target positions
      timestamps // timestamps
    );

    setResult(analysisResult);
  };

  // Update gaze data when eye tracking provides new points
  useEffect(() => {
    if (testPhase === 'testing' && gazeData.length > 0) {
      const newPoint = gazeData[gazeData.length - 1];
      gazePointsRef.current.push(newPoint);
    }
  }, [gazeData, testPhase]);

  // Clear timer on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, []);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 px-4 py-8">
      <div className="w-full max-w-4xl">
        <h1 className="text-3xl font-bold text-gray-900 mb-6 text-center">Eye Tracking Test</h1>

        {/* Intro Phase */}
        {testPhase === 'intro' && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Welcome to the Eye Tracking Test</CardTitle>
              <CardDescription>
                This test will analyze your eye movements to help assess visual attention patterns.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="mb-4 text-gray-700">
                During this test, your webcam will track your eye movements as you follow a moving
                ball on the screen. Please make sure you are in a well-lit environment and sitting
                at a comfortable distance from your screen.
              </p>
              <div className="flex justify-center">
                <Button onClick={() => setTestPhase('ready')} size="lg" className="mt-4">
                  Get Started
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Ready Phase - Setup webcam and face tracking */}
        {testPhase === 'ready' && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Prepare for the Test</CardTitle>
              <CardDescription>
                Please position yourself so your face is clearly visible to the camera.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center">
                <div className="relative w-full max-w-md h-[300px] bg-gray-100 rounded-lg mb-4 overflow-hidden">
                  <EyeTrackingComponent
                    key={`eye-tracking-component-${retryCount}`}
                    onGazeData={(data) => setGazeData([...gazeData, data])}
                    testPhase={testPhase}
                    onEyeDetected={setEyeDetected}
                  />

                  {!eyeDetected && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/50 text-white p-4">
                      <Loader2 className="w-8 h-8 animate-spin mb-2" />
                      <p className="text-center font-medium">
                        Setting up webcam and detecting your face...
                      </p>
                      <p className="text-center text-sm mt-2">
                        Please make sure your face is clearly visible and well-lit.
                      </p>
                      <Button
                        variant="outline"
                        className="mt-4 bg-white text-black hover:bg-gray-100"
                        onClick={handleRetry}
                      >
                        Retry Detection
                      </Button>
                    </div>
                  )}
                </div>

                {eyeDetected && (
                  <div className="text-center mb-4">
                    <p className="text-green-600 font-medium mb-2">
                      Face detected! You&apos;re ready to start the test.
                    </p>
                    <p className="text-gray-600 mb-4">
                      When you click &quot;Start Test&quot;, a ball will appear and move in a
                      pattern. Try to follow it with your eyes while keeping your head still.
                    </p>
                    <Button onClick={handleStartTest} size="lg" className="mt-2">
                      Start Test
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Testing Phase */}
        {testPhase === 'testing' && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Follow the Ball</CardTitle>
              <CardDescription>
                Track the ball with your eyes while keeping your head still.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center">
                <div className="relative w-full max-w-md h-[300px] bg-gray-100 rounded-lg mb-4 overflow-hidden">
                  <EyeTrackingComponent
                    onGazeData={(data) => setGazeData([...gazeData, data])}
                    testPhase={testPhase}
                    onEyeDetected={setEyeDetected}
                  />
                  <div className="absolute inset-0">
                    <AnimatedBall
                      size={20}
                      onPositionUpdate={(pos) => {
                        // Store the target position for later analysis
                        targetPositionsRef.current.push(pos);
                      }}
                      showPath={true}
                    />
                  </div>
                </div>

                <div className="w-full max-w-md mt-4">
                  <div className="flex justify-between mb-2">
                    <span className="text-sm text-gray-500">Test progress</span>
                    <span className="text-sm text-gray-500">{Math.round(progress)}%</span>
                  </div>
                  <Progress value={progress} className="h-2" />

                  <Button
                    variant="outline"
                    className="mt-4 w-full"
                    onClick={() => {
                      if (timerRef.current) clearTimeout(timerRef.current);
                      handleRetry();
                    }}
                  >
                    Cancel Test
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Results Phase */}
        {testPhase === 'results' && result && (
          <Card>
            <CardHeader>
              <CardTitle>Test Results</CardTitle>
              <CardDescription>Analysis of your eye movement patterns</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-6 md:grid-cols-2">
                <div>
                  <h3 className="text-lg font-medium mb-2 text-gray-900">Eye Movement Metrics</h3>
                  <ul className="space-y-2 text-gray-700">
                    <li className="flex justify-between">
                      <span>Saccade Frequency:</span>
                      <span className="font-medium">
                        {result.saccadeFrequency.toFixed(2)} per second
                      </span>
                    </li>
                    <li className="flex justify-between">
                      <span>Average Fixation Duration:</span>
                      <span className="font-medium">
                        {result.averageFixationDuration.toFixed(2)} ms
                      </span>
                    </li>
                    <li className="flex justify-between">
                      <span>Wiggle Score:</span>
                      <span className="font-medium">{result.wiggleScore.toFixed(2)}</span>
                    </li>
                    <li className="flex justify-between">
                      <span>Deviation Score:</span>
                      <span className="font-medium">{result.deviationScore.toFixed(2)}</span>
                    </li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-lg font-medium mb-2 text-gray-900">Assessment</h3>
                  <div className="p-4 rounded-lg bg-gray-100">
                    <p className="text-gray-800 mb-2">
                      <span className="font-medium">Risk Assessment:</span> {result.riskAssessment}
                    </p>
                    <p className="text-gray-800">
                      This assessment is based on patterns in eye movement that may indicate certain
                      attention traits. Higher deviation scores may suggest difficulty following
                      predictable motion patterns.
                    </p>
                  </div>
                </div>

                <div className="md:col-span-2 mt-4">
                  <div className="flex flex-wrap gap-4 justify-center md:justify-start">
                    <Button onClick={handleRetry}>Restart Test</Button>
                    <Button variant="outline" onClick={() => window.print()}>
                      Print Results
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default EyeTrackingTestClient;
