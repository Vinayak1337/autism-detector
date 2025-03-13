'use client';

import { useCallback } from 'react';
import { TestPhase } from '../store';

interface UseTestPhaseManagerProps {
  testPhase: TestPhase;
  setTestPhase: (phase: TestPhase) => void;
  startTest: () => void;
  endTest: () => void;
  resetPositions: () => void;
}

export function useTestPhaseManager({
  testPhase,
  setTestPhase,
  startTest,
  endTest,
  resetPositions,
}: UseTestPhaseManagerProps) {
  // Move to setup phase
  const handleStartSetup = useCallback(() => {
    setTestPhase('setup');
  }, [setTestPhase]);

  // Move to ready phase
  const handleProceedToReady = useCallback(() => {
    setTestPhase('ready');
  }, [setTestPhase]);

  // Start the actual test
  const handleStartTest = useCallback(() => {
    // Reset position data before starting
    resetPositions();
    startTest();
  }, [resetPositions, startTest]);

  // Cancel the test
  const handleCancelTest = useCallback(() => {
    endTest();
  }, [endTest]);

  // Restart from beginning
  const handleRestart = useCallback(() => {
    setTestPhase('intro');
    resetPositions();
  }, [setTestPhase, resetPositions]);

  return {
    testPhase,
    handleStartSetup,
    handleProceedToReady,
    handleStartTest,
    handleCancelTest,
    handleRestart,
    isTestActive: testPhase === 'testing',
  };
}
