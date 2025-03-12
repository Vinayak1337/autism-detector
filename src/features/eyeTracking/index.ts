'use client';

// Re-export all components to be used in the application
export { EyeTrackingComponent } from './EyeTrackingComponent';
export { AnimatedBall } from './AnimatedBall';
export { createFaceLandmarksDetector } from './faceLandmarkUtils';
export { analyzeEyeMovementData } from './dataProcessing';
export { useEyeTrackingStore } from './store';
export { useEyeTracking } from './useEyeTracking';

// Export types as well
export type { FaceLandmarksDetector } from './faceLandmarkUtils';
export type { EyeTrackingOptions, EyeTrackingState } from './useEyeTracking';
export type { EyeMovementData, AnalysisResult } from './dataProcessing';
export type { Point } from './AnimatedBall';
