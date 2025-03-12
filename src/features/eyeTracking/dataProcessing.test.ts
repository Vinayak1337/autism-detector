// import {
//   calculateDistance,
//   identifyFixations,
//   identifySaccades,
//   calculateSaccadeFrequency,
//   calculateAverageFixationDuration,
//   calculateWiggleScore,
//   calculateDeviationScore,
//   determineRiskAssessment,
//   analyzeEyeMovementData,
//   EyeMovementData,
// } from './dataProcessing';

// describe('Data Processing Utilities', () => {
//   // Sample data for testing
//   const sampleEyeMovementData: EyeMovementData[] = [
//     { timestamp: 0, position: { x: 100, y: 100 }, targetPosition: { x: 100, y: 100 } },
//     { timestamp: 100, position: { x: 105, y: 103 }, targetPosition: { x: 110, y: 100 } },
//     { timestamp: 200, position: { x: 120, y: 105 }, targetPosition: { x: 120, y: 100 } },
//     { timestamp: 300, position: { x: 125, y: 105 }, targetPosition: { x: 130, y: 100 } },
//     { timestamp: 400, position: { x: 128, y: 102 }, targetPosition: { x: 140, y: 100 } },
//     // Simulate fixation
//     { timestamp: 500, position: { x: 200, y: 200 }, targetPosition: { x: 200, y: 200 } },
//     { timestamp: 600, position: { x: 203, y: 202 }, targetPosition: { x: 200, y: 200 } },
//     { timestamp: 700, position: { x: 201, y: 198 }, targetPosition: { x: 200, y: 200 } },
//     // Simulate movement
//     { timestamp: 800, position: { x: 250, y: 250 }, targetPosition: { x: 250, y: 250 } },
//     { timestamp: 900, position: { x: 300, y: 300 }, targetPosition: { x: 300, y: 300 } },
//   ];

//   describe('calculateDistance', () => {
//     it('calculates Euclidean distance between two points', () => {
//       const p1 = { x: 0, y: 0 };
//       const p2 = { x: 3, y: 4 };

//       expect(calculateDistance(p1, p2)).toBe(5);
//     });

//     it('returns 0 for identical points', () => {
//       const p = { x: 10, y: 20 };

//       expect(calculateDistance(p, p)).toBe(0);
//     });
//   });

//   describe('identifyFixations', () => {
//     it('identifies fixations in eye movement data', () => {
//       const fixations = identifyFixations(sampleEyeMovementData);

//       // We should identify at least one fixation in the sample data
//       expect(fixations.length).toBeGreaterThan(0);
//     });

//     it('returns empty array for insufficient data', () => {
//       expect(identifyFixations([])).toEqual([]);
//       expect(identifyFixations([sampleEyeMovementData[0]])).toEqual([]);
//     });

//     it('calculates fixation duration correctly', () => {
//       const fixations = identifyFixations(sampleEyeMovementData);

//       fixations.forEach((fixation) => {
//         expect(fixation.duration).toBe(fixation.endTime - fixation.startTime);
//       });
//     });
//   });

//   describe('identifySaccades', () => {
//     it('identifies saccades between fixations', () => {
//       const fixations = [
//         { startTime: 0, endTime: 300, position: { x: 100, y: 100 }, duration: 300 },
//         { startTime: 500, endTime: 700, position: { x: 200, y: 200 }, duration: 200 },
//       ];

//       const saccades = identifySaccades(sampleEyeMovementData, fixations);

//       // Should identify a saccade between the two fixations
//       expect(saccades.length).toBeGreaterThan(0);
//     });

//     it('returns empty array when there are less than 2 fixations', () => {
//       const singleFixation = [
//         { startTime: 0, endTime: 300, position: { x: 100, y: 100 }, duration: 300 },
//       ];

//       expect(identifySaccades(sampleEyeMovementData, singleFixation)).toEqual([]);
//       expect(identifySaccades(sampleEyeMovementData, [])).toEqual([]);
//     });
//   });

//   describe('calculateSaccadeFrequency', () => {
//     it('calculates saccade frequency correctly', () => {
//       const saccades = [
//         {
//           startTime: 300,
//           endTime: 500,
//           startPosition: { x: 100, y: 100 },
//           endPosition: { x: 200, y: 200 },
//           duration: 200,
//           velocity: 0.5,
//         },
//       ];

//       // 1 saccade in 1000ms = 1 saccade per second
//       expect(calculateSaccadeFrequency(saccades, 1000)).toBe(1);

