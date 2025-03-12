import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import EyeTrackingTestPage from './page';
import { useRouter } from 'next/navigation';
import { TestPhase } from '@/features/eyeTracking/store';

// Mock the next/navigation router
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));

// Mock the EyeTrackingComponent
jest.mock('@/features/eyeTracking/EyeTrackingComponent', () => ({
  EyeTrackingComponent: jest.fn().mockImplementation(({ onEyeDetected, onGazeData }) => {
    // Store callbacks for later use
    let eyeDetectedCallback = onEyeDetected;
    let gazeDataCallback = onGazeData;

    // Add buttons to simulate eye tracking events
    return (
      <div>
        <button
          data-testid="mock-gaze-button"
          onClick={() => gazeDataCallback && gazeDataCallback({ x: 0.5, y: 0.5 })}
        >
          Simulate Gaze
        </button>
        <button
          data-testid="mock-eye-detected"
          onClick={() => eyeDetectedCallback && eyeDetectedCallback(true)}
        >
          Simulate Eye Detection
        </button>
        <div data-testid="eye-tracking-component">Eye Tracking Component</div>
      </div>
    );
  }),
}));

// Mock the AnimatedBall component
jest.mock('@/features/eyeTracking/AnimatedBall', () => ({
  AnimatedBall: jest.fn().mockImplementation(({ onPositionUpdate, onComplete }) => {
    // Store callbacks for later use
    let positionChangeCallback = onPositionUpdate;
    let completeCallback = onComplete;

    return (
      <div>
        <button
          data-testid="mock-ball-position"
          onClick={() => positionChangeCallback && positionChangeCallback({ x: 0.7, y: 0.3 })}
        >
          Change Ball Position
        </button>
        <button
          data-testid="simulate-complete"
          onClick={() => completeCallback && completeCallback()}
        >
          Simulate Test Complete
        </button>
        <div data-testid="animated-ball">Animated Ball</div>
      </div>
    );
  }),
}));

// Mock the data processing module
jest.mock('@/features/eyeTracking/dataProcessing', () => ({
  analyzeEyeMovementData: jest.fn().mockReturnValue({
    accuracy: 85,
    reactionTime: 450,
    consistency: 78,
    attentionScore: 82,
  }),
}));

// Mock the eye tracking store
jest.mock('@/features/eyeTracking/store', () => {
  // Create a mock store state that can be modified during tests
  const mockStore = {
    testPhase: 'intro' as TestPhase,
    eyePosition: { x: 0, y: 0 },
    ballPosition: { x: 0, y: 0 },
    eyeMovementData: [],
    analysisResults: null,
    isCameraReady: true,
    eyeDetected: false,
    gazeData: [],
    setTestPhase: jest.fn((phase: string) => {
      mockStore.testPhase = phase as TestPhase;
    }),
    startTest: jest.fn(() => {
      mockStore.testPhase = 'testing';
    }),
    endTest: jest.fn(),
    setEyePosition: jest.fn(),
    setBallPosition: jest.fn(),
    recordEyeMovement: jest.fn(),
    setAnalysisResults: jest.fn(),
    resetTest: jest.fn(),
  };

  return {
    useEyeTrackingStore: jest.fn(() => mockStore),
    TestPhase: {
      INTRO: 'intro',
      SETUP: 'setup',
      READY: 'ready',
      TESTING: 'testing',
      RESULTS: 'results',
    },
  };
});

// Mock useEyeTracking hook
jest.mock('@/features/eyeTracking/useEyeTracking', () => {
  return {
    useEyeTracking: jest.fn(() => ({
      startTracking: jest.fn(),
      stopTracking: jest.fn(),
      isTracking: false,
      error: null,
      permissionStatus: 'granted',
      isPermissionGranted: true,
      isCameraReady: true,
      isModelLoading: false,
      isModelLoaded: true,
      faceDetected: true,
      eyeDetected: true,
      gazeData: { x: 0.5, y: 0.5 },
      setGazeData: jest.fn(),
      setEyeDetected: jest.fn(),
      setIsCameraReady: jest.fn(),
      setIsModelLoading: jest.fn(),
      setIsPermissionGranted: jest.fn(),
      setPermissionStatus: jest.fn(),
      setError: jest.fn(),
      setFaceDetected: jest.fn(),
      setLocalModelLoading: jest.fn(),
    })),
  };
});

beforeEach(() => {
  // Clear all mocks before each test
  jest.clearAllMocks();

  // Reset the router mock
  (useRouter as jest.Mock).mockReturnValue({
    push: jest.fn(),
  });
});

