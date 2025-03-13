'use client';

import React, { useRef, useEffect, useState } from 'react';
import Webcam from 'react-webcam';
import { useEyeTrackingStore } from './store';
import { Point } from './AnimatedBall';
import * as tf from '@tensorflow/tfjs';
// Explicitly import backends to ensure they're available
import '@tensorflow/tfjs-backend-webgl';
import '@tensorflow/tfjs-backend-cpu';

// Define types we need for our component
interface Keypoint {
  x: number;
  y: number;
  z?: number;
}

interface FacePrediction {
  keypoints: Keypoint[];
  box?: {
    xMin: number;
    yMin: number;
    xMax: number;
    yMax: number;
    width: number;
    height: number;
  };
}

// BlazeFace specific types
interface BlazeFacePrediction {
  topLeft: [number, number];
  bottomRight: [number, number];
  landmarks: Array<[number, number]>;
  probability: number;
}

// Define a simplified type for the detector
interface FaceLandmarksDetector {
  estimateFaces: (image: HTMLVideoElement | HTMLImageElement) => Promise<FacePrediction[]>;
}

interface EyeTrackingComponentProps {
  width?: string | number;
  height?: string | number;
  testPhase?: string;
  onGazeData?: (point: Point) => void;
  onEyeDetected?: (detected: boolean) => void;
}

