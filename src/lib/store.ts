import { create } from 'zustand';

// Define possible test phases
type TestPhase = 'idle' | 'testing' | 'complete';

// Extend the AppState interface
interface AppState {
  isLoading: boolean;
  setIsLoading: (isLoading: boolean) => void;
  darkMode: boolean;
  toggleDarkMode: () => void;
  testPhase: TestPhase; // Add testPhase
  startTest: () => void; // Add action to start the test
  endTest: () => void;  // Add action to end the test
}

export const useAppStore = create<AppState>((set) => ({
  isLoading: false,
  setIsLoading: (isLoading: boolean) => set({ isLoading }),
  darkMode: false,
  toggleDarkMode: () => set((state) => ({ darkMode: !state.darkMode })),
  testPhase: 'idle', // Initial state for testPhase
  startTest: () => set({ testPhase: 'testing' }), // Start the animation
  endTest: () => set({ testPhase: 'complete' }),  // End the animation
}));