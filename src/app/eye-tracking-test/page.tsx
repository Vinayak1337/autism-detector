'use client';

import React, { useState } from 'react';
import { useEyeTrackingStore } from '@/features/eyeTracking/store';
import dynamic from 'next/dynamic';

// Import our custom hooks
import {
  useEyeTrackingStats,
  useTargetPositions,
  useTestCompletion,
  useTestPhaseManager,
} from '@/features/eyeTracking/hooks';

// Dynamically import components to ensure they load client-side
const IntroPhase = dynamic(
  () =>
    import('@/features/eyeTracking/components/IntroPhase').then((mod) => ({
      default: mod.IntroPhase,
    })),
  {
    ssr: false,
    loading: () => <div className="animate-pulse bg-gray-200 rounded-lg h-64 w-full"></div>,
  }
);

const SetupPhase = dynamic(
  () =>
    import('@/features/eyeTracking/components/SetupPhase').then((mod) => ({
      default: mod.SetupPhase,
    })),
  {
    ssr: false,
    loading: () => <div className="animate-pulse bg-gray-200 rounded-lg h-64 w-full"></div>,
  }
);

const ReadyPhase = dynamic(
  () =>
    import('@/features/eyeTracking/components/ReadyPhase').then((mod) => ({
      default: mod.ReadyPhase,
    })),
  {
    ssr: false,
    loading: () => <div className="animate-pulse bg-gray-200 rounded-lg h-64 w-full"></div>,
  }
);

const TestingPhase = dynamic(
  () =>
    import('@/features/eyeTracking/components/TestingPhase/TestingPhase').then((mod) => ({
      default: mod.TestingPhase,
    })),
  {
    ssr: false,
    loading: () => <div className="animate-pulse bg-gray-200 rounded-lg h-64 w-full"></div>,
  }
);

const ResultsPhase = dynamic(
  () =>
    import('@/features/eyeTracking/components/ResultsPhase').then((mod) => ({
      default: mod.ResultsPhase,
    })),
  {
    ssr: false,
    loading: () => <div className="animate-pulse bg-gray-200 rounded-lg h-64 w-full"></div>,
  }
);

const EyeTrackingVisualizer = dynamic(
  () =>
    import('@/features/eyeTracking/components/EyeTrackingVisualizer').then((mod) => ({
      default: mod.EyeTrackingVisualizer,
    })),
  {
    ssr: false,
    loading: () => <div className="animate-pulse bg-gray-200 rounded-lg h-48 w-full"></div>,
  }
);

const EyeTrackingDataSummary = dynamic(
  () =>
    import('@/features/eyeTracking/components/EyeTrackingDataSummary').then((mod) => ({
      default: mod.EyeTrackingDataSummary,
    })),
  {
    ssr: false,
  }
);

const EyeTrackingInsights = dynamic(
  () =>
    import('@/features/eyeTracking/components/EyeTrackingInsights').then((mod) => ({
      default: mod.EyeTrackingInsights,
    })),
  {
    ssr: false,
  }
);

// The EyeTrackingComponent is dynamically imported by child components when needed

