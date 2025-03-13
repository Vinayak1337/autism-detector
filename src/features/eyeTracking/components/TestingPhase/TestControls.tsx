'use client';

import React from 'react';

interface TestControlsProps {
  gazeDataCount: number;
  onCancel: () => void;
}

export const TestControls: React.FC<TestControlsProps> = ({ gazeDataCount, onCancel }) => {
  return (
    <div className="p-4 bg-white bg-opacity-90 border-t border-gray-200 flex justify-between items-center">
      <div className="text-sm text-gray-600">
        <span className="font-medium">Progress:</span>
        <div className="w-32 h-2 bg-gray-200 rounded-full mt-1 overflow-hidden">
          <div
            className="h-full bg-indigo-600 transition-all duration-100"
            style={{
              width: `${Math.min((gazeDataCount / 300) * 100, 100)}%`,
            }}
          ></div>
        </div>
      </div>
      <button
        onClick={onCancel}
        className="px-4 py-2 bg-red-600 text-white rounded-lg shadow-sm hover:bg-red-700 transition-colors"
      >
        Cancel Test
      </button>
    </div>
  );
};