export const EyeTrackingComponent: React.FC<EyeTrackingComponentProps> = ({
  width = '100%',
  height = '100%',
  testPhase = 'setup',
  onGazeData,
  onEyeDetected,
}) => {
  const webcamRef = useRef<Webcam>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isModelLoading, setIsModelLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [detector, setDetector] = useState<FaceLandmarksDetector | null>(null);

  // Access the store state and actions
  const {
    setIsCameraReady,
    setEyeDetected,
    testPhase: currentTestPhase,
    addGazePoint,
  } = useEyeTrackingStore();

  const loadModels = async () => {
    try {
      // Initialize TensorFlow.js with WebGL backend
      await tf.setBackend('webgl');
      console.log('Using TensorFlow.js backend:', tf.getBackend());
      await tf.ready();
      console.log('TensorFlow.js is ready');

      // Load the blazeface model which is more reliable
      console.log('Loading blazeface model...');
      const blazeFace = await import('@tensorflow-models/blazeface');

      // Load the BlazeFace model
      console.log('Loading BlazeFace model...');
      const model = await blazeFace.load();
      console.log('BlazeFace model loaded successfully');

      // Create a wrapper to make the BlazeFace model compatible with our interface
      const blazeFaceDetector: FaceLandmarksDetector = {
        estimateFaces: async (image) => {
          // Detect faces using BlazeFace
          const predictions = (await model.estimateFaces(image, false)) as BlazeFacePrediction[];

          // Convert BlazeFace predictions to our expected format
          return predictions.map((pred: BlazeFacePrediction) => {
            // Extract landmarks - BlazeFace provides 6 keypoints:
            // 2 eyes, 2 ears, nose, and mouth
            const keypoints = [
              // Left eye
              { x: pred.landmarks[0][0], y: pred.landmarks[0][1], z: 0 },
              // Right eye
              { x: pred.landmarks[1][0], y: pred.landmarks[1][1], z: 0 },
              // Nose
              { x: pred.landmarks[2][0], y: pred.landmarks[2][1], z: 0 },
              // Mouth
              { x: pred.landmarks[3][0], y: pred.landmarks[3][1], z: 0 },
              // Left ear
              { x: pred.landmarks[4][0], y: pred.landmarks[4][1], z: 0 },
              // Right ear
              { x: pred.landmarks[5][0], y: pred.landmarks[5][1], z: 0 },
            ];

            // Add boundary points around eyes (more detailed eye contour)
            const leftEyeX = pred.landmarks[0][0];
            const leftEyeY = pred.landmarks[0][1];
            const rightEyeX = pred.landmarks[1][0];
            const rightEyeY = pred.landmarks[1][1];

            // Add 8 points around each eye
            // Left eye
            for (let i = 0; i < 8; i++) {
              const angle = (i / 8) * 2 * Math.PI;
              const radius = 10;
              keypoints.push({
                x: leftEyeX + radius * Math.cos(angle),
                y: leftEyeY + radius * Math.sin(angle),
                z: 0,
              });
            }

            // Right eye
            for (let i = 0; i < 8; i++) {
              const angle = (i / 8) * 2 * Math.PI;
              const radius = 10;
              keypoints.push({
                x: rightEyeX + radius * Math.cos(angle),
                y: rightEyeY + radius * Math.sin(angle),
                z: 0,
              });
            }

            return {
              keypoints,
              box: {
                xMin: pred.topLeft[0],
                yMin: pred.topLeft[1],
                xMax: pred.bottomRight[0],
                yMax: pred.bottomRight[1],
                width: pred.bottomRight[0] - pred.topLeft[0],
                height: pred.bottomRight[1] - pred.topLeft[1],
              },
            };
          });
        },
      };

      // Set the detector
      setDetector(blazeFaceDetector);
      setIsModelLoading(false);
      console.log('Face detector ready');
    } catch (err) {
      console.error('Failed to load models:', err);
      setError(
        'Failed to load facial detection models. Please check your internet connection and try again. Error: ' +
          (err instanceof Error ? err.message : String(err))
      );
      setIsModelLoading(false);
    }
  };

  const detect = async () => {
    if (!detector) return;

    if (
      typeof webcamRef.current !== 'undefined' &&
      webcamRef.current !== null &&
      webcamRef.current.video &&
      webcamRef.current.video.readyState === 4
    ) {
      try {
        // Get Video Properties
        const video = webcamRef.current.video;
        const videoWidth = webcamRef.current.video.videoWidth;
        const videoHeight = webcamRef.current.video.videoHeight;

        // Set video width
        webcamRef.current.video.width = videoWidth;
        webcamRef.current.video.height = videoHeight;

        // Set canvas width
        if (canvasRef.current) {
          canvasRef.current.width = videoWidth;
          canvasRef.current.height = videoHeight;
        }

        // Make Detections
        const faces = await detector.estimateFaces(video);
        const eyesDetected = faces.length > 0;

        // Update store and notify parent component if needed
        setEyeDetected(eyesDetected);
        if (onEyeDetected) {
          onEyeDetected(eyesDetected);
        }

        // If we have faces, calculate gaze position and draw
        if (faces.length > 0) {
          // Calculate gaze position as normalized coordinates (0-100%)
          const face = faces[0];
          const leftEye = face.keypoints[0];
          const rightEye = face.keypoints[1];

          // Center point between eyes
          const eyeCenterX = (leftEye.x + rightEye.x) / 2;
          const eyeCenterY = (leftEye.y + rightEye.y) / 2;

          // Convert to percentage of screen
          const gazeX = (eyeCenterX / videoWidth) * 100;
          const gazeY = (eyeCenterY / videoHeight) * 100;

          // Create gaze point
          const gazePoint: Point = {
            x: Math.min(Math.max(gazeX, 0), 100),
            y: Math.min(Math.max(gazeY, 0), 100),
            timestamp: Date.now(),
          };

          // Call onGazeData callback if provided
          if (onGazeData) {
            onGazeData(gazePoint);
          }

          // Add to store if in testing phase
          if (currentTestPhase === 'testing') {
            addGazePoint(gazePoint);
          }

          // Get canvas context for visualization
          if (canvasRef.current) {
            const ctx = canvasRef.current.getContext('2d');
            if (ctx) {
              // Clear the canvas
              ctx.clearRect(0, 0, videoWidth, videoHeight);

              // Draw eye circles
              ctx.beginPath();
              ctx.arc(leftEye.x, leftEye.y, 5, 0, 2 * Math.PI);
              ctx.fillStyle = 'aqua';
              ctx.fill();

              ctx.beginPath();
              ctx.arc(rightEye.x, rightEye.y, 5, 0, 2 * Math.PI);
              ctx.fillStyle = 'aqua';
              ctx.fill();

              // Draw line between eyes
              ctx.beginPath();
              ctx.moveTo(leftEye.x, leftEye.y);
              ctx.lineTo(rightEye.x, rightEye.y);
              ctx.strokeStyle = 'aqua';
              ctx.lineWidth = 2;
              ctx.stroke();

              // Draw center point between eyes
              ctx.beginPath();
              ctx.arc(eyeCenterX, eyeCenterY, 3, 0, 2 * Math.PI);
              ctx.fillStyle = 'yellow';
              ctx.fill();
            }
          }
        } else if (canvasRef.current) {
          // Clear the canvas if no faces
          const ctx = canvasRef.current.getContext('2d');
          if (ctx) {
            ctx.clearRect(0, 0, videoWidth, videoHeight);
          }
        }
      } catch (err) {
        console.error('Error in detection:', err);
      }
    }
  };

  // Initialize the models on mount
  useEffect(() => {
    // Only load models in the browser
    if (typeof window !== 'undefined') {
      loadModels();
    }

    return () => {
      // Cleanup
    };
  }, []);

  // Handle webcam ready state
  useEffect(() => {
    const checkWebcam = () => {
      if (
        webcamRef.current &&
        webcamRef.current.video &&
        webcamRef.current.video.readyState === 4
      ) {
        setIsCameraReady(true);
        console.log('Camera is ready');
      } else {
        setIsCameraReady(false);
      }
    };

    // Initial check
    checkWebcam();

    // Set up interval to check periodically
    const interval = setInterval(checkWebcam, 1000);

    return () => {
      clearInterval(interval);
    };
  }, [setIsCameraReady]);

  // Set up the detection loop if detector is available
  useEffect(() => {
    if (!detector) return;

    const detectionInterval = setInterval(() => {
      detect();
    }, 100);

    return () => {
      clearInterval(detectionInterval);
    };
  }, [detector]);

  const webcamStyle = {
    width,
    height,
    position: 'absolute' as const,
    margin: 0,
    padding: 0,
    transform: 'scaleX(-1)', // Mirror the webcam view
  };

  const canvasStyle = {
    width,
    height,
    position: 'absolute' as const,
    margin: 0,
    padding: 0,
    transform: 'scaleX(-1)', // Mirror the canvas to match webcam
  };

  // Add some error styling
  const errorStyle = {
    position: 'absolute' as const,
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    backgroundColor: 'rgba(220, 53, 69, 0.8)',
    color: 'white',
    padding: '10px',
    borderRadius: '4px',
    zIndex: 10,
    textAlign: 'center' as const,
    maxWidth: '80%',
  };

  return (
    <div style={{ position: 'relative', width, height }}>
      {isModelLoading && (
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            zIndex: 10,
            backgroundColor: 'rgba(0, 0, 0, 0.7)',
            color: 'white',
            padding: '10px',
            borderRadius: '4px',
          }}
        >
          Loading face detection...
        </div>
      )}

      {error && <div style={errorStyle}>{error}</div>}

      <Webcam
        ref={webcamRef}
        style={webcamStyle}
        audio={false}
        screenshotFormat="image/jpeg"
        videoConstraints={{
          facingMode: 'user',
        }}
      />

      <canvas ref={canvasRef} style={canvasStyle} className="eye-tracking-overlay" />
    </div>
  );
};
