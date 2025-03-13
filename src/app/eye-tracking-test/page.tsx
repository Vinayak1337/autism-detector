'use client';

import React from 'react';
import { useEyeTrackingStore } from '@/features/eyeTracking/store';

// Import our custom hooks
import {
  useEyeTrackingStats,
  useTargetPositions,
  useTestCompletion,
  useTestPhaseManager,
} from '@/features/eyeTracking/hooks';

// Import all phase components
import { IntroPhase } from '@/features/eyeTracking/components/IntroPhase';
import { SetupPhase } from '@/features/eyeTracking/components/SetupPhase';
import { ReadyPhase } from '@/features/eyeTracking/components/ReadyPhase';
import { TestingPhase } from '@/features/eyeTracking/components/TestingPhase/TestingPhase';
import { ResultsPhase } from '@/features/eyeTracking/components/ResultsPhase';

const EyeTrackingTestPage: React.FC = () => {
  // Access the global eye tracking store
  const {
    testPhase,
    setTestPhase,
    isCameraReady,
    eyeDetected,
    gazeData,
    startTest,
    endTest,
    setAnalysisResults,
  } = useEyeTrackingStore();

  // Use our custom target positions hook
  const { targetPositions, handleBallPositionUpdate, resetPositions, getConsistentTimestamps } =
    useTargetPositions();

  // Use our test phase manager hook
  const {
    handleStartSetup,
    handleProceedToReady,
    handleStartTest,
    handleCancelTest,
    handleRestart,
    isTestActive,
  } = useTestPhaseManager({
    testPhase,
    setTestPhase,
    startTest,
    endTest,
    resetPositions,
  });

  // Use our eye tracking stats hook
  const { eyeStats, handleGazeData } = useEyeTrackingStats({
    gazeData,
    targetPositions,
    eyeDetected,
    isTestActive,
  });

  // Use our test completion hook
  const { handleTestComplete } = useTestCompletion({
    gazeData,
    targetPositions,
    getConsistentTimestamps,
    setAnalysisResults,
    setTestPhase,
  });

  // Render content based on test phase
  const renderPhaseContent = () => {
    switch (testPhase) {
      case 'intro':
        return <IntroPhase onProceed={handleStartSetup} />;

      case 'setup':
        return (
          <SetupPhase
            isCameraReady={isCameraReady}
            eyeDetected={eyeDetected}
            onProceed={handleProceedToReady}
          />
        );

      case 'ready':
        return <ReadyPhase eyeDetected={eyeDetected} onStartTest={handleStartTest} />;

      case 'testing':
        return (
          <TestingPhase
            eyeDetected={eyeDetected}
            gazeData={gazeData}
            onGazeData={handleGazeData}
            onComplete={handleTestComplete}
            onCancel={handleCancelTest}
            onPositionUpdate={handleBallPositionUpdate}
            eyeStats={eyeStats}
          />
        );

      case 'results':
        return <ResultsPhase onRestart={handleRestart} />;

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        <div
          className={`bg-white rounded-lg shadow-lg ${
            testPhase === 'testing' ? 'min-h-[90vh] overflow-auto p-0' : 'min-h-[70vh] p-8'
          }`}
        >
          {renderPhaseContent()}
        </div>

        {testPhase !== 'testing' && (
          <div className="mt-6 text-center text-gray-600">
            <p>For best results, please use a computer with a good webcam in a well-lit room.</p>
            <p className="mt-2 text-sm">
              Position your face clearly in the camera view and minimize background movement.
            </p>
            <div className="mt-4">
              <a
                href="/eye-tracking-test/square-animation-test"
                className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors text-sm inline-block"
              >
                Try Dedicated Square Animation Test
              </a>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default EyeTrackingTestPage;
