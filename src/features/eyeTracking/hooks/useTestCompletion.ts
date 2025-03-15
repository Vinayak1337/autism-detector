'use client';

import { useCallback, useEffect, useRef } from 'react';
import { analyzeEyeMovementData, AnalysisResult } from '../dataProcessing';
import { Point } from '../AnimatedBall';
import { TestPhase } from '../store';

interface UseTestCompletionProps {
  gazeData: Point[];
  targetPositions: Array<{ x: number; y: number }>;
  getConsistentTimestamps: (dataLength: number) => number[];
  setAnalysisResults: (results: AnalysisResult) => void;
  setTestPhase: (phase: TestPhase) => void;
}

export function useTestCompletion({
  gazeData,
  targetPositions,
  getConsistentTimestamps,
  setAnalysisResults,
  setTestPhase,
}: UseTestCompletionProps) {
  // Ref to track the latest data for immediate analysis
  const latestGazeDataRef = useRef<Point[]>(gazeData);
  const latestTargetPositionsRef = useRef<Array<{ x: number; y: number }>>(targetPositions);

  // Sync props with refs whenever they change
  useEffect(() => {
    latestGazeDataRef.current = gazeData;
    console.log('Gaze data updated:', gazeData.length);
  }, [gazeData]);

  useEffect(() => {
    latestTargetPositionsRef.current = targetPositions;
    console.log('Target positions updated:', targetPositions.length);
  }, [targetPositions]);

  // Handle test completion with data analysis
  const handleTestComplete = useCallback(() => {
    // Use the latest data from refs to ensure we have the most up-to-date values
    const currentGazeData = latestGazeDataRef.current;
    const currentTargetPositions = latestTargetPositionsRef.current;

    console.log('Handling test completion with data:', {
      gazeDataLength: currentGazeData.length,
      targetPositionsLength: currentTargetPositions.length,
    });

    // Check if we have enough data to analyze (lowered threshold to 2 for debugging)
    if (currentGazeData.length > 2 && currentTargetPositions.length > 2) {
      try {
        // Get timestamps (either existing or generated)
        const timestamps = getConsistentTimestamps(currentGazeData.length);

        // Analyze eye movement data
        const results = analyzeEyeMovementData(currentGazeData, currentTargetPositions, timestamps);

        // Store results and move to results phase
        setAnalysisResults(results);
        setTestPhase('results');
      } catch (error) {
        console.error('Error analyzing eye movement data:', error);
        // Still show results screen even if analysis fails
        setTestPhase('results');
      }
    } else {
      console.warn('Not enough data to analyze', {
        gazeDataLength: currentGazeData.length,
        targetPositionsLength: currentTargetPositions.length,
      });
      // Show results screen anyway with a fallback message
      setTestPhase('results');
    }
  }, [getConsistentTimestamps, setAnalysisResults, setTestPhase]);

  return {
    handleTestComplete,
  };
}