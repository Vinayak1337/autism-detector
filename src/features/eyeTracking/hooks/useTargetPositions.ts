'use client';

import { useState } from 'react';

export function useTargetPositions() {
  const [targetPositions, setTargetPositions] = useState<Array<{ x: number; y: number }>>([]);
  const [testTimestamps, setTestTimestamps] = useState<number[]>([]);

  // Handler for recording ball position updates
  const handleBallPositionUpdate = (position: { x: number; y: number }) => {
    setTargetPositions((prev) => [...prev, position]);
    setTestTimestamps((prev) => [...prev, Date.now()]);
  };

  // Reset target positions and timestamps
  const resetPositions = () => {
    setTargetPositions([]);
    setTestTimestamps([]);
  };

  // Generate timestamps if needed (useful for analysis)
  const getConsistentTimestamps = (dataLength: number) => {
    return testTimestamps.length === dataLength
      ? testTimestamps
      : Array.from({ length: dataLength }, (_, i) => Date.now() - (dataLength - i) * 100);
  };

  return {
    targetPositions,
    testTimestamps,
    handleBallPositionUpdate,
    resetPositions,
    getConsistentTimestamps,
  };
}
