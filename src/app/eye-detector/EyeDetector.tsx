'use client';

import React, { useRef, useEffect, useState } from 'react';
import Webcam from 'react-webcam';
import { drawMesh } from './utilities';
import * as tf from '@tensorflow/tfjs';
// Explicitly import backends to ensure they're available
import '@tensorflow/tfjs-backend-webgl';
import '@tensorflow/tfjs-backend-cpu';

// Define only the types we need for our component
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

const EyeDetector = () => {
  const webcamRef = useRef<Webcam>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isModelLoading, setIsModelLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [detector, setDetector] = useState<FaceLandmarksDetector | null>(null);

  const loadModels = async () => {
    try {
      // Initialize TensorFlow.js with WebGL backend
      await tf.setBackend('webgl');
      console.log('Using TensorFlow.js backend:', tf.getBackend());
      await tf.ready();
      console.log('TensorFlow.js is ready');

      // Instead of trying to load the MediaPipe model which is having issues,
      // let's use the blazeface model which is more reliable
      console.log('Loading face-landmarks-detection module...');
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

            // Add boundary points around eyes
            const leftEyeX = pred.landmarks[0][0];
            const leftEyeY = pred.landmarks[0][1];
            const rightEyeX = pred.landmarks[1][0];
            const rightEyeY = pred.landmarks[1][1];

            // Add 8 points around each eye to create a more detailed eye contour
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
        console.log(
          'Face detection results:',
          faces.length > 0 ? faces[0].keypoints.length + ' keypoints found' : 'No faces'
        );

        // Get canvas context
        if (canvasRef.current) {
          const ctx = canvasRef.current.getContext('2d');
          if (ctx) {
            // Convert Face[] to the expected format for drawMesh
            const facesWithScaledMesh = faces.map((face: FacePrediction) => ({
              scaledMesh: face.keypoints.map((kp) => [kp.x, kp.y, kp.z || 0]),
            }));

            // Clear the canvas before drawing
            ctx.clearRect(0, 0, videoWidth, videoHeight);

            // Draw the mesh (should only draw eyes based on our utilities.tsx)
            drawMesh(facesWithScaledMesh, ctx);
          }
        }
      } catch (err) {
        console.error('Error in detection:', err);
      }
    }
  };

  useEffect(() => {
    // Only load models in the browser
    if (typeof window !== 'undefined') {
      loadModels();
    }

    return () => {
      // Cleanup function
    };
  }, []);

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

  // Add some nicer styling for the loading and error states
  const messageStyle = {
    position: 'absolute' as const,
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    color: 'white',
    padding: '20px',
    borderRadius: '8px',
    zIndex: 10,
    textAlign: 'center' as const,
    maxWidth: '80%',
  };

  return (
    <div className="App">
      {isModelLoading && <div style={messageStyle}>Loading facial detection models...</div>}
      {error && (
        <div style={{ ...messageStyle, backgroundColor: 'rgba(220, 53, 69, 0.8)' }}>{error}</div>
      )}
      <header className="App-header">
        <Webcam
          ref={webcamRef}
          style={{
            position: 'absolute',
            marginLeft: 'auto',
            marginRight: 'auto',
            left: 0,
            right: 0,
            textAlign: 'center',
            zIndex: 9,
            width: 640,
            height: 480,
          }}
        />

        <canvas
          ref={canvasRef}
          style={{
            position: 'absolute',
            marginLeft: 'auto',
            marginRight: 'auto',
            left: 0,
            right: 0,
            textAlign: 'center',
            zIndex: 9,
            width: 640,
            height: 480,
          }}
        />
      </header>
    </div>
  );
};

export default EyeDetector;