//       // 1 saccade in 500ms = 2 saccades per second
//       expect(calculateSaccadeFrequency(saccades, 500)).toBe(2);
//     });

//     it('returns 0 for empty saccades array', () => {
//       expect(calculateSaccadeFrequency([], 1000)).toBe(0);
//     });
//   });

//   describe('calculateAverageFixationDuration', () => {
//     it('calculates average fixation duration correctly', () => {
//       const fixations = [
//         { startTime: 0, endTime: 300, position: { x: 100, y: 100 }, duration: 300 },
//         { startTime: 500, endTime: 800, position: { x: 200, y: 200 }, duration: 300 },
//       ];

//       expect(calculateAverageFixationDuration(fixations)).toBe(300);
//     });

//     it('returns 0 for empty fixations array', () => {
//       expect(calculateAverageFixationDuration([])).toBe(0);
//     });
//   });

//   describe('calculateWiggleScore', () => {
//     it('calculates wiggle score based on unwanted movements', () => {
//       // Create data with horizontal target movement but vertical eye wiggle
//       const wiggleData: EyeMovementData[] = [
//         { timestamp: 0, position: { x: 100, y: 100 }, targetPosition: { x: 100, y: 100 } },
//         { timestamp: 100, position: { x: 110, y: 110 }, targetPosition: { x: 110, y: 100 } }, // 10px vertical wiggle
//         { timestamp: 200, position: { x: 120, y: 105 }, targetPosition: { x: 120, y: 100 } }, // 5px vertical wiggle
//       ];

//       const wiggleScore = calculateWiggleScore(wiggleData);

//       // We expect some non-zero wiggle score
//       expect(wiggleScore).toBeGreaterThan(0);
//     });

//     it('returns 0 for insufficient data', () => {
//       expect(calculateWiggleScore([])).toBe(0);
//       expect(calculateWiggleScore([sampleEyeMovementData[0]])).toBe(0);
//     });
//   });

//   describe('calculateDeviationScore', () => {
//     it('calculates average deviation from target position', () => {
//       // Create data with consistent 10px deviation
//       const deviationData: EyeMovementData[] = [
//         { timestamp: 0, position: { x: 110, y: 110 }, targetPosition: { x: 100, y: 100 } }, // 14.14px deviation
//         { timestamp: 100, position: { x: 120, y: 120 }, targetPosition: { x: 110, y: 110 } }, // 14.14px deviation
//       ];

//       const deviationScore = calculateDeviationScore(deviationData);

//       // Expected average is 14.14px (though we'll allow for floating point imprecision)
//       expect(deviationScore).toBeCloseTo(14.14, 1);
//     });

//     it('returns 0 for empty data array', () => {
//       expect(calculateDeviationScore([])).toBe(0);
//     });
//   });

//   describe('determineRiskAssessment', () => {
//     it('returns Low Risk for good metrics', () => {
//       expect(determineRiskAssessment(10, 20, 1.5, 300)).toBe('Low Risk');
//     });

//     it('returns Medium Risk for concerning metrics', () => {
//       expect(determineRiskAssessment(50, 100, 0.8, 150)).toBe('Medium Risk');
//     });

//     it('returns High Risk for poor metrics', () => {
//       expect(determineRiskAssessment(90, 180, 0.3, 50)).toBe('High Risk');
//     });
//   });

//   describe('analyzeEyeMovementData', () => {
//     it('performs complete analysis on eye movement data', () => {
//       const result = analyzeEyeMovementData(sampleEyeMovementData);

//       // Check that all expected properties are present
//       expect(result).toHaveProperty('fixations');
//       expect(result).toHaveProperty('saccades');
//       expect(result).toHaveProperty('averageFixationDuration');
//       expect(result).toHaveProperty('saccadeFrequency');
//       expect(result).toHaveProperty('wiggleScore');
//       expect(result).toHaveProperty('deviationScore');
//       expect(result).toHaveProperty('riskAssessment');
//     });

//     it('returns default values for empty data', () => {
//       const result = analyzeEyeMovementData([]);

//       expect(result.fixations).toEqual([]);
//       expect(result.saccades).toEqual([]);
//       expect(result.averageFixationDuration).toBe(0);
//       expect(result.saccadeFrequency).toBe(0);
//       expect(result.wiggleScore).toBe(0);
//       expect(result.deviationScore).toBe(0);
//       expect(result.riskAssessment).toBe('Low Risk');
//     });
//   });
// });
