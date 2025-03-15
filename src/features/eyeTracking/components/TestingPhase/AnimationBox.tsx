'use client';

import React from 'react';
import { useEffect } from 'react';
import { AnimatedBall } from '../../AnimatedBall';
import { Point } from '../../AnimatedBall';
import { useEyeTrackingStore } from '../../store';

interface AnimationBoxProps {
  onComplete: () => void;
  onPositionUpdate: (position: { x: number; y: number }) => void;
  lastPosition: Point;
  forwardedRef?: React.RefObject<HTMLDivElement | null>;
}

export const AnimationBox: React.FC<AnimationBoxProps> = ({
  onComplete,
  onPositionUpdate,
  lastPosition,
  forwardedRef,
})  => {
  const startTest = useEyeTrackingStore((state: { startTest: () => void }) => state.startTest);

  useEffect(() => {
    startTest(); // Call startTest to set the testPhase to 'testing'
  }, [startTest]);
  return (
    <div
      ref={forwardedRef}
      className="flex-grow relative border-2 border-gray-300 rounded-lg mx-4 my-4 overflow-hidden"
      style={{ height: '400px', background: 'white' }}
    >
      <div className="absolute inset-0">
        <AnimatedBall
          onComplete={onComplete}
          onPositionUpdate={onPositionUpdate}
          size={36}
          showPath={true}
          showLabels={true}
        />
      </div>

      {/* Position indicator */}
      <div className="absolute bottom-2 left-2 bg-white bg-opacity-75 rounded p-1 text-xs">
        <span className="font-medium">Eye Position:</span>
        <span className="ml-1">
          x: {lastPosition.x.toFixed(1)}, y: {lastPosition.y.toFixed(1)}
        </span>
      </div>
    </div>
  );
};
