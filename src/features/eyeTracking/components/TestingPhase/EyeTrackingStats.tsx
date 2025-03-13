'use client';

import React from 'react';

interface EyeTrackingStatsProps {
  eyesDetected: boolean;
  gazePointsCollected: number;
  accuracy: number;
  coverage: number;
}

export const EyeTrackingStats: React.FC<EyeTrackingStatsProps> = ({
  eyesDetected,
  gazePointsCollected,
  accuracy,
  coverage,
}) => {
  return (
    <div className="bg-gray-50 p-4 border-t border-b border-gray-200">
      <h3 className="text-md font-semibold text-gray-700 mb-2">Eye Tracking Stats</h3>
      <div className="grid grid-cols-4 gap-2">
        <div className="bg-white p-2 rounded border border-gray-200">
          <div className="text-xs text-gray-500">Detection</div>
          <div className="font-medium flex items-center">
            <div
              className={`h-2 w-2 rounded-full mr-1 ${eyesDetected ? 'bg-green-500' : 'bg-red-500'}`}
            ></div>
            {eyesDetected ? 'Active' : 'Inactive'}
          </div>
        </div>
        <div className="bg-white p-2 rounded border border-gray-200">
          <div className="text-xs text-gray-500">Data Points</div>
          <div className="font-medium">{gazePointsCollected}</div>
        </div>
        <div className="bg-white p-2 rounded border border-gray-200">
          <div className="text-xs text-gray-500">Accuracy</div>
          <div className="font-medium">{accuracy.toFixed(1)}%</div>
        </div>
        <div className="bg-white p-2 rounded border border-gray-200">
          <div className="text-xs text-gray-500">Coverage</div>
          <div className="font-medium">{coverage.toFixed(1)}%</div>
        </div>
      </div>
    </div>
  );
};
