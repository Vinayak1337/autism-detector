'use client';

import React from 'react';
import { useEyeTrackingStore } from '../store';
import { Point } from '../AnimatedBall';

interface EyeTrackingDataSummaryProps {
  className?: string;
}

/**
 * A component that provides a statistical summary of eye tracking data
 * This pulls data directly from the global eye tracking store
 */
export const EyeTrackingDataSummary: React.FC<EyeTrackingDataSummaryProps> = ({
  className = '',
}) => {
  // Get data from the store
  const gazeData = useEyeTrackingStore((state) => state.gazeData);
  const eyeDetected = useEyeTrackingStore((state) => state.eyeDetected);
  const testPhase = useEyeTrackingStore((state) => state.testPhase);
  const analysisResults = useEyeTrackingStore((state) => state.analysisResults);

  // Calculate statistics from the gaze data
  const calculateStats = (data: Point[]) => {
    if (!data.length) return null;

    // Calculate average position
    const avgX = data.reduce((sum, point) => sum + point.x, 0) / data.length;
    const avgY = data.reduce((sum, point) => sum + point.y, 0) / data.length;

    // Calculate data range
    const minX = Math.min(...data.map((point) => point.x));
    const maxX = Math.max(...data.map((point) => point.x));
    const minY = Math.min(...data.map((point) => point.y));
    const maxY = Math.max(...data.map((point) => point.y));

    // Calculate movement statistics
    let totalDistance = 0;
    for (let i = 1; i < data.length; i++) {
      const dx = data[i].x - data[i - 1].x;
      const dy = data[i].y - data[i - 1].y;
      totalDistance += Math.sqrt(dx * dx + dy * dy);
    }

    // Calculate variability (standard deviation)
    const xVariance =
      data.reduce((sum, point) => sum + Math.pow(point.x - avgX, 2), 0) / data.length;
    const yVariance =
      data.reduce((sum, point) => sum + Math.pow(point.y - avgY, 2), 0) / data.length;
    const xStdDev = Math.sqrt(xVariance);
    const yStdDev = Math.sqrt(yVariance);

    return {
      dataPoints: data.length,
      averagePosition: { x: avgX.toFixed(1), y: avgY.toFixed(1) },
      range: {
        x: { min: minX.toFixed(1), max: maxX.toFixed(1) },
        y: { min: minY.toFixed(1), max: maxY.toFixed(1) },
      },
      movementDistance: totalDistance.toFixed(1),
      standardDeviation: { x: xStdDev.toFixed(2), y: yStdDev.toFixed(2) },
    };
  };

  const stats = calculateStats(gazeData);
  const isCollectingData = testPhase === 'testing';

  // If no data, show a message
  if (!stats) {
    return (
      <div className={`bg-white rounded-lg shadow-md p-4 ${className}`}>
        <h3 className="text-lg font-semibold mb-2">Eye Tracking Data</h3>
        <p className="text-gray-500">No eye tracking data available yet.</p>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-lg shadow-md p-4 ${className}`}>
      <div className="flex justify-between items-center mb-3">
        <h3 className="text-lg font-semibold">Eye Tracking Data Summary</h3>
        <div className="flex items-center">
          <div
            className={`h-3 w-3 rounded-full ${eyeDetected ? 'bg-green-500' : 'bg-red-500'} mr-2`}
          ></div>
          <span className="text-sm text-gray-600">
            {isCollectingData ? 'Collecting data' : 'Data collection paused'}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-4">
        <div>
          <p className="text-xs text-gray-500">Data Points</p>
          <p className="text-lg font-medium">{stats.dataPoints}</p>
        </div>

        <div>
          <p className="text-xs text-gray-500">Average Position</p>
          <p className="text-sm">
            X: {stats.averagePosition.x}, Y: {stats.averagePosition.y}
          </p>
        </div>

        <div>
          <p className="text-xs text-gray-500">Movement Distance</p>
          <p className="text-lg font-medium">{stats.movementDistance}</p>
        </div>

        <div>
          <p className="text-xs text-gray-500">X Range</p>
          <p className="text-sm">
            {stats.range.x.min} - {stats.range.x.max}
          </p>
        </div>

        <div>
          <p className="text-xs text-gray-500">Y Range</p>
          <p className="text-sm">
            {stats.range.y.min} - {stats.range.y.max}
          </p>
        </div>

        <div>
          <p className="text-xs text-gray-500">Standard Deviation</p>
          <p className="text-sm">
            X: {stats.standardDeviation.x}, Y: {stats.standardDeviation.y}
          </p>
        </div>
      </div>

      {/* Display analysis results if available */}
      {analysisResults && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <h4 className="text-md font-semibold mb-2">Analysis Results</h4>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <p className="text-xs text-gray-500">Saccade Frequency</p>
              <p className="text-sm font-medium">
                {analysisResults.saccadeFrequency.toFixed(2)} Hz
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Fixation Duration</p>
              <p className="text-sm font-medium">
                {analysisResults.averageFixationDuration.toFixed(0)} ms
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Wiggle Score</p>
              <p className="text-sm font-medium">
                {(analysisResults.wiggleScore * 100).toFixed(0)}%
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Deviation Score</p>
              <p className="text-sm font-medium">
                {(analysisResults.deviationScore * 100).toFixed(0)}%
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="mt-4 text-xs text-gray-500">
        This summary provides a statistical overview of your eye tracking data. The data is updated
        in real-time as you complete the eye tracking test.
      </div>
    </div>
  );
};
