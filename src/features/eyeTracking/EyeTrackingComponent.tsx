'use client';

import React, { useState, useEffect } from 'react';
import { useEyeTracking, EyeTrackingOptions } from './useEyeTracking';

interface EyeTrackingComponentProps {
  options?: EyeTrackingOptions;
  onGazeData?: (x: number, y: number) => void;
  width?: string | number;
  height?: string | number;
}

export const EyeTrackingComponent: React.FC<EyeTrackingComponentProps> = ({
  options = {},
  onGazeData,
  width = '100%',
  height = 'auto',
}) => {
  const [isPermissionGranted, setIsPermissionGranted] = useState<boolean | null>(null);

  // Merge options with callback
  const mergedOptions: EyeTrackingOptions = {
    ...options,
    onGazeMove: onGazeData,
  };

  const {
    isModelLoading,
    isWebcamLoading,
    isTracking,
    error,
    webcamRef,
    canvasRef,
    startTracking,
    stopTracking,
  } = useEyeTracking(mergedOptions);

  // Check for webcam permission
  useEffect(() => {
    async function checkPermission() {
      try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const videoDevices = devices.filter((device) => device.kind === 'videoinput');

        if (videoDevices.length === 0) {
          setIsPermissionGranted(false);
          return;
        }

        // Try to access the camera
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        setIsPermissionGranted(true);

        // Stop the stream immediately since we're just checking permission
        stream.getTracks().forEach((track) => track.stop());
      } catch (err) {
        setIsPermissionGranted(false);
      }
    }

    checkPermission();
  }, []);

  // Handle permission denied
  if (isPermissionGranted === false) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-md">
        <h3 className="text-lg font-medium text-red-800">Camera Access Required</h3>
        <p className="mt-2 text-sm text-red-700">
          Please allow camera access to use the eye tracking feature. You can change this in your
          browser settings.
        </p>
      </div>
    );
  }

  return (
    <div className="relative" style={{ width, height }}>
      {/* Loading states */}
      {(isModelLoading || isWebcamLoading) && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 bg-opacity-75 z-10">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-gray-300 border-t-blue-600"></div>
            <p className="mt-2 text-sm text-gray-600">
              {isModelLoading ? 'Loading eye tracking model...' : 'Setting up webcam...'}
            </p>
          </div>
        </div>
      )}

      {/* Error message */}
      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-red-50 bg-opacity-75 z-10">
          <div className="text-center p-4">
            <p className="text-red-600">{error}</p>
            <button
              className="mt-2 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
              onClick={() => window.location.reload()}
            >
              Reload
            </button>
          </div>
        </div>
      )}

      {/* Video and canvas container */}
      <div className="relative w-full h-full">
        {/* Webcam video (hidden but needed for detection) */}
        <video
          ref={webcamRef}
          autoPlay
          playsInline
          muted
          className="absolute inset-0 w-full h-full object-cover"
          style={{ opacity: isTracking ? 1 : 0.7 }}
        />

        {/* Canvas overlay for drawing */}
        <canvas ref={canvasRef} className="absolute inset-0 w-full h-full object-cover z-10" />

        {/* Controls */}
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 z-20 flex space-x-2">
          {!isTracking ? (
            <button
              onClick={startTracking}
              disabled={isModelLoading || isWebcamLoading}
              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              Start Tracking
            </button>
          ) : (
            <button
              onClick={stopTracking}
              className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
            >
              Stop Tracking
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
