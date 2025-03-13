'use client';

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useEyeTracking, EyeTrackingOptions } from './useEyeTracking';
import { useEyeTrackingStore } from './store';
import { Point } from './AnimatedBall';
import { useCameraPermission, PermissionStatus } from './hooks/useCameraPermission';
import { useTrackingManager } from './hooks/useTrackingManager';
import { enableDummyDetector } from './modelCache';

// UI Components
import { DebugPanel } from './components/DebugPanel';
import { ErrorState } from './components/ErrorState';
import { LoadingState } from './components/LoadingState';
import { PermissionDenied } from './components/PermissionDenied';
import { GazeIndicator } from './components/GazeIndicator';

// Declare the window property for typescript
declare global {
  interface Window {
    _hasPrintedPredictions?: boolean;
    _useDummyDetector?: boolean;
    _dummyDetectorStable?: boolean;
  }
}

interface EyeTrackingComponentProps {
  options?: EyeTrackingOptions;
  onGazeData?: (data: Point) => void;
  testPhase?: 'intro' | 'ready' | 'testing' | 'results';
  onEyeDetected?: (detected: boolean) => void;
  width?: string | number;
  height?: string | number;
}

export const EyeTrackingComponent: React.FC<EyeTrackingComponentProps> = ({
  options = {},
  onGazeData,
  testPhase,
  onEyeDetected,
  width = '100%',
  height = 'auto',
}) => {
  // Access the global store
  const setIsCameraReady = useEyeTrackingStore((state) => state.setIsCameraReady);
  const isCameraReady = useEyeTrackingStore((state) => state.isCameraReady);
  const setEyeDetected = useEyeTrackingStore((state) => state.setEyeDetected);
  const gazeData = useEyeTrackingStore((state) => state.gazeData);

  // Use the last gaze point from the store if available
  const lastGazePoint = gazeData.length > 0 ? gazeData[gazeData.length - 1] : { x: 50, y: 50 };

  // Add state for current gaze position
  const [currentGazeX, setCurrentGazeX] = useState(lastGazePoint.x);
  const [currentGazeY, setCurrentGazeY] = useState(lastGazePoint.y);

  // Prepare the merged options for tracking
  const [mergedOptions, setMergedOptions] = useState<EyeTrackingOptions>(options);

  // Use the camera permission hook
  const { isPermissionGranted, permissionStatus, checkPermission } =
    useCameraPermission(setIsCameraReady);

  // Use the eye tracking hook with the current options
  const {
    isModelLoading,
    isWebcamLoading,
    isTracking,
    error: trackingError,
    webcamRef,
    canvasRef,
    startTracking,
    stopTracking,
  } = useEyeTracking(mergedOptions);

  // Use the tracking manager hook
  const { faceDetected, setupAttempts, error, handleRetry, mergeOptions, isReady } =
    useTrackingManager({
      isTracking,
      isModelLoading,
      isWebcamLoading,
      trackingError,
      startTracking,
      stopTracking,
      webcamRef,
      isPermissionGranted,
      setEyeDetected,
      onEyeDetected,
      testPhase,
    });

  // Use ref to track previous options to prevent unnecessary updates
  const prevOptionsRef = useRef(options);
  const prevOnGazeDataRef = useRef(onGazeData);

  // Memoize the gaze data handler to prevent recreation on every render
  const handleGazeData = useCallback(
    (data: Point) => {
      // Update current gaze position
      setCurrentGazeX(data.x);
      setCurrentGazeY(data.y);

      // Forward the data to the parent component
      if (onGazeData) {
        onGazeData(data);
      }
    },
    [onGazeData]
  );

  // Use memoized merged options
  const memoizedMergedOptions = useMemo(() => {
    // Only recreate if options or onGazeData changed
    if (options !== prevOptionsRef.current || onGazeData !== prevOnGazeDataRef.current) {
      prevOptionsRef.current = options;
      prevOnGazeDataRef.current = onGazeData;
      return mergeOptions(options, handleGazeData);
    }
    return mergedOptions;
  }, [options, onGazeData, handleGazeData, mergeOptions, mergedOptions]);

  // Update merged options only when the memoized value changes
  useEffect(() => {
    // Avoid unnecessary state updates
    if (JSON.stringify(memoizedMergedOptions) !== JSON.stringify(mergedOptions)) {
      setMergedOptions(memoizedMergedOptions);
    }
  }, [memoizedMergedOptions, mergedOptions]);

  // Helper function to check if permission status is an error state
  const isPermissionError = (status: PermissionStatus): boolean => {
    return status === 'denied' || status === 'no-device';
  };

  // Use ref to prevent multiple timeouts
  const forceShowTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Enable dummy detector for testing
  const enableDummyDetectorHandler = () => {
    console.log('Force continuing to UI using dummy detector');
    enableDummyDetector();
    handleRetry();
  };

  // Enable stable dummy detector for testing
  const enableStableDetector = () => {
    console.log('Force continuing to UI using stable dummy detector');
    window._useDummyDetector = true;
    window._dummyDetectorStable = true;
    handleRetry();
  };

  // Add a timeout effect to force-show the interface if camera is ready
  useEffect(() => {
    if (isCameraReady && !isReady && !forceShowTimeoutRef.current) {
      // Force the interface to show after 5 seconds if camera is ready
      forceShowTimeoutRef.current = setTimeout(() => {
        if (!isReady && isCameraReady) {
          console.log('Forcing UI to show since camera is ready but isReady is still false');
          // Enable the dummy detector
          if (typeof window !== 'undefined' && !window._useDummyDetector) {
            window._useDummyDetector = true;
            console.log('Force enabled dummy detector due to timeout');
            // Add debounce to prevent rapid state changes
            setTimeout(() => {
              handleRetry();
            }, 500);
          }
        }
        forceShowTimeoutRef.current = null;
      }, 5000);

      return () => {
        if (forceShowTimeoutRef.current) {
          clearTimeout(forceShowTimeoutRef.current);
          forceShowTimeoutRef.current = null;
        }
      };
    }
  }, [isCameraReady, isReady, handleRetry]);

  // Handle permission denied state
  if (isPermissionGranted === false || isPermissionError(permissionStatus)) {
    return (
      <PermissionDenied isNoDevice={permissionStatus === 'no-device'} onRetry={checkPermission} />
    );
  }

  return (
    <div className="relative" style={{ width, height }}>
      {/* Loading states */}
      {(!isCameraReady || isModelLoading) && (
        <LoadingState
          isModelLoading={isModelLoading}
          isWebcamLoading={isWebcamLoading}
          setupAttempts={setupAttempts}
          onRetry={handleRetry}
          onEnableDummyDetector={enableDummyDetectorHandler}
          onEnableStableDetector={enableStableDetector}
        />
      )}

      {/* Error message */}
      {error && (
        <ErrorState
          message={error}
          onRetry={handleRetry}
          isPermissionDenied={isPermissionError(permissionStatus)}
        />
      )}

      {/* Video and canvas container */}
      <div className="relative w-full h-full">
        {/* Webcam video */}
        <video
          ref={webcamRef}
          style={{
            position: 'absolute',
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            visibility: 'visible',
            opacity: 0.9,
          }}
          autoPlay
          playsInline
          muted
        />

        {/* Canvas for drawing eye tracking visualization */}
        <canvas
          ref={canvasRef}
          style={{
            position: 'absolute',
            width: '100%',
            height: '100%',
            zIndex: 1,
          }}
        />

        {/* Gaze indicator */}
        <GazeIndicator
          faceDetected={faceDetected}
          currentGaze={{ x: currentGazeX, y: currentGazeY }}
        />

        {/* Debug panel */}
        <DebugPanel
          webcamRef={webcamRef}
          isCameraReady={isCameraReady}
          isModelLoading={isModelLoading}
          isWebcamLoading={isWebcamLoading}
          isTracking={isTracking}
          faceDetected={faceDetected}
          setupAttempts={setupAttempts}
          permissionStatus={permissionStatus}
          error={error}
          onRetry={handleRetry}
          onEnableDummyDetector={enableDummyDetectorHandler}
          onEnableStableDetector={enableStableDetector}
        />
      </div>
    </div>
  );
};
