'use client';

import { create } from 'zustand';
import { Point } from './AnimatedBall';
import { devtools } from 'zustand/middleware';
import { debounce } from 'lodash'; // Import lodash debounce

// Define test phases for eye tracking flow
export type TestPhase = 'intro' | 'setup' | 'ready' | 'testing' | 'results';

// Define the interface for analysis results
export interface AnalysisResult {
  saccadeFrequency: number;
  averageFixationDuration: number;
  wiggleScore: number;
  deviationScore: number;
  riskAssessment: string;
  testDate: Date;
  fixationPercentage: number;
}

// Define the store's state
export interface EyeTrackingState {
  // Camera and model status
  isModelLoading: boolean;
  isCameraReady: boolean;
  eyeDetected: boolean;

  // Test status
  testPhase: TestPhase;
  testStartTime: Date | null;
  testEndTime: Date | null;

  // Gaze data
  gazeData: Point[];

  // Analysis results
  analysisResults: AnalysisResult | null;

  // Actions
  setIsModelLoading: (loading: boolean) => void;
  setIsCameraReady: (isReady: boolean) => void;
  setEyeDetected: (detected: boolean) => void;
  setTestPhase: (phase: TestPhase) => void;
  setGazeData: (data: Point[]) => void;
  addGazePoint: (point: Point) => void;
  clearGazeData: () => void;
  startTest: () => void;
  endTest: () => void;
  setAnalysisResults: (results: AnalysisResult) => void;
  resetTest: () => void;
  resetTestState: () => void;
}

export const useEyeTrackingStore = create<EyeTrackingState>()(
  devtools(
    (set) => {
      // Debounced setEyeDetected to prevent rapid updates
      const setEyeDetectedDebounced = debounce((detected: boolean) => {
        console.log('eyesDetected set to:', detected);
        set({ eyeDetected: detected });
      }, 500); // 500ms debounce delay

      return {
        // Camera and model status
        isModelLoading: true,
        isCameraReady: false,
        eyeDetected: false,

        // Test status
        testPhase: 'intro',
        testStartTime: null,
        testEndTime: null,

        // Gaze data
        gazeData: [],

        // Analysis results
        analysisResults: null,

        // Actions
        setIsModelLoading: (loading) => set({ isModelLoading: loading }),

        setIsCameraReady: (isReady) => set({ isCameraReady: isReady }),

        setEyeDetected: (detected) => setEyeDetectedDebounced(detected), // Use debounced version

        setTestPhase: (phase) => {
          console.log('testPhase set to:', phase);
          set({ testPhase: phase });
        },

        setGazeData: (data) => set({ gazeData: data }),

        addGazePoint: (point) =>
          set((state) => ({
            gazeData: [...state.gazeData, point],
          })),

        clearGazeData: () => set({ gazeData: [] }),

        startTest: () => {
          console.log("Starting test, setting testPhase to 'testing'");
          set({
            testPhase: 'testing',
            testStartTime: new Date(),
            gazeData: [], // Clear previous data
          });
        },

        endTest: () =>
          set(() => ({
            testPhase: 'results',
            testEndTime: new Date(),
          })),

        setAnalysisResults: (results) => set({ analysisResults: results }),

        resetTest: () =>
          set({
            testPhase: 'intro',
            testStartTime: null,
            testEndTime: null,
            gazeData: [],
            analysisResults: null,
          }),

        resetTestState: () =>
          set({
            testPhase: 'ready',
            testStartTime: null,
            testEndTime: null,
            gazeData: [],
            analysisResults: null,
            eyeDetected: false,
          }),
      };
    },
    {
      name: 'eye-tracking-store',
    }
  )
);