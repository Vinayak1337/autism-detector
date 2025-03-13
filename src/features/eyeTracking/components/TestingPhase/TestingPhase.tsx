'use client';

import React, { useRef } from 'react';
import { WebcamFeed } from '../WebcamFeed';
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
      <div
        style={{
          width: '100%',
          maxWidth: '32rem' /* max-w-lg = 32rem */,
          height: '384px' /* h-96 = 384px */,
          margin: '0 auto',
          position: 'relative',
          overflow: 'hidden',
          borderRadius: '0.5rem',
          border: '2px solid #d1d5db',
        }}
      >
        <WebcamFeed
          phase="testing"
          containerStyle={{
            border: 'none',
            borderRadius: '0',
          }}
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
