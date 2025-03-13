'use client';

import React, { useState } from 'react';
import { PermissionStatus } from '../hooks/useCameraPermission';

interface DebugPanelProps {
  webcamRef: React.RefObject<HTMLVideoElement | null>;
  isCameraReady: boolean;
  isModelLoading: boolean;
  isWebcamLoading: boolean;
  isTracking: boolean;
  faceDetected: boolean;
  setupAttempts: number;
  permissionStatus: PermissionStatus;
  error: string | null;
  onRetry: () => void;
  onEnableDummyDetector: () => void;
  onEnableStableDetector: () => void;
}

export const DebugPanel: React.FC<DebugPanelProps> = ({
  webcamRef,
  isCameraReady,
  isModelLoading,
  isWebcamLoading,
  isTracking,
  faceDetected,
  setupAttempts,
  permissionStatus,
  error,
  onRetry,
  onEnableDummyDetector,
  onEnableStableDetector,
}) => {
  const [showDebugInfo, setShowDebugInfo] = useState(false);

  const toggleDebugInfo = () => {
    setShowDebugInfo(!showDebugInfo);
  };

  // Debug button at the bottom right
  return (
    <>
      <button
        onClick={toggleDebugInfo}
        className="absolute bottom-2 right-2 bg-gray-700 text-white text-xs px-2 py-1 rounded-md opacity-50 hover:opacity-100 z-20"
        style={{ fontSize: '10px' }}
      >
        {showDebugInfo ? 'Hide Debug' : 'Show Debug'}
      </button>

      {showDebugInfo && (
        <div
          className="absolute bottom-10 right-2 bg-gray-800 text-white p-2 rounded-md text-xs z-20 w-64"
          style={{ maxHeight: '300px', overflow: 'auto' }}
        >
          <h4 className="font-bold mb-1">Debug Info:</h4>
          <p>Camera Ready: {isCameraReady ? 'Yes' : 'No'}</p>
          <p>Model Loading: {isModelLoading ? 'Yes' : 'No'}</p>
          <p>Webcam Loading: {isWebcamLoading ? 'Yes' : 'No'}</p>
          <p>Tracking: {isTracking ? 'Yes' : 'No'}</p>
          <p>Eye Detected: {faceDetected ? 'Yes' : 'No'}</p>
          <p>Setup Attempts: {setupAttempts}</p>
          <p>Permission: {permissionStatus}</p>
          <p>
            TF Loaded:{' '}
            {typeof window !== 'undefined' &&
            (window as Window & typeof globalThis & { tf?: unknown }).tf
              ? 'Yes'
              : 'No'}
          </p>
          <p>Video Element: {webcamRef.current ? 'Available' : 'Not Available'}</p>
          <p>Video Playing: {webcamRef.current && !webcamRef.current.paused ? 'Yes' : 'No'}</p>
          <p>
            Video Size:{' '}
            {webcamRef.current
              ? `${webcamRef.current.videoWidth}x${webcamRef.current.videoHeight}`
              : 'Unknown'}
          </p>
          {error && <p className="text-red-400">Error: {error}</p>}
          <div className="mt-2 flex flex-col space-y-2">
            <button
              onClick={() => {
                console.log('Camera Ready:', isCameraReady);
                console.log('Model Loading:', isModelLoading);
                console.log(
                  'WebGL Support:',
                  typeof document !== 'undefined' &&
                    typeof (
                      document.createElement('canvas').getContext('webgl') ||
                      document.createElement('canvas').getContext('experimental-webgl')
                    ) !== 'undefined'
                    ? 'Yes'
                    : 'No'
                );

                // Additional diagnostic info
                console.log('Browser:', navigator.userAgent);

                // Safely log TensorFlow backend if available
                if (typeof window !== 'undefined') {
                  const tfWindow = window as Window &
                    typeof globalThis & {
                      tf?: { getBackend?: () => string };
                    };
                  if (tfWindow.tf && tfWindow.tf.getBackend) {
                    console.log('TensorFlow backend:', tfWindow.tf.getBackend());
                  }
                }

                // Log video element info
                if (webcamRef.current) {
                  console.log('Video element details:', {
                    videoWidth: webcamRef.current.videoWidth,
                    videoHeight: webcamRef.current.videoHeight,
                    readyState: webcamRef.current.readyState,
                    paused: webcamRef.current.paused,
                    ended: webcamRef.current.ended,
                    muted: webcamRef.current.muted,
                    error: webcamRef.current.error,
                  });

                  // Check stream status
                  if (webcamRef.current.srcObject) {
                    const stream = webcamRef.current.srcObject as MediaStream;
                    console.log('Stream details:', {
                      active: stream.active,
                      id: stream.id,
                      tracks: stream.getTracks().map((t) => ({
                        kind: t.kind,
                        id: t.id,
                        label: t.label,
                        enabled: t.enabled,
                        readyState: t.readyState,
                      })),
                    });
                  } else {
                    console.log('No stream attached to video element');
                  }
                }
              }}
              className="bg-blue-600 text-white px-2 py-1 rounded text-xs"
            >
              Log Debug Info
            </button>
            <button onClick={onRetry} className="bg-green-600 text-white px-2 py-1 rounded text-xs">
              Retry Setup
            </button>
            <button
              onClick={onEnableDummyDetector}
              className="bg-yellow-600 text-white px-2 py-1 rounded text-xs"
            >
              Use Test Detector
            </button>
            <button
              onClick={onEnableStableDetector}
              className="bg-purple-600 text-white px-2 py-1 rounded text-xs"
            >
              Use Stable Detector
            </button>
          </div>
        </div>
      )}
    </>
  );
};
