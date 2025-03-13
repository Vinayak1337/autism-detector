'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { EyeTrackingOptions } from '../useEyeTracking';
import { Point } from '../AnimatedBall';

interface UseTrackingManagerProps {
  isTracking: boolean;
  isModelLoading: boolean;
  isWebcamLoading: boolean;
  trackingError: string | null;
  startTracking: () => Promise<void>;
  stopTracking: () => void;
  webcamRef: React.RefObject<HTMLVideoElement | null>;
  isPermissionGranted: boolean | null;
  setEyeDetected: (detected: boolean) => void;
  onEyeDetected?: (detected: boolean) => void;
  testPhase?: 'intro' | 'ready' | 'testing' | 'results';
}

export function useTrackingManager({
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
}: UseTrackingManagerProps) {
  const [setupAttempts, setSetupAttempts] = useState(0);
  const [faceDetected, setFaceDetected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const prevTrackingErrorRef = useRef<string | null>(null);
  const lastDetectionTimeRef = useRef<number>(0);
  const detectionDebounceTimeMs = 1000; // 1 second debounce

  // Add retry mechanism for webcam setup
  useEffect(() => {
    // Force an initial tracking attempt when component mounts and permission is granted
    if (isPermissionGranted && !isTracking && setupAttempts === 0) {
      console.log('Initial webcam setup attempt after permission granted');
      startTracking().catch((err) => {
        console.error('Initial tracking attempt failed:', err);
        // Increment setup attempts to trigger the retry mechanism
        setSetupAttempts(1);
      });
    }

    // Retry logic for subsequent attempts
    if (
      isPermissionGranted &&
      !isTracking &&
      !isModelLoading &&
      setupAttempts > 0 &&
      setupAttempts < 3
    ) {
      console.log(`Scheduling retry webcam setup, attempt ${setupAttempts + 1}`);

      const timer = setTimeout(() => {
        console.log(`Executing retry webcam setup, attempt ${setupAttempts + 1}`);
        // Force reset any existing streams
        if (webcamRef.current && webcamRef.current.srcObject) {
          const stream = webcamRef.current.srcObject as MediaStream;
          stream.getTracks().forEach((track) => {
            track.stop();
          });
          webcamRef.current.srcObject = null;
        }

        setSetupAttempts((prev) => prev + 1);
        startTracking().catch((err) => {
          console.error('Retry tracking failed:', err);
        });
      }, 2000);

      return () => clearTimeout(timer);
    }
  }, [isPermissionGranted, isModelLoading, setupAttempts, isTracking, startTracking, webcamRef]);

  // Add camera activity monitoring
  useEffect(() => {
    // Skip if we're not tracking or webcam isn't ready
    if (!isTracking || !webcamRef.current || !webcamRef.current.srcObject) {
      return;
    }

    console.log('Setting up camera activity monitoring');
    let isActive = true; // Flag to prevent updates after unmount

    // Function to check if camera is still active
    const checkCameraActive = () => {
      if (!isActive || !webcamRef.current || !webcamRef.current.srcObject) {
        console.warn('Camera reference lost during activity check');
        if (isActive) {
          setFaceDetected(false);
          setEyeDetected(false);
        }
        return;
      }

      const stream = webcamRef.current.srcObject as MediaStream;
      const videoTracks = stream.getVideoTracks();

      if (videoTracks.length === 0 || videoTracks[0].readyState !== 'live') {
        console.warn('Camera track is no longer active, attempting to restart');
        if (isActive) {
          setFaceDetected(false);
          setEyeDetected(false);

          // Attempt to restart tracking
          startTracking().catch((err) => {
            if (isActive) {
              console.error('Failed to restart tracking after camera became inactive:', err);
            }
          });
        }
      }
    };

    // Check periodically
    const activityCheckInterval = setInterval(checkCameraActive, 3000);

    return () => {
      isActive = false;
      clearInterval(activityCheckInterval);
    };
  }, [isTracking, webcamRef, setEyeDetected, startTracking]);

  // Auto-start tracking when component mounts if permission is granted
  useEffect(() => {
    let isActive = true; // Flag to prevent state updates after unmount

    if (isPermissionGranted && !isModelLoading && !isWebcamLoading && !isTracking) {
      console.log('Auto-starting eye tracking');
      startTracking().catch((err) => {
        if (isActive) {
          console.error('Auto-start tracking failed:', err);
        }
      });
    }

    return () => {
      isActive = false;
      if (isTracking) {
        console.log('Stopping tracking on unmount');
        stopTracking();
      }
    };
  }, [
    isPermissionGranted,
    isModelLoading,
    isWebcamLoading,
    isTracking,
    startTracking,
    stopTracking,
  ]);

  // When test phase changes to testing, ensure tracking is active
  useEffect(() => {
    let isActive = true; // Flag to prevent updates after unmount

    if (
      testPhase === 'testing' &&
      isPermissionGranted &&
      !isTracking &&
      !isModelLoading &&
      !isWebcamLoading
    ) {
      console.log('Starting tracking due to test phase change');
      startTracking().catch((err) => {
        if (isActive) {
          console.error('Failed to start tracking on test phase change:', err);
        }
      });
    }

    return () => {
      isActive = false;
    };
  }, [testPhase, isPermissionGranted, isTracking, isModelLoading, isWebcamLoading, startTracking]);

  // If we get an error from tracking, update our error state
  useEffect(() => {
    if (trackingError) {
      // Only update if the error message has changed
      const newErrorMessage = `Tracking error: ${trackingError}`;

      if (prevTrackingErrorRef.current !== newErrorMessage) {
        prevTrackingErrorRef.current = newErrorMessage;
        setError(newErrorMessage);

        // These state updates are now only called when the error actually changes
        setFaceDetected(false);
        setEyeDetected(false);
        if (onEyeDetected) {
          onEyeDetected(false);
        }
      }
    }
  }, [trackingError, onEyeDetected, setEyeDetected]);

  // Manual retry function
  const handleRetry = () => {
    console.log('Manual retry requested');
    setSetupAttempts(0);
    setError(null);
    setFaceDetected(false);
    setEyeDetected(false);
    startTracking().catch(console.error);
  };

  // Memoize handleGazeMove to prevent recreation on every render
  const handleGazeMove = useCallback(
    (x: number, y: number, onGazeData?: (data: Point) => void) => {
      const gazePoint: Point = { x, y };

      // Call the component callback
      if (onGazeData) {
        onGazeData(gazePoint);
      }

      // Update face detection status - only if not already detected and not too recent
      const now = Date.now();
      if (!faceDetected && now - lastDetectionTimeRef.current > detectionDebounceTimeMs) {
        console.log('Face detected in gaze tracking');
        lastDetectionTimeRef.current = now;
        setFaceDetected(true);

        // Update global state
        setEyeDetected(true);

        // Call the component callback - add setTimeout to prevent sync loop
        if (onEyeDetected) {
          setTimeout(() => {
            onEyeDetected(true);
          }, 100);
        }
      }
    },
    [
      faceDetected,
      lastDetectionTimeRef,
      detectionDebounceTimeMs,
      setFaceDetected,
      setEyeDetected,
      onEyeDetected,
    ]
  );

  // Memoize mergeOptions to prevent recreation on every render
  const mergeOptions = useCallback(
    (options: EyeTrackingOptions, onGazeData?: (data: Point) => void): EyeTrackingOptions => {
      return {
        ...options,
        onGazeMove: (x, y) => handleGazeMove(x, y, onGazeData),
      };
    },
    [handleGazeMove]
  );

  return {
    faceDetected,
    setupAttempts,
    error,
    handleRetry,
    mergeOptions,
    isReady: !isModelLoading && !isWebcamLoading && isTracking,
  };
}
