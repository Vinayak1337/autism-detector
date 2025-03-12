'use client';

import { useRef, useState, useEffect, useCallback, useMemo } from 'react';
import { createFaceLandmarksDetector, FaceLandmarksDetector } from './faceLandmarkUtils';
import { useEyeTrackingStore } from './store';
import { Point } from './AnimatedBall';

// Updated interface to match the new API format
interface FacePrediction {
  keypoints: Array<{
    x: number;
    y: number;
    z?: number;
    name?: string;
  }>;
  box: {
    xMin: number;
    yMin: number;
    width: number;
    height: number;
    xMax: number;
    yMax: number;
  };
}

export interface EyeTrackingOptions {
  drawLandmarks?: boolean;
  drawPath?: boolean;
  pathColor?: string;
  pathLength?: number;
  landmarkColor?: string;
  onGazeMove?: (x: number, y: number) => void;
}

export interface EyeTrackingState {
  isModelLoading: boolean;
  isWebcamLoading: boolean;
  isTracking: boolean;
  error: string | null;
  webcamRef: React.RefObject<HTMLVideoElement | null>;
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  startTracking: () => Promise<void>;
  stopTracking: () => void;
}

// Add interface for analysis results
export interface AnalysisResult {
  saccadeFrequency: number;
  averageFixationDuration: number;
  wiggleScore: number;
  deviationScore: number;
  riskAssessment: string;
}

const DEFAULT_OPTIONS: EyeTrackingOptions = {
  drawLandmarks: true,
  drawPath: true,
  pathColor: 'rgba(255, 0, 0, 0.7)',
  pathLength: 50,
  landmarkColor: 'rgba(0, 255, 0, 0.7)',
};

// Declare the window property for typescript
declare global {
  interface Window {
    _hasPrintedPredictions?: boolean;
    _useDummyDetector?: boolean;
  }
}

// Helper function to check if we're in a browser environment
const isBrowser = typeof window !== 'undefined' && typeof navigator !== 'undefined';

