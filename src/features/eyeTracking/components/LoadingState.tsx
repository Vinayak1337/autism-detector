'use client';

import React from 'react';

interface LoadingStateProps {
  isModelLoading: boolean;
  isWebcamLoading: boolean;
  setupAttempts: number;
  onRetry: () => void;
  onEnableDummyDetector: () => void;
  onEnableStableDetector: () => void;
}

export const LoadingState: React.FC<LoadingStateProps> = ({
  isModelLoading,
  isWebcamLoading,
  setupAttempts,
  onRetry,
  onEnableDummyDetector,
  onEnableStableDetector,
}) => {
  return (
    <div className="absolute inset-0 flex items-center justify-center bg-gray-100 bg-opacity-75 z-10">
      <div className="text-center">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-gray-300 border-t-blue-600"></div>
        <p className="mt-2 text-sm text-gray-800 font-medium">
          {isModelLoading ? 'Loading eye tracking model...' : 'Setting up webcam...'}
        </p>
        {isModelLoading && (
          <p className="text-xs text-gray-600 mt-1">This may take a moment. Please wait...</p>
        )}
        {isWebcamLoading && setupAttempts > 0 && (
          <p className="text-xs text-gray-600 mt-1">Attempt {setupAttempts} of 3</p>
        )}
        <div className="mt-3 flex flex-col space-y-2">
          {isWebcamLoading && setupAttempts > 1 && (
            <button
              className="px-3 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600"
              onClick={onRetry}
            >
              Retry Webcam Setup
            </button>
          )}
          <button
            className="px-3 py-1 text-xs bg-green-500 text-white rounded hover:bg-green-600"
            onClick={onRetry}
          >
            Retry Setup
          </button>
          <button
            className="px-3 py-1 text-xs bg-yellow-600 text-white rounded hover:bg-yellow-700"
            onClick={onEnableDummyDetector}
          >
            Use Test Detector
          </button>
          <button
            className="px-3 py-1 text-xs bg-purple-600 text-white rounded hover:bg-purple-700"
            onClick={onEnableStableDetector}
          >
            Use Stable Detector
          </button>
        </div>
      </div>
    </div>
  );
}; 