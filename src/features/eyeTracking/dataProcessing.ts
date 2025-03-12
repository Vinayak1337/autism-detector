'use client';

import { Point } from './AnimatedBall';

// Types for eye tracking data analysis
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

// Make this compatible with the store's version
export interface AnalysisResult {
  saccadeFrequency: number;
  averageFixationDuration: number;
  wiggleScore: number;
  deviationScore: number;
  riskAssessment: string; // Match the string type from store.ts
  testDate: Date;
  fixationPercentage: number;
}

// Constants for analysis
const FIXATION_THRESHOLD = 5; // Maximum distance between points to be considered a fixation
const SACCADE_THRESHOLD = 15; // Minimum distance to be considered a saccade
// const NORMAL_FIXATION_DURATION = 200; // Normal fixation duration in ms
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
 * when the target is moving horizontally/vertically
 */
export function calculateWiggleScore(eyeData: Point[], targetData: Point[]): number {
  if (eyeData.length === 0 || targetData.length === 0) return 0;

  let totalWiggle = 0;
  let wigglePoints = 0;

  // Interpolate target data to match eye data length if needed
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

    // If target moving horizontally, check for unwanted vertical eye movement
    if (targetDX > targetDY) {
      if (eyeDY > WIGGLE_THRESHOLD) {
        totalWiggle += eyeDY;
        wigglePoints++;
      }
    }
    // If target moving vertically, check for unwanted horizontal eye movement
    else if (targetDY > targetDX) {
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

  // Interpolate target data to match eye data length if needed
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
 * Determine risk assessment based on various metrics
 */
export function determineRiskAssessment(
  saccadeFrequency: number,
  avgFixationDuration: number,
  wiggleScore: number,
  deviationScore: number
): string {
  // Create a scoring system (0-100) where higher scores indicate more risk
  let riskScore = 0;

  // Abnormal saccade frequency (too high or too low)
  if (saccadeFrequency < 1) {
    riskScore += 25; // Too few saccades
  } else if (saccadeFrequency > 5) {
    riskScore += 25; // Too many saccades
  }

  // Abnormal fixation duration
  if (avgFixationDuration < 100) {
    riskScore += 20; // Too short fixations
  } else if (avgFixationDuration > 500) {
    riskScore += 20; // Too long fixations
  }

  // Wiggle score (unwanted movements)
  if (wiggleScore > 10) {
    riskScore += 20;
  } else if (wiggleScore > 5) {
    riskScore += 10;
  }

  // Deviation score (not following target)
  if (deviationScore > 30) {
    riskScore += 30;
  } else if (deviationScore > 15) {
    riskScore += 15;
  }

  // Convert score to risk assessment
  if (riskScore >= 70) {
    return 'High Risk';
  } else if (riskScore >= 40) {
    return 'Medium Risk';
  } else if (riskScore >= 20) {
    return 'Low Risk';
  } else {
    return 'No Risk Detected';
  }
}

/**
 * Calculate fixation on face percentage
 */
export function calculateFixationPercentage(eyeData: Point[], targetData: Point[]): number {
  if (eyeData.length === 0 || targetData.length === 0) return 0;

  // Interpolate target data to match eye data length if needed
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

  // Process and extract metrics
  const { durations: fixationDurations } = identifyFixations(eyePositions, timestamps);
  const { durations: saccadeDurations } = identifySaccades(eyePositions, timestamps);

  const totalDuration = timestamps[timestamps.length - 1] - timestamps[0];
  const saccadeFrequency = calculateSaccadeFrequency(saccadeDurations.length, totalDuration);
  const avgFixationDuration = calculateAverageFixationDuration(fixationDurations);
  const wiggleScore = calculateWiggleScore(eyePositions, targetPositions);
  const deviationScore = calculateDeviationScore(eyePositions, targetPositions);
  const fixationPercentage = calculateFixationPercentage(eyePositions, targetPositions);

  const riskAssessment = determineRiskAssessment(
    saccadeFrequency,
    avgFixationDuration,
    wiggleScore,
    deviationScore
  ) as string;

  return {
    saccadeFrequency,
    averageFixationDuration: avgFixationDuration,
    wiggleScore,
    deviationScore,
    riskAssessment,
    testDate: new Date(),
    fixationPercentage,
  };
}
