'use client';

import React, { useState } from 'react';
import { TestPhase } from '../store';
import { LiveEyeTracker } from './LiveEyeTracker';

interface IntroPhaseProps {
  onProceed: () => void;
}

export const IntroPhase: React.FC<IntroPhaseProps> = ({ onProceed }) => {
  const [showEyeTracker, setShowEyeTracker] = useState(false);

  return (
    <div className="text-center">
      <h1 className="text-3xl font-bold mb-6">Eye Tracking Test</h1>
      <p className="mb-4">
        This test will track your eye movements as you follow a moving ball on the screen.
      </p>
      <p className="mb-4">
        Please enable your webcam when prompted and look directly at the camera.
      </p>

      {/* Live eye tracker toggle */}
      <div className="mb-8">
        <button
          onClick={() => setShowEyeTracker(!showEyeTracker)}
          className="px-4 py-2 text-sm bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-lg transition-colors mb-4"
        >
          {showEyeTracker ? 'Hide Eye Tracker' : 'Test Your Webcam'}
        </button>

        {showEyeTracker && (
          <div className="mt-4 flex justify-center">
            <LiveEyeTracker width={320} height={240} />
          </div>
        )}
      </div>

      <button
        onClick={() => onProceed()}
        className="px-6 py-3 bg-indigo-600 text-white rounded-lg shadow-lg hover:bg-indigo-700 transition-colors"
      >
        Get Started
      </button>
    </div>
  );
};