describe('EyeTrackingTestPage', () => {
  it('renders the eye tracking test title', () => {
    render(<EyeTrackingTestPage />);
    expect(screen.getByText('Eye Tracking Test')).toBeInTheDocument();
  });

  it('starts with the intro phase', () => {
    render(<EyeTrackingTestPage />);
    expect(
      screen.getByText(
        'This test will track your eye movements as you follow a moving ball on the screen.'
      )
    ).toBeInTheDocument();
  });

  it('transitions to setup phase when Get Started is clicked', async () => {
    const user = userEvent.setup();
    const { useEyeTrackingStore } = require('@/features/eyeTracking/store');
    const mockStore = useEyeTrackingStore();

    render(<EyeTrackingTestPage />);

    // Click the Get Started button
    await user.click(screen.getByText('Get Started'));

    // Verify we're in the setup phase
    expect(mockStore.setTestPhase).toHaveBeenCalledWith('setup');
  });

  it('shows eye tracking component when in setup phase', () => {
    const { useEyeTrackingStore } = require('@/features/eyeTracking/store');
    const mockStore = useEyeTrackingStore();

    // Set the phase to setup
    mockStore.testPhase = 'setup';

    render(<EyeTrackingTestPage />);

    // Verify the eye tracking component is rendered
    expect(screen.getByText('Setting Up Camera')).toBeInTheDocument();
  });

  it('transitions to ready phase when eye is detected', async () => {
    const user = userEvent.setup();
    const { useEyeTrackingStore } = require('@/features/eyeTracking/store');
    const mockStore = useEyeTrackingStore();

    // Set the phase to setup and camera ready
    mockStore.testPhase = 'setup';
    mockStore.isCameraReady = true;

    render(<EyeTrackingTestPage />);

    // Simulate eye detection
    await user.click(screen.getByTestId('mock-eye-detected'));

    // Verify we're in the ready phase
    expect(mockStore.setTestPhase).toHaveBeenCalledWith('ready');
  });

  it('enables the Start Test button when eye is detected', () => {
    const { useEyeTrackingStore } = require('@/features/eyeTracking/store');
    const mockStore = useEyeTrackingStore();

    // Set the phase to ready and eye detected
    mockStore.testPhase = 'ready';
    mockStore.eyeDetected = true;

    render(<EyeTrackingTestPage />);

    // Verify the Start Test button is enabled
    const startButton = screen.getByText('Start Test');
    expect(startButton).not.toBeDisabled();
  });

  it('transitions to testing phase when Start Test is clicked', async () => {
    const user = userEvent.setup();
    const { useEyeTrackingStore } = require('@/features/eyeTracking/store');
    const mockStore = useEyeTrackingStore();

    // Set the phase to ready and eye detected
    mockStore.testPhase = 'ready';
    mockStore.eyeDetected = true;

    render(<EyeTrackingTestPage />);

    // Click Start Test
    await user.click(screen.getByText('Start Test'));

    // Verify startTest was called
    expect(mockStore.startTest).toHaveBeenCalled();
  });

  it('shows the ball in testing phase', () => {
    const { useEyeTrackingStore } = require('@/features/eyeTracking/store');
    const mockStore = useEyeTrackingStore();

    // Set the phase to testing
    mockStore.testPhase = 'testing';

    render(<EyeTrackingTestPage />);

    // Verify we're in the testing phase
    expect(screen.getByText('Follow the Ball')).toBeInTheDocument();
    expect(screen.getByTestId('animated-ball')).toBeInTheDocument();
  });

  it('collects eye movement data during testing', async () => {
    const user = userEvent.setup();
    const { useEyeTrackingStore } = require('@/features/eyeTracking/store');
    const mockStore = useEyeTrackingStore();

    // Set the phase to testing
    mockStore.testPhase = 'testing';

    render(<EyeTrackingTestPage />);

    // Simulate ball position change
    await user.click(screen.getByTestId('mock-ball-position'));

    // Verify position update was recorded
    expect(screen.getByTestId('mock-ball-position')).toBeInTheDocument();
  });

  it('navigates to results page when test completes', async () => {
    const user = userEvent.setup();
    const { useEyeTrackingStore } = require('@/features/eyeTracking/store');
    const mockStore = useEyeTrackingStore();
    const router = useRouter();

    // Set the phase to testing and add some data
    mockStore.testPhase = 'testing';
    mockStore.gazeData = Array(20).fill({ x: 0.5, y: 0.5 });

    render(<EyeTrackingTestPage />);

    // Simulate test completion
    await user.click(screen.getByTestId('simulate-complete'));

    // Verify router.push was called
    expect(router.push).toHaveBeenCalledWith('/eye-tracking-results');
  });

  it('shows processing message in results phase', () => {
    const { useEyeTrackingStore } = require('@/features/eyeTracking/store');
    const mockStore = useEyeTrackingStore();

    // Set the phase to results
    mockStore.testPhase = 'results';

    render(<EyeTrackingTestPage />);

    // Verify results phase content is shown
    expect(screen.getByText('Test Complete')).toBeInTheDocument();
    expect(screen.getByText('Processing your results...')).toBeInTheDocument();
  });

  it('allows canceling the test during testing phase', async () => {
    const user = userEvent.setup();
    const { useEyeTrackingStore } = require('@/features/eyeTracking/store');
    const mockStore = useEyeTrackingStore();

    // Set the phase to testing
    mockStore.testPhase = 'testing';

    render(<EyeTrackingTestPage />);

    // Click the Cancel Test button
    await user.click(screen.getByText('Cancel Test'));

    // Verify endTest was called
    expect(mockStore.endTest).toHaveBeenCalled();
  });
});
