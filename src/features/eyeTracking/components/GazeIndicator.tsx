'use client';

import React, { useState, useEffect } from 'react';
import { Point } from '../AnimatedBall';

interface GazeIndicatorProps {
  faceDetected: boolean;
  currentGaze: Point;
}

export const GazeIndicator: React.FC<GazeIndicatorProps> = ({ faceDetected, currentGaze }) => {
  return faceDetected ? (
    <div
      className="absolute z-10 pointer-events-none transform -translate-x-1/2 -translate-y-1/2 transition-all duration-75"
      style={{
        left: `${currentGaze.x}%`,
        top: `${currentGaze.y}%`,
        width: '30px',
        height: '30px',
        backgroundColor: 'rgba(59, 130, 246, 0.5)',
        borderRadius: '50%',
        border: '2px solid rgba(59, 130, 246, 0.8)',
        boxShadow: '0 0 0 4px rgba(59, 130, 246, 0.3)',
      }}
    />
  ) : null;
};
