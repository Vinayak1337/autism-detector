'use client';

import React, { useEffect, useRef, useCallback } from 'react';
import { Point } from '../AnimatedBall';

interface EyeTrackingVisualizerProps {
  gazeData: Point[];
  width?: number;
  height?: number;
  showHeatmap?: boolean;
  showTrail?: boolean;
  trailLength?: number;
  className?: string;
}

/**
 * A component that visualizes eye tracking data on a canvas
 * Can show either a heatmap of eye focus areas or a trail of eye movements
 */
export const EyeTrackingVisualizer: React.FC<EyeTrackingVisualizerProps> = ({
  gazeData,
  width = 300,
  height = 200,
  showHeatmap = true,
  showTrail = true,
  trailLength = 50,
  className = '',
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const prevPointsRef = useRef<Point[]>([]);

  // Draw a heatmap of eye movements
  const drawHeatmap = useCallback(
    (ctx: CanvasRenderingContext2D, points: Point[], canvasWidth: number, canvasHeight: number) => {
      if (points.length === 0) return;

      // We'll use a separate canvas for the heatmap to allow compositing
      const heatmapCanvas = document.createElement('canvas');
      heatmapCanvas.width = canvasWidth;
      heatmapCanvas.height = canvasHeight;
      const heatCtx = heatmapCanvas.getContext('2d');

      if (!heatCtx) return;

      // Clear the heatmap canvas
      heatCtx.clearRect(0, 0, canvasWidth, canvasHeight);

      // Draw each point as a gradient circle
      for (const point of points) {
        const x = (point.x / 100) * canvasWidth;
        const y = (point.y / 100) * canvasHeight;

        // Create a radial gradient
        const gradient = heatCtx.createRadialGradient(x, y, 0, x, y, 30);
        gradient.addColorStop(0, 'rgba(255, 0, 0, 0.2)');
        gradient.addColorStop(0.3, 'rgba(255, 255, 0, 0.1)');
        gradient.addColorStop(1, 'rgba(0, 0, 255, 0)');

        // Draw the gradient circle
        heatCtx.beginPath();
        heatCtx.arc(x, y, 30, 0, Math.PI * 2);
        heatCtx.fillStyle = gradient;
        heatCtx.fill();
      }

      // Composite the heatmap onto the main canvas
      if (showTrail) {
        // If we're showing a trail, we want the heatmap to appear underneath
        const compositeOperation = ctx.globalCompositeOperation;
        ctx.globalCompositeOperation = 'destination-over';
        ctx.drawImage(heatmapCanvas, 0, 0);
        ctx.globalCompositeOperation = compositeOperation;
      } else {
        // If no trail, just draw the heatmap directly
        ctx.drawImage(heatmapCanvas, 0, 0);
      }
    },
    [showTrail]
  );

  // Draw the visualization on the canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Only update if we have new data
    if (gazeData.length === 0) return;

    // If this is the first render or we need to clear
    if (prevPointsRef.current.length === 0) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }

    // Store limited history for drawing the trail
    const currentPoints = [...prevPointsRef.current, ...gazeData];
    if (currentPoints.length > trailLength) {
      prevPointsRef.current = currentPoints.slice(-trailLength);
    } else {
      prevPointsRef.current = currentPoints;
    }

    // Draw the points
    if (showTrail) {
      drawTrail(ctx, prevPointsRef.current, canvas.width, canvas.height);
    }

    if (showHeatmap) {
      drawHeatmap(ctx, prevPointsRef.current, canvas.width, canvas.height);
    }
  }, [gazeData, showHeatmap, showTrail, trailLength, drawHeatmap]);

  // Draw a trail connecting eye movement points
  const drawTrail = (
    ctx: CanvasRenderingContext2D,
    points: Point[],
    canvasWidth: number,
    canvasHeight: number
  ) => {
    if (points.length < 2) return;

    // Clear the canvas for trail
    ctx.clearRect(0, 0, canvasWidth, canvasHeight);

    // Start a new path
    ctx.beginPath();

    // Convert percentage coordinates to canvas coordinates
    const startX = (points[0].x / 100) * canvasWidth;
    const startY = (points[0].y / 100) * canvasHeight;

    ctx.moveTo(startX, startY);

    // Draw the line through all points
    for (let i = 1; i < points.length; i++) {
      const x = (points[i].x / 100) * canvasWidth;
      const y = (points[i].y / 100) * canvasHeight;

      ctx.lineTo(x, y);
    }

    // Set line style
    ctx.strokeStyle = 'rgba(75, 85, 255, 0.7)';
    ctx.lineWidth = 3;
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';

    // Draw the line
    ctx.stroke();

    // Draw points on the trail
    for (let i = 0; i < points.length; i++) {
      const x = (points[i].x / 100) * canvasWidth;
      const y = (points[i].y / 100) * canvasHeight;

      // Make more recent points larger and more opaque
      const size = 2 + (i / points.length) * 5;
      const opacity = 0.3 + (i / points.length) * 0.7;

      ctx.beginPath();
      ctx.arc(x, y, size, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(75, 85, 255, ${opacity})`;
      ctx.fill();
    }

    // Draw the current gaze position (most recent point)
    if (points.length > 0) {
      const current = points[points.length - 1];
      const currentX = (current.x / 100) * canvasWidth;
      const currentY = (current.y / 100) * canvasHeight;

      ctx.beginPath();
      ctx.arc(currentX, currentY, 8, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(255, 69, 0, 0.8)';
      ctx.fill();

      // Add a pulsing ring
      ctx.beginPath();
      ctx.arc(currentX, currentY, 12, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(255, 69, 0, 0.5)';
      ctx.lineWidth = 2;
      ctx.stroke();
    }
  };

  return (
    <div className={`relative ${className}`}>
      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        className="bg-white rounded-lg shadow-md"
      />
      <div className="absolute bottom-2 right-2 text-xs text-gray-500">
        Points: {prevPointsRef.current.length}
      </div>
    </div>
  );
};
