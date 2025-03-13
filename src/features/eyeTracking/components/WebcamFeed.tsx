'use client';

import React, { useRef, useEffect, useState, useCallback } from 'react';
import Webcam from 'react-webcam';
import { useEyeTrackingStore } from '../store';
import { Point } from '../AnimatedBall';
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

interface WebcamFeedProps {
  phase: 'setup' | 'testing';
  onGazeData?: (point: Point) => void;
  onEyeDetected?: (detected: boolean) => void;
  containerStyle?: React.CSSProperties;
}

export const WebcamFeed: React.FC<WebcamFeedProps> = ({
  phase = 'setup',
  onGazeData,
  onEyeDetected,
  containerStyle,
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

  const loadModels = useCallback(async () => {
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
  }, []);

  const detect = useCallback(async () => {
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
        const videoWidth = video.videoWidth;
        const videoHeight = video.videoHeight;

        // Make sure we have valid dimensions
        if (videoWidth === 0 || videoHeight === 0) {
          console.log('Invalid video dimensions, skipping detection');
          return;
        }

        // Set canvas dimensions to match video source
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
        if (faces.length > 0 && canvasRef.current) {
          const ctx = canvasRef.current.getContext('2d');
          if (!ctx) return;

          // Clear the canvas
          ctx.clearRect(0, 0, videoWidth, videoHeight);

          // Calculate gaze position
          const face = faces[0];

          // Original eye positions
          const origLeftEye = face.keypoints[0];
          const origRightEye = face.keypoints[1];

          // Mirror the x coordinates for drawing since video is mirrored
          // but detection runs on unmirrored data
          const leftEye = {
            x: videoWidth - origLeftEye.x, // Mirror the x coordinate
            y: origLeftEye.y,
          };

          const rightEye = {
            x: videoWidth - origRightEye.x, // Mirror the x coordinate
            y: origRightEye.y,
          };

          // Center point between eyes (mirrored)
          const eyeCenterX = (leftEye.x + rightEye.x) / 2;
          const eyeCenterY = (leftEye.y + rightEye.y) / 2;

          // Convert to percentage of screen
          const gazeX = (eyeCenterX / videoWidth) * 100;
          const gazeY = (eyeCenterY / videoHeight) * 100;

          // Create gaze point
          const gazePoint: Point = {
            x: Math.min(Math.max(gazeX, 0), 100),
            y: Math.min(Math.max(gazeY, 0), 100),
          };

          // Use phase prop here when adding gaze points
          if (onGazeData) {
            onGazeData(gazePoint);
          }

          // Add to store if in testing phase (use component phase prop here)
          if (currentTestPhase === 'testing' || phase === 'testing') {
            addGazePoint(gazePoint);
          }

          // Set line width and style
          ctx.lineWidth = 2;

          // Draw eye circles with larger radius for better visibility
          // Left eye
          ctx.beginPath();
          ctx.arc(leftEye.x, leftEye.y, 8, 0, 2 * Math.PI);
          ctx.fillStyle = 'rgba(0, 255, 255, 0.6)';
          ctx.fill();
          ctx.strokeStyle = 'rgba(0, 255, 255, 1)';
          ctx.stroke();

          // Right eye
          ctx.beginPath();
          ctx.arc(rightEye.x, rightEye.y, 8, 0, 2 * Math.PI);
          ctx.fillStyle = 'rgba(0, 255, 255, 0.6)';
          ctx.fill();
          ctx.strokeStyle = 'rgba(0, 255, 255, 1)';
          ctx.stroke();

          // Draw line between eyes
          ctx.beginPath();
          ctx.moveTo(leftEye.x, leftEye.y);
          ctx.lineTo(rightEye.x, rightEye.y);
          ctx.strokeStyle = 'rgba(0, 255, 255, 0.8)';
          ctx.lineWidth = 2;
          ctx.stroke();

          // Draw center point between eyes
          ctx.beginPath();
          ctx.arc(eyeCenterX, eyeCenterY, 5, 0, 2 * Math.PI);
          ctx.fillStyle = 'rgba(255, 255, 0, 0.8)';
          ctx.fill();
          ctx.strokeStyle = 'rgba(255, 255, 0, 1)';
          ctx.stroke();

          // Show coordinates in smaller text
          ctx.font = '12px Arial';
          ctx.fillStyle = 'white';
          ctx.fillText(
            `Center: (${Math.round(gazeX)}%, ${Math.round(gazeY)}%)`,
            10,
            videoHeight - 10
          );
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
  }, [
    detector,
    webcamRef,
    canvasRef,
    setEyeDetected,
    onEyeDetected,
    onGazeData,
    currentTestPhase,
    addGazePoint,
    phase,
  ]);

  // Initialize the models on mount
  useEffect(() => {
    // Only load models in the browser
    if (typeof window !== 'undefined') {
      loadModels();
    }

    return () => {
      // Cleanup
    };
  }, [loadModels]);

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
  }, [detector, detect]);

  // Default container style that works well for both phases
  const defaultContainerStyle: React.CSSProperties = {
    width: '100%',
    height: '100%',
    position: 'relative',
    overflow: 'hidden',
    borderRadius: '0.5rem',
    backgroundColor: '#000',
  };

  // Error message styling
  const errorStyle = {
    position: 'absolute' as const,
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    backgroundColor: 'rgba(220, 53, 69, 0.8)',
    color: 'white',
    padding: '10px',
    borderRadius: '4px',
    zIndex: 20,
    textAlign: 'center' as const,
    maxWidth: '80%',
  };

  return (
    <div style={{ ...defaultContainerStyle, ...containerStyle }}>
      {isModelLoading && (
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            zIndex: 30,
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
        audio={false}
        mirrored={true}
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          position: 'absolute',
          top: 0,
          left: 0,
          zIndex: 1,
        }}
        videoConstraints={{
          facingMode: 'user',
        }}
      />

      <canvas
        ref={canvasRef}
        className="eye-tracking-overlay"
        style={{
          width: '100%',
          height: '100%',
          position: 'absolute',
          top: 0,
          left: 0,
          zIndex: 2,
        }}
      />
    </div>
  );
};
