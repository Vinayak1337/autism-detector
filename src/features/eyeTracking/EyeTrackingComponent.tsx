'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useEyeTracking, EyeTrackingOptions } from './useEyeTracking';
import { useEyeTrackingStore } from './store';
import { Point } from './AnimatedBall';

interface EyeTrackingComponentProps {
  options?: EyeTrackingOptions;
  onGazeData?: (data: Point) => void;
  testPhase?: 'intro' | 'ready' | 'testing' | 'results';
  onEyeDetected?: (detected: boolean) => void;
  width?: string | number;
  height?: string | number;
}

// Declare the window property for typescript
declare global {
  interface Window {
    _hasPrintedPredictions?: boolean;
    _useDummyDetector?: boolean;
    _dummyDetectorStable?: boolean;
  }
}

export const EyeTrackingComponent: React.FC<EyeTrackingComponentProps> = ({
  options = {},
  onGazeData,
  testPhase,
  onEyeDetected,
  width = '100%',
  height = 'auto',
}) => {
  // Use the global store
  const setIsCameraReady = useEyeTrackingStore((state) => state.setIsCameraReady);
  const isCameraReady = useEyeTrackingStore((state) => state.isCameraReady);
  const setEyeDetected = useEyeTrackingStore((state) => state.setEyeDetected);
  const gazeData = useEyeTrackingStore((state) => state.gazeData);

  const [isPermissionGranted, setIsPermissionGranted] = useState<boolean | null>(null);
  const [setupAttempts, setSetupAttempts] = useState(0);
  const [permissionStatus, setPermissionStatus] = useState<string>('checking');
  const [error, setError] = useState<string | null>(null);
  const [faceDetected, setFaceDetected] = useState(false);
  const [showDebugInfo, setShowDebugInfo] = useState(false);

  // Use the last gaze point from the store if available
  const lastGazePoint = gazeData.length > 0 ? gazeData[gazeData.length - 1] : { x: 50, y: 50 };

  // Add state for current gaze position
  const [currentGazeX, setCurrentGazeX] = useState(lastGazePoint.x);
  const [currentGazeY, setCurrentGazeY] = useState(lastGazePoint.y);

  // Add a ref to track the previous tracking error
  const prevTrackingErrorRef = useRef<string | null>(null);

  // Create a function to check permission with useCallback
  const checkPermission = useCallback(async () => {
    try {
      setPermissionStatus('checking');
      console.log('Checking webcam permissions...');

      // Check if we can enumerate devices first
      console.log('Attempting to enumerate devices...');
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = devices.filter((device) => device.kind === 'videoinput');

      console.log(`Found ${videoDevices.length} video devices:`, videoDevices);

      if (videoDevices.length === 0) {
        console.log('No video devices found');
        setIsPermissionGranted(false);
        setIsCameraReady(false);
        setPermissionStatus('no-device');
        return;
      }

      // Try to access the camera
      setPermissionStatus('requesting');
      console.log('Requesting camera access...');

      const constraints = {
        video: {
          facingMode: 'user',
          width: { ideal: 640 },
          height: { ideal: 480 },
        },
      };

      console.log('Using constraints:', constraints);
      const stream = await navigator.mediaDevices.getUserMedia(constraints);

      console.log('Camera access granted:', stream);
      console.log('Video tracks:', stream.getVideoTracks().length);

      if (stream.getVideoTracks().length > 0) {
        const trackSettings = stream.getVideoTracks()[0].getSettings();
        console.log('Video track settings:', trackSettings);
        console.log('Video track constraints:', stream.getVideoTracks()[0].getConstraints());
        console.log('Video track capabilities:', stream.getVideoTracks()[0].getCapabilities());
      } else {
        console.warn('No video tracks found in the stream');
      }

      setIsPermissionGranted(true);
      setIsCameraReady(true);
      setPermissionStatus('granted');

      // Stop the stream immediately since we're just checking permission
      stream.getTracks().forEach((track) => {
        console.log(`Stopping check track: ${track.kind}, ID: ${track.id}, label: ${track.label}`);
        track.stop();
      });
    } catch (err) {
      console.error('Permission check failed:', err);
      const errorMessage = err instanceof Error ? err.message : String(err);
      console.error(`Error details: ${errorMessage}`);
      setIsPermissionGranted(false);
      setIsCameraReady(false);
      setPermissionStatus('denied');
      setError(`Camera access failed: ${errorMessage}`);
    }
  }, [setIsCameraReady]);

  // Merge options with callback
  const mergedOptions: EyeTrackingOptions = {
    ...options,
    onGazeMove: (x, y) => {
      const gazePoint: Point = { x, y };

      // Update current gaze position for the visual indicator
      setCurrentGazeX(x);
      setCurrentGazeY(y);

      // Call the component callback
      if (onGazeData) {
        onGazeData(gazePoint);
      }

      // Update face detection status - only if not already detected
      if (!faceDetected) {
        console.log('Face detected in gaze tracking');
        setFaceDetected(true);

        // Update global state
        setEyeDetected(true);

        // Call the component callback
        if (onEyeDetected) {
          onEyeDetected(true);
        }
      }
    },
  };

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

  // Check for webcam permission
  useEffect(() => {
    checkPermission();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Run only once on mount

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
      !isCameraReady &&
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPermissionGranted, isCameraReady, isModelLoading, setupAttempts, isTracking]);

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
          setIsCameraReady(false);
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
          setIsCameraReady(false);

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isTracking, webcamRef]); // Remove dependencies that could cause re-renders

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPermissionGranted, isModelLoading, isWebcamLoading, isTracking]); // Remove startTracking and stopTracking

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [testPhase, isPermissionGranted, isTracking, isModelLoading, isWebcamLoading]); // Remove startTracking

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

  // This determines if we should show the component or the loading screen
  // CHANGE: Now we only care if the model is loaded and webcam is set up,
  // not if eyes are detected
  const isReady = !isModelLoading && !isWebcamLoading && isTracking;

  // Manual retry function
  const handleRetry = () => {
    console.log('Manual retry requested');
    setSetupAttempts(0);
    setError(null);
    setFaceDetected(false);
    setEyeDetected(false);

    if (permissionStatus === 'denied') {
      // Try to re-request permission
      checkPermission();
    } else {
      startTracking().catch(console.error);
    }
  };

  // Toggle debug information display
  const toggleDebugInfo = () => {
    setShowDebugInfo((prev) => !prev);
  };

  // Add a timeout effect to force-show the interface if camera is ready
  useEffect(() => {
    if (isCameraReady && !isReady) {
      // Force the interface to show after 5 seconds if camera is ready
      const forceShowTimeout = setTimeout(() => {
        if (!isReady && isCameraReady) {
          console.log('Forcing UI to show since camera is ready but isReady is still false');
          // Instead of trying to set state variables directly, let's bypass the condition
          // by enabling the dummy detector which will make the UI show
          if (typeof window !== 'undefined' && !window._useDummyDetector) {
            window._useDummyDetector = true;
            console.log('Force enabled dummy detector due to timeout');
          }
        }
      }, 5000);

      return () => clearTimeout(forceShowTimeout);
    }
  }, [isCameraReady, isReady]);

  // Handle permission denied
  if (
    isPermissionGranted === false ||
    permissionStatus === 'denied' ||
    permissionStatus === 'no-device'
  ) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-md">
        <h3 className="text-lg font-medium text-red-800">Camera Access Required</h3>
        <p className="mt-2 text-sm text-red-700">
          {permissionStatus === 'no-device'
            ? 'No camera device detected. Please connect a webcam to use the eye tracking feature.'
            : 'Please allow camera access to use the eye tracking feature. You can change this in your browser settings.'}
        </p>
        <button
          className="mt-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          onClick={handleRetry}
        >
          Retry Camera Access
        </button>
      </div>
    );
  }

  return (
    <div className="relative" style={{ width, height }}>
      {/* Loading states - Only show loading if camera is not ready or if isReady but isModelLoading */}
      {(!isCameraReady || isModelLoading) && (
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
                  onClick={handleRetry}
                >
                  Retry Webcam Setup
                </button>
              )}
              <button
                className="px-3 py-1 text-xs bg-green-500 text-white rounded hover:bg-green-600"
                onClick={() => {
                  console.log('Retrying setup and enable dummy detector');
                  // Force the UI to show by enabling dummy detector
                  if (typeof window !== 'undefined') {
                    window._useDummyDetector = true;
                  }
                  handleRetry();
                }}
              >
                Retry Setup
              </button>
              <button
                className="px-3 py-1 text-xs bg-gray-500 text-white rounded hover:bg-gray-600"
                onClick={toggleDebugInfo}
              >
                {showDebugInfo ? 'Hide Debug Info' : 'Show Debug Info'}
              </button>
              <button
                className="px-3 py-1 text-xs bg-yellow-600 text-white rounded hover:bg-yellow-700"
                onClick={() => {
                  // Force the UI to show by enabling dummy detector
                  console.log('Force continuing to UI using dummy detector');
                  window._useDummyDetector = true;
                  handleRetry();
                }}
              >
                Use Test Detector
              </button>
              <button
                className="px-3 py-1 text-xs bg-purple-600 text-white rounded hover:bg-purple-700"
                onClick={() => {
                  // Force the UI to show by enabling stable dummy detector
                  console.log('Force continuing to UI using stable dummy detector');
                  window._useDummyDetector = true;
                  window._dummyDetectorStable = true;
                  handleRetry();
                }}
              >
                Use Stable Detector
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Error message */}
      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-red-50 bg-opacity-75 z-10">
          <div className="text-center p-4 max-w-md">
            <p className="text-red-600 font-medium">{error}</p>
            <p className="text-xs text-gray-500 mt-1">
              Make sure your camera is connected and browser permissions are granted.
            </p>
            <button
              className="mt-2 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
              onClick={handleRetry}
            >
              Retry
            </button>
          </div>
        </div>
      )}

      {/* Video and canvas container */}
      <div className="relative w-full h-full">
        {/* Webcam video (hidden but needed for detection) */}
        <video
          ref={webcamRef}
          style={{
            position: 'absolute',
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            visibility: 'visible', // Make visible for smoother setup
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

        {/* Add a visual gaze indicator */}
        {faceDetected && (
          <div
            className="absolute z-10 pointer-events-none transform -translate-x-1/2 -translate-y-1/2 transition-all duration-75"
            style={{
              left: `${currentGazeX}%`,
              top: `${currentGazeY}%`,
              width: '30px',
              height: '30px',
              backgroundColor: 'rgba(59, 130, 246, 0.5)',
              borderRadius: '50%',
              border: '2px solid rgba(59, 130, 246, 0.8)',
              boxShadow: '0 0 0 4px rgba(59, 130, 246, 0.3)',
            }}
          />
        )}

        {/* Debug information button at the bottom right */}
        <button
          onClick={toggleDebugInfo}
          className="absolute bottom-2 right-2 bg-gray-700 text-white text-xs px-2 py-1 rounded-md opacity-50 hover:opacity-100 z-20"
          style={{ fontSize: '10px' }}
        >
          {showDebugInfo ? 'Hide Debug' : 'Show Debug'}
        </button>

        {/* Debug information panel */}
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
              <button
                onClick={handleRetry}
                className="bg-green-600 text-white px-2 py-1 rounded text-xs"
              >
                Retry Setup
              </button>
              <button
                onClick={() => {
                  // Force a dummy detector for testing
                  window._useDummyDetector = true;
                  console.log('Enabled dummy detector for testing');
                  handleRetry();
                }}
                className="bg-yellow-600 text-white px-2 py-1 rounded text-xs"
              >
                Use Test Detector
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
