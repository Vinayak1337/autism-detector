'use client';

import { useRef, useState, useEffect, useCallback, useMemo } from 'react';
import { createFaceLandmarksDetector, FaceLandmarksDetector } from './faceLandmarkUtils';
import { useEyeTrackingStore } from './store';
import { Point } from './AnimatedBall';

/**
 * Face prediction data structure from the face detection API
 */
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

/**
 * Configuration options for eye tracking visualization and behavior
 */
export interface EyeTrackingOptions {
  /** Whether to draw eye landmarks on the canvas */
  drawLandmarks?: boolean;
  /** Whether to draw the gaze path on the canvas */
  drawPath?: boolean;
  /** Color of the gaze path */
  pathColor?: string;
  /** Maximum number of points to keep in the gaze path history */
  pathLength?: number;
  /** Color of eye landmarks */
  landmarkColor?: string;
  /** Callback triggered when gaze position changes */
  onGazeMove?: (x: number, y: number) => void;
}

/**
 * State returned by the useEyeTracking hook
 */
export interface EyeTrackingState {
  /** Whether the ML model is currently loading */
  isModelLoading: boolean;
  /** Whether the webcam is currently initializing */
  isWebcamLoading: boolean;
  /** Whether eye tracking is currently active */
  isTracking: boolean;
  /** Error message if something went wrong */
  error: string | null;
  /** Reference to the webcam video element */
  webcamRef: React.RefObject<HTMLVideoElement | null>;
  /** Reference to the canvas for visualization */
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  /** Function to start eye tracking */
  startTracking: () => Promise<void>;
  /** Function to stop eye tracking */
  stopTracking: () => void;
}

/**
 * Analysis results from eye tracking data
 */
export interface AnalysisResult {
  /** Frequency of rapid eye movements */
  saccadeFrequency: number;
  /** Average duration of fixations in milliseconds */
  averageFixationDuration: number;
  /** Score quantifying micro-movements */
  wiggleScore: number;
  /** Score quantifying deviation from target */
  deviationScore: number;
  /** Overall risk assessment */
  riskAssessment: string;
}

// Default configuration for eye tracking visualization
const DEFAULT_OPTIONS: EyeTrackingOptions = {
  drawLandmarks: true,
  drawPath: true,
  pathColor: 'rgba(255, 0, 0, 0.7)',
  pathLength: 50,
  landmarkColor: 'rgba(0, 255, 0, 0.7)',
};

// Global window properties for debugging and testing
declare global {
  interface Window {
    _hasPrintedPredictions?: boolean;
    _useDummyDetector?: boolean;
  }
}

// Check if code is running in browser environment
const isBrowser = typeof window !== 'undefined' && typeof navigator !== 'undefined';

/**
 * Utility to create detailed error messages based on common error patterns
 */
