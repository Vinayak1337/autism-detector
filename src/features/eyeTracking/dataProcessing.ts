import { Point } from './AnimatedBall';

// Types for eye tracking data analysis
export interface EyeMovementData {
  timestamp: number;
  position: Point;
  targetPosition: Point;
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
  fixations: FixationData[];
  saccades: SaccadeData[];
  averageFixationDuration: number;
  saccadeFrequency: number;
  wiggleScore: number;
  riskAssessment: 'Low Risk' | 'Medium Risk' | 'High Risk';
  deviationScore: number;
}

// Constants for analysis
const FIXATION_THRESHOLD = 30; // pixels - max movement to be considered a fixation
const SACCADE_THRESHOLD = 50; // pixels - min movement to be considered a saccade
const MIN_FIXATION_DURATION = 100; // ms
const LOW_RISK_THRESHOLD = 0.3;
const MEDIUM_RISK_THRESHOLD = 0.7;

/**
 * Calculate the Euclidean distance between two points
 */
export const calculateDistance = (p1: Point, p2: Point): number => {
  return Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2));
};

/**
 * Identify fixations in eye movement data
 * Fixations are periods where the eye stays relatively still
 */
export const identifyFixations = (data: EyeMovementData[]): FixationData[] => {
  if (data.length < 2) return [];

  const fixations: FixationData[] = [];
  let currentFixation: {
    startTime: number;
    positions: Point[];
    startIndex: number;
  } | null = null;

  for (let i = 0; i < data.length; i++) {
    const current = data[i];

    if (currentFixation === null) {
      // Start a new potential fixation
      currentFixation = {
        startTime: current.timestamp,
        positions: [current.position],
        startIndex: i,
      };
      continue;
    }

    // Check if still in the same fixation
    const avgPosition = currentFixation.positions.reduce(
      (acc, pos) => ({ x: acc.x + pos.x, y: acc.y + pos.y }),
      { x: 0, y: 0 }
    );
    avgPosition.x /= currentFixation.positions.length;
    avgPosition.y /= currentFixation.positions.length;

    const distance = calculateDistance(avgPosition, current.position);

    if (distance <= FIXATION_THRESHOLD) {
      // Continue the current fixation
      currentFixation.positions.push(current.position);
    } else {
      // End the current fixation if it meets minimum duration
      const duration = data[i - 1].timestamp - currentFixation.startTime;

      if (duration >= MIN_FIXATION_DURATION) {
        const avgFixationPos = currentFixation.positions.reduce(
          (acc, pos) => ({ x: acc.x + pos.x, y: acc.y + pos.y }),
          { x: 0, y: 0 }
        );
        avgFixationPos.x /= currentFixation.positions.length;
        avgFixationPos.y /= currentFixation.positions.length;

        fixations.push({
          startTime: currentFixation.startTime,
          endTime: data[i - 1].timestamp,
          position: avgFixationPos,
          duration,
        });
      }

      // Start a new fixation
      currentFixation = {
        startTime: current.timestamp,
        positions: [current.position],
        startIndex: i,
      };
    }
  }

  // Check if the last sequence was a fixation
  if (currentFixation && data.length > 0) {
    const duration = data[data.length - 1].timestamp - currentFixation.startTime;

    if (duration >= MIN_FIXATION_DURATION) {
      const avgFixationPos = currentFixation.positions.reduce(
        (acc, pos) => ({ x: acc.x + pos.x, y: acc.y + pos.y }),
        { x: 0, y: 0 }
      );
      avgFixationPos.x /= currentFixation.positions.length;
      avgFixationPos.y /= currentFixation.positions.length;

      fixations.push({
        startTime: currentFixation.startTime,
        endTime: data[data.length - 1].timestamp,
        position: avgFixationPos,
        duration,
      });
    }
  }

  return fixations;
};

/**
 * Identify saccades in eye movement data
 * Saccades are rapid eye movements between fixations
 */
export const identifySaccades = (
  data: EyeMovementData[],
  fixations: FixationData[]
): SaccadeData[] => {
  if (fixations.length < 2) return [];

  const saccades: SaccadeData[] = [];

  for (let i = 0; i < fixations.length - 1; i++) {
    const startTime = fixations[i].endTime;
    const endTime = fixations[i + 1].startTime;
    const startPosition = fixations[i].position;
    const endPosition = fixations[i + 1].position;
    const duration = endTime - startTime;
    const distance = calculateDistance(startPosition, endPosition);

    if (distance >= SACCADE_THRESHOLD) {
      saccades.push({
        startTime,
        endTime,
        startPosition,
        endPosition,
        duration,
        velocity: distance / duration, // pixels per ms
      });
    }
  }

  return saccades;
};

/**
 * Calculate the saccade frequency (saccades per second)
 */
