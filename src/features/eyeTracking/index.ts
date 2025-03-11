export { useEyeTracking } from './useEyeTracking';
export { EyeTrackingComponent } from './EyeTrackingComponent';
export { AnimatedBall } from './AnimatedBall';
export { createFaceLandmarksDetector } from './faceLandmarkUtils';
export type { FaceLandmarksDetector } from './faceLandmarkUtils';
export type { Point, TrackingPattern } from './AnimatedBall';
export type { EyeTrackingOptions, EyeTrackingState } from './useEyeTracking';
export {
  analyzeEyeMovementData,
  calculateSaccadeFrequency,
  calculateAverageFixationDuration,
  calculateWiggleScore,
  calculateDeviationScore,
  determineRiskAssessment,
} from './dataProcessing';
export type { EyeMovementData, FixationData, SaccadeData, AnalysisResult } from './dataProcessing';
