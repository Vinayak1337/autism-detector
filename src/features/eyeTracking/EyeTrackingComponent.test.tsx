import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { EyeTrackingComponent } from './EyeTrackingComponent';
import { useEyeTracking } from './useEyeTracking';

// Mock the useEyeTracking hook
jest.mock('./useEyeTracking', () => ({
  useEyeTracking: jest.fn(),
}));

describe('EyeTrackingComponent', () => {
  const mockStartTracking = jest.fn();
  const mockStopTracking = jest.fn();
  const mockWebcamRef = { current: document.createElement('video') };
  const mockCanvasRef = { current: document.createElement('canvas') };

  // Default mock implementation
  beforeEach(() => {
    (useEyeTracking as jest.Mock).mockReturnValue({
      isModelLoading: false,
      isWebcamLoading: false,
      isTracking: false,
      error: null,
      webcamRef: mockWebcamRef,
      canvasRef: mockCanvasRef,
      startTracking: mockStartTracking,
      stopTracking: mockStopTracking,
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('renders loading state while model is loading', () => {
    (useEyeTracking as jest.Mock).mockReturnValue({
      isModelLoading: true,
      isWebcamLoading: false,
      isTracking: false,
      error: null,
      webcamRef: mockWebcamRef,
      canvasRef: mockCanvasRef,
      startTracking: mockStartTracking,
      stopTracking: mockStopTracking,
    });

    render(<EyeTrackingComponent />);
    expect(screen.getByText('Loading eye tracking model...')).toBeInTheDocument();
  });

  it('renders loading state while webcam is loading', () => {
    (useEyeTracking as jest.Mock).mockReturnValue({
      isModelLoading: false,
      isWebcamLoading: true,
      isTracking: false,
      error: null,
      webcamRef: mockWebcamRef,
      canvasRef: mockCanvasRef,
      startTracking: mockStartTracking,
      stopTracking: mockStopTracking,
    });

    render(<EyeTrackingComponent />);
    expect(screen.getByText('Setting up webcam...')).toBeInTheDocument();
  });

  it('renders error message when an error occurs', () => {
    const errorMessage = 'Failed to access camera';
    (useEyeTracking as jest.Mock).mockReturnValue({
      isModelLoading: false,
      isWebcamLoading: false,
      isTracking: false,
      error: errorMessage,
      webcamRef: mockWebcamRef,
      canvasRef: mockCanvasRef,
      startTracking: mockStartTracking,
      stopTracking: mockStopTracking,
    });

    render(<EyeTrackingComponent />);
    expect(screen.getByText(errorMessage)).toBeInTheDocument();
    expect(screen.getByText('Reload')).toBeInTheDocument();
  });

  it('renders start tracking button when ready', () => {
    render(<EyeTrackingComponent />);
    expect(screen.getByText('Start Tracking')).toBeInTheDocument();
  });

  it('renders stop tracking button when tracking', () => {
    (useEyeTracking as jest.Mock).mockReturnValue({
      isModelLoading: false,
      isWebcamLoading: false,
      isTracking: true,
      error: null,
      webcamRef: mockWebcamRef,
      canvasRef: mockCanvasRef,
      startTracking: mockStartTracking,
      stopTracking: mockStopTracking,
    });

    render(<EyeTrackingComponent />);
    expect(screen.getByText('Stop Tracking')).toBeInTheDocument();
  });

  it('calls startTracking when start button is clicked', async () => {
    const user = userEvent.setup();
    render(<EyeTrackingComponent />);

    const startButton = screen.getByText('Start Tracking');
    await user.click(startButton);

    expect(mockStartTracking).toHaveBeenCalled();
  });

  it('calls stopTracking when stop button is clicked', async () => {
    const user = userEvent.setup();
    (useEyeTracking as jest.Mock).mockReturnValue({
      isModelLoading: false,
      isWebcamLoading: false,
      isTracking: true,
      error: null,
      webcamRef: mockWebcamRef,
      canvasRef: mockCanvasRef,
      startTracking: mockStartTracking,
      stopTracking: mockStopTracking,
    });

    render(<EyeTrackingComponent />);

    const stopButton = screen.getByText('Stop Tracking');
    await user.click(stopButton);

    expect(mockStopTracking).toHaveBeenCalled();
  });

  it('renders permission denied message when camera access is denied', async () => {
    const mockSetIsPermissionGranted = jest.fn();
    jest.spyOn(React, 'useState').mockImplementation(() => [false, mockSetIsPermissionGranted]);

    render(<EyeTrackingComponent />);

    await waitFor(() => {
      expect(screen.getByText('Camera Access Required')).toBeInTheDocument();
      expect(screen.getByText(/Please allow camera access/)).toBeInTheDocument();
    });
  });

  it('passes options to useEyeTracking', () => {
    const options = {
      drawLandmarks: true,
      drawPath: true,
      pathColor: 'rgba(255, 0, 0, 0.5)',
      pathLength: 100,
    };

    render(<EyeTrackingComponent options={options} />);

    expect(useEyeTracking).toHaveBeenCalledWith(
      expect.objectContaining({
        drawLandmarks: true,
        drawPath: true,
        pathColor: 'rgba(255, 0, 0, 0.5)',
        pathLength: 100,
      })
    );
  });

  it('applies custom width and height styles', () => {
    const { container } = render(<EyeTrackingComponent width="500px" height="300px" />);
    const mainDiv = container.firstChild as HTMLElement;

    expect(mainDiv).toHaveStyle({
      width: '500px',
      height: '300px',
    });
  });
});
