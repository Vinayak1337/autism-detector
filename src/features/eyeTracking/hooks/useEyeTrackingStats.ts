'use client';

import { useState, useEffect } from 'react';
import { Point } from '../AnimatedBall';

interface EyeStats {
  eyesDetected: boolean;
  gazePointsCollected: number;
  accuracy: number;
  coverage: number;
  lastPosition: Point;
}

interface UseEyeTrackingStatsProps {
  gazeData: Point[];
  targetPositions: { x: number; y: number }[];
  eyeDetected: boolean;
  isTestActive: boolean;
}

export function useEyeTrackingStats({
  gazeData,
  targetPositions,
  eyeDetected,
  isTestActive,
}: UseEyeTrackingStatsProps) {
  // Initialize stats with default values
  const [eyeStats, setEyeStats] = useState<EyeStats>({
    eyesDetected: false,
    gazePointsCollected: 0,
    accuracy: 0,
    coverage: 0,
    lastPosition: { x: 50, y: 50 },
  });

  // Update stats when gaze data changes
  useEffect(() => {
    if (!isTestActive) return;

    let accuracy = 0;
    let coverage = 0;
    let lastPoint = { x: 0, y: 0 };

    if (gazeData.length > 0 && targetPositions.length > 0) {
      lastPoint = gazeData[gazeData.length - 1];

      // Calculate accuracy based on distance to target
      const targetPoint = targetPositions[targetPositions.length - 1];
      const distance = Math.sqrt(
        Math.pow(lastPoint.x - targetPoint.x, 2) + Math.pow(lastPoint.y - targetPoint.y, 2)
      );
      accuracy = Math.max(0, 100 - distance * 2);

      // Calculate coverage based on data points collected
      coverage = Math.min(100, (gazeData.length / 300) * 100);
    }

    // Only update if values have changed significantly
    if (
      eyeStats.eyesDetected !== eyeDetected ||
      eyeStats.gazePointsCollected !== gazeData.length ||
      Math.abs(eyeStats.accuracy - accuracy) > 1 ||
      Math.abs(eyeStats.coverage - coverage) > 1 ||
      eyeStats.lastPosition.x !== lastPoint.x ||
      eyeStats.lastPosition.y !== lastPoint.y
    ) {
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
  }, [gazeData, targetPositions, eyeDetected, isTestActive, eyeStats]);

  // Handle new gaze data
  const handleGazeData = (data: Point) => {
    setEyeStats((prev) => ({
      ...prev,
      lastPosition: data,
    }));
  };

  return {
    eyeStats,
    handleGazeData,
  };
}
