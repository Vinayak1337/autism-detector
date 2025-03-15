'use client';

import React, { useEffect, useRef, useCallback, useState } from 'react';
import { useEyeTrackingStore } from './store';
import { analyzeEyeMovementData } from './dataProcessing';

export interface Point {
  x: number;
  y: number;
}

const MOVEMENT_DURATION = 10000;
const SQUARE_SIZE = 60;
const POSITION_UPDATE_THROTTLE_MS = 100;

interface AnimatedBallProps {
  onComplete?: () => void;
  onPositionUpdate?: (position: Point) => void;
  size?: number;
  color?: string;
  showPath?: boolean;
  showLabels?: boolean;
}

export const AnimatedBall: React.FC<AnimatedBallProps> = ({
  onComplete,
  onPositionUpdate,
  size = 30,
  color = '#4F46E5',
  showPath = true,
  showLabels = true,
}) => {
  const testPhase = useEyeTrackingStore((state) => state.testPhase);
  const endTest = useEyeTrackingStore((state) => state.endTest);
  const eyesDetected = useEyeTrackingStore((state) => state.eyeDetected);

  const ballRef = useRef<HTMLDivElement>(null);
  const animationStartTimeRef = useRef<number | null>(null);
  const progressRef = useRef<number>(0);
  const requestRef = useRef<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const lastFrameTimeRef = useRef<number | null>(null);
  const lastPositionUpdateTimeRef = useRef<number>(0);
  const isAnimatingRef = useRef(false);
  const shouldStopRef = useRef(false);
  const lastStopTimeRef = useRef<number>(0);

  const [eyePositions, setEyePositions] = useState<Point[]>([]);
  const [targetPositions, setTargetPositions] = useState<Point[]>([]);
  const [timestamps, setTimestamps] = useState<number[]>([]);

  const calculateSquarePoints = useCallback((): Point[] => {
    if (!containerRef.current) {
      console.warn('Container ref not ready');
      return [];
    }
    const containerWidth = containerRef.current.clientWidth;
    const containerHeight = containerRef.current.clientHeight;
    console.log('Container dimensions:', { containerWidth, containerHeight }); // Debug dimensions
    if (containerWidth === 0 || containerHeight === 0) {
      console.warn('Container dimensions not ready:', containerWidth, containerHeight);
      return [];
    }
    const squareWidth = (containerWidth * SQUARE_SIZE) / 100;
    const squareHeight = (containerHeight * SQUARE_SIZE) / 100;
    const offsetX = (containerWidth - squareWidth) / 2;
    const offsetY = (containerHeight - squareHeight) / 2;
    const points = [
      { x: offsetX, y: offsetY + squareHeight / 2 },
      { x: offsetX + squareWidth / 2, y: offsetY + squareHeight },
      { x: offsetX + squareWidth, y: offsetY + squareHeight / 2 },
      { x: offsetX + squareWidth / 2, y: offsetY },
      { x: offsetX, y: offsetY + squareHeight / 2 },
    ];
    console.log('Calculated squarePoints:', points);
    return points;
  }, []);

  const animate = useCallback(
    (timestamp: number) => {
      console.log('animate called with timestamp:', timestamp);
      if (process.env.NODE_ENV === 'test' && lastFrameTimeRef.current === timestamp) {
        console.log('Skipping duplicate frame in test env');
        return;
      }
      lastFrameTimeRef.current = timestamp;

      if (animationStartTimeRef.current === null) {
        animationStartTimeRef.current = timestamp - progressRef.current * MOVEMENT_DURATION;
        console.log('Animation start time set:', animationStartTimeRef.current);
      }

      const elapsedTime = timestamp - (animationStartTimeRef.current || timestamp);
      const progress = Math.min(elapsedTime / MOVEMENT_DURATION, 1);
      progressRef.current = progress;
      console.log('Progress:', progress);

      if (progress >= 1) {
        if (onComplete) onComplete();
        endTest();
        if (requestRef.current) {
          cancelAnimationFrame(requestRef.current);
          requestRef.current = null;
        }
        isAnimatingRef.current = false;
        lastStopTimeRef.current = timestamp;
        console.log('Animation completed');
        return;
      }

      if (shouldStopRef.current) {
        if (requestRef.current) {
          cancelAnimationFrame(requestRef.current);
          requestRef.current = null;
        }
        isAnimatingRef.current = false;
        lastStopTimeRef.current = timestamp;
        console.log('Animation paused at progress:', progress);
        return;
      }

      const squarePoints = calculateSquarePoints();
      console.log('squarePoints length:', squarePoints.length, 'ballRef exists:', !!ballRef.current);
      if (!ballRef.current || squarePoints.length === 0) {
        console.warn('Cannot animate: ballRef or squarePoints missing');
        requestRef.current = requestAnimationFrame(animate);
        console.log('Animation frame requested (retry):', requestRef.current);
        return;
      }

      const segmentCount = squarePoints.length - 1;
      const totalSegmentProgress = progress * segmentCount;
      const segmentIndex = Math.min(Math.floor(totalSegmentProgress), segmentCount - 1);
      const segmentProgress = totalSegmentProgress - segmentIndex;

      if (segmentIndex < squarePoints.length - 1) {
        const startPoint = squarePoints[segmentIndex];
        const endPoint = squarePoints[segmentIndex + 1];
        const newX = startPoint.x + (endPoint.x - startPoint.x) * segmentProgress;
        const newY = startPoint.y + (endPoint.y - startPoint.y) * segmentProgress;

        ballRef.current.style.transform = `translate(${newX - size / 2}px, ${newY - size / 2}px)`;
        console.log('Ball position updated:', { x: newX - size / 2, y: newY - size / 2 });

        const now = timestamp;
        if (now - lastPositionUpdateTimeRef.current > POSITION_UPDATE_THROTTLE_MS) {
          lastPositionUpdateTimeRef.current = now;
          const containerWidth = containerRef.current?.clientWidth || 1;
          const containerHeight = containerRef.current?.clientHeight || 1;
          const percentX = (newX / containerWidth) * 100;
          const percentY = (newY / containerHeight) * 100;
          const targetPosition = { x: percentX, y: percentY };
          console.log('Collecting data:', { targetPosition, now });
          if (onPositionUpdate) onPositionUpdate(targetPosition);

          setTargetPositions((prev) => [...prev, targetPosition]);
          setTimestamps((prev) => [...prev, now]);
          const simulatedEyePosition = {
            x: percentX + (Math.random() - 0.5) * 10,
            y: percentY + (Math.random() - 0.5) * 10,
          };
          setEyePositions((prev) => [...prev, simulatedEyePosition]);
        }
      }

      requestRef.current = requestAnimationFrame(animate);
      console.log('Animation frame requested:', requestRef.current);
    },
    [endTest, onComplete, onPositionUpdate, size, calculateSquarePoints]
  );

  useEffect(() => {
    console.log('useEffect triggered:', { testPhase, eyesDetected, isAnimating: isAnimatingRef.current });
    const squarePoints = calculateSquarePoints();
    const now = performance.now();

    if (
      testPhase === 'testing' &&
      eyesDetected &&
      !isAnimatingRef.current &&
      squarePoints.length > 0 &&
      (lastStopTimeRef.current === 0 || now - lastStopTimeRef.current > 500)
    ) {
      console.log('Animation started. Square Points:', squarePoints);
      isAnimatingRef.current = true;
      shouldStopRef.current = false;
      requestRef.current = requestAnimationFrame(animate);
      console.log('Initial animation frame requested:', requestRef.current);
      setEyePositions([]);
      setTargetPositions([]);
      setTimestamps([]);
    }

    if (isAnimatingRef.current && (testPhase !== 'testing' || !eyesDetected)) {
      shouldStopRef.current = true;
      console.log('Conditions failed, animation will pause on next frame');
    }

    return () => {
      if (requestRef.current) {
        console.log('Cleaning up requestRef:', requestRef.current);
        cancelAnimationFrame(requestRef.current);
        requestRef.current = null;
        isAnimatingRef.current = false;
        shouldStopRef.current = false;
      }
    };
  }, [testPhase, eyesDetected, animate, calculateSquarePoints]);

  useEffect(() => {
    console.log('eyesDetected changed to:', eyesDetected);
  }, [eyesDetected]);

  useEffect(() => {
    if (!isAnimatingRef.current && progressRef.current >= 1) {
      console.log('Collected Data:', { eyePositions, targetPositions, timestamps });
      try {
        const result = analyzeEyeMovementData(eyePositions, targetPositions, timestamps);
        console.log('Analysis Result:', result);
        useEyeTrackingStore.getState().setAnalysisResults?.(result);
      } catch (error) {
        console.error('Analysis Error:', error);
      }
    }
  }, [isAnimatingRef.current, progressRef.current, eyePositions, targetPositions, timestamps]);

  return (
    <div ref={containerRef} className="relative w-full h-full" style={{ visibility: testPhase === 'testing' && eyesDetected ? 'visible' : 'hidden' }}>
      {showPath && calculateSquarePoints().length > 0 && (
        <svg className="absolute inset-0 w-full h-full pointer-events-none">
          <path d={`M ${calculateSquarePoints().map((p) => `${p.x},${p.y}`).join(' L ')}`} stroke="#CBD5E1" strokeWidth="2" strokeDasharray="6 4" fill="none" />
        </svg>
      )}
      {showLabels && calculateSquarePoints().length > 0 && (
        <>
          <div style={{ left: calculateSquarePoints()[0].x - 60, top: calculateSquarePoints()[0].y - 10 }} className="absolute text-sm font-bold text-gray-600">Left</div>
          <div style={{ left: calculateSquarePoints()[1].x - 16, top: calculateSquarePoints()[1].y + 10 }} className="absolute text-sm font-bold text-gray-600">Bottom</div>
          <div style={{ left: calculateSquarePoints()[2].x + 10, top: calculateSquarePoints()[2].y - 10 }} className="absolute text-sm font-bold text-gray-600">Right</div>
          <div style={{ left: calculateSquarePoints()[3].x - 12, top: calculateSquarePoints()[3].y - 30 }} className="absolute text-sm font-bold text-gray-600">Top</div>
        </>
      )}
      <div ref={ballRef} style={{ width: `${size}px`, height: `${size}px`, borderRadius: '50%', backgroundColor: color, position: 'absolute', transition: 'transform 0.1s linear' }} />
    </div>
  );
};