'use client';

// Types for eye tracking data analysis
export interface Point {
  x: number;
  y: number;
}

export interface EyeMovementData {
  position: Point;
  targetPosition: Point;
  timestamp: number;
}

export interface FixationData {
  startTime: number;
  endTime: number;
  position: Point;
  duration: number;
}

export interface SaccadeData {
  startTime: number;
  endTime: number;
  startPosition: Point;
  endPosition: Point;
  duration: number;
  velocity: number;
}

export interface AnalysisResult {
  saccadeFrequency: number;
  averageFixationDuration: number;
  wiggleScore: number;
  deviationScore: number;
  riskAssessment: string;
  testDate: Date;
  fixationPercentage: number;
  isSquarePattern: boolean;
}

// Constants for analysis
const FIXATION_THRESHOLD = 5; // Maximum distance between points to be considered a fixation
const SACCADE_THRESHOLD = 15; // Minimum distance to be considered a saccade
const WIGGLE_THRESHOLD = 5; // Threshold for unwanted movement
const DEVIATION_THRESHOLD = 15; // Threshold for deviation from target

/**
 * Calculate the Euclidean distance between two points
 */
export function calculateDistance(p1: Point, p2: Point): number {
  return Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2));
}

/**
 * Identify fixation points where eye position doesn't change significantly
 */
export function identifyFixations(
  eyeData: Point[],
  timeData: number[]
): {
  points: Point[];
  durations: number[];
  startIndices: number[];
} {
  if (eyeData.length < 2 || eyeData.length !== timeData.length) {
    return { points: [], durations: [], startIndices: [] };
  }

  const fixationPoints: Point[] = [];
  const fixationDurations: number[] = [];
  const startIndices: number[] = [];

  let currentFixationStart = 0;
  let currentFixationPoint = eyeData[0];

  for (let i = 1; i < eyeData.length; i++) {
    const distance = calculateDistance(currentFixationPoint, eyeData[i]);

    if (distance > FIXATION_THRESHOLD) {
      // End of fixation, calculate duration and add to results
      const duration = timeData[i - 1] - timeData[currentFixationStart];

      if (duration > 50) {
        // Only count fixations longer than 50ms
        fixationPoints.push(currentFixationPoint);
        fixationDurations.push(duration);
        startIndices.push(currentFixationStart);
      }

      // Start a new fixation
      currentFixationStart = i;
      currentFixationPoint = eyeData[i];
    }
  }

  // Add the last fixation if it exists
  const lastDuration = timeData[timeData.length - 1] - timeData[currentFixationStart];
  if (lastDuration > 50) {
    fixationPoints.push(currentFixationPoint);
    fixationDurations.push(lastDuration);
    startIndices.push(currentFixationStart);
  }

  return { points: fixationPoints, durations: fixationDurations, startIndices };
}

/**
 * Identify saccades (rapid eye movements between fixations)
 */
export function identifySaccades(
  eyeData: Point[],
  timeData: number[]
): {
  startPoints: Point[];
  endPoints: Point[];
  durations: number[];
} {
  if (eyeData.length < 2 || eyeData.length !== timeData.length) {
    return { startPoints: [], endPoints: [], durations: [] };
  }

  const saccadeStartPoints: Point[] = [];
  const saccadeEndPoints: Point[] = [];
  const saccadeDurations: number[] = [];

  let inSaccade = false;
  let saccadeStartIndex = 0;

  for (let i = 1; i < eyeData.length; i++) {
    const distance = calculateDistance(eyeData[i - 1], eyeData[i]);

    if (!inSaccade && distance > SACCADE_THRESHOLD) {
      // Start of saccade
      inSaccade = true;
      saccadeStartIndex = i - 1;
    } else if (inSaccade && distance < SACCADE_THRESHOLD) {
      // End of saccade
      inSaccade = false;

      const duration = timeData[i] - timeData[saccadeStartIndex];
      saccadeStartPoints.push(eyeData[saccadeStartIndex]);
      saccadeEndPoints.push(eyeData[i]);
      saccadeDurations.push(duration);
    }
  }

  // If we end while still in a saccade
  if (inSaccade) {
    const duration = timeData[timeData.length - 1] - timeData[saccadeStartIndex];
    saccadeStartPoints.push(eyeData[saccadeStartIndex]);
    saccadeEndPoints.push(eyeData[eyeData.length - 1]);
    saccadeDurations.push(duration);
  }

  return {
    startPoints: saccadeStartPoints,
    endPoints: saccadeEndPoints,
    durations: saccadeDurations,
  };
}

