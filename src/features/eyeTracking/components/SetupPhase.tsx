'use client';

import React, { useState, useEffect, useRef } from 'react';
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
  // Add state to track if we're transitioning to prevent multiple calls
  const [isTransitioning, setIsTransitioning] = useState(false);
  const hasAutoProceededRef = useRef(false);
  const proceedTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Clean up timeout on unmount
  useEffect(() => {
    return () => {
      if (proceedTimeoutRef.current) {
        clearTimeout(proceedTimeoutRef.current);
        proceedTimeoutRef.current = null;
      }
    };
  }, []);

  // Use an effect to handle the transition with a delay
  useEffect(() => {
    // Only proceed if we're not already transitioning, camera is ready, eyes are detected
    // and we haven't auto-proceeded before
    if (eyeDetected && isCameraReady && !isTransitioning && !hasAutoProceededRef.current) {
      // Mark as transitioning immediately to prevent multiple triggers
      setIsTransitioning(true);
      hasAutoProceededRef.current = true;

      // Use ref to track the timeout for cleanup
      proceedTimeoutRef.current = setTimeout(() => {
        onProceed();
        proceedTimeoutRef.current = null;
      }, 1000);
    }
  }, [eyeDetected, isCameraReady, onProceed, isTransitioning]);

  // Safe handler for manual proceed
  const handleManualProceed = () => {
    if (!isTransitioning) {
      // Prevent multiple clicks
      setIsTransitioning(true);

      // Clear any existing auto-proceed timeout
      if (proceedTimeoutRef.current) {
        clearTimeout(proceedTimeoutRef.current);
        proceedTimeoutRef.current = null;
      }

      // Mark as proceeded to prevent auto-proceed
      hasAutoProceededRef.current = true;

      // Call proceed
      onProceed();
    }
  };

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
            // Don't call onProceed directly here - the useEffect will handle it
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

        {isCameraReady && !eyeDetected && !isTransitioning && (
          <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
            <p className="text-amber-800 text-sm">
              Eyes not detected yet. Make sure your face is clearly visible in the camera view and
              there is sufficient lighting.
            </p>
          </div>
        )}

        {isTransitioning && (
          <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-green-800 text-sm">
              Camera setup complete. Proceeding to next step...
            </p>
          </div>
        )}

        {isCameraReady && !isTransitioning && (
          <button
            onClick={handleManualProceed}
            disabled={isTransitioning}
            className={`mt-4 px-4 py-2 bg-indigo-500 text-white rounded hover:bg-indigo-600 transition-colors ${
              isTransitioning ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            Continue Anyway
          </button>
        )}

        {!isCameraReady && !isTransitioning && (
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
