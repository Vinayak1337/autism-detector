'use client';

import React, { useRef } from 'react';
import { EyeTrackingComponent } from '../../EyeTrackingComponent';
import { EyeTrackingStats } from './EyeTrackingStats';
import { AnimationBox } from './AnimationBox';
import { TestControls } from './TestControls';
import { Point } from '../../AnimatedBall';

interface TestingPhaseProps {
  eyeDetected: boolean;
  gazeData: Point[];
  onGazeData: (data: Point) => void;
  onComplete: () => void;
  onCancel: () => void;
  onPositionUpdate: (position: { x: number; y: number }) => void;
  eyeStats: {
    eyesDetected: boolean;
    gazePointsCollected: number;
    accuracy: number;
    coverage: number;
    lastPosition: Point;
  };
}

export const TestingPhase: React.FC<TestingPhaseProps> = ({
  eyeDetected,
  gazeData,
  onGazeData,
  onComplete,
  onCancel,
  onPositionUpdate,
  eyeStats,
}) => {
  const animationBoxRef = useRef<HTMLDivElement>(null);

  return (
    <div className="relative w-full h-full flex flex-col">
      {/* Status header */}
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
          <span className="text-xs text-gray-500">({gazeData.length} data points collected)</span>
        </div>
      </div>

      {/* Webcam area */}
      <div className="w-full" style={{ height: '300px' }}>
        <EyeTrackingComponent
          width="100%"
          height="100%"
          testPhase="testing"
          onGazeData={onGazeData}
        />
      </div>

      {/* Stats panel */}
      <EyeTrackingStats
        eyesDetected={eyeStats.eyesDetected}
        gazePointsCollected={eyeStats.gazePointsCollected}
        accuracy={eyeStats.accuracy}
        coverage={eyeStats.coverage}
      />

      {/* Animation box */}
      <AnimationBox
        forwardedRef={animationBoxRef}
        onComplete={onComplete}
        onPositionUpdate={onPositionUpdate}
        lastPosition={eyeStats.lastPosition}
      />

      {/* Controls */}
      <TestControls gazeDataCount={gazeData.length} onCancel={onCancel} />
    </div>
  );
};