/**
 * Calculate saccade frequency (saccades per second)
 */
export function calculateSaccadeFrequency(saccadeCount: number, totalDuration: number): number {
  if (totalDuration <= 0) return 0;
  return (saccadeCount * 1000) / totalDuration; // Convert ms to seconds
}

/**
 * Calculate average fixation duration
 */
export function calculateAverageFixationDuration(fixationDurations: number[]): number {
  if (fixationDurations.length === 0) return 0;

  const totalDuration = fixationDurations.reduce((sum, duration) => sum + duration, 0);
  return totalDuration / fixationDurations.length;
}

/**
 * Calculate a "wiggle" score based on unwanted vertical/horizontal movements
 */
export function calculateWiggleScore(eyeData: Point[], targetData: Point[]): number {
  if (eyeData.length === 0 || targetData.length === 0) return 0;

  let totalWiggle = 0;
  let wigglePoints = 0;

  const interpolatedTargets: Point[] = [];
  if (targetData.length !== eyeData.length) {
    for (let i = 0; i < eyeData.length; i++) {
      const targetIndex = Math.floor((i / eyeData.length) * targetData.length);
      interpolatedTargets[i] = targetData[targetIndex];
    }
  } else {
    interpolatedTargets.push(...targetData);
  }

  for (let i = 1; i < eyeData.length; i++) {
    const prevTarget = interpolatedTargets[i - 1];
    const currentTarget = interpolatedTargets[i];

    const targetDX = Math.abs(currentTarget.x - prevTarget.x);
    const targetDY = Math.abs(currentTarget.y - prevTarget.y);

    const eyeDX = Math.abs(eyeData[i].x - eyeData[i - 1].x);
    const eyeDY = Math.abs(eyeData[i].y - eyeData[i - 1].y);

    if (targetDX > targetDY) {
      if (eyeDY > WIGGLE_THRESHOLD) {
        totalWiggle += eyeDY;
        wigglePoints++;
      }
    } else if (targetDY > targetDX) {
      if (eyeDX > WIGGLE_THRESHOLD) {
        totalWiggle += eyeDX;
        wigglePoints++;
      }
    }
  }

  return wigglePoints > 0 ? totalWiggle / wigglePoints : 0;
}

/**
 * Calculate deviation score (how much the eye position deviates from the target)
 */
export function calculateDeviationScore(eyeData: Point[], targetData: Point[]): number {
  if (eyeData.length === 0 || targetData.length === 0) return 0;

  const interpolatedTargets: Point[] = [];
  if (targetData.length !== eyeData.length) {
    for (let i = 0; i < eyeData.length; i++) {
      const targetIndex = Math.floor((i / eyeData.length) * targetData.length);
      interpolatedTargets[i] = targetData[targetIndex];
    }
  } else {
    interpolatedTargets.push(...targetData);
  }

  let totalDeviation = 0;

  for (let i = 0; i < eyeData.length; i++) {
    const distance = calculateDistance(eyeData[i], interpolatedTargets[i]);
    totalDeviation += distance;
  }

  return totalDeviation / eyeData.length;
}

/**
 * Calculate fixation on target percentage
 */
export function calculateFixationPercentage(eyeData: Point[], targetData: Point[]): number {
  if (eyeData.length === 0 || targetData.length === 0) return 0;

  const interpolatedTargets: Point[] = [];
  if (targetData.length !== eyeData.length) {
    for (let i = 0; i < eyeData.length; i++) {
      const targetIndex = Math.floor((i / eyeData.length) * targetData.length);
      interpolatedTargets[i] = targetData[targetIndex];
    }
  } else {
    interpolatedTargets.push(...targetData);
  }

  let onTargetCount = 0;

  for (let i = 0; i < eyeData.length; i++) {
    const distance = calculateDistance(eyeData[i], interpolatedTargets[i]);
    if (distance < DEVIATION_THRESHOLD) {
      onTargetCount++;
    }
  }

  return (onTargetCount / eyeData.length) * 100;
}

