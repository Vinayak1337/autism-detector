'use client';

import React from 'react';
import { AnimationBox } from '@/features/eyeTracking/components/TestingPhase/AnimationBox';

const BallPage = () => {
  const handleComplete = () => {
    console.log('Animation completed');
  };

  const handlePositionUpdate = () => {
    // Position update handler
  };

  return (
    <div className="min-h-screen flex items-center justify-center">
      <AnimationBox
        onComplete={handleComplete}
        onPositionUpdate={handlePositionUpdate}
        lastPosition={{ x: 0, y: 0 }}
      />
    </div>
  );
};

export default BallPage;