export const calculateSaccadeFrequency = (
  saccades: SaccadeData[],
  totalDuration: number
): number => {
  const durationInSeconds = totalDuration / 1000;
  return saccades.length / durationInSeconds;
};

/**
 * Calculate the average fixation duration
 */
export const calculateAverageFixationDuration = (fixations: FixationData[]): number => {
  if (fixations.length === 0) return 0;

  const totalDuration = fixations.reduce((sum, fixation) => sum + fixation.duration, 0);
  return totalDuration / fixations.length;
};

/**
 * Calculate a "wiggle score" that measures unwanted movements
 * For example, during horizontal movement, checks for y-axis variations
 */
export const calculateWiggleScore = (data: EyeMovementData[]): number => {
  if (data.length < 3) return 0;

  let totalWiggle = 0;

  for (let i = 2; i < data.length; i++) {
    const prev2 = data[i - 2];
    const prev1 = data[i - 1];
    const current = data[i];

    // Determine the primary direction of movement
    const xChange1 = Math.abs(prev1.targetPosition.x - prev2.targetPosition.x);
    const yChange1 = Math.abs(prev1.targetPosition.y - prev2.targetPosition.y);
    const xChange2 = Math.abs(current.targetPosition.x - prev1.targetPosition.x);
    const yChange2 = Math.abs(current.targetPosition.y - prev1.targetPosition.y);

    // Check if movement is primarily horizontal or vertical
    const isHorizontalTarget = xChange1 + xChange2 > yChange1 + yChange2;

    // Calculate wiggle based on the opposite axis of the target movement
    if (isHorizontalTarget) {
      // For horizontal target movement, check vertical eye movements
      const expectedY = prev1.position.y; // Expected to stay relatively constant
      const actualY = current.position.y;
      totalWiggle += Math.abs(actualY - expectedY);
    } else {
      // For vertical target movement, check horizontal eye movements
      const expectedX = prev1.position.x; // Expected to stay relatively constant
      const actualX = current.position.x;
      totalWiggle += Math.abs(actualX - expectedX);
    }
  }

  // Normalize by the number of measurements
  return totalWiggle / (data.length - 2);
};

/**
 * Calculate how well the eye follows the target (deviation score)
 */
export const calculateDeviationScore = (data: EyeMovementData[]): number => {
  if (data.length === 0) return 0;

  let totalDeviation = 0;

  data.forEach((point) => {
    const distance = calculateDistance(point.position, point.targetPosition);
    totalDeviation += distance;
  });

  return totalDeviation / data.length;
};

/**
 * Determine risk assessment based on analysis metrics
 */
export const determineRiskAssessment = (
  wiggleScore: number,
  deviationScore: number,
  saccadeFrequency: number,
  averageFixationDuration: number
): 'Low Risk' | 'Medium Risk' | 'High Risk' => {
  // Normalize all factors to 0-1 scale
  const normalizedWiggle = Math.min(wiggleScore / 100, 1);
  const normalizedDeviation = Math.min(deviationScore / 200, 1);
  const normalizedSaccadeFreq = Math.min(Math.max(2 - saccadeFrequency, 0), 1);
  const normalizedFixationDuration = Math.min(Math.max(500 - averageFixationDuration, 0) / 500, 1);

  // Calculate overall risk score
  const riskScore =
    normalizedWiggle * 0.4 +
    normalizedDeviation * 0.3 +
    normalizedSaccadeFreq * 0.15 +
    normalizedFixationDuration * 0.15;

  // Determine risk category
  if (riskScore < LOW_RISK_THRESHOLD) {
    return 'Low Risk';
  } else if (riskScore < MEDIUM_RISK_THRESHOLD) {
    return 'Medium Risk';
  } else {
    return 'High Risk';
  }
};

/**
 * Main function to analyze eye movement data
 */
export const analyzeEyeMovementData = (data: EyeMovementData[]): AnalysisResult => {
  if (data.length === 0) {
    return {
      fixations: [],
      saccades: [],
      averageFixationDuration: 0,
      saccadeFrequency: 0,
      wiggleScore: 0,
      deviationScore: 0,
      riskAssessment: 'Low Risk',
    };
  }

  const totalDuration = data[data.length - 1].timestamp - data[0].timestamp;
  const fixations = identifyFixations(data);
  const saccades = identifySaccades(data, fixations);
  const averageFixationDuration = calculateAverageFixationDuration(fixations);
  const saccadeFrequency = calculateSaccadeFrequency(saccades, totalDuration);
  const wiggleScore = calculateWiggleScore(data);
  const deviationScore = calculateDeviationScore(data);

  const riskAssessment = determineRiskAssessment(
    wiggleScore,
    deviationScore,
    saccadeFrequency,
    averageFixationDuration
  );

  return {
    fixations,
    saccades,
    averageFixationDuration,
    saccadeFrequency,
    wiggleScore,
    deviationScore,
    riskAssessment,
  };
};
