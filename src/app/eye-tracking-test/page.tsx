'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { WebcamFeed } from '@/components/eye-tracking/WebcamFeed';
import { EyeTrackingBox, TrackingPattern, Point } from '@/components/eye-tracking/EyeTrackingBox';

export default function EyeTrackingTest() {
  const [webcamEnabled, setWebcamEnabled] = useState(false);
  const [testStarted, setTestStarted] = useState(false);
  const [selectedPattern, setSelectedPattern] = useState<TrackingPattern>('square');
  const [testDuration, setTestDuration] = useState(60); // Default 60 seconds
  const [lastPosition, setLastPosition] = useState<Point | null>(null);

  const testAreaSize = 500; // Size of the test area in pixels
  const ballSize = 20; // Size of the ball in pixels

  const handleStreamReady = () => {
    setWebcamEnabled(true);
  };

  const startTest = () => {
    setTestStarted(true);
  };

  const stopTest = () => {
    setTestStarted(false);
  };

  const handleTestComplete = () => {
    alert(
      'Eye tracking test completed! In a real application, the recorded eye tracking data would be analyzed here.'
    );
    setTestStarted(false);
  };

  // In a real implementation, this would process eye tracking data
  const handlePositionChange = (position: Point) => {
    setLastPosition(position);
    // In a production app, you would:
    // 1. Process the current eye position from the webcam feed
    // 2. Compare it with the current ball position
    // 3. Record the data for analysis
  };

  const patternOptions: { value: TrackingPattern; label: string }[] = [
    { value: 'square', label: 'Square (Left → Down → Right → Up)' },
    { value: 'circle', label: 'Circle' },
    { value: 'horizontal', label: 'Horizontal (Left ↔ Right)' },
    { value: 'vertical', label: 'Vertical (Top ↔ Bottom)' },
    { value: 'random', label: 'Random Movement' },
  ];

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4">
      <h1 className="text-3xl font-bold mb-6">Eye Tracking Test</h1>

      {!webcamEnabled ? (
        <div className="max-w-md mx-auto text-center bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4">Camera Access Required</h2>
          <p className="mb-6 text-gray-600 dark:text-gray-300">
            This test requires access to your webcam to track eye movements. Please enable your
            camera when prompted.
          </p>
          <WebcamFeed className="h-48 mb-6" onStreamReady={handleStreamReady} />
          <p className="text-sm text-gray-500 mb-4">
            If you see your webcam feed above, please proceed. If not, check your camera
            permissions.
          </p>
        </div>
      ) : !testStarted ? (
        <div className="max-w-lg mx-auto text-center bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4">Instructions</h2>
          <div className="mb-4 h-48">
            <WebcamFeed className="h-full w-full" />
          </div>

          <div className="mb-6">
            <h3 className="text-lg font-medium mb-2 text-left">Test Settings</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 text-left mb-1">
                  Movement Pattern
                </label>
                <select
                  value={selectedPattern}
                  onChange={(e) => setSelectedPattern(e.target.value as TrackingPattern)}
                  className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-left"
                >
                  {patternOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 text-left mb-1">
                  Duration (seconds)
                </label>
                <select
                  value={testDuration}
                  onChange={(e) => setTestDuration(Number(e.target.value))}
                  className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800"
                >
                  <option value={30}>30 seconds</option>
                  <option value={60}>60 seconds</option>
                  <option value={90}>90 seconds</option>
                  <option value={120}>2 minutes</option>
                </select>
              </div>
            </div>
          </div>

          <ul className="text-left mb-6 space-y-2 text-gray-600 dark:text-gray-300">
            <li>• Position yourself approximately 50cm from the screen</li>
            <li>• Try to keep your head relatively still during the test</li>
            <li>• Follow the moving ball with your eyes only</li>
            <li>• The test will last for {testDuration} seconds</li>
            <li>• The ball will move in a {selectedPattern} pattern</li>
          </ul>

          <button
            onClick={startTest}
            className="w-full px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
          >
            Start Test
          </button>
        </div>
      ) : (
        <div className="flex flex-col items-center">
          <div className="mb-4 text-center">
            <p className="text-lg font-medium">Follow the ball with your eyes</p>
          </div>

          <div className="flex flex-col md:flex-row items-center gap-4 mb-4">
            {/* Video feed (small) */}
            <div className="h-32 w-48">
              <WebcamFeed className="h-full w-full" />
            </div>

            {/* Instructions */}
            <div className="bg-blue-50 dark:bg-blue-900/30 p-4 rounded-lg max-w-xs">
              <h3 className="font-medium text-blue-700 dark:text-blue-300">During the test:</h3>
              <ul className="text-sm text-blue-700 dark:text-blue-300 list-disc pl-5 space-y-1 mt-2">
                <li>Keep your head still</li>
                <li>Follow the ball with your eyes only</li>
                <li>Try to maintain focus throughout the test</li>
              </ul>
            </div>
          </div>

          {/* Test area */}
          <EyeTrackingBox
            size={testAreaSize}
            ballSize={ballSize}
            duration={testDuration}
            pattern={selectedPattern}
            onComplete={handleTestComplete}
            onPositionChange={handlePositionChange}
          />

          <button
            onClick={stopTest}
            className="mt-6 px-6 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
          >
            Cancel Test
          </button>
        </div>
      )}

      <div className="mt-8">
        <Link
          href="/dashboard"
          className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-md hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
        >
          Back to Dashboard
        </Link>
      </div>
    </div>
  );
}
