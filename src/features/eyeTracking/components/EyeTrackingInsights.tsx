'use client';

import React, { useEffect, useState } from 'react';
import { useEyeTrackingStore } from '../store';

interface EyeTrackingInsightsProps {
  className?: string;
}

/**
 * Component that analyzes eye tracking data in real-time and provides
 * insights and recommendations based on the user's eye movements
 */
export const EyeTrackingInsights: React.FC<EyeTrackingInsightsProps> = ({ className = '' }) => {
  const gazeData = useEyeTrackingStore((state) => state.gazeData);
  const analysisResults = useEyeTrackingStore((state) => state.analysisResults);

  const [insights, setInsights] = useState<{
    patterns: string[];
    recommendations: string[];
    attentionQuality: 'high' | 'medium' | 'low' | 'unknown';
  }>({
    patterns: [],
    recommendations: [],
    attentionQuality: 'unknown',
  });

  // Generate insights based on the gaze data and analysis results
  useEffect(() => {
    if (gazeData.length < 10) {
      setInsights({
        patterns: ['Not enough data to identify patterns'],
        recommendations: ['Continue the test to collect more eye movement data'],
        attentionQuality: 'unknown',
      });
      return;
    }

    const newPatterns: string[] = [];
    const newRecommendations: string[] = [];
    let attentionQuality: 'high' | 'medium' | 'low' | 'unknown' = 'unknown';

    // Calculate some basic metrics
    let totalDistance = 0;
    let maxJump = 0;

    for (let i = 1; i < gazeData.length; i++) {
      const dx = gazeData[i].x - gazeData[i - 1].x;
      const dy = gazeData[i].y - gazeData[i - 1].y;
      const distance = Math.sqrt(dx * dx + dy * dy);

      totalDistance += distance;
      maxJump = Math.max(maxJump, distance);
    }

    const avgDistance = totalDistance / (gazeData.length - 1);

    // Identify patterns based on metrics
    if (maxJump > 30) {
      newPatterns.push(
        'Large jumps detected in eye movements, which may indicate saccades or attention shifts'
      );
    }

    if (avgDistance < 5 && gazeData.length > 50) {
      newPatterns.push('Minimal eye movement detected, which may indicate good focus or fixation');
      attentionQuality = 'high';
    } else if (avgDistance > 15) {
      newPatterns.push(
        'Significant eye movement detected, which may indicate active scanning or difficulty focusing'
      );
      attentionQuality = 'medium';
    }

    // Add insights based on analysis results if available
    if (analysisResults) {
      if (analysisResults.saccadeFrequency > 2.5) {
        newPatterns.push(
          'High saccade frequency detected, which may indicate active visual search or difficulty maintaining focus'
        );
        attentionQuality = attentionQuality === 'unknown' ? 'medium' : attentionQuality;
      }

      if (analysisResults.wiggleScore > 0.7) {
        newPatterns.push(
          'High variability in eye movements detected, which may indicate challenges with smooth tracking'
        );
        attentionQuality = 'low';
      }

      if (analysisResults.averageFixationDuration < 200) {
        newPatterns.push(
          'Short fixation durations detected, which may indicate difficulty sustaining attention'
        );
        attentionQuality = 'low';
      } else if (analysisResults.averageFixationDuration > 350) {
        newPatterns.push(
          'Long fixation durations detected, which may indicate deep focus or processing'
        );
        attentionQuality = attentionQuality === 'unknown' ? 'high' : attentionQuality;
      }
    }

    // Generate recommendations based on patterns
    if (attentionQuality === 'low') {
      newRecommendations.push(
        'Consider taking breaks when performing tasks requiring sustained visual attention'
      );
      newRecommendations.push('Try practicing mindfulness exercises to improve focus');
      newRecommendations.push(
        'Reduce visual distractions in your environment when working on important tasks'
      );
    } else if (attentionQuality === 'medium') {
      newRecommendations.push(
        'Practice visual tracking exercises to improve smooth pursuit movements'
      );
      newRecommendations.push(
        'Consider taking periodic short breaks during visually intensive tasks'
      );
    } else if (attentionQuality === 'high') {
      newRecommendations.push('Your eye movements suggest good visual attention control');
      newRecommendations.push(
        'Continue to take breaks periodically to maintain this quality of focus'
      );
    }

    // Ensure we have at least one pattern and recommendation
    if (newPatterns.length === 0) {
      newPatterns.push('No specific patterns detected in your eye movements');
    }

    if (newRecommendations.length === 0) {
      newRecommendations.push('Complete the test to receive personalized recommendations');
    }

    setInsights({
      patterns: newPatterns,
      recommendations: newRecommendations,
      attentionQuality,
    });
  }, [gazeData, analysisResults]);

  const getQualityColor = (quality: 'high' | 'medium' | 'low' | 'unknown') => {
    switch (quality) {
      case 'high':
        return 'text-green-600';
      case 'medium':
        return 'text-yellow-600';
      case 'low':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  return (
    <div className={`bg-white rounded-lg shadow-md p-4 ${className}`}>
      <h3 className="text-lg font-semibold mb-3">Eye Tracking Insights</h3>

      {insights.attentionQuality !== 'unknown' && (
        <div className="mb-4">
          <p className="text-sm text-gray-600 mb-1">Attention Quality Assessment:</p>
          <p className={`font-medium ${getQualityColor(insights.attentionQuality)}`}>
            {insights.attentionQuality === 'high' &&
              'High - Your visual attention appears strong and focused'}
            {insights.attentionQuality === 'medium' &&
              'Moderate - Your visual attention shows some variability'}
            {insights.attentionQuality === 'low' &&
              'Variable - Your visual attention patterns may benefit from exercises'}
          </p>
        </div>
      )}

      <div className="mb-4">
        <h4 className="text-md font-medium mb-2">Detected Patterns</h4>
        <ul className="list-disc pl-5 space-y-1">
          {insights.patterns.map((pattern, index) => (
            <li key={index} className="text-sm text-gray-700">
              {pattern}
            </li>
          ))}
        </ul>
      </div>

      <div className="border-t border-gray-200 pt-4">
        <h4 className="text-md font-medium mb-2">Recommendations</h4>
        <ul className="list-disc pl-5 space-y-1">
          {insights.recommendations.map((recommendation, index) => (
            <li key={index} className="text-sm text-gray-700">
              {recommendation}
            </li>
          ))}
        </ul>
      </div>

      <div className="mt-4 text-xs text-gray-500">
        Note: These insights are generated based on patterns in your eye tracking data and should
        not be considered diagnostic. For professional assessment, please consult with a healthcare
        provider.
      </div>
    </div>
  );
};
