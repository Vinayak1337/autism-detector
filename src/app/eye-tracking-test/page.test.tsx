import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import EyeTrackingTestPage from './page';
import { EyeTrackingComponent } from '@/features/eyeTracking/EyeTrackingComponent';

// Mock the EyeTrackingComponent
jest.mock('@/features/eyeTracking/EyeTrackingComponent', () => ({
  EyeTrackingComponent: jest.fn().mockImplementation(({ onGazeData }) => (
    <div data-testid="eye-tracking-component">
      <button data-testid="mock-gaze-button" onClick={() => onGazeData && onGazeData(150, 200)}>
        Simulate Gaze Data
      </button>
    </div>
  )),
}));

describe('EyeTrackingTestPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the eye tracking test title', () => {
    render(<EyeTrackingTestPage />);
    expect(screen.getByText('Eye Tracking Test')).toBeInTheDocument();
  });

  it('renders instructions initially', () => {
    render(<EyeTrackingTestPage />);

    expect(screen.getByText('Instructions')).toBeInTheDocument();
    expect(
      screen.getByText('This test will track your eye movements using your webcam')
    ).toBeInTheDocument();
    expect(screen.getByText(/Position your face/)).toBeInTheDocument();
  });

  it('hides instructions when "Got it" button is clicked', async () => {
    const user = userEvent.setup();
    render(<EyeTrackingTestPage />);

    const gotItButton = screen.getByText('Got it');
    await user.click(gotItButton);

    expect(screen.queryByText('Instructions')).not.toBeInTheDocument();
  });

  it('renders the EyeTrackingComponent with correct props', () => {
    render(<EyeTrackingTestPage />);

    expect(EyeTrackingComponent).toHaveBeenCalledWith(
      expect.objectContaining({
        width: '100%',
        height: '100%',
        options: {
          drawLandmarks: true,
          drawPath: true,
          pathColor: 'rgba(255, 0, 0, 0.5)',
          pathLength: 100,
        },
      }),
      expect.anything()
    );
  });

  it('displays gaze data when received from EyeTrackingComponent', async () => {
    const user = userEvent.setup();
    render(<EyeTrackingTestPage />);

    // Initially, gaze data should show placeholder
    expect(screen.getByText('X Coordinate')).toBeInTheDocument();
    expect(screen.getByText('-')).toBeInTheDocument();

    // Simulate gaze data being sent from the component
    const gazeButton = screen.getByTestId('mock-gaze-button');
    await user.click(gazeButton);

    // Now we should see the coordinates
    expect(screen.getByText('X Coordinate')).toBeInTheDocument();
    expect(screen.getByText('150')).toBeInTheDocument();
    expect(screen.getByText('Y Coordinate')).toBeInTheDocument();
    expect(screen.getByText('200')).toBeInTheDocument();
  });

  it('renders the about section with information', () => {
    render(<EyeTrackingTestPage />);

    expect(screen.getByText('About Eye Tracking')).toBeInTheDocument();
    expect(screen.getByText(/Eye tracking technology uses computer vision/)).toBeInTheDocument();
    expect(screen.getByText(/Research has shown that individuals with autism/)).toBeInTheDocument();
    expect(
      screen.getByText(/This test uses TensorFlow.js and the MediaPipe FaceMesh model/)
    ).toBeInTheDocument();
  });
});
