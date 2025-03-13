'use client';

import React from 'react';

interface ResultsPhaseProps {
  onRestart?: () => void;
}

export const ResultsPhase: React.FC<ResultsPhaseProps> = ({ onRestart }) => {
  return (
    <div className="text-center">
      <h2 className="text-2xl font-bold mb-4">Test Complete</h2>
      <p className="mb-4">Thank you for completing the eye tracking test.</p>
      <p className="mb-6">Processing your results...</p>
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600 mx-auto mb-8"></div>

      {onRestart && (
        <button
          onClick={onRestart}
          className="px-6 py-3 bg-indigo-600 text-white rounded-lg shadow-lg hover:bg-indigo-700 transition-colors mt-4"
        >
          Start New Test
        </button>
      )}
    </div>
  );
};