/**
 * Analyze eye movement data to produce analysis results
 */
export function analyzeEyeMovementData(
  eyePositions: Point[],
  targetPositions: Point[],
  timestamps: number[]
): AnalysisResult {
  if (eyePositions.length < 2 || timestamps.length < 2) {
    throw new Error('Insufficient data for analysis');
  }

  const { durations: fixationDurations } = identifyFixations(eyePositions, timestamps);
  const { durations: saccadeDurations } = identifySaccades(eyePositions, timestamps);

  const totalDuration = timestamps[timestamps.length - 1] - timestamps[0];
  const saccadeFrequency = calculateSaccadeFrequency(saccadeDurations.length, totalDuration);
  const avgFixationDuration = calculateAverageFixationDuration(fixationDurations);
  const wiggleScore = calculateWiggleScore(eyePositions, targetPositions);
  const deviationScore = calculateDeviationScore(eyePositions, targetPositions);
  const fixationPercentage = calculateFixationPercentage(eyePositions, targetPositions);

  // Determine if the eyes are following the square pattern
  // Check for 4 distinct corners in the eye movements with relatively straight lines between them
  const isSquarePattern = determineSquarePattern(eyePositions, targetPositions);

  // More accurate risk assessment based on multiple factors
  const riskAssessment = determineRiskAssessment(
    saccadeFrequency,
    avgFixationDuration,
    wiggleScore,
    deviationScore,
    isSquarePattern
  );

  return {
    saccadeFrequency,
    averageFixationDuration: avgFixationDuration,
    wiggleScore,
    deviationScore,
    riskAssessment,
    testDate: new Date(),
    fixationPercentage,
    isSquarePattern,
  };
}

/**
 * Determine if the eye movements follow a square pattern
 */
function determineSquarePattern(eyePositions: Point[], targetPositions: Point[]): boolean {
  if (eyePositions.length < 20 || targetPositions.length < 4) {
    return false;
  }

  // Find the four "corner" points of the target path
  const corners = findCornerPoints(targetPositions);
  if (corners.length < 4) {
    return false;
  }

  // Check if the eye movement data has corresponding corners
  const eyeCorners = findCornerPoints(eyePositions);

  // Calculate what percentage of the expected corners were detected
  // Now more lenient - only need 50% of corners for partial success
  const cornerDetectionRate = eyeCorners.length >= 4 ? 1.0 : eyeCorners.length / 4;

  // Check how straight the eye movement paths are between corners
  const pathStraightness = calculatePathStraightness(eyePositions);

  // Log the values for debugging
  console.log('Square pattern detection:', {
    eyeCornersCount: eyeCorners.length,
    cornerDetectionRate,
    pathStraightness,
  });

  // Combine metrics to determine if it's a square pattern
  // Reduced thresholds to be more forgiving of natural eye movement
  return cornerDetectionRate >= 0.5 && pathStraightness >= 0.5;
}

/**
 * Find potential corner points in a path
 */
function findCornerPoints(points: Point[]): Point[] {
  if (points.length < 4) return [];

  const corners: Point[] = [];
  const angleThreshold = 30; // degrees

  // Simplify the path to focus on major direction changes
  const simplifiedPath = simplifyPath(points, 5);

  for (let i = 1; i < simplifiedPath.length - 1; i++) {
    const prev = simplifiedPath[i - 1];
    const current = simplifiedPath[i];
    const next = simplifiedPath[i + 1];

    // Calculate vectors and angle
    const v1 = { x: current.x - prev.x, y: current.y - prev.y };
    const v2 = { x: next.x - current.x, y: next.y - current.y };

    // Calculate the angle between vectors (in degrees)
    const angle = calculateAngle(v1, v2);

    // If the angle is significant, consider it a corner
    if (angle > angleThreshold) {
      corners.push(current);
    }
  }

  return corners;
}

/**
 * Calculate angle between two vectors in degrees
 */
function calculateAngle(v1: Point, v2: Point): number {
  const dot = v1.x * v2.x + v1.y * v2.y;
  const mag1 = Math.sqrt(v1.x * v1.x + v1.y * v1.y);
  const mag2 = Math.sqrt(v2.x * v2.x + v2.y * v2.y);

  if (mag1 === 0 || mag2 === 0) return 0;

  const cosAngle = dot / (mag1 * mag2);
  const radians = Math.acos(Math.min(Math.max(cosAngle, -1), 1));
  return radians * (180 / Math.PI);
}