export function useEyeTracking(options: EyeTrackingOptions = {}): EyeTrackingState {
  // Use the global state with Zustand
  const setIsModelLoading = useEyeTrackingStore((state) => state.setIsModelLoading);
  const setGazeData = useEyeTrackingStore((state) => state.setGazeData);
  const currentGazeData = useEyeTrackingStore((state) => state.gazeData);
  const setIsCameraReady = useEyeTrackingStore((state) => state.setIsCameraReady);
  const setEyeDetected = useEyeTrackingStore((state) => state.setEyeDetected);

  // Memoize merged options to avoid unnecessary re-renders
  const mergedOptions = useMemo(() => ({ ...DEFAULT_OPTIONS, ...options }), [options]);

  const [isModelLoading, setLocalModelLoading] = useState(true);
  const [isWebcamLoading, setIsWebcamLoading] = useState(true);
  const [isTracking, setIsTracking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const webcamRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const modelRef = useRef<FaceLandmarksDetector | null>(null);
  const requestAnimationRef = useRef<number | null>(null);
  const gazeHistoryRef = useRef<Point[]>([]);
  const webcamTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const forceTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Force set ready state after a timeout to prevent UI from being stuck
  useEffect(() => {
    // Set a timeout to force the component to move past the loading state
    forceTimeoutRef.current = setTimeout(() => {
      if (isModelLoading || isWebcamLoading) {
        console.log(
          'Force timeout: Setting component to ready state to prevent UI from being stuck'
        );

        // If dummy detector isn't already enabled, enable it
        if (typeof window !== 'undefined' && !window._useDummyDetector) {
          window._useDummyDetector = true;
          console.log('Force enabled dummy detector due to timeout');
        }

        setLocalModelLoading(false);
        setIsModelLoading(false);
        setIsWebcamLoading(false);
        setIsCameraReady(true);
      }
    }, 8000); // 8 second timeout

    return () => {
      if (forceTimeoutRef.current) {
        clearTimeout(forceTimeoutRef.current);
      }
    };
  }, [setIsCameraReady, setIsModelLoading, isModelLoading, isWebcamLoading]);

  // Load the TensorFlow model
  useEffect(() => {
    // Skip this effect on the server
    if (!isBrowser) return;

    async function loadModel() {
      try {
        console.log('Starting TensorFlow model loading...', new Date().toISOString());
        console.log('Browser environment check:', {
          window: typeof window !== 'undefined',
          navigator: typeof navigator !== 'undefined',
          userAgent: navigator.userAgent,
        });

        // Clear any previous model
        if (modelRef.current) {
          console.log('Disposing previous model');
          modelRef.current = null;
        }

        // Reset global state
        setGazeData([]);

        // Load the face landmarks detection model using our utility
        console.log('Loading face landmarks model using createFaceLandmarksDetector...');
        const startTime = performance.now();

        try {
          modelRef.current = await createFaceLandmarksDetector();
          const loadTime = performance.now() - startTime;
          console.log(`Face detector model loaded successfully in ${loadTime.toFixed(0)}ms`);
        } catch (modelError: unknown) {
          console.error('Error loading face landmarks model:', modelError);
          // Access stack trace safely
          if (modelError instanceof Error) {
            console.error('Stack trace:', modelError.stack);
          }

          // Re-throw the error to be caught by the outer try/catch
          throw modelError;
        }

        // Verify model is loaded
        if (!modelRef.current) {
          throw new Error('Model loaded but reference is null');
        }

        setLocalModelLoading(false);
        setIsModelLoading(false);
        console.log('Model loading complete, ready for detection', new Date().toISOString());
      } catch (err) {
        console.error('Error loading TensorFlow model:', err);
        console.error('Full error details:', JSON.stringify(err, Object.getOwnPropertyNames(err)));

        // More descriptive error message
        let errorMessage = 'Failed to load model';
        if (err instanceof Error) {
          errorMessage += `: ${err.message}`;
          // Try to identify common issues
          if (err.message.includes('backend') || err.message.includes('WebGL')) {
            errorMessage +=
              ' - WebGL issues detected. Try using Chrome or updating your graphics drivers.';
          } else if (
            err.message.includes('download') ||
            err.message.includes('network') ||
            err.message.includes('fetch')
          ) {
            errorMessage += ' - Network error. Check your internet connection.';
          } else if (err.message.includes('memory')) {
            errorMessage += ' - Out of memory. Try closing other applications or tabs.';
          }
        } else {
          errorMessage += `: ${String(err)}`;
        }

        // Attempt to create a fallback detector - if this fails, we'll show the error
        try {
          console.log('Trying to create fallback detector after error');
          modelRef.current = await createFaceLandmarksDetector();

          if (modelRef.current) {
            console.log('Fallback detector created successfully');
            setLocalModelLoading(false);
            setIsModelLoading(false);
          } else {
            setError(errorMessage);
            setLocalModelLoading(false);
            setIsModelLoading(false);
          }
        } catch (fallbackError) {
          console.error('Fallback detector creation failed:', fallbackError);
          setError(errorMessage);
          setLocalModelLoading(false);
          setIsModelLoading(false);
        }
      }
    }

    loadModel();

    // Cleanup
    return () => {
      if (requestAnimationRef.current) {
        cancelAnimationFrame(requestAnimationRef.current);
      }
      if (webcamTimeoutRef.current) {
        clearTimeout(webcamTimeoutRef.current);
      }
    };
  }, [setIsModelLoading, setGazeData]);

  // Setup webcam with timeout and more robust handling
  const setupWebcam = useCallback(async () => {
    // Skip on server
    if (!isBrowser) {
      console.warn('Webcam setup called in non-browser environment');
      return Promise.resolve();
    }

    console.log('Setting up webcam...');
    if (!webcamRef.current) {
      console.error('Webcam ref is not available');
      setError('Webcam reference not available');
      setIsWebcamLoading(false);
      return Promise.reject(new Error('Webcam reference not available'));
    }

    try {
      // First check if we already have a stream
      if (webcamRef.current.srcObject) {
        const currentStream = webcamRef.current.srcObject as MediaStream;
        if (
          currentStream.active &&
          currentStream.getVideoTracks().length > 0 &&
          currentStream.getVideoTracks()[0].readyState === 'live'
        ) {
          console.log(
            'Webcam already has active stream, readyState:',
            webcamRef.current.readyState
          );
          setIsWebcamLoading(false);
          setIsCameraReady(true);
          return Promise.resolve();
        } else {
          console.log('Existing stream is not active or has no video tracks, creating new stream');
          // Stop the existing tracks
          currentStream.getTracks().forEach((track) => {
            console.log(`Stopping track: ${track.kind}, ${track.label}`);
            track.stop();
          });
          webcamRef.current.srcObject = null;
        }
      }

      console.log('Requesting camera permission...');
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'user',
          width: { ideal: 640 },
          height: { ideal: 480 },
        },
        audio: false, // Explicitly disable audio to avoid permissions issues
      });

      console.log('Camera permission granted, setting up video stream');
      webcamRef.current.srcObject = stream;

      // Make sure we have active video tracks
      if (stream.getVideoTracks().length === 0) {
        throw new Error('No video tracks in the obtained media stream');
      }

      // Log video track details
      const videoTrack = stream.getVideoTracks()[0];
      console.log('Video track:', {
        label: videoTrack.label,
        id: videoTrack.id,
        readyState: videoTrack.readyState,
        enabled: videoTrack.enabled,
        constraints: videoTrack.getConstraints(),
      });

      // Try to play the video immediately - use play/catch pattern
      webcamRef.current
        .play()
        .then(() => {
          console.log('Video playback started successfully');
        })
        .catch((playErr) => {
          console.warn('Could not automatically play video:', playErr);
          // Continue anyway, as the metadata/data loading events may still trigger
        });

      // Set up a timeout in case the loadedmetadata event doesn't fire
      if (webcamTimeoutRef.current) {
        clearTimeout(webcamTimeoutRef.current);
      }

      return new Promise<void>((resolve, reject) => {
        // Create video element event listeners
        const handleMetadataLoaded = () => {
          console.log('Webcam metadata loaded, readyState:', webcamRef.current?.readyState);
          if (webcamTimeoutRef.current) {
            clearTimeout(webcamTimeoutRef.current);
            webcamTimeoutRef.current = null;
          }
          setIsWebcamLoading(false);
          setIsCameraReady(true);
          resolve();

          // Remove the event listeners after they're triggered
          if (webcamRef.current) {
            webcamRef.current.removeEventListener('loadedmetadata', handleMetadataLoaded);
            webcamRef.current.removeEventListener('loadeddata', handleDataLoaded);
          }
        };

        const handleDataLoaded = () => {
          console.log('Webcam data loaded, readyState:', webcamRef.current?.readyState);
          if (webcamTimeoutRef.current) {
            clearTimeout(webcamTimeoutRef.current);
            webcamTimeoutRef.current = null;
          }
          setIsWebcamLoading(false);
          setIsCameraReady(true);
          resolve();

          // Remove the event listeners after they're triggered
          if (webcamRef.current) {
            webcamRef.current.removeEventListener('loadedmetadata', handleMetadataLoaded);
            webcamRef.current.removeEventListener('loadeddata', handleDataLoaded);
          }
        };

        const handleVideoError = (e: Event) => {
          console.error('Video element error:', e);
          if (webcamTimeoutRef.current) {
            clearTimeout(webcamTimeoutRef.current);
            webcamTimeoutRef.current = null;
          }
          setError(`Video element error: ${e}`);
          setIsWebcamLoading(false);
          reject(new Error(`Video element error: ${e}`));

          // Remove the event listeners after error
          if (webcamRef.current) {
            webcamRef.current.removeEventListener('loadedmetadata', handleMetadataLoaded);
            webcamRef.current.removeEventListener('loadeddata', handleDataLoaded);
            webcamRef.current.removeEventListener('error', handleVideoError);
          }
        };

        // Add the event listeners
        if (webcamRef.current) {
          webcamRef.current.addEventListener('loadedmetadata', handleMetadataLoaded);
          webcamRef.current.addEventListener('loadeddata', handleDataLoaded);
          webcamRef.current.addEventListener('error', handleVideoError);
        }

        // Set a shorter timeout (3s) to resolve anyway after time
        webcamTimeoutRef.current = setTimeout(() => {
          console.log('Webcam setup timeout triggered after 3s');
          if (webcamRef.current && webcamRef.current.srcObject) {
            // Check if video tracks are active before resolving
            const stream = webcamRef.current.srcObject as MediaStream;
            const videoTracks = stream.getVideoTracks();
            console.log('Video tracks at timeout:', videoTracks.length);
            if (videoTracks.length > 0) {
              console.log('Video track state:', videoTracks[0].readyState);

              // If video is ready, resolve even if events didn't fire
              setIsWebcamLoading(false);
              setIsCameraReady(true);

              // Remove the event listeners
              if (webcamRef.current) {
                webcamRef.current.removeEventListener('loadedmetadata', handleMetadataLoaded);
                webcamRef.current.removeEventListener('loadeddata', handleDataLoaded);
                webcamRef.current.removeEventListener('error', handleVideoError);
              }

              resolve();
            } else {
              setError('No video tracks available after timeout');
              setIsWebcamLoading(false);
              reject(new Error('No video tracks available after timeout'));
            }
          } else {
            setError('Video element not ready after timeout');
            setIsWebcamLoading(false);
            reject(new Error('Video element not ready after timeout'));
          }
        }, 3000);
      });
    } catch (err) {
      console.error('Error setting up webcam:', err);
      setError(`Failed to setup webcam: ${err instanceof Error ? err.message : String(err)}`);
      setIsWebcamLoading(false);
      throw err;
    }
  }, [setIsCameraReady]);

  // Draw eye tracking data on canvas
  const drawToCanvas = useCallback(
    (predictions: FacePrediction[], video: HTMLVideoElement, canvas: HTMLCanvasElement) => {
      if (!canvas) return;

      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // Set canvas dimensions to match video
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      // Clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Exit if no predictions
      if (!predictions.length) {
        // Even if there are no predictions, we'll use the last known position or a default
        // This prevents the UI from getting stuck when eye detection is intermittent
        console.log('No face predictions detected in this frame');

        // If we have gaze history, continue showing it
        if (gazeHistoryRef.current.length > 0 && mergedOptions.drawPath) {
          ctx.strokeStyle = mergedOptions.pathColor || 'rgba(255, 0, 0, 0.7)';
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.moveTo(gazeHistoryRef.current[0].x, gazeHistoryRef.current[0].y);
          for (let i = 1; i < gazeHistoryRef.current.length; i++) {
            ctx.lineTo(gazeHistoryRef.current[i].x, gazeHistoryRef.current[i].y);
          }
          ctx.stroke();
        }

        return;
      }

      // Get the first face
      const face = predictions[0];

      // Handle the case where keypoints might be missing
      if (!face.keypoints || face.keypoints.length === 0) {
        console.warn('No keypoints found in face prediction');

        // Use face box center if available
        if (face.box) {
          const centerX = face.box.xMin + face.box.width / 2;
          const centerY = face.box.yMin + face.box.height / 2;

          // Draw face box center
          ctx.fillStyle = mergedOptions.landmarkColor || 'rgba(0, 255, 0, 0.7)';
          ctx.beginPath();
          ctx.arc(centerX, centerY, 8, 0, 2 * Math.PI);
          ctx.fill();

          // Update gaze history with box center
          const newPoint: Point = { x: centerX, y: centerY };
          gazeHistoryRef.current.push(newPoint);

          // Limit history length
          const maxLength = mergedOptions.pathLength || 50;
          if (gazeHistoryRef.current.length > maxLength) {
            gazeHistoryRef.current = gazeHistoryRef.current.slice(-maxLength);
          }

          // Draw gaze path with box center
          if (mergedOptions.drawPath && gazeHistoryRef.current.length > 1) {
            ctx.strokeStyle = mergedOptions.pathColor || 'rgba(255, 0, 0, 0.7)';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.moveTo(gazeHistoryRef.current[0].x, gazeHistoryRef.current[0].y);
            for (let i = 1; i < gazeHistoryRef.current.length; i++) {
              ctx.lineTo(gazeHistoryRef.current[i].x, gazeHistoryRef.current[i].y);
            }
            ctx.stroke();
          }

          // Call onGazeMove callback with normalized coordinates from box center
          if (mergedOptions.onGazeMove) {
            // Normalize coordinates to 0-1 range
            const normX = centerX / canvas.width;
            const normY = centerY / canvas.height;

            // Scale to screen coordinates (0-100)
            const screenX = normX * 100;
            const screenY = normY * 100;

            mergedOptions.onGazeMove(screenX, screenY);

            // Update gaze data in global store
            const newGazePoint: Point = { x: screenX, y: screenY };
            setGazeData([...currentGazeData, newGazePoint]);
          }
        }

        return;
      }

      // Only process if we have keypoints
      if (face.keypoints.length > 0) {
        // Find the eye keypoints
        // For TF Face Mesh, we need to find specific eye landmarks
        const leftEye = face.keypoints.find((kp) => kp.name === 'leftEye');
        const rightEye = face.keypoints.find((kp) => kp.name === 'rightEye');

        if (leftEye && rightEye) {
          // Calculate the center point between the eyes
          const centerX = (leftEye.x + rightEye.x) / 2;
          const centerY = (leftEye.y + rightEye.y) / 2;

          // Draw eye landmarks if option is enabled
          if (mergedOptions.drawLandmarks) {
            ctx.fillStyle = mergedOptions.landmarkColor || 'rgba(0, 255, 0, 0.7)';
            ctx.beginPath();
            ctx.arc(leftEye.x, leftEye.y, 5, 0, 2 * Math.PI);
            ctx.fill();
            ctx.beginPath();
            ctx.arc(rightEye.x, rightEye.y, 5, 0, 2 * Math.PI);
            ctx.fill();
            ctx.beginPath();
            ctx.arc(centerX, centerY, 8, 0, 2 * Math.PI);
            ctx.fill();
          }

          // Update gaze history
          const newPoint: Point = { x: centerX, y: centerY };
          gazeHistoryRef.current.push(newPoint);

          // Limit history length
          const maxLength = mergedOptions.pathLength || 50;
          if (gazeHistoryRef.current.length > maxLength) {
            gazeHistoryRef.current = gazeHistoryRef.current.slice(-maxLength);
          }

          // Draw gaze path
          if (mergedOptions.drawPath && gazeHistoryRef.current.length > 1) {
            ctx.strokeStyle = mergedOptions.pathColor || 'rgba(255, 0, 0, 0.7)';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.moveTo(gazeHistoryRef.current[0].x, gazeHistoryRef.current[0].y);
            for (let i = 1; i < gazeHistoryRef.current.length; i++) {
              ctx.lineTo(gazeHistoryRef.current[i].x, gazeHistoryRef.current[i].y);
            }
            ctx.stroke();
          }

          // Call onGazeMove callback with normalized coordinates
          if (mergedOptions.onGazeMove) {
            // Normalize coordinates to 0-1 range
            const normX = centerX / canvas.width;
            const normY = centerY / canvas.height;

            // Scale to screen coordinates (0-100)
            const screenX = normX * 100;
            const screenY = normY * 100;

            mergedOptions.onGazeMove(screenX, screenY);

            // Update gaze data in global store
            // We use the existing array and add the new point to maintain a history
            const newGazePoint: Point = { x: screenX, y: screenY };
            setGazeData([...currentGazeData, newGazePoint]);
          }
        } else {
          console.log('Eye keypoints not found in face prediction, using fallback approach');

          // Fallback: use any available keypoints or the face box center
          if (face.keypoints.length >= 2) {
            // Use first two keypoints as a fallback
            const kp1 = face.keypoints[0];
            const kp2 = face.keypoints[1];
            const centerX = (kp1.x + kp2.x) / 2;
            const centerY = (kp1.y + kp2.y) / 2;

            // Draw landmarks and update gaze data using these fallback points
            if (mergedOptions.drawLandmarks) {
              ctx.fillStyle = mergedOptions.landmarkColor || 'rgba(255, 165, 0, 0.7)'; // Orange for fallback
              ctx.beginPath();
              ctx.arc(centerX, centerY, 8, 0, 2 * Math.PI);
              ctx.fill();
            }

            // Update gaze history
            const newPoint: Point = { x: centerX, y: centerY };
            gazeHistoryRef.current.push(newPoint);

            // Continue the rest of drawing and callbacks as before
            // (Same code as above for drawing path and calling onGazeMove)
            if (mergedOptions.drawPath && gazeHistoryRef.current.length > 1) {
              ctx.strokeStyle = mergedOptions.pathColor || 'rgba(255, 0, 0, 0.7)';
              ctx.lineWidth = 3;
              ctx.beginPath();
              ctx.moveTo(gazeHistoryRef.current[0].x, gazeHistoryRef.current[0].y);
              for (let i = 1; i < gazeHistoryRef.current.length; i++) {
                ctx.lineTo(gazeHistoryRef.current[i].x, gazeHistoryRef.current[i].y);
              }
              ctx.stroke();
            }

            if (mergedOptions.onGazeMove) {
              const normX = centerX / canvas.width;
              const normY = centerY / canvas.height;
              const screenX = normX * 100;
              const screenY = normY * 100;
              mergedOptions.onGazeMove(screenX, screenY);
              const newGazePoint: Point = { x: screenX, y: screenY };
              setGazeData([...currentGazeData, newGazePoint]);
            }
          } else if (face.box) {
            // Fallback to face box center
            const centerX = face.box.xMin + face.box.width / 2;
            const centerY = face.box.yMin + face.box.height / 2;

            if (mergedOptions.drawLandmarks) {
              ctx.fillStyle = 'rgba(255, 0, 0, 0.7)'; // Red for box fallback
              ctx.beginPath();
              ctx.arc(centerX, centerY, 8, 0, 2 * Math.PI);
              ctx.fill();
            }

            // Update gaze using box center
            const newPoint: Point = { x: centerX, y: centerY };
            gazeHistoryRef.current.push(newPoint);

            if (mergedOptions.onGazeMove) {
              const normX = centerX / canvas.width;
              const normY = centerY / canvas.height;
              const screenX = normX * 100;
              const screenY = normY * 100;
              mergedOptions.onGazeMove(screenX, screenY);
              const newGazePoint: Point = { x: screenX, y: screenY };
              setGazeData([...currentGazeData, newGazePoint]);
            }
          }
        }
      }
    },
    [mergedOptions, setGazeData, currentGazeData]
  );

  // Start the eye tracking process
  const startTracking = useCallback(async () => {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] Starting eye tracking...`);

    // Check if we're already tracking
    if (isTracking) {
      console.log(`[${timestamp}] Already tracking, no need to start again`);
      return;
    }

    try {
      // First make sure the webcam is ready
      await setupWebcam();
      console.log(`[${timestamp}] Webcam is ready`);

      // Check if model is still loading
      if (isModelLoading) {
        console.log(`[${timestamp}] Model is still loading, waiting...`);
        // Set a timeout to check model status
        const waitForModel = async (retries = 20, delay = 800): Promise<void> => {
          if (retries <= 0) {
            const err = new Error('Model loading timeout - please refresh the page and try again');
            console.error(`[${timestamp}] Model loading timeout after multiple retries`);
            setError(err.message);
            throw err;
          }

          // Check if model is ready by checking modelRef or for a successful detector creation
          console.log(`[${timestamp}] Checking for model... (${retries} retries left)`);
          if (modelRef.current) {
            console.log(`[${timestamp}] Model is now available in modelRef, continuing...`);
            return;
          } else {
            // If we've seen the "Face detector created successfully" message in logs,
            // but modelRef.current is still null, try to recreate the model
            if (retries % 5 === 0) {
              try {
                console.log(`[${timestamp}] Attempting to create model directly...`);
                modelRef.current = await createFaceLandmarksDetector();
                console.log(`[${timestamp}] Model created directly and assigned to modelRef`);
                return;
              } catch (e) {
                const errorMsg = e instanceof Error ? e.message : String(e);
                console.log(
                  `[${timestamp}] Direct model creation attempt failed: ${errorMsg}, continuing to wait...`
                );
              }
            }

            console.log(
              `[${timestamp}] Model still not ready, retrying... (${retries} retries left)`
            );
            await new Promise((resolve) => setTimeout(resolve, delay));
            return waitForModel(retries - 1, delay);
          }
        };

        // Wait for the model to be ready
        await waitForModel();
      }

      // Double-check that model is available
      if (!modelRef.current) {
        console.log(
          `[${timestamp}] Model is still not available after waiting, trying one more time`
        );

        // Try to load the model one more time with a longer timeout
        try {
          console.log(`[${timestamp}] Attempting to load model again...`);
          const model = await Promise.race([
            createFaceLandmarksDetector(),
            new Promise<never>((_, reject) =>
              setTimeout(() => reject(new Error('Direct model creation timeout')), 10000)
            ),
          ]);

          modelRef.current = model;
          console.log(`[${timestamp}] Model loaded successfully on retry`);
        } catch (modelError) {
          const errorMessage =
            modelError instanceof Error ? modelError.message : String(modelError);
          console.error(`[${timestamp}] Failed to load model on retry: ${errorMessage}`);
          const err = new Error('Failed to load face tracking model - please try again');
          setError(err.message);
          throw err;
        }
      }

      // Check if video and canvas references are available
      if (!webcamRef.current || !canvasRef.current) {
        console.warn('Video or canvas reference not available - attempting to continue');

        // Don't try to retry with setTimeout - instead continue with the process
        // and let the animation frame handle the retry inside the prediction loop
        console.log('Will check for references again during prediction loop');

        // Reset any previous tracking state
        if (requestAnimationRef.current) {
          cancelAnimationFrame(requestAnimationRef.current);
          requestAnimationRef.current = null;
        }

        setError(null);
        setEyeDetected(false); // Reset eye detection state

        // Initialize local tracking variables
        let localEyeDetected = false;
        let frameCount = 0;

        // Start the prediction loop, which will check for references
        const predictLoop = async () => {
          try {
            // Check refs first thing in the loop
            if (!webcamRef.current || !canvasRef.current) {
              console.log('References still not available, retrying next frame...');
              requestAnimationRef.current = requestAnimationFrame(predictLoop);
              return;
            }

            if (!webcamRef.current.readyState || webcamRef.current.readyState < 2) {
              console.log('Video not ready yet');
              requestAnimationRef.current = requestAnimationFrame(predictLoop);
              return;
            }

            // Rest of prediction logic
            // Create detector if not already created
            if (!modelRef.current) {
              console.log('Creating face landmark detector...');
              modelRef.current = await createFaceLandmarksDetector();
            }

            // Perform face detection
            const predictions = await modelRef.current.estimateFaces(webcamRef.current);

            frameCount++;

            // Log first set of predictions for debugging
            if (frameCount === 1) {
              console.log('First frame predictions:', predictions);

              // If no faces detected in first frame, log video dimensions for debugging
              if (predictions.length === 0 && webcamRef.current) {
                console.log('No faces detected in first frame. Video details:', {
                  videoWidth: webcamRef.current.videoWidth,
                  videoHeight: webcamRef.current.videoHeight,
                  readyState: webcamRef.current.readyState,
                  playing: !webcamRef.current.paused,
                  hasStream: !!webcamRef.current.srcObject,
                  streamActive: webcamRef.current.srcObject
                    ? (webcamRef.current.srcObject as MediaStream).active
                    : false,
                });
              }
            }

            // Log every 30 frames for performance monitoring
            if (frameCount % 30 === 0) {
              console.log(`Frame ${frameCount}: Detected ${predictions.length} faces`);
            }

            // Update face detection state
            const newFaceDetected = predictions.length > 0;
            if (newFaceDetected !== localEyeDetected) {
              localEyeDetected = newFaceDetected;
              setEyeDetected(localEyeDetected); // Update eye detection state
              console.log(`Face detection ${localEyeDetected ? 'started' : 'lost'}`);
            }

            // Draw predictions to canvas
            if (canvasRef.current) {
              drawToCanvas(predictions as FacePrediction[], webcamRef.current, canvasRef.current);
            }

            // Only continue if we're still tracking
            if (isTracking) {
              requestAnimationRef.current = requestAnimationFrame(predictLoop);
            }
          } catch (predictionError) {
            console.error('Error during face detection:', predictionError);
            // Log more details about the error
            if (predictionError instanceof Error) {
              console.error('Error details:', predictionError.message);
              if (predictionError.stack) {
                console.error('Stack trace:', predictionError.stack);
              }
            }

            // Don't stop tracking on single prediction errors, try to continue
            if (isTracking) {
              requestAnimationRef.current = requestAnimationFrame(predictLoop);
            }
          }
        };

        // Wait a short time before starting the prediction loop to ensure webcam is fully initialized
        console.log(`[${timestamp}] Starting face detection loop even without references...`);
        setIsTracking(true);
        requestAnimationRef.current = requestAnimationFrame(predictLoop);
        return;
      }

      // Reset any previous tracking state
      if (requestAnimationRef.current) {
        cancelAnimationFrame(requestAnimationRef.current);
        requestAnimationRef.current = null;
      }

      setError(null);
      setEyeDetected(false); // Reset eye detection state

      // Initialize local tracking variables
      let localEyeDetected = false;
      let frameCount = 0;

      // Start the prediction loop, which will check for references
      const predictLoop = async () => {
        try {
          // Check refs first thing in the loop
          if (!webcamRef.current || !canvasRef.current) {
            console.log('References still not available, retrying next frame...');
            requestAnimationRef.current = requestAnimationFrame(predictLoop);
            return;
          }

          if (!webcamRef.current.readyState || webcamRef.current.readyState < 2) {
            console.log('Video not ready yet');
            requestAnimationRef.current = requestAnimationFrame(predictLoop);
            return;
          }

          // Rest of prediction logic
          // Create detector if not already created
          if (!modelRef.current) {
            console.log('Creating face landmark detector...');
            modelRef.current = await createFaceLandmarksDetector();
          }

          // Perform face detection
          const predictions = await modelRef.current.estimateFaces(webcamRef.current);

          frameCount++;

          // Log first set of predictions for debugging
          if (frameCount === 1) {
            console.log('First frame predictions:', predictions);

            // If no faces detected in first frame, log video dimensions for debugging
            if (predictions.length === 0 && webcamRef.current) {
              console.log('No faces detected in first frame. Video details:', {
                videoWidth: webcamRef.current.videoWidth,
                videoHeight: webcamRef.current.videoHeight,
                readyState: webcamRef.current.readyState,
                playing: !webcamRef.current.paused,
                hasStream: !!webcamRef.current.srcObject,
                streamActive: webcamRef.current.srcObject
                  ? (webcamRef.current.srcObject as MediaStream).active
                  : false,
              });
            }
          }

          // Log every 30 frames for performance monitoring
          if (frameCount % 30 === 0) {
            console.log(`Frame ${frameCount}: Detected ${predictions.length} faces`);
          }

          // Update face detection state
          const newFaceDetected = predictions.length > 0;
          if (newFaceDetected !== localEyeDetected) {
            localEyeDetected = newFaceDetected;
            setEyeDetected(localEyeDetected); // Update eye detection state
            console.log(`Face detection ${localEyeDetected ? 'started' : 'lost'}`);
          }

          // Draw predictions to canvas
          if (canvasRef.current) {
            drawToCanvas(predictions as FacePrediction[], webcamRef.current, canvasRef.current);
          }

          // Only continue if we're still tracking
          if (isTracking) {
            requestAnimationRef.current = requestAnimationFrame(predictLoop);
          }
        } catch (predictionError) {
          console.error('Error during face detection:', predictionError);
          // Log more details about the error
          if (predictionError instanceof Error) {
            console.error('Error details:', predictionError.message);
            if (predictionError.stack) {
              console.error('Stack trace:', predictionError.stack);
            }
          }

          // Don't stop tracking on single prediction errors, try to continue
          if (isTracking) {
            requestAnimationRef.current = requestAnimationFrame(predictLoop);
          }
        }
      };

      // Wait a short time before starting the prediction loop to ensure webcam is fully initialized
      console.log(`[${timestamp}] Starting face detection loop even without references...`);
      setIsTracking(true);
      requestAnimationRef.current = requestAnimationFrame(predictLoop);
    } catch (error) {
      console.error('Error starting tracking:', error);
      setError(error instanceof Error ? error.message : String(error));
      setIsTracking(false);
    }
  }, [isTracking, setupWebcam, isModelLoading, drawToCanvas, setEyeDetected]);

  // Stop tracking
  const stopTracking = useCallback(() => {
    console.log('Stopping eye tracking...');
    if (requestAnimationRef.current) {
      cancelAnimationFrame(requestAnimationRef.current);
      requestAnimationRef.current = null;
    }

    // Stop webcam if active
    if (webcamRef.current && webcamRef.current.srcObject) {
      const stream = webcamRef.current.srcObject as MediaStream;
      stream.getTracks().forEach((track) => {
        console.log(`Stopping track: ${track.kind}, ID: ${track.id}`);
        track.stop();
      });
      webcamRef.current.srcObject = null;
    }

    setIsTracking(false);
    gazeHistoryRef.current = [];
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    // Capture current refs inside the effect
    const videoElement = webcamRef.current;

    return () => {
      console.log('Cleaning up eye tracking...');
      if (requestAnimationRef.current) {
        cancelAnimationFrame(requestAnimationRef.current);
      }
      if (webcamTimeoutRef.current) {
        clearTimeout(webcamTimeoutRef.current);
      }
      // Use the captured ref value in cleanup
      if (videoElement && videoElement.srcObject) {
        const stream = videoElement.srcObject as MediaStream;
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  return {
    isModelLoading,
    isWebcamLoading,
    isTracking,
    error,
    webcamRef,
    canvasRef,
    startTracking,
    stopTracking,
  };
}
