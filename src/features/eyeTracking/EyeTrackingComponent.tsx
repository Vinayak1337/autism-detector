'use client';

import React from 'react';
import { WebcamFeed } from './components/WebcamFeed';
import { useRef, useState, useEffect, useCallback, useMemo } from 'react';
import { createFaceLandmarksDetector, FaceLandmarksDetector } from './faceLandmarkUtils';
import { useEyeTrackingStore } from './store';
import { Point } from './AnimatedBall';

interface EyeTrackingComponentProps {
  width?: string | number;
  height?: string | number;
  testPhase?: string;
  onGazeData?: (point: Point) => void;
  onEyeDetected?: (detected: boolean) => void;
}

// This component is now a wrapper around WebcamFeed for backward compatibility
export const EyeTrackingComponent: React.FC<EyeTrackingComponentProps> = ({
  width = '100%',
  height = '100%',
  testPhase = 'setup',
  onGazeData,
  onEyeDetected,
}) => {
  // Convert testPhase to the format expected by WebcamFeed
  const phase = testPhase === 'testing' ? 'testing' : 'setup';

  // Pass all props to the new WebcamFeed component
  return (
    <WebcamFeed
      phase={phase}
      onGazeData={onGazeData}
      onEyeDetected={onEyeDetected}
      containerStyle={{
        width,
        height,
      }}
    />
  );
};
