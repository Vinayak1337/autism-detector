import React from 'react';
import { AnimationBox } from '@/features/eyeTracking/components/TestingPhase/AnimationBox';

const page = () => {
  return (
    <div>
      <AnimationBox
        onComplete={() => {}}
        onPositionUpdate={() => {}}
        lastPosition={{ x: 0, y: 0 }}
      />
    </div>
  );
};

export default page;
