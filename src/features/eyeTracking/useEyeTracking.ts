import { useRef, useState, useEffect, useCallback } from 'react';
import * as tf from '@tensorflow/tfjs';
import * as faceLandmarksDetection from '@tensorflow-models/face-landmarks-detection';
import { MediaPipeFaceMesh } from '@tensorflow-models/face-landmarks-detection/dist/types';

// Define types for face landmarks
interface FaceLandmark {
  x: number;
  y: number;
  z: number;
}

interface FacePrediction {
  scaledMesh: FaceLandmark[];
  boundingBox: {
    topLeft: [number, number];
    bottomRight: [number, number];
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
  webcamRef: React.RefObject<HTMLVideoElement>;
  canvasRef: React.RefObject<HTMLCanvasElement>;
  startTracking: () => Promise<void>;
  stopTracking: () => void;
}

const DEFAULT_OPTIONS: EyeTrackingOptions = {
  drawLandmarks: true,
  drawPath: true,
  pathColor: 'rgba(255, 0, 0, 0.7)',
  pathLength: 50,
  landmarkColor: 'rgba(0, 255, 0, 0.7)',
};

export function useEyeTracking(options: EyeTrackingOptions = {}): EyeTrackingState {
  const mergedOptions = { ...DEFAULT_OPTIONS, ...options };

  const [isModelLoading, setIsModelLoading] = useState(true);
  const [isWebcamLoading, setIsWebcamLoading] = useState(true);
  const [isTracking, setIsTracking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const webcamRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const modelRef = useRef<MediaPipeFaceMesh | null>(null);
  const requestAnimationRef = useRef<number | null>(null);
  const gazeHistoryRef = useRef<Array<{ x: number; y: number }>>([]);

  // Load the TensorFlow model
  useEffect(() => {
    async function loadModel() {
      try {
        // Ensure TensorFlow is ready
        await tf.ready();

        // Load the face landmarks detection model
        modelRef.current = await faceLandmarksDetection.load(
          faceLandmarksDetection.SupportedPackages.mediapipeFacemesh,
          { maxFaces: 1 }
        );

        setIsModelLoading(false);
      } catch (err) {
        setError(`Failed to load model: ${err instanceof Error ? err.message : String(err)}`);
        setIsModelLoading(false);
      }
    }

    loadModel();

    // Cleanup
    return () => {
      if (requestAnimationRef.current) {
        cancelAnimationFrame(requestAnimationRef.current);
      }
    };
  }, []);

  // Setup webcam
  const setupWebcam = useCallback(async () => {
    if (!webcamRef.current) return;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user' },
      });

      webcamRef.current.srcObject = stream;

      return new Promise<void>((resolve) => {
        if (webcamRef.current) {
          webcamRef.current.onloadedmetadata = () => {
            setIsWebcamLoading(false);
            resolve();
          };
        }
      });
    } catch (err) {
      setError(`Webcam access denied: ${err instanceof Error ? err.message : String(err)}`);
      setIsWebcamLoading(false);
    }
  }, []);

  // Calculate eye gaze from landmarks
  const calculateEyeGaze = useCallback((landmarks: FacePrediction[] | null) => {
    if (!landmarks || landmarks.length === 0) return null;

    // Get eye landmarks (using MediaPipe FaceMesh indices)
    // Left eye: 130, 133, 160, 159, 158, 144, 145, 153
    // Right eye: 362, 263, 386, 385, 384, 398, 386, 374

    // For simplicity, we'll use the center points of each eye
    const leftEyePoints = [130, 133, 160, 159, 158, 144, 145, 153].map((idx) => [
      landmarks[0].scaledMesh[idx].x,
      landmarks[0].scaledMesh[idx].y,
    ]);
    const rightEyePoints = [362, 263, 386, 385, 384, 398, 386, 374].map((idx) => [
      landmarks[0].scaledMesh[idx].x,
      landmarks[0].scaledMesh[idx].y,
    ]);

    // Calculate eye centers
    const leftEyeCenter = leftEyePoints.reduce(
      (acc, point) => ({ x: acc.x + point[0], y: acc.y + point[1] }),
      { x: 0, y: 0 }
    );
    leftEyeCenter.x /= leftEyePoints.length;
    leftEyeCenter.y /= leftEyePoints.length;

    const rightEyeCenter = rightEyePoints.reduce(
      (acc, point) => ({ x: acc.x + point[0], y: acc.y + point[1] }),
      { x: 0, y: 0 }
    );
    rightEyeCenter.x /= rightEyePoints.length;
    rightEyeCenter.y /= rightEyePoints.length;

    // Average of both eyes for gaze point
    return {
      x: (leftEyeCenter.x + rightEyeCenter.x) / 2,
      y: (leftEyeCenter.y + rightEyeCenter.y) / 2,
    };
  }, []);

  // Draw eye landmarks and gaze path
  const drawResults = useCallback(
    (landmarks: FacePrediction[] | null, gazePoint: { x: number; y: number } | null) => {
      if (!canvasRef.current || !webcamRef.current || !gazePoint) return;

      const ctx = canvasRef.current.getContext('2d');
      if (!ctx) return;

      // Clear canvas
      ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);

      // Draw landmarks if enabled
      if (mergedOptions.drawLandmarks && landmarks && landmarks.length > 0) {
        ctx.fillStyle = mergedOptions.landmarkColor || 'rgba(0, 255, 0, 0.7)';

        // Draw eye landmarks
        const eyeIndices = [
          // Left eye
          130, 133, 160, 159, 158, 144, 145, 153,
          // Right eye
          362, 263, 386, 385, 384, 398, 386, 374,
        ];

        eyeIndices.forEach((index) => {
          const point = [landmarks[0].scaledMesh[index].x, landmarks[0].scaledMesh[index].y];
          ctx.beginPath();
          ctx.arc(point[0], point[1], 2, 0, 2 * Math.PI);
          ctx.fill();
        });
      }

      // Update gaze history
      if (gazePoint) {
        gazeHistoryRef.current.push(gazePoint);

        // Limit history length
        if (gazeHistoryRef.current.length > (mergedOptions.pathLength || 50)) {
          gazeHistoryRef.current.shift();
        }

        // Draw gaze path if enabled
        if (mergedOptions.drawPath) {
          ctx.strokeStyle = mergedOptions.pathColor || 'rgba(255, 0, 0, 0.7)';
          ctx.lineWidth = 2;
          ctx.beginPath();

          const history = gazeHistoryRef.current;
          if (history.length > 0) {
            ctx.moveTo(history[0].x, history[0].y);

            for (let i = 1; i < history.length; i++) {
              ctx.lineTo(history[i].x, history[i].y);
            }

            ctx.stroke();
          }

          // Draw current gaze point
          ctx.fillStyle = 'rgba(255, 0, 0, 1)';
          ctx.beginPath();
          ctx.arc(gazePoint.x, gazePoint.y, 5, 0, 2 * Math.PI);
          ctx.fill();
        }

        // Call the onGazeMove callback if provided
        if (mergedOptions.onGazeMove) {
          mergedOptions.onGazeMove(gazePoint.x, gazePoint.y);
        }
      }
    },
    [mergedOptions]
  );

  // Main detection loop
  const detectFace = useCallback(async () => {
    if (!modelRef.current || !webcamRef.current || !canvasRef.current || !isTracking) return;

    try {
      // Ensure the video is ready
      if (webcamRef.current.readyState !== 4) {
        requestAnimationRef.current = requestAnimationFrame(detectFace);
        return;
      }

      // Match canvas size to video
      const video = webcamRef.current;
      const canvas = canvasRef.current;

      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      // Detect face landmarks
      const predictions = await modelRef.current.estimateFaces({
        input: video,
        returnTensors: false,
        flipHorizontal: false,
        predictIrises: true,
      });

      // Calculate eye gaze
      const gazePoint = calculateEyeGaze(predictions);

      // Draw results
      drawResults(predictions, gazePoint);
    } catch (err) {
      console.error('Detection error:', err);
    }

    // Continue detection loop
    if (isTracking) {
      requestAnimationRef.current = requestAnimationFrame(detectFace);
    }
  }, [isTracking, calculateEyeGaze, drawResults]);

  // Start tracking function
  const startTracking = useCallback(async () => {
    if (isModelLoading || isWebcamLoading) {
      setError('Model or webcam not ready yet');
      return;
    }

    if (!webcamRef.current || !canvasRef.current) {
      setError('Webcam or canvas reference not available');
      return;
    }

    try {
      // Setup webcam if not already done
      if (isWebcamLoading) {
        await setupWebcam();
      }

      // Clear previous tracking
      if (requestAnimationRef.current) {
        cancelAnimationFrame(requestAnimationRef.current);
      }

      // Reset gaze history
      gazeHistoryRef.current = [];

      // Start tracking
      setIsTracking(true);
      requestAnimationRef.current = requestAnimationFrame(detectFace);
    } catch (err) {
      setError(`Failed to start tracking: ${err instanceof Error ? err.message : String(err)}`);
    }
  }, [isModelLoading, isWebcamLoading, setupWebcam, detectFace]);

  // Stop tracking function
  const stopTracking = useCallback(() => {
    setIsTracking(false);

    if (requestAnimationRef.current) {
      cancelAnimationFrame(requestAnimationRef.current);
      requestAnimationRef.current = null;
    }

    // Clear canvas
    if (canvasRef.current) {
      const ctx = canvasRef.current.getContext('2d');
      if (ctx) {
        ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
      }
    }
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
