'use client';

import React from 'react';

interface ErrorStateProps {
  message: string;
  onRetry: () => void;
  isPermissionDenied?: boolean;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  message,
  onRetry,
  isPermissionDenied = false,
}) => {
  return (
    <div className="absolute inset-0 flex items-center justify-center bg-red-50 bg-opacity-75 z-10">
      <div className="text-center p-4 max-w-md">
        <p className="text-red-600 font-medium">{message}</p>
        <p className="text-xs text-gray-500 mt-1">
          {isPermissionDenied
            ? 'Please check your browser settings to enable camera access.'
            : 'Make sure your camera is connected and browser permissions are granted.'}
        </p>
        <button
          className="mt-2 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          onClick={onRetry}
        >
          Retry
        </button>
      </div>
    </div>
  );
};
