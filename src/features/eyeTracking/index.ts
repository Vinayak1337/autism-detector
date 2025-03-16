'use client';

// Re-export all components to be used in the application
export { EyeTrackingComponent } from './EyeTrackingComponent';
export { AnimatedBall } from './AnimatedBall';
export { analyzeEyeMovementData } from './dataProcessing';
export { useEyeTrackingStore } from './store';

// Export types as well
export type { EyeMovementData, AnalysisResult } from './dataProcessing';
export type { Point } from './AnimatedBall';
