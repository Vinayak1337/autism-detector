'use client';

import React from 'react';

interface PermissionDeniedProps {
  isNoDevice: boolean;
  onRetry: () => void;
}

export const PermissionDenied: React.FC<PermissionDeniedProps> = ({ isNoDevice, onRetry }) => {
  return (
    <div className="p-4 bg-red-50 border border-red-200 rounded-md">
      <h3 className="text-lg font-medium text-red-800">Camera Access Required</h3>
      <p className="mt-2 text-sm text-red-700">
        {isNoDevice
          ? 'No camera device detected. Please connect a webcam to use the eye tracking feature.'
          : 'Please allow camera access to use the eye tracking feature. You can change this in your browser settings.'}
      </p>
      <button
        className="mt-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
        onClick={onRetry}
      >
        Retry Camera Access
      </button>
    </div>
  );
};
