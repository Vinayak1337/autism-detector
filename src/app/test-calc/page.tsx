'use client';

import React, { useEffect, useState } from 'react';
import {
  calculateWiggleScore,
  calculateDeviationScore,
} from '@/features/eyeTracking/dataProcessing';
import { Point } from '@/features/eyeTracking/AnimatedBall';

interface TestResult {
  name: string;
  eyeData: Point[];
  expectedAccuracy: number;
  wiggleScore?: number;
  deviationScore?: number;
  calculatedAccuracy?: number;
  accuracyDifference?: number;
  riskLevel?: string;
}

const TestCalcPage: React.FC = () => {
  const [results, setResults] = useState<TestResult[]>([]);

  // Create test datasets with different accuracy levels
  const generateTestData = () => {
    // Generate target data (a perfect square pattern)
    const targetData: Point[] = [
      { x: 20, y: 20 },
      { x: 20, y: 80 },
      { x: 80, y: 80 },
      { x: 80, y: 20 },
      { x: 20, y: 20 },
    ];

    // Test cases with different levels of wiggle
    const testCases = [
      {
        name: 'Perfect Tracking (100%)',
        eyeData: [...targetData], // Clone the perfect path
        expectedAccuracy: 100,
      },
      {
        name: 'Excellent Tracking (90%)',
        eyeData: targetData.map((p) => ({
          x: p.x + (Math.random() * 4 - 2),
          y: p.y + (Math.random() * 4 - 2),
        })),
        expectedAccuracy: 90,
      },
      {
        name: 'Good Tracking (75%)',
        eyeData: targetData.map((p) => ({
          x: p.x + (Math.random() * 10 - 5),
          y: p.y + (Math.random() * 10 - 5),
        })),
        expectedAccuracy: 75,
      },
      {
        name: 'Moderate Tracking (58%)',
        eyeData: targetData.map((p) => ({
          x: p.x + (Math.random() * 20 - 10),
          y: p.y + (Math.random() * 20 - 10),
        })),
        expectedAccuracy: 58,
      },
      {
        name: 'Poor Tracking (40%)',
        eyeData: targetData.map((p) => ({
          x: p.x + (Math.random() * 40 - 20),
          y: p.y + (Math.random() * 40 - 20),
        })),
        expectedAccuracy: 40,
      },
    ];

    // Calculate wiggle scores and accuracy for each test case
    const testResults = testCases.map((test) => {
      const wiggleScore = calculateWiggleScore(test.eyeData, targetData);
      const deviationScore = calculateDeviationScore(test.eyeData, targetData);
      const calculatedAccuracy = 100 - wiggleScore * 100;

      // Determine risk level based on accuracy
      let riskLevel = 'High';
      if (calculatedAccuracy >= 80) riskLevel = 'Low (Perfect)';
      else if (calculatedAccuracy > 60) riskLevel = 'Low (Good)';
      else if (calculatedAccuracy >= 55) riskLevel = 'Moderate';

      return {
        ...test,
        wiggleScore,
        deviationScore,
        calculatedAccuracy,
        accuracyDifference: calculatedAccuracy - test.expectedAccuracy,
        riskLevel,
      };
    });

    setResults(testResults);
  };

  useEffect(() => {
    generateTestData();
  }, []);

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Eye Tracking Calculation Test Page</h1>
      <p className="mb-6">
        This page validates the eye tracking accuracy calculations with test data.
      </p>

      <button onClick={generateTestData} className="px-4 py-2 bg-blue-600 text-white rounded mb-6">
        Re-run Test Calculations
      </button>

      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">Test Results</h2>
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-gray-100">
              <th className="p-2 text-left">Test Case</th>
              <th className="p-2 text-left">Wiggle Score</th>
              <th className="p-2 text-left">Calculated Accuracy</th>
              <th className="p-2 text-left">Expected Accuracy</th>
              <th className="p-2 text-left">Difference</th>
              <th className="p-2 text-left">Risk Level</th>
            </tr>
          </thead>
          <tbody>
            {results.map((result, index) => (
              <tr key={index} className="border-t">
                <td className="p-2">{result.name}</td>
                <td className="p-2">{result.wiggleScore?.toFixed(4) || 'N/A'}</td>
                <td className="p-2">{result.calculatedAccuracy?.toFixed(1) || 'N/A'}%</td>
                <td className="p-2">{result.expectedAccuracy}%</td>
                <td
                  className="p-2"
                  style={{ color: Math.abs(result.accuracyDifference || 0) > 10 ? 'red' : 'green' }}
                >
                  {result.accuracyDifference && result.accuracyDifference > 0 ? '+' : ''}
                  {result.accuracyDifference?.toFixed(1) || 'N/A'}%
                </td>
                <td className="p-2">{result.riskLevel || 'N/A'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default TestCalcPage;
