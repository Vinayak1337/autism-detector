'use client';

import React, { useRef, useEffect, useState, useCallback } from 'react';
import Webcam from 'react-webcam';
import { useEyeTrackingStore } from '../store';
import { Point } from '../AnimatedBall';
import * as tf from '@tensorflow/tfjs';
import '@tensorflow/tfjs-backend-webgl';
import '@tensorflow/tfjs-backend-cpu';

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

interface BlazeFacePrediction {
  topLeft: [number, number];
  bottomRight: [number, number];
  landmarks: Array<[number, number]>;
  probability: number;
}

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
  const [isCameraReadyLogged, setIsCameraReadyLogged] = useState(false); // Track if logged

  const {
    setIsCameraReady,
    setEyeDetected,
    testPhase: currentTestPhase,
    addGazePoint,
    eyeDetected, // Access current eyeDetected state
  } = useEyeTrackingStore();

  const loadModels = useCallback(async () => {
    try {
      await tf.setBackend('webgl');
      console.log('Using TensorFlow.js backend:', tf.getBackend());
      await tf.ready();
      console.log('TensorFlow.js is ready');

      console.log('Loading blazeface model...');
      const blazeFace = await import('@tensorflow-models/blazeface');
      console.log('Loading BlazeFace model...');
      const model = await blazeFace.load();
      console.log('BlazeFace model loaded successfully');

      const blazeFaceDetector: FaceLandmarksDetector = {
        estimateFaces: async (image) => {
          const predictions = (await model.estimateFaces(image, false)) as BlazeFacePrediction[];
          return predictions.map((pred: BlazeFacePrediction) => {
            const keypoints = [
              { x: pred.landmarks[0][0], y: pred.landmarks[0][1], z: 0 }, // Left eye
              { x: pred.landmarks[1][0], y: pred.landmarks[1][1], z: 0 }, // Right eye
              { x: pred.landmarks[2][0], y: pred.landmarks[2][1], z: 0 }, // Nose
              { x: pred.landmarks[3][0], y: pred.landmarks[3][1], z: 0 }, // Mouth
              { x: pred.landmarks[4][0], y: pred.landmarks[4][1], z: 0 }, // Left ear
              { x: pred.landmarks[5][0], y: pred.landmarks[5][1], z: 0 }, // Right ear
            ];

            const leftEyeX = pred.landmarks[0][0];
            const leftEyeY = pred.landmarks[0][1];
            const rightEyeX = pred.landmarks[1][0];
            const rightEyeY = pred.landmarks[1][1];

            for (let i = 0; i < 8; i++) {
              const angle = (i / 8) * 2 * Math.PI;
              const radius = 10;
              keypoints.push({
                x: leftEyeX + radius * Math.cos(angle),
                y: leftEyeY + radius * Math.sin(angle),
                z: 0,
              });
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
    if (!detector || !webcamRef.current?.video || webcamRef.current.video.readyState !== 4) {
      return;
    }

    try {
      const video = webcamRef.current.video;
      const videoWidth = video.videoWidth;
      const videoHeight = video.videoHeight;

      if (videoWidth === 0 || videoHeight === 0) {
        console.log('Invalid video dimensions, skipping detection');
        return;
      }

      if (canvasRef.current) {
        canvasRef.current.width = videoWidth;
        canvasRef.current.height = videoHeight;
      }

      const faces = await detector.estimateFaces(video);
      const eyesDetectedNow = faces.length > 0;

      setEyeDetected(eyesDetectedNow);
      if (onEyeDetected) {
        onEyeDetected(eyesDetectedNow);
      }

      if (eyesDetectedNow && !isCameraReadyLogged) {
        setIsCameraReady(true);
        console.log('Camera is ready'); // Log only once when eyes are first detected
        setIsCameraReadyLogged(true);
      }

      if (faces.length > 0 && canvasRef.current) {
        const ctx = canvasRef.current.getContext('2d');
        if (!ctx) return;

        ctx.clearRect(0, 0, videoWidth, videoHeight);

        const face = faces[0];
        const origLeftEye = face.keypoints[0];
        const origRightEye = face.keypoints[1];

        const leftEye = {
          x: videoWidth - origLeftEye.x,
          y: origLeftEye.y,
        };
        const rightEye = {
          x: videoWidth - origRightEye.x,
          y: origRightEye.y,
        };

        const eyeCenterX = (leftEye.x + rightEye.x) / 2;
        const eyeCenterY = (leftEye.y + rightEye.y) / 2;

        const gazeX = (eyeCenterX / videoWidth) * 100;
        const gazeY = (eyeCenterY / videoHeight) * 100;

        const gazePoint: Point = {
          x: Math.min(Math.max(gazeX, 0), 100),
          y: Math.min(Math.max(gazeY, 0), 100),
        };

        if (onGazeData) {
          onGazeData(gazePoint);
        }

        if (currentTestPhase === 'testing' || phase === 'testing') {
          addGazePoint(gazePoint);
        }

        ctx.lineWidth = 2;

        ctx.beginPath();
        ctx.arc(leftEye.x, leftEye.y, 8, 0, 2 * Math.PI);
        ctx.fillStyle = 'rgba(0, 255, 255, 0.6)';
        ctx.fill();
        ctx.strokeStyle = 'rgba(0, 255, 255, 1)';
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(rightEye.x, rightEye.y, 8, 0, 2 * Math.PI);
        ctx.fillStyle = 'rgba(0, 255, 255, 0.6)';
        ctx.fill();
        ctx.strokeStyle = 'rgba(0, 255, 255, 1)';
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(leftEye.x, leftEye.y);
        ctx.lineTo(rightEye.x, rightEye.y);
        ctx.strokeStyle = 'rgba(0, 255, 255, 0.8)';
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(eyeCenterX, eyeCenterY, 5, 0, 2 * Math.PI);
        ctx.fillStyle = 'rgba(255, 255, 0, 0.8)';
        ctx.fill();
        ctx.strokeStyle = 'rgba(255, 255, 0, 1)';
        ctx.stroke();

        ctx.font = '12px Arial';
        ctx.fillStyle = 'white';
        ctx.fillText(
          `Center: (${Math.round(gazeX)}%, ${Math.round(gazeY)}%)`,
          10,
          videoHeight - 10
        );
      } else if (canvasRef.current) {
        const ctx = canvasRef.current.getContext('2d');
        if (ctx) {
          ctx.clearRect(0, 0, videoWidth, videoHeight);
        }
      }
    } catch (err) {
      console.error('Error in detection:', err);
    }
  }, [
    detector,
    onEyeDetected,
    onGazeData,
    currentTestPhase,
    addGazePoint,
    phase,
    setEyeDetected,
    setIsCameraReady,
    isCameraReadyLogged,
  ]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      loadModels();
    }
  }, [loadModels]);

  // Check webcam readiness only until eyes are detected
  useEffect(() => {
    if (eyeDetected && isCameraReadyLogged) {
      return; // Stop checking if eyes are detected and camera readiness is logged
    }

    const checkWebcam = () => {
      if (
        webcamRef.current &&
        webcamRef.current.video &&
        webcamRef.current.video.readyState === 4
      ) {
        setIsCameraReady(true);
      } else {
        setIsCameraReady(false);
      }
    };

    checkWebcam();
    const interval = setInterval(checkWebcam, 1000);

    return () => {
      clearInterval(interval);
    };
  }, [setIsCameraReady, eyeDetected, isCameraReadyLogged]);

  useEffect(() => {
    if (!detector) return;

    const detectionInterval = setInterval(() => {
      detect();
    }, 100);

    return () => {
      clearInterval(detectionInterval);
    };
  }, [detector, detect]);

  const defaultContainerStyle: React.CSSProperties = {
    width: '100%',
    height: '100%',
    position: 'relative',
    overflow: 'hidden',
    borderRadius: '0.5rem',
    backgroundColor: '#000',
  };

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