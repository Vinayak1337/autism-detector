'use client';

import React from 'react';
import { AnalysisResult } from '../store';
import { EyeTrackingVisualizer } from './EyeTrackingVisualizer';
import { Point } from '../AnimatedBall';

interface ResultsPhaseProps {
  results: AnalysisResult;
  gazeData: Point[];
  onRetry: () => void;
  onReset: () => void;
}

export const ResultsPhase: React.FC<ResultsPhaseProps> = ({
  results,
  gazeData,
  onRetry,
  onReset,
}) => {
  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(date);
  };

  // Determine risk level class
  const getRiskLevelClass = (riskLevel: string) => {
    switch (riskLevel.toLowerCase()) {
      case 'low':
        return 'bg-green-100 text-green-800';
      case 'moderate':
        return 'bg-yellow-100 text-yellow-800';
      case 'high':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Get suggestions based on results
  const getSuggestions = (results: AnalysisResult) => {
    const suggestions = [];

    if (results.saccadeFrequency > 2.5) {
      suggestions.push(
        'Your eye movements showed rapid shifting between points. This may indicate difficulty maintaining focus.'
      );
    }

    if (results.averageFixationDuration < 200) {
      suggestions.push(
        'Your fixation durations were shorter than average, which could suggest difficulty sustaining attention.'
      );
    }

    if (results.wiggleScore > 0.7) {
      suggestions.push(
        'Your eye movements showed higher variability, which may indicate challenges with smooth tracking.'
      );
    }

    if (results.deviationScore > 0.6) {
      suggestions.push(
        'Your gaze tended to deviate from the target more than average, which could indicate processing differences.'
      );
    }

    if (suggestions.length === 0) {
      suggestions.push('Your eye movement patterns appear to be within typical ranges.');
    }

    return suggestions;
  };

  return (
    <div className="max-w-4xl mx-auto px-4">
      <h1 className="text-3xl font-bold mb-4 text-center">Eye Tracking Results</h1>

      <div className="mb-8">
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Analysis Summary</h2>
            <span className="text-sm text-gray-500">
              Test completed: {formatDate(results.testDate)}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Metrics */}
            <div>
              <div className="space-y-4">
                <div>
                  <p className="text-sm font-medium text-gray-500">Risk Assessment</p>
                  <p
                    className={`mt-1 px-3 py-1 rounded-full inline-block font-medium ${getRiskLevelClass(results.riskAssessment)}`}
                  >
                    {results.riskAssessment} Risk
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-gray-500">Saccade Frequency</p>
                    <p className="mt-1 text-2xl font-semibold">
                      {results.saccadeFrequency.toFixed(2)}{' '}
                      <span className="text-sm font-normal text-gray-500">Hz</span>
                    </p>
                  </div>

                  <div>
                    <p className="text-sm font-medium text-gray-500">Fixation Duration</p>
                    <p className="mt-1 text-2xl font-semibold">
                      {results.averageFixationDuration.toFixed(0)}{' '}
                      <span className="text-sm font-normal text-gray-500">ms</span>
                    </p>
                  </div>

                  <div>
                    <p className="text-sm font-medium text-gray-500">Deviation Score</p>
                    <p className="mt-1 text-2xl font-semibold">
                      {(results.deviationScore * 100).toFixed(0)}{' '}
                      <span className="text-sm font-normal text-gray-500">%</span>
                    </p>
                  </div>

                  <div>
                    <p className="text-sm font-medium text-gray-500">Fixation Rate</p>
                    <p className="mt-1 text-2xl font-semibold">
                      {results.fixationPercentage.toFixed(0)}{' '}
                      <span className="text-sm font-normal text-gray-500">%</span>
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Visualization */}
            <div className="flex flex-col items-center">
              <p className="text-sm font-medium text-gray-500 mb-2">Eye Movement Visualization</p>
              <EyeTrackingVisualizer
                gazeData={gazeData}
                width={280}
                height={200}
                showHeatmap={true}
                showTrail={true}
              />
            </div>
          </div>
        </div>

        {/* Interpretation and Suggestions */}
        <div className="bg-indigo-50 rounded-lg p-6 mb-6">
          <h3 className="text-lg font-semibold mb-3">Interpretation & Suggestions</h3>
          <ul className="list-disc pl-5 space-y-2">
            {getSuggestions(results).map((suggestion, index) => (
              <li key={index} className="text-gray-700">
                {suggestion}
              </li>
            ))}
          </ul>
          <div className="mt-4 text-sm text-gray-600">
            <p className="font-medium">Note:</p>
            <p>
              This test is not diagnostic. Results should be interpreted by qualified professionals
              and used alongside other assessments.
            </p>
          </div>
        </div>

        {/* Next Steps */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold mb-3">What&apos;s Next?</h3>
          <div className="space-y-4">
            <p>Your results have been saved. You can:</p>
            <div className="flex flex-wrap gap-4 justify-center">
              <button
                onClick={onRetry}
                className="px-5 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
              >
                Take the Test Again
              </button>
              <button
                onClick={onReset}
                className="px-5 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Back to Home
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
