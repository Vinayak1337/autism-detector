'use client';

import React from 'react';

interface ReadyPhaseProps {
  eyeDetected: boolean;
  onStartTest: () => void;
}

export const ReadyPhase: React.FC<ReadyPhaseProps> = ({ eyeDetected, onStartTest }) => {
  return (
    <div className="text-center">
      <h2 className="text-2xl font-bold mb-4">Ready to Begin</h2>
      <p className="mb-4">The test will take approximately 60 seconds to complete.</p>
      <p className="mb-4">Follow the ball with your eyes as it moves around the screen.</p>
      <p className="mb-6">Try not to move your head - just your eyes.</p>
      <button
        onClick={onStartTest}
        className="px-6 py-3 bg-indigo-600 text-white rounded-lg shadow-lg hover:bg-indigo-700 transition-colors"
        disabled={!eyeDetected}
      >
        Start Test
      </button>
      {!eyeDetected && (
        <p className="mt-4 text-amber-600">Please position your face in the camera view.</p>
      )}
    </div>
  );
};
