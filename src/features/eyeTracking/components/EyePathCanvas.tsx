'use client';

import React, { useEffect, useRef } from 'react';
import { Point } from '../AnimatedBall';
import { findCornerPoints } from '../dataProcessing';

interface EyePathCanvasProps {
  gazeData: Point[];
  isSquarePattern: boolean;
  width: number;
  height: number;
}

export const EyePathCanvas: React.FC<EyePathCanvasProps> = ({
  gazeData,
  isSquarePattern,
  width,
  height,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Create simulated left and right eye paths from the gaze data
  // In a real implementation, you would use actual left/right eye data
  const getLeftEyePath = (data: Point[]): Point[] => {
    return data.map((point) => ({
      x: point.x - 5 + Math.random() * 3,
      y: point.y - 2 + Math.random() * 3,
    }));
  };

  const getRightEyePath = (data: Point[]): Point[] => {
    return data.map((point) => ({
      x: point.x + 5 + Math.random() * 3,
      y: point.y - 2 + Math.random() * 3,
    }));
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || gazeData.length === 0) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, width, height);

    // Draw ideal square pattern
    const padding = 30;
    const squareSize = Math.min(width, height) - padding * 2;
    const centerX = width / 2;
    const centerY = height / 2;
    const halfSize = squareSize / 2;

    // Draw the ideal square path
    ctx.beginPath();
    ctx.strokeStyle = 'rgba(200, 200, 200, 0.5)';
    ctx.lineWidth = 2;
    ctx.moveTo(centerX - halfSize, centerY);
    ctx.lineTo(centerX, centerY - halfSize);
    ctx.lineTo(centerX + halfSize, centerY);
    ctx.lineTo(centerX, centerY + halfSize);
    ctx.lineTo(centerX - halfSize, centerY);
    ctx.stroke();

    // Normalize data points to fit canvas
    const normalizePoint = (point: Point): Point => {
      return {
        x: (point.x / 100) * width,
        y: (point.y / 100) * height,
      };
    };

    // Get left and right eye paths
    const leftEyePath = getLeftEyePath(gazeData);
    const rightEyePath = getRightEyePath(gazeData);

    // Highlight corner points in eye paths
    const leftEyeCorners = findCornerPoints(leftEyePath);
    const rightEyeCorners = findCornerPoints(rightEyePath);

    // Draw left eye path
    ctx.beginPath();
    ctx.strokeStyle = 'rgba(255, 0, 0, 0.6)';
    ctx.lineWidth = 1.5;
    if (leftEyePath.length > 0) {
      const first = normalizePoint(leftEyePath[0]);
      ctx.moveTo(first.x, first.y);
      leftEyePath.forEach((point) => {
        const normalized = normalizePoint(point);
        ctx.lineTo(normalized.x, normalized.y);
      });
    }
    ctx.stroke();

    // Draw right eye path
    ctx.beginPath();
    ctx.strokeStyle = 'rgba(0, 0, 255, 0.6)';
    ctx.lineWidth = 1.5;
    if (rightEyePath.length > 0) {
      const first = normalizePoint(rightEyePath[0]);
      ctx.moveTo(first.x, first.y);
      rightEyePath.forEach((point) => {
        const normalized = normalizePoint(point);
        ctx.lineTo(normalized.x, normalized.y);
      });
    }
    ctx.stroke();

    // Draw corner points for left eye
    ctx.fillStyle = 'rgba(255, 0, 0, 0.8)';
    leftEyeCorners.forEach((corner) => {
      const normalized = normalizePoint(corner);
      ctx.beginPath();
      ctx.arc(normalized.x, normalized.y, 4, 0, Math.PI * 2);
      ctx.fill();
    });

    // Draw corner points for right eye
    ctx.fillStyle = 'rgba(0, 0, 255, 0.8)';
    rightEyeCorners.forEach((corner) => {
      const normalized = normalizePoint(corner);
      ctx.beginPath();
      ctx.arc(normalized.x, normalized.y, 4, 0, Math.PI * 2);
      ctx.fill();
    });

    // Draw legend
    ctx.font = '10px Arial';
    ctx.fillStyle = 'black';
    ctx.fillText('Left Eye', 10, 15);
    ctx.fillStyle = 'rgba(255, 0, 0, 0.8)';
    ctx.fillRect(55, 8, 10, 10);

    ctx.fillStyle = 'black';
    ctx.fillText('Right Eye', 10, 30);
    ctx.fillStyle = 'rgba(0, 0, 255, 0.8)';
    ctx.fillRect(55, 23, 10, 10);

    ctx.fillStyle = 'black';
    ctx.fillText('Ideal Path', 10, 45);
    ctx.fillStyle = 'rgba(200, 200, 200, 0.8)';
    ctx.fillRect(55, 38, 10, 10);

    // Show pattern detection result
    ctx.fillStyle = isSquarePattern ? 'rgba(0, 128, 0, 0.8)' : 'rgba(255, 128, 0, 0.8)';
    ctx.fillText(
      isSquarePattern ? 'Square Pattern Detected' : 'Irregular Pattern Detected',
      width - 150,
      15
    );
  }, [gazeData, isSquarePattern, width, height]);

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      className="border border-gray-200 rounded-lg"
    />
  );
};
