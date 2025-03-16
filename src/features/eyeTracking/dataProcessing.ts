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
 * Returns a value between 0-1 (0 = perfect tracking, 1 = poor tracking)
 */
export function calculateWiggleScore(eyeData: Point[], targetData: Point[]): number {
  // Input validation
  if (!eyeData || !targetData || eyeData.length === 0 || targetData.length === 0) {
    console.warn('Invalid eye or target data provided to calculateWiggleScore');
    return 0;
  }

  let totalWiggle = 0;
  let wigglePoints = 0;

  // Adaptive normalization based on data size
  const datasetSize = eyeData.length;
  const adaptiveMaxWiggle = Math.max(40, Math.min(100, datasetSize * 0.2));

  // Prepare interpolated targets to match eye data length
  const interpolatedTargets: Point[] = [];
  try {
    if (targetData.length !== eyeData.length) {
      for (let i = 0; i < eyeData.length; i++) {
        const targetIndex = Math.floor((i / eyeData.length) * targetData.length);
        if (targetIndex >= 0 && targetIndex < targetData.length) {
          interpolatedTargets[i] = targetData[targetIndex];
        } else {
          // Handle potential out of bounds error
          interpolatedTargets[i] = targetData[targetData.length - 1];
        }
      }
    } else {
      interpolatedTargets.push(...targetData);
    }

    // Calculate wiggle from unwanted movements
    for (let i = 1; i < eyeData.length; i++) {
      // Validate data points
      if (
        !eyeData[i] ||
        !eyeData[i - 1] ||
        !interpolatedTargets[i] ||
        !interpolatedTargets[i - 1]
      ) {
        continue;
      }

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
  } catch (error) {
    console.error('Error in wiggle score calculation:', error);
    return 0;
  }

  // Calculate raw wiggle score - if no wiggle points, return 0 (perfect score)
  if (wigglePoints === 0) {
    return 0;
  }

  const rawWiggleScore = totalWiggle / wigglePoints;

  // Use a more contextual normalization based on the dataset size
  const normalizedWiggleScore = Math.min(1, Math.max(0, rawWiggleScore / adaptiveMaxWiggle));

  // Log for debugging
  console.log('Wiggle calculation:', {
    eyeDataPoints: eyeData.length,
    wigglePoints,
    totalWiggle,
    rawWiggleScore,
    adaptiveMaxWiggle,
    normalizedWiggleScore,
    accuracyPercentage: (100 - normalizedWiggleScore * 100).toFixed(1) + '%',
  });

  return normalizedWiggleScore;
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
 * Simplify a path by removing points that are very close to each other
 */
export function simplifyPath(points: Point[], threshold: number = 5): Point[] {
  if (points.length <= 2) return points;

  const result: Point[] = [points[0]];
  let lastAddedPoint = points[0];

  for (let i = 1; i < points.length; i++) {
    const distance = calculateDistance(lastAddedPoint, points[i]);
    if (distance > threshold) {
      result.push(points[i]);
      lastAddedPoint = points[i];
    }
  }

  // Always include the last point
  if (result[result.length - 1] !== points[points.length - 1]) {
    result.push(points[points.length - 1]);
  }

  return result;
}

/**
 * Find corner points in an eye tracking path (potential square corners)
 */
export function findCornerPoints(points: Point[], angleTolerance: number = 45): Point[] {
  if (points.length < 5) return [];

  // First simplify the path to reduce noise
  const simplifiedPath = simplifyPath(points, 8);
  if (simplifiedPath.length < 5) return [];

  const cornerPoints: Point[] = [];
  const angleThreshold = Math.cos(((90 - angleTolerance) * Math.PI) / 180); // Convert to radians

  for (let i = 2; i < simplifiedPath.length - 2; i++) {
    const p1 = simplifiedPath[i - 2];
    const p2 = simplifiedPath[i];
    const p3 = simplifiedPath[i + 2];

    // Calculate vectors
    const v1 = { x: p2.x - p1.x, y: p2.y - p1.y };
    const v2 = { x: p3.x - p2.x, y: p3.y - p2.y };

    // Normalize vectors
    const l1 = Math.sqrt(v1.x * v1.x + v1.y * v1.y);
    const l2 = Math.sqrt(v2.x * v2.x + v2.y * v2.y);

    if (l1 === 0 || l2 === 0) continue;

    const v1Norm = { x: v1.x / l1, y: v1.y / l1 };
    const v2Norm = { x: v2.x / l2, y: v2.y / l2 };

    // Calculate dot product
    const dotProduct = v1Norm.x * v2Norm.x + v1Norm.y * v2Norm.y;

    // If dot product is close to 0, vectors are perpendicular (90 degrees)
    if (Math.abs(dotProduct) < angleThreshold) {
      cornerPoints.push(simplifiedPath[i]);
    }
  }

  // Return 4 corners at most (for square pattern)
  return cornerPoints.slice(0, 4);
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
  // Input validation
  if (isNaN(wiggleScore) || wiggleScore < 0) {
    console.warn('Invalid wiggle score in risk assessment:', wiggleScore);
    wiggleScore = 0; // Default to best case if invalid
  }

  // Clamp wiggle score to 0-1 range to ensure accuracy calculation works correctly
  wiggleScore = Math.min(1, Math.max(0, wiggleScore));

  // Convert wiggle score to a percentage (0-100%)
  // wiggleScore is now normalized between 0-1
  const wigglePercentage = wiggleScore * 100;

  // Calculate an overall tracking accuracy percentage (higher is better)
  const trackingAccuracy = Math.max(0, 100 - wigglePercentage);

  // Define thresholds based on requirements
  const EXCELLENT_THRESHOLD = 80; // 80% or higher is perfectly normal
  const GOOD_THRESHOLD = 60; // Above 60% is no risk

  // Log the metrics for debugging
  console.log('Eye metrics:', {
    wiggleScore,
    wigglePercentage,
    trackingAccuracy,
    saccadeFrequency,
    fixationDuration,
    deviationScore,
    isSquarePattern,
  });

  // Risk assessment based on accuracy percentage
  if (trackingAccuracy >= EXCELLENT_THRESHOLD) {
    // 80% or higher is perfectly normal
    return 'Low';
  } else if (trackingAccuracy > GOOD_THRESHOLD) {
    // Above 60% is no risk
    return 'Low';
  } else if (trackingAccuracy >= 55) {
    // 55-60% (inclusive) is moderate risk
    return 'Moderate';
  } else {
    // Below 55% is high risk
    return 'High';
  }
}
