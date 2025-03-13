'use client';

import { useCallback } from 'react';
import { analyzeEyeMovementData } from '../dataProcessing';
import { Point } from '../AnimatedBall';
import { TestPhase } from '../store';

interface UseTestCompletionProps {
  gazeData: Point[];
  targetPositions: Array<{ x: number; y: number }>;
  getConsistentTimestamps: (dataLength: number) => number[];
  setAnalysisResults: (results: any) => void;
  setTestPhase: (phase: TestPhase) => void;
}

export function useTestCompletion({
  gazeData,
  targetPositions,
  getConsistentTimestamps,
  setAnalysisResults,
  setTestPhase,
}: UseTestCompletionProps) {
  // Handle test completion with data analysis
  const handleTestComplete = useCallback(() => {
    // Check if we have enough data to analyze
    if (gazeData.length > 10 && targetPositions.length > 10) {
      try {
        // Get timestamps (either existing or generated)
        const timestamps = getConsistentTimestamps(gazeData.length);

        // Analyze eye movement data
        const results = analyzeEyeMovementData(gazeData, targetPositions, timestamps);

        // Store results and move to results phase
        setAnalysisResults(results);
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
  }, [gazeData, targetPositions, getConsistentTimestamps, setAnalysisResults, setTestPhase]);

  return {
    handleTestComplete,
  };
}
