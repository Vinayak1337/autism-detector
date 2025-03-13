'use client';

import React, { useState } from 'react';
import { LiveEyeTracker } from './LiveEyeTracker';

interface PreparationPhaseProps {
  onStart: () => void;
}

export const PreparationPhase: React.FC<PreparationPhaseProps> = ({ onStart }) => {
  const [showEyeTracker, setShowEyeTracker] = useState(true);

  return (
    <div className="text-center">
      <h1 className="text-3xl font-bold mb-6">Get Ready</h1>

      <div className="bg-indigo-50 p-6 rounded-lg shadow-sm mb-8 max-w-2xl mx-auto">
        <h2 className="text-xl font-semibold mb-4">Instructions:</h2>
        <ul className="text-left list-disc pl-6 space-y-2 mb-4">
          <li>Ensure you&apos;re in a well-lit environment with minimal glare on your screen</li>
          <li>Position yourself approximately 20-30 inches (50-75 cm) from your screen</li>
          <li>Try to keep your head relatively still during the test</li>
          <li>Follow the moving ball with your eyes without moving your head</li>
          <li>The test will take approximately 30-60 seconds to complete</li>
        </ul>
      </div>

      {/* Eye tracker display */}
      <div className="mb-8">
        <div className="flex justify-center items-center gap-4 mb-4">
          <p className="font-medium">Eye tracking status:</p>
          <button
            onClick={() => setShowEyeTracker(!showEyeTracker)}
            className="px-3 py-1 text-sm bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-lg transition-colors"
          >
            {showEyeTracker ? 'Hide Tracker' : 'Show Tracker'}
          </button>
        </div>

        {showEyeTracker && (
          <div className="flex justify-center mb-4">
            <LiveEyeTracker width={320} height={240} />
          </div>
        )}

        <p className="text-sm text-gray-600 mt-2">
          Make sure your eyes are detected before starting the test. Your eyes should appear as a
          dot on the tracker above.
        </p>
      </div>

      <button
        onClick={onStart}
        className="px-6 py-3 bg-indigo-600 text-white rounded-lg shadow-lg hover:bg-indigo-700 transition-colors"
      >
        Start Test
      </button>
    </div>
  );
};