const createDetailedErrorMessage = (err: unknown): string => {
  let errorMessage = 'Failed to load model';

  if (err instanceof Error) {
    errorMessage += `: ${err.message}`;

    // Add suggestions for common error patterns
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

  return errorMessage;
};

/**
 * Main hook for eye tracking functionality
 * Provides webcam access, ML model loading, and eye tracking visualization
 */
export function useEyeTracking(options: EyeTrackingOptions = {}): EyeTrackingState {
  // Global eye tracking state from Zustand store
  const setIsModelLoading = useEyeTrackingStore((state) => state.setIsModelLoading);
  const setGazeData = useEyeTrackingStore((state) => state.setGazeData);
  const currentGazeData = useEyeTrackingStore((state) => state.gazeData);
  const setIsCameraReady = useEyeTrackingStore((state) => state.setIsCameraReady);
  const setEyeDetected = useEyeTrackingStore((state) => state.setEyeDetected);

  // Memoize merged options to avoid unnecessary re-renders
  const mergedOptions = useMemo(() => ({ ...DEFAULT_OPTIONS, ...options }), [options]);

  // Local state
  const [isModelLoading, setLocalModelLoading] = useState(true);
  const [isWebcamLoading, setIsWebcamLoading] = useState(true);
  const [isTracking, setIsTracking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Refs for DOM elements and tracking state
  const webcamRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const modelRef = useRef<FaceLandmarksDetector | null>(null);
  const requestAnimationRef = useRef<number | null>(null);
  const gazeHistoryRef = useRef<Point[]>([]);
  const webcamTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const forceTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  /**
   * Converts canvas coordinates to screen percentage (0-100)
   */
  const canvasToScreenCoordinates = useCallback(
    (x: number, y: number, canvasWidth: number, canvasHeight: number): Point => {
      // Normalize coordinates to 0-1 range
      const normX = x / canvasWidth;
      const normY = y / canvasHeight;

      // Scale to screen coordinates (0-100)
      return {
        x: normX * 100,
        y: normY * 100,
      };
    },
    []
  );

  /**
   * Updates gaze history and optionally triggers callbacks
   */
  const updateGazeData = useCallback(
    (
      point: Point,
      canvasWidth: number,
      canvasHeight: number,
      options: EyeTrackingOptions
    ): void => {
      // Update local gaze history
      gazeHistoryRef.current.push(point);

      // Limit history length
      const maxLength = options.pathLength || 50;
      if (gazeHistoryRef.current.length > maxLength) {
        gazeHistoryRef.current = gazeHistoryRef.current.slice(-maxLength);
      }

      // Convert to screen coordinates for callbacks
      if (options.onGazeMove) {
        const screenPoint = canvasToScreenCoordinates(point.x, point.y, canvasWidth, canvasHeight);

        // Trigger the callback
        options.onGazeMove(screenPoint.x, screenPoint.y);

        // Store in global state
        setGazeData([...currentGazeData, screenPoint]);
      }
    },
    [canvasToScreenCoordinates, setGazeData, currentGazeData]
  );

  /**
   * Draws gaze path on canvas
   */
  const drawGazePath = useCallback(
    (ctx: CanvasRenderingContext2D, options: EyeTrackingOptions): void => {
      if (!options.drawPath || gazeHistoryRef.current.length <= 1) return;

      ctx.strokeStyle = options.pathColor || 'rgba(255, 0, 0, 0.7)';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(gazeHistoryRef.current[0].x, gazeHistoryRef.current[0].y);

      for (let i = 1; i < gazeHistoryRef.current.length; i++) {
        ctx.lineTo(gazeHistoryRef.current[i].x, gazeHistoryRef.current[i].y);
      }

      ctx.stroke();
    },
    []
  );

  /**
   * Draws landmarks for detected eyes
   */
  const drawEyeLandmarks = useCallback(
    (
      ctx: CanvasRenderingContext2D,
      leftEye: { x: number; y: number },
      rightEye: { x: number; y: number },
      centerPoint: { x: number; y: number },
      options: EyeTrackingOptions
    ): void => {
      if (!options.drawLandmarks) return;

      ctx.fillStyle = options.landmarkColor || 'rgba(0, 255, 0, 0.7)';

      // Draw left eye
      ctx.beginPath();
      ctx.arc(leftEye.x, leftEye.y, 5, 0, 2 * Math.PI);
      ctx.fill();

      // Draw right eye
      ctx.beginPath();
      ctx.arc(rightEye.x, rightEye.y, 5, 0, 2 * Math.PI);
      ctx.fill();

      // Draw center point between eyes
      ctx.beginPath();
      ctx.arc(centerPoint.x, centerPoint.y, 8, 0, 2 * Math.PI);
      ctx.fill();
    },
    []
  );

  /**
   * Process a face prediction with eyes detected
   */
  const processEyePrediction = useCallback(
    (
      leftEye: { x: number; y: number },
      rightEye: { x: number; y: number },
      canvas: HTMLCanvasElement,
      ctx: CanvasRenderingContext2D,
      options: EyeTrackingOptions
    ): void => {
      // Calculate center point between eyes
      const centerX = (leftEye.x + rightEye.x) / 2;
      const centerY = (leftEye.y + rightEye.y) / 2;
      const centerPoint = { x: centerX, y: centerY };

      // Draw landmarks if enabled
      drawEyeLandmarks(ctx, leftEye, rightEye, centerPoint, options);

      // Update gaze data with the new point
      updateGazeData(centerPoint, canvas.width, canvas.height, options);

      // Draw the gaze path
      drawGazePath(ctx, options);
    },
    [drawEyeLandmarks, updateGazeData, drawGazePath]
  );

  /**
   * Process a face prediction with face box but no eye keypoints
   */
  const processFaceBoxPrediction = useCallback(
    (
      box: FacePrediction['box'],
      canvas: HTMLCanvasElement,
      ctx: CanvasRenderingContext2D,
      options: EyeTrackingOptions
    ): void => {
      // Calculate center of face box
      const centerX = box.xMin + box.width / 2;
      const centerY = box.yMin + box.height / 2;
      const centerPoint = { x: centerX, y: centerY };

      // Draw face box center
      if (options.drawLandmarks) {
        ctx.fillStyle = 'rgba(255, 0, 0, 0.7)'; // Red for box fallback
        ctx.beginPath();
        ctx.arc(centerX, centerY, 8, 0, 2 * Math.PI);
        ctx.fill();
      }

      // Update gaze data with the face box center
      updateGazeData(centerPoint, canvas.width, canvas.height, options);

      // Draw the gaze path
      drawGazePath(ctx, options);
    },
    [updateGazeData, drawGazePath]
  );

  /**
   * Process a face prediction with generic keypoints
   */
  const processGenericKeypoints = useCallback(
    (
      keypoints: FacePrediction['keypoints'],
      canvas: HTMLCanvasElement,
      ctx: CanvasRenderingContext2D,
      options: EyeTrackingOptions
    ): void => {
      // Use first two keypoints as a fallback
      if (keypoints.length < 2) return;

      const kp1 = keypoints[0];
      const kp2 = keypoints[1];
      const centerX = (kp1.x + kp2.x) / 2;
      const centerY = (kp1.y + kp2.y) / 2;
      const centerPoint = { x: centerX, y: centerY };

      // Draw fallback landmark
      if (options.drawLandmarks) {
        ctx.fillStyle = options.landmarkColor || 'rgba(255, 165, 0, 0.7)'; // Orange for fallback
        ctx.beginPath();
        ctx.arc(centerX, centerY, 8, 0, 2 * Math.PI);
        ctx.fill();
      }

      // Update gaze data with the keypoint center
      updateGazeData(centerPoint, canvas.width, canvas.height, options);

      // Draw the gaze path
      drawGazePath(ctx, options);
    },
    [updateGazeData, drawGazePath]
  );

  /**
   * Draw eye tracking data on canvas
   */
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

      // If no predictions but we have history, just draw the path
      if (!predictions.length) {
        if (gazeHistoryRef.current.length > 0 && mergedOptions.drawPath) {
          drawGazePath(ctx, mergedOptions);
        }
        return;
      }

      // Get the first face
      const face = predictions[0];

      // Handle the case where keypoints might be missing
      if (!face.keypoints || face.keypoints.length === 0) {
        // Use face box as fallback if available
        if (face.box) {
          processFaceBoxPrediction(face.box, canvas, ctx, mergedOptions);
        }
        return;
      }

      // Find the eye keypoints
      const leftEye = face.keypoints.find((kp) => kp.name === 'leftEye');
      const rightEye = face.keypoints.find((kp) => kp.name === 'rightEye');

      if (leftEye && rightEye) {
        // Process predictions with proper eye landmarks
        processEyePrediction(leftEye, rightEye, canvas, ctx, mergedOptions);
      } else if (face.keypoints.length >= 2) {
        // Fallback to using generic keypoints
        processGenericKeypoints(face.keypoints, canvas, ctx, mergedOptions);
      } else if (face.box) {
        // Fallback to face box if no usable keypoints
        processFaceBoxPrediction(face.box, canvas, ctx, mergedOptions);
      }
    },
    [
      mergedOptions,
      processEyePrediction,
      processFaceBoxPrediction,
      processGenericKeypoints,
      drawGazePath,
    ]
  );

  /**
   * Set up webcam with timeout and robust error handling
   */
  const setupWebcam = useCallback(async () => {
    // Skip on server
    if (!isBrowser) {
      console.warn('Webcam setup called in non-browser environment');
      return Promise.resolve();
    }

    console.log('Setting up webcam...');
    if (!webcamRef.current) {
      const error = new Error('Webcam reference not available');
      setError(error.message);
      setIsWebcamLoading(false);
      return Promise.reject(error);
    }

    try {
      // Check if we have a valid stream already
      if (webcamRef.current.srcObject) {
        const currentStream = webcamRef.current.srcObject as MediaStream;
        const hasActiveVideoTrack =
          currentStream.active &&
          currentStream.getVideoTracks().length > 0 &&
          currentStream.getVideoTracks()[0].readyState === 'live';

        if (hasActiveVideoTrack) {
          setIsWebcamLoading(false);
          setIsCameraReady(true);
          return Promise.resolve();
        }

        // Stop existing inactive stream
        stopMediaTracks(currentStream);
        webcamRef.current.srcObject = null;
      }

      // Request camera access
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'user',
          width: { ideal: 640 },
          height: { ideal: 480 },
        },
        audio: false,
      });

      webcamRef.current.srcObject = stream;

      // Verify we have video tracks
      if (stream.getVideoTracks().length === 0) {
        throw new Error('No video tracks in the obtained media stream');
      }

      // Try to play the video (might fail in some browsers)
      webcamRef.current.play().catch((playErr) => {
        console.warn('Could not automatically play video:', playErr);
      });

      // Clear any existing timeout
      if (webcamTimeoutRef.current) {
        clearTimeout(webcamTimeoutRef.current);
      }

      // Create a promise that resolves when video is ready
      return new Promise<void>((resolve, reject) => {
        const cleanup = () => {
          if (webcamRef.current) {
            webcamRef.current.removeEventListener('loadedmetadata', handleMetadataLoaded);
            webcamRef.current.removeEventListener('loadeddata', handleDataLoaded);
            webcamRef.current.removeEventListener('error', handleVideoError);
          }

          if (webcamTimeoutRef.current) {
            clearTimeout(webcamTimeoutRef.current);
            webcamTimeoutRef.current = null;
          }
        };

        // Handle metadata loaded event
        const handleMetadataLoaded = () => {
          setIsWebcamLoading(false);
          setIsCameraReady(true);
          cleanup();
          resolve();
        };

        // Handle data loaded event
        const handleDataLoaded = () => {
          setIsWebcamLoading(false);
          setIsCameraReady(true);
          cleanup();
          resolve();
        };

        // Handle video error event
        const handleVideoError = (e: Event) => {
          setError(`Video element error: ${e}`);
          setIsWebcamLoading(false);
          cleanup();
          reject(new Error(`Video element error: ${e}`));
        };

        // Add event listeners
        if (webcamRef.current) {
          webcamRef.current.addEventListener('loadedmetadata', handleMetadataLoaded);
          webcamRef.current.addEventListener('loadeddata', handleDataLoaded);
          webcamRef.current.addEventListener('error', handleVideoError);
        }

        // Set a timeout to resolve if events don't fire
        webcamTimeoutRef.current = setTimeout(() => {
          if (webcamRef.current && webcamRef.current.srcObject) {
            const stream = webcamRef.current.srcObject as MediaStream;
            const videoTracks = stream.getVideoTracks();

            if (videoTracks.length > 0) {
              setIsWebcamLoading(false);
              setIsCameraReady(true);
              cleanup();
              resolve();
            } else {
              setError('No video tracks available after timeout');
              setIsWebcamLoading(false);
              cleanup();
              reject(new Error('No video tracks available after timeout'));
            }
          } else {
            setError('Video element not ready after timeout');
            setIsWebcamLoading(false);
            cleanup();
            reject(new Error('Video element not ready after timeout'));
          }
        }, 3000); // 3 second timeout
      });
    } catch (err) {
      console.error('Error setting up webcam:', err);
      setError(`Failed to setup webcam: ${err instanceof Error ? err.message : String(err)}`);
      setIsWebcamLoading(false);
      throw err;
    }
  }, [setIsCameraReady]);

  /**
   * Helper function to stop media tracks
   */
  const stopMediaTracks = (stream: MediaStream) => {
    stream.getTracks().forEach((track) => {
      console.log(`Stopping track: ${track.kind}, ${track.label}`);
      track.stop();
    });
  };

  /**
   * Creates and runs the face detection loop
   */
  const runDetectionLoop = useCallback(
    (timestamp: string) => {
      // Reset tracking state
      if (requestAnimationRef.current) {
        cancelAnimationFrame(requestAnimationRef.current);
        requestAnimationRef.current = null;
      }

      setError(null);
      setEyeDetected(false);

      // Local tracking variables
      let localEyeDetected = false;
      let frameCount = 0;

      // The prediction loop function
      const predictLoop = async () => {
        try {
          // First check if references are available
          if (!webcamRef.current || !canvasRef.current) {
            requestAnimationRef.current = requestAnimationFrame(predictLoop);
            return;
          }

          // Check if video is ready
          if (!webcamRef.current.readyState || webcamRef.current.readyState < 2) {
            requestAnimationRef.current = requestAnimationFrame(predictLoop);
            return;
          }

          // Create detector if needed
          if (!modelRef.current) {
            modelRef.current = await createFaceLandmarksDetector();
          }

          // Perform face detection
          const predictions = await modelRef.current.estimateFaces(webcamRef.current);
          frameCount++;

          // Log first frame for debugging
          if (frameCount === 1) {
            logFirstFrameDetails(predictions as FacePrediction[], webcamRef.current);
          }

          // Performance logging
          if (frameCount % 30 === 0) {
            console.log(`Frame ${frameCount}: Detected ${predictions.length} faces`);
          }

          // Update face detection state
          const newFaceDetected = predictions.length > 0;
          if (newFaceDetected !== localEyeDetected) {
            localEyeDetected = newFaceDetected;
            setEyeDetected(localEyeDetected);
            console.log(`Face detection ${localEyeDetected ? 'started' : 'lost'}`);
          }

          // Draw predictions
          drawToCanvas(predictions as FacePrediction[], webcamRef.current, canvasRef.current);

          // Continue the loop if still tracking
          if (isTracking) {
            requestAnimationRef.current = requestAnimationFrame(predictLoop);
          }
        } catch (error) {
          console.error('Error during face detection:', error);

          // Continue loop despite errors
          if (isTracking) {
            requestAnimationRef.current = requestAnimationFrame(predictLoop);
          }
        }
      };

      // Start the loop
      console.log(`[${timestamp}] Starting face detection loop...`);
      setIsTracking(true);
      requestAnimationRef.current = requestAnimationFrame(predictLoop);
    },
    [isTracking, drawToCanvas, setEyeDetected]
  );

  /**
   * Log details about the first frame for debugging
   */
  const logFirstFrameDetails = (predictions: FacePrediction[], videoElement: HTMLVideoElement) => {
    console.log('First frame predictions:', predictions);

    if (predictions.length === 0) {
      console.log('No faces detected in first frame. Video details:', {
        videoWidth: videoElement.videoWidth,
        videoHeight: videoElement.videoHeight,
        readyState: videoElement.readyState,
        playing: !videoElement.paused,
        hasStream: !!videoElement.srcObject,
        streamActive: videoElement.srcObject
          ? (videoElement.srcObject as MediaStream).active
          : false,
      });
    }
  };

  /**
   * Attempts to load or create the face detection model
   */
  const ensureModelIsLoaded = useCallback(async (timestamp: string): Promise<void> => {
    // Check if model is already loaded
    if (modelRef.current) {
      return;
    }

    console.log(`[${timestamp}] Model is still loading, waiting...`);

    // Try to create model with timeout
    try {
      const model = await Promise.race([
        createFaceLandmarksDetector(),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('Model creation timeout')), 10000)
        ),
      ]);

      modelRef.current = model;
      console.log(`[${timestamp}] Model loaded successfully`);
    } catch (error) {
      console.error(`[${timestamp}] Failed to load model:`, error);
      throw new Error('Failed to load face tracking model - please try again');
    }
  }, []);

  /**
   * Start the eye tracking process
   */
  const startTracking = useCallback(async () => {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] Starting eye tracking...`);

    if (isTracking) {
      console.log(`[${timestamp}] Already tracking, no need to start again`);
      return;
    }

    try {
      // Set up webcam first
      await setupWebcam();
      console.log(`[${timestamp}] Webcam is ready`);

      // Make sure model is loaded
      if (isModelLoading || !modelRef.current) {
        await ensureModelIsLoaded(timestamp);
      }

      // Start detection loop
      runDetectionLoop(timestamp);
    } catch (error) {
      console.error('Error starting tracking:', error);
      setError(error instanceof Error ? error.message : String(error));
      setIsTracking(false);
    }
  }, [isTracking, setupWebcam, isModelLoading, ensureModelIsLoaded, runDetectionLoop]);

  /**
   * Stop tracking and release resources
   */
  const stopTracking = useCallback(() => {
    console.log('Stopping eye tracking...');

    // Cancel animation frame
    if (requestAnimationRef.current) {
      cancelAnimationFrame(requestAnimationRef.current);
      requestAnimationRef.current = null;
    }

    // Stop webcam stream
    if (webcamRef.current && webcamRef.current.srcObject) {
      const stream = webcamRef.current.srcObject as MediaStream;
      stopMediaTracks(stream);
      webcamRef.current.srcObject = null;
    }

    // Reset state
    setIsTracking(false);
    gazeHistoryRef.current = [];
  }, []);

  // Force timeout to prevent UI from being stuck in loading state
  useEffect(() => {
    forceTimeoutRef.current = setTimeout(() => {
      if (isModelLoading || isWebcamLoading) {
        console.log(
          'Force timeout: Setting component to ready state to prevent UI from being stuck'
        );

        // Enable dummy detector if needed
        if (typeof window !== 'undefined' && !window._useDummyDetector) {
          window._useDummyDetector = true;
          console.log('Force enabled dummy detector due to timeout');
        }

        // Force set ready state
        setLocalModelLoading(false);
        setIsModelLoading(false);
        setIsWebcamLoading(false);
        setIsCameraReady(true);
      }
    }, 8000);

    return () => {
      if (forceTimeoutRef.current) {
        clearTimeout(forceTimeoutRef.current);
      }
    };
  }, [setIsCameraReady, setIsModelLoading, isModelLoading, isWebcamLoading]);

  // Load the TensorFlow model on mount
  useEffect(() => {
    // Skip this effect on the server
    if (!isBrowser) return;

    async function loadModel() {
      try {
        console.log('Starting TensorFlow model loading...', new Date().toISOString());

        // Clear any previous model
        if (modelRef.current) {
          modelRef.current = null;
        }

        // Reset global state
        setGazeData([]);

        // Load the face landmarks detection model
        console.log('Loading face landmarks model...');
        const startTime = performance.now();

        try {
          modelRef.current = await createFaceLandmarksDetector();
          const loadTime = performance.now() - startTime;
          console.log(`Face detector model loaded successfully in ${loadTime.toFixed(0)}ms`);
        } catch (modelError) {
          console.error('Error loading face landmarks model:', modelError);
          throw modelError;
        }

        // Verify model is loaded
        if (!modelRef.current) {
          throw new Error('Model loaded but reference is null');
        }

        // Update state
        setLocalModelLoading(false);
        setIsModelLoading(false);
        console.log('Model loading complete, ready for detection', new Date().toISOString());
      } catch (err) {
        console.error('Error loading TensorFlow model:', err);

        const errorMessage = createDetailedErrorMessage(err);

        // Try fallback detector
        try {
          console.log('Trying to create fallback detector');
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

  // Cleanup on unmount
  useEffect(() => {
    const videoElement = webcamRef.current;

    return () => {
      console.log('Cleaning up eye tracking...');

      // Cancel animation frame
      if (requestAnimationRef.current) {
        cancelAnimationFrame(requestAnimationRef.current);
      }

      // Clear timeout
      if (webcamTimeoutRef.current) {
        clearTimeout(webcamTimeoutRef.current);
      }

      // Stop webcam stream
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
