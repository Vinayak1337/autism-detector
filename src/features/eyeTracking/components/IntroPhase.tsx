'use client';

import React from 'react';
import { TestPhase } from '../store';

interface IntroPhaseProps {
  onProceed: () => void;
}

export const IntroPhase: React.FC<IntroPhaseProps> = ({ onProceed }) => {
  return (
    <div className="text-center">
      <h1 className="text-3xl font-bold mb-6">Eye Tracking Test</h1>
      <p className="mb-4">
        This test will track your eye movements as you follow a moving ball on the screen.
      </p>
      <p className="mb-8">
        Please enable your webcam when prompted and look directly at the camera.
      </p>
      <button
        onClick={() => onProceed()}
        className="px-6 py-3 bg-indigo-600 text-white rounded-lg shadow-lg hover:bg-indigo-700 transition-colors"
      >
        Get Started
      </button>
    </div>
  );
};
