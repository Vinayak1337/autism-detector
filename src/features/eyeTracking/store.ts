import { create } from 'zustand';
import { Point } from './AnimatedBall';
import { EyeMovementData, AnalysisResult } from './dataProcessing';

interface EyeTrackingState {
  // Test phase state
  testPhase: 'intro' | 'ready' | 'testing' | 'results';
  setTestPhase: (phase: 'intro' | 'ready' | 'testing' | 'results') => void;

  // Eye tracking data
  gazeData: { x: number; y: number } | null;
  setGazeData: (data: { x: number; y: number } | null) => void;

  // Target position data
  targetPosition: Point | null;
  setTargetPosition: (position: Point | null) => void;

  // Eye movement data collection
  eyeMovementData: EyeMovementData[];
  addEyeMovementData: (data: EyeMovementData) => void;
  clearEyeMovementData: () => void;

  // Analysis results
  analysisResult: AnalysisResult | null;
  setAnalysisResult: (result: AnalysisResult | null) => void;

  // Test control
  startTime: number | null;
  setStartTime: (time: number | null) => void;

  // Model and camera state
  isModelLoading: boolean;
  setIsModelLoading: (loading: boolean) => void;

  isCameraReady: boolean;
  setIsCameraReady: (ready: boolean) => void;
}

export const useEyeTrackingStore = create<EyeTrackingState>((set) => ({
  // Test phase state
  testPhase: 'intro',
  setTestPhase: (phase) => set({ testPhase: phase }),

  // Eye tracking data
  gazeData: null,
  setGazeData: (data) => set({ gazeData: data }),

  // Target position data
  targetPosition: null,
  setTargetPosition: (position) => set({ targetPosition: position }),

  // Eye movement data collection
  eyeMovementData: [],
  addEyeMovementData: (data) =>
    set((state) => ({ eyeMovementData: [...state.eyeMovementData, data] })),
  clearEyeMovementData: () => set({ eyeMovementData: [] }),

  // Analysis results
  analysisResult: null,
  setAnalysisResult: (result) => set({ analysisResult: result }),

  // Test control
  startTime: null,
  setStartTime: (time) => set({ startTime: time }),

  // Model and camera state
  isModelLoading: true,
  setIsModelLoading: (loading) => set({ isModelLoading: loading }),

  isCameraReady: false,
  setIsCameraReady: (ready) => set({ isCameraReady: ready }),
}));