const EyeTrackingTestPage: React.FC = () => {
  // Local state for visualization settings
  const [showVisualizer, setShowVisualizer] = useState(true);
  const [showHeatmap, setShowHeatmap] = useState(true);
  const [showTrail, setShowTrail] = useState(true);
  const [showDataSummary, setShowDataSummary] = useState(false);
  const [showInsights, setShowInsights] = useState(false);

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
        // Get analysis results from the store
        const analysisResults = useEyeTrackingStore.getState().analysisResults;

        // If results aren't available yet, show a loading state
        if (!analysisResults) {
          return (
            <div className="flex flex-col items-center justify-center h-64 p-8">
              <h2 className="text-2xl font-bold mb-4 text-gray-800">Processing Results</h2>
              <p className="mb-6 text-gray-600">
                Please wait while we analyze your eye tracking data...
              </p>
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600 mx-auto"></div>
            </div>
          );
        }

        // Return the results component with the analysis data
        return (
          <ResultsPhase
            results={analysisResults}
            gazeData={gazeData}
            onRetry={handleRestart}
            onReset={() => setTestPhase('intro')}
          />
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 py-8 px-4 sm:px-6 md:px-8">
      <div className="max-w-6xl mx-auto">
        <header className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 text-center mb-2">
            Eye Tracking Assessment
          </h1>
          <p className="text-gray-600 text-center max-w-2xl mx-auto">
            This test tracks your eye movements to analyze patterns that may help identify visual
            attention characteristics.
          </p>
        </header>

        <div
          className={`bg-white rounded-2xl shadow-xl transition-all duration-300 ${
            testPhase === 'testing' ? 'min-h-[80vh] overflow-auto p-0' : 'min-h-[60vh] p-6 md:p-8'
          }`}
        >
          {renderPhaseContent()}
        </div>

        {/* Eye Tracking Data Section */}
        {gazeData.length > 0 && (
          <div className="mt-8 space-y-6 transition-all duration-500">
            {/* Eye Tracking Data Summary Toggle */}
            <div className="bg-white rounded-2xl shadow-xl p-6 transition-all duration-300">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <h3 className="text-lg font-semibold text-gray-800">Eye Tracking Data Analysis</h3>
                <div className="flex flex-wrap gap-3">
                  <button
                    onClick={() => setShowDataSummary(!showDataSummary)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      showDataSummary
                        ? 'bg-gray-800 text-white hover:bg-gray-700'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {showDataSummary ? 'Hide Data Summary' : 'Show Data Summary'}
                  </button>
                  <button
                    onClick={() => setShowInsights(!showInsights)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      showInsights
                        ? 'bg-blue-600 text-white hover:bg-blue-700'
                        : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                    }`}
                  >
                    {showInsights ? 'Hide Insights' : 'Show Insights'}
                  </button>
                </div>
              </div>

              {/* Show the data summary and insights if enabled */}
              {(showDataSummary || showInsights) && (
                <div className="mt-6 transition-all duration-300">
                  {showDataSummary && !showInsights && <EyeTrackingDataSummary />}

                  {!showDataSummary && showInsights && <EyeTrackingInsights />}

                  {showDataSummary && showInsights && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <EyeTrackingDataSummary />
                      <EyeTrackingInsights />
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Visualization Section */}
            <div className="bg-white rounded-2xl shadow-xl p-6 transition-all duration-300">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
                <h3 className="text-lg font-semibold text-gray-800">Eye Movement Visualization</h3>
                <div className="flex flex-wrap items-center gap-4">
                  <button
                    onClick={() => setShowVisualizer(!showVisualizer)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      showVisualizer
                        ? 'bg-gray-800 text-white hover:bg-gray-700'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {showVisualizer ? 'Hide Visualization' : 'Show Visualization'}
                  </button>
                  {showVisualizer && (
                    <div className="flex gap-4">
                      <label className="flex items-center gap-2 text-sm cursor-pointer group">
                        <input
                          type="checkbox"
                          checked={showHeatmap}
                          onChange={(e) => setShowHeatmap(e.target.checked)}
                          className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-gray-300"
                        />
                        <span className="text-gray-700 group-hover:text-gray-900">Heatmap</span>
                      </label>
                      <label className="flex items-center gap-2 text-sm cursor-pointer group">
                        <input
                          type="checkbox"
                          checked={showTrail}
                          onChange={(e) => setShowTrail(e.target.checked)}
                          className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-gray-300"
                        />
                        <span className="text-gray-700 group-hover:text-gray-900">Trail</span>
                      </label>
                    </div>
                  )}
                </div>
              </div>

              <div className="transition-all duration-500 ease-in-out">
                {showVisualizer ? (
                  <>
                    <div className="bg-gray-50 rounded-xl p-4 flex justify-center">
                      <EyeTrackingVisualizer
                        gazeData={gazeData}
                        width={640}
                        height={360}
                        showHeatmap={showHeatmap}
                        showTrail={showTrail}
                        trailLength={100}
                        className="max-w-full h-auto"
                      />
                    </div>
                    <div className="mt-4 text-center text-sm text-gray-600">
                      <p>This visualization shows your eye movement patterns during the test.</p>
                      <p className="mt-1">
                        The heatmap indicates focus areas, while the trail displays your eye
                        movement path.
                      </p>
                    </div>
                  </>
                ) : null}
              </div>
            </div>
          </div>
        )}

        {testPhase !== 'testing' && (
          <footer className="mt-8 text-center text-gray-500 text-sm">
            <p>
              This assessment is for informational purposes only and is not a medical diagnosis.
            </p>
            <p className="mt-1">
              For medical advice, please consult with a healthcare professional.
            </p>
          </footer>
        )}
      </div>
    </div>
  );
};

export default EyeTrackingTestPage;
