'use client';

import React, { useState } from 'react';
import { EyeTrackingComponent } from '@/features/eyeTracking/EyeTrackingComponent';

export default function EyeTestPage() {
  const [gazeData, setGazeData] = useState<{ x: number; y: number } | null>(null);
  const [showInstructions, setShowInstructions] = useState(true);

  const handleGazeData = (x: number, y: number) => {
    setGazeData({ x, y });
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Eye Tracking Test</h1>

      {showInstructions && (
        <div className="bg-blue-50 p-4 rounded-md mb-6">
          <h2 className="text-xl font-semibold text-blue-800 mb-2">Instructions</h2>
          <ul className="list-disc pl-5 text-blue-700 space-y-2">
            <li>This test will track your eye movements using your webcam</li>
            <li>Make sure you are in a well-lit environment</li>
            <li>Position your face so it&apos;s clearly visible in the camera</li>
            <li>Try to keep your head relatively still during the test</li>
            <li>Click &quot;Start Tracking&quot; when you&apos;re ready to begin</li>
          </ul>
          <button
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            onClick={() => setShowInstructions(false)}
          >
            Got it
          </button>
        </div>
      )}

      <div className="bg-white rounded-lg shadow-lg overflow-hidden">
        <div className="aspect-video relative">
          <EyeTrackingComponent
            width="100%"
            height="100%"
            onGazeData={handleGazeData}
            options={{
              drawLandmarks: true,
              drawPath: true,
              pathColor: 'rgba(255, 0, 0, 0.5)',
              pathLength: 100,
            }}
          />
        </div>

        <div className="p-4 bg-gray-50 border-t">
          <h3 className="text-lg font-medium mb-2">Real-time Data</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white p-3 rounded border">
              <p className="text-sm text-gray-500">X Coordinate</p>
              <p className="text-xl font-mono">{gazeData ? Math.round(gazeData.x) : '-'}</p>
            </div>
            <div className="bg-white p-3 rounded border">
              <p className="text-sm text-gray-500">Y Coordinate</p>
              <p className="text-xl font-mono">{gazeData ? Math.round(gazeData.y) : '-'}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-8 bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-2xl font-bold mb-4">About Eye Tracking</h2>
        <p className="mb-4">
          Eye tracking technology uses computer vision and machine learning to detect and analyze
          eye movements. This can be useful for diagnosing certain conditions, including autism
          spectrum disorder.
        </p>
        <p className="mb-4">
          Research has shown that individuals with autism may exhibit different patterns of eye
          movement and visual attention compared to neurotypical individuals. These differences can
          sometimes be detected through eye tracking tests.
        </p>
        <p>
          This test uses TensorFlow.js and the MediaPipe FaceMesh model to track facial landmarks in
          real-time, with a focus on eye positions. The data collected is processed locally in your
          browser and is not sent to any server.
        </p>
      </div>
    </div>
  );
}