/**
 * Simplify a path by removing points that are too close to each other
 */
function simplifyPath(points: Point[], minDistance: number): Point[] {
  if (points.length <= 2) return [...points];

  const result: Point[] = [points[0]];
  let lastPoint = points[0];

  for (let i = 1; i < points.length; i++) {
    const dist = calculateDistance(lastPoint, points[i]);
    if (dist > minDistance) {
      result.push(points[i]);
      lastPoint = points[i];
    }
  }

  // Ensure we include the last point if it's not already included
  if (result[result.length - 1] !== points[points.length - 1]) {
    result.push(points[points.length - 1]);
  }

  return result;
}

/**
 * Calculate how straight the paths are between points
 * Returns a value between 0 (very wiggly) and 1 (perfectly straight)
 */
function calculatePathStraightness(points: Point[]): number {
  if (points.length < 3) return 1.0;

  let totalDeviation = 0;
  let segmentCount = 0;

  // Check each sequence of 3 points
  for (let i = 0; i < points.length - 2; i += 2) {
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[i + 2];

    // Calculate the actual path length (p1 to p2 to p3)
    const actualLength = calculateDistance(p1, p2) + calculateDistance(p2, p3);

    // Calculate the direct distance (p1 to p3)
    const directLength = calculateDistance(p1, p3);

    // A perfectly straight line would have actualLength = directLength
    // Calculate the deviation ratio (1.0 for straight line, lower for wiggly)
    if (actualLength > 0) {
      totalDeviation += directLength / actualLength;
      segmentCount++;
    }
  }

  return segmentCount > 0 ? totalDeviation / segmentCount : 1.0;
}

/**
 * Determine the risk assessment based on eye tracking metrics
 */
function determineRiskAssessment(
  saccadeFrequency: number,
  fixationDuration: number,
  wiggleScore: number,
  deviationScore: number,
  isSquarePattern: boolean
): string {
  // Define thresholds for metrics
  const SACCADE_THRESHOLD_HIGH = 4.0; // High saccade frequency may indicate attention issues
  const SACCADE_THRESHOLD_MED = 2.5;

  const FIXATION_THRESHOLD_LOW = 150; // Low fixation duration may indicate attention issues
  const FIXATION_THRESHOLD_MED = 250;

  const WIGGLE_THRESHOLD_HIGH = 0.5; // High wiggle score may indicate motor control issues
  const WIGGLE_THRESHOLD_MED = 0.3;

  const DEVIATION_THRESHOLD_HIGH = 0.4; // High deviation may indicate tracking issues
  const DEVIATION_THRESHOLD_MED = 0.2;

  // Count how many metrics are in concerning ranges
  let highRiskFactors = 0;
  let medRiskFactors = 0;

  // Check saccade frequency
  if (saccadeFrequency > SACCADE_THRESHOLD_HIGH) highRiskFactors++;
  else if (saccadeFrequency > SACCADE_THRESHOLD_MED) medRiskFactors++;

  // Check fixation duration (lower is worse)
  if (fixationDuration < FIXATION_THRESHOLD_LOW) highRiskFactors++;
  else if (fixationDuration < FIXATION_THRESHOLD_MED) medRiskFactors++;

  // Check wiggle score
  if (wiggleScore > WIGGLE_THRESHOLD_HIGH) highRiskFactors++;
  else if (wiggleScore > WIGGLE_THRESHOLD_MED) medRiskFactors++;

  // Check deviation score
  if (deviationScore > DEVIATION_THRESHOLD_HIGH) highRiskFactors++;
  else if (deviationScore > DEVIATION_THRESHOLD_MED) medRiskFactors++;

  // Square pattern is a significant indicator
  if (!isSquarePattern) highRiskFactors++;

  // Determine overall risk based on the number of concerning metrics
  if (highRiskFactors >= 2) {
    return 'High';
  } else if (highRiskFactors === 1 || medRiskFactors >= 2) {
    return 'Moderate';
  } else {
    return 'Low';
  }
}
