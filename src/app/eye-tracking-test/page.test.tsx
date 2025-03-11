import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import EyeTrackingTestPage from './page';
import { EyeTrackingComponent, AnimatedBall, analyzeEyeMovementData } from '@/features/eyeTracking';

// Mock the eye tracking components
jest.mock('@/features/eyeTracking', () => ({
  EyeTrackingComponent: jest.fn().mockImplementation(({ onGazeData }) => (
    <div data-testid="eye-tracking-component">
      <button data-testid="mock-gaze-button" onClick={() => onGazeData && onGazeData(150, 200)}>
        Simulate Gaze Data
      </button>
    </div>
  )),
  AnimatedBall: jest.fn().mockImplementation(({ onPositionChange, onComplete }) => (
    <div data-testid="animated-ball">
      <div>60s</div>
      <button
        data-testid="simulate-position-change"
        onClick={() => onPositionChange && onPositionChange({ x: 100, y: 100 })}
      >
        Simulate Position Change
      </button>
      <button data-testid="simulate-complete" onClick={() => onComplete && onComplete()}>
        Simulate Test Complete
      </button>
    </div>
  )),
  analyzeEyeMovementData: jest.fn().mockReturnValue({
    fixations: [],
    saccades: [],
    averageFixationDuration: 250,
    saccadeFrequency: 1.5,
    wiggleScore: 25,
    deviationScore: 30,
    riskAssessment: 'Low Risk',
  }),
}));

describe('EyeTrackingTestPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the eye tracking test title', () => {
    render(<EyeTrackingTestPage />);
    expect(screen.getByText('Eye Tracking Test')).toBeInTheDocument();
  });

  it('starts with the intro phase', () => {
    render(<EyeTrackingTestPage />);

    expect(screen.getByText('Welcome to the Eye Tracking Test')).toBeInTheDocument();
    expect(screen.getByText('Get Started')).toBeInTheDocument();
  });

  it('transitions to ready phase when Get Started is clicked', async () => {
    const user = userEvent.setup();
    render(<EyeTrackingTestPage />);

    const getStartedButton = screen.getByText('Get Started');
    await user.click(getStartedButton);

    expect(screen.getByText('Camera Setup')).toBeInTheDocument();
    expect(screen.getByText('Test Instructions')).toBeInTheDocument();
  });

  it('shows eye tracking data when received', async () => {
    const user = userEvent.setup();
    render(<EyeTrackingTestPage />);

    // Go to ready phase
    await user.click(screen.getByText('Get Started'));

    // Simulate eye position data
    await user.click(screen.getByTestId('mock-gaze-button'));

    expect(screen.getByText('Eye position detected: Yes')).toBeInTheDocument();
    expect(screen.getByText('Coordinates: (150, 200)')).toBeInTheDocument();
  });

  it('enables the Start Test button when eye position is detected', async () => {
    const user = userEvent.setup();
    render(<EyeTrackingTestPage />);

    // Go to ready phase
    await user.click(screen.getByText('Get Started'));

    // Before eye detection
    expect(screen.getByText('Waiting for eye detection...')).toBeInTheDocument();

    // Simulate eye position data
    await user.click(screen.getByTestId('mock-gaze-button'));

    // After eye detection
    expect(screen.getByText('Start Test')).toBeInTheDocument();
    expect(screen.getByText('Start Test')).not.toBeDisabled();
  });

  it('transitions to testing phase when Start Test is clicked', async () => {
    const user = userEvent.setup();
    render(<EyeTrackingTestPage />);

    // Go to ready phase
    await user.click(screen.getByText('Get Started'));

    // Simulate eye position data
    await user.click(screen.getByTestId('mock-gaze-button'));

    // Start the test
    await user.click(screen.getByText('Start Test'));

    expect(screen.getByText('Follow the Ball')).toBeInTheDocument();
    expect(screen.getByTestId('animated-ball')).toBeInTheDocument();
  });

  it('collects eye movement data during testing', async () => {
    const user = userEvent.setup();
    render(<EyeTrackingTestPage />);

    // Go to ready phase
    await user.click(screen.getByText('Get Started'));

    // Simulate eye position data
    await user.click(screen.getByTestId('mock-gaze-button'));

    // Start the test
    await user.click(screen.getByText('Start Test'));

    // Simulate ball position change
    await user.click(screen.getByTestId('simulate-position-change'));

    // Simulate eye position update
    await user.click(screen.getByTestId('mock-gaze-button'));

    // We can't directly check the internal state, but we can verify the components are rendered
    expect(screen.getByTestId('animated-ball')).toBeInTheDocument();
    expect(screen.getByTestId('eye-tracking-component')).toBeInTheDocument();
  });

  it('transitions to results phase when test completes', async () => {
    const user = userEvent.setup();
    render(<EyeTrackingTestPage />);

    // Go to ready phase
    await user.click(screen.getByText('Get Started'));

    // Simulate eye position data
    await user.click(screen.getByTestId('mock-gaze-button'));

    // Start the test
    await user.click(screen.getByText('Start Test'));

    // Simulate test completion
    await user.click(screen.getByTestId('simulate-complete'));

    expect(screen.getByText('Test Results')).toBeInTheDocument();
    expect(screen.getByText('Risk Assessment')).toBeInTheDocument();
    expect(screen.getByText('Low Risk')).toBeInTheDocument();
  });

  it('shows correct metrics in the results', async () => {
    const user = userEvent.setup();
    render(<EyeTrackingTestPage />);

    // Go through phases to results
    await user.click(screen.getByText('Get Started'));
    await user.click(screen.getByTestId('mock-gaze-button'));
    await user.click(screen.getByText('Start Test'));
    await user.click(screen.getByTestId('simulate-complete'));

    expect(screen.getByText('250ms')).toBeInTheDocument(); // averageFixationDuration
    expect(screen.getByText('1.50/sec')).toBeInTheDocument(); // saccadeFrequency
    expect(screen.getByText('25')).toBeInTheDocument(); // wiggleScore
  });

  it('allows restarting the test from results phase', async () => {
    const user = userEvent.setup();
    render(<EyeTrackingTestPage />);

    // Go through phases to results
    await user.click(screen.getByText('Get Started'));
    await user.click(screen.getByTestId('mock-gaze-button'));
    await user.click(screen.getByText('Start Test'));
    await user.click(screen.getByTestId('simulate-complete'));

    // Click take test again
    await user.click(screen.getByText('Take Test Again'));

    // Should be back at ready phase
    expect(screen.getByText('Camera Setup')).toBeInTheDocument();
    expect(screen.getByText('Test Instructions')).toBeInTheDocument();
  });

  it('allows canceling the test during testing phase', async () => {
    const user = userEvent.setup();
    render(<EyeTrackingTestPage />);

    // Go to testing phase
    await user.click(screen.getByText('Get Started'));
    await user.click(screen.getByTestId('mock-gaze-button'));
    await user.click(screen.getByText('Start Test'));

    // Cancel test
    await user.click(screen.getByText('Cancel Test'));

    // Should be back at ready phase
    expect(screen.getByText('Camera Setup')).toBeInTheDocument();
    expect(screen.getByText('Test Instructions')).toBeInTheDocument();
  });
});
