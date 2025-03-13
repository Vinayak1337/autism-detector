'use client';

import React from 'react';
import { EyeTrackingComponent } from '../EyeTrackingComponent';

interface SetupPhaseProps {
  isCameraReady: boolean;
  eyeDetected: boolean;
  onProceed: () => void;
}

export const SetupPhase: React.FC<SetupPhaseProps> = ({
  isCameraReady,
  eyeDetected,
  onProceed,
}) => {
  return (
    <div className="text-center">
      <h2 className="text-2xl font-bold mb-4">Setting Up Camera</h2>
      <p className="mb-4">Please allow access to your webcam.</p>
      <div className="w-full max-w-lg mx-auto h-96 border-2 border-gray-300 rounded-lg overflow-hidden relative">
        <EyeTrackingComponent
          width="100%"
          height="100%"
          testPhase="setup"
          onEyeDetected={(detected) => {
            if (detected && isCameraReady) {
              onProceed();
            }
          }}
        />
      </div>

      <div className="mt-6 text-center">
        <div className="flex items-center justify-center mb-4 space-x-4">
          <div className="flex items-center">
            <div
              className={`h-3 w-3 rounded-full ${isCameraReady ? 'bg-green-500' : 'bg-gray-300'} mr-2`}
            ></div>
            <span className="text-sm">Camera Ready</span>
          </div>
          <div className="flex items-center">
            <div
              className={`h-3 w-3 rounded-full ${eyeDetected ? 'bg-green-500' : 'bg-gray-300'} mr-2`}
            ></div>
            <span className="text-sm">Eyes Detected</span>
          </div>
        </div>

        {isCameraReady && !eyeDetected && (
          <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
            <p className="text-amber-800 text-sm">
              Eyes not detected yet. Make sure your face is clearly visible in the camera view and
              there is sufficient lighting.
            </p>
          </div>
        )}

        {isCameraReady && (
          <button
            onClick={onProceed}
            className="mt-4 px-4 py-2 bg-indigo-500 text-white rounded hover:bg-indigo-600 transition-colors"
          >
            Continue Anyway
          </button>
        )}

        {!isCameraReady && (
          <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-blue-800 text-sm">
              Waiting for camera access. If you&apos;ve already allowed access but still see this
              message, try refreshing the page.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
