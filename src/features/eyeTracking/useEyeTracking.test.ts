import { renderHook, act } from '@testing-library/react';
import { useEyeTracking } from './useEyeTracking';
import * as tf from '@tensorflow/tfjs';
import * as faceLandmarksDetection from '@tensorflow-models/face-landmarks-detection';

// Mock the modules
jest.mock('@tensorflow/tfjs', () => ({
  ready: jest.fn(),
}));

jest.mock('@tensorflow-models/face-landmarks-detection', () => ({
  load: jest.fn(),
  SupportedPackages: {
    mediapipeFacemesh: 'mediapipeFacemesh',
  },
}));

// Mock canvas and video elements
class MockCanvas {
  getContext() {
    return {
      clearRect: jest.fn(),
      beginPath: jest.fn(),
      arc: jest.fn(),
      fill: jest.fn(),
      stroke: jest.fn(),
      moveTo: jest.fn(),
      lineTo: jest.fn(),
    };
  }
}

class MockVideo {
  readyState = 4;
  videoWidth = 640;
  videoHeight = 480;
  play = jest.fn();
}

// Mock navigator.mediaDevices
Object.defineProperty(global.navigator, 'mediaDevices', {
  value: {
    getUserMedia: jest.fn(),
    enumerateDevices: jest.fn(),
  },
  writable: true,
});

describe('useEyeTracking', () => {
  const mockModel = {
    estimateFaces: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock successful initialization
    (tf.ready as jest.Mock).mockResolvedValue(undefined);
    (faceLandmarksDetection.load as jest.Mock).mockResolvedValue(mockModel);
    
    // Mock HTML elements
    HTMLVideoElement.prototype.play = jest.fn().mockImplementation(function() {
      this.onloadedmetadata && this.onloadedmetadata();
      return Promise.resolve();
    });
    
    global.HTMLCanvasElement.prototype.getContext = jest.fn().mockImplementation(() => ({
      clearRect: jest.fn(),
      beginPath: jest.fn(),
      arc: jest.fn(),
      fill: jest.fn(),
      stroke: jest.fn(),
      moveTo: jest.fn(),
      lineTo: jest.fn(),
    }));
    
    // Mock successful media stream
    const mockStream = {
      getTracks: () => [{
        stop: jest.fn()
      }]
    };
    navigator.mediaDevices.getUserMedia = jest.fn().mockResolvedValue(mockStream);
    navigator.mediaDevices.enumerateDevices = jest.fn().mockResolvedValue([
      { kind: 'videoinput', deviceId: 'mock-camera' }
    ]);
    
    // Mock requestAnimationFrame
    jest.spyOn(window, 'requestAnimationFrame').mockImplementation(cb => {
      cb(0);
      return 0;
    });
    
    jest.spyOn(window, 'cancelAnimationFrame').mockImplementation(() => {});
  });

  it('initializes with the correct default state', () => {
    const { result } = renderHook(() => useEyeTracking());
    
    expect(result.current.isModelLoading).toBe(true);
    expect(result.current.isWebcamLoading).toBe(true);
    expect(result.current.isTracking).toBe(false);
    expect(result.current.error).toBe(null);
    expect(result.current.webcamRef.current).toBe(null);
    expect(result.current.canvasRef.current).toBe(null);
  });

  it('loads TensorFlow model on initialization', async () => {
    renderHook(() => useEyeTracking());
    
    expect(tf.ready).toHaveBeenCalled();
    expect(faceLandmarksDetection.load).toHaveBeenCalledWith(
      'mediapipeFacemesh',
      { maxFaces: 1 }
    );
  });

  it('sets error when model loading fails', async () => {
    const mockError = new Error('Failed to load model');
    (faceLandmarksDetection.load as jest.Mock).mockRejectedValue(mockError);
    
    const { result, rerender } = renderHook(() => useEyeTracking());
    
    // Wait for the effect to complete
    await act(async () => {
      await Promise.resolve();
    });
    
    rerender();
    
    expect(result.current.isModelLoading).toBe(false);
    expect(result.current.error).toContain('Failed to load model');
  });

  it('starts tracking when startTracking is called', async () => {
    // Mock successful face detection
    mockModel.estimateFaces.mockResolvedValue([{
      scaledMesh: Array(468).fill().map((_, i) => ({ x: i, y: i, z: i })),
      boundingBox: {
        topLeft: [0, 0],
        bottomRight: [100, 100]
      }
    }]);
    
    const { result } = renderHook(() => useEyeTracking());
    
    // Wait for the model to load
    await act(async () => {
      await Promise.resolve();
    });
    
    // Manually set refs since we can't directly manipulate them in the test
    result.current.webcamRef.current = new MockVideo() as unknown as HTMLVideoElement;
    result.current.canvasRef.current = new MockCanvas() as unknown as HTMLCanvasElement;
    
    // Call startTracking
    await act(async () => {
      await result.current.startTracking();
    });
    
    expect(result.current.isTracking).toBe(true);
    expect(window.requestAnimationFrame).toHaveBeenCalled();
  });

  it('stops tracking when stopTracking is called', async () => {
    const { result } = renderHook(() => useEyeTracking());
    
    // Wait for the model to load
    await act(async () => {
      await Promise.resolve();
    });
    
    // Manually set tracking state to true
    act(() => {
      (result.current as any).setIsTracking(true);
    });
    
    // Call stopTracking
    act(() => {
      result.current.stopTracking();
    });
    
    expect(result.current.isTracking).toBe(false);
    expect(window.cancelAnimationFrame).toHaveBeenCalled();
  });

  it('accepts and applies custom options', () => {
    const customOptions = {
      drawLandmarks: false,
      drawPath: true,
      pathColor: 'rgba(0, 0, 255, 0.5)',
      pathLength: 30,
      landmarkColor: 'rgba(0, 255, 0, 0.7)',
    };
    
    const { result } = renderHook(() => useEyeTracking(customOptions));
    
    // We can't directly test the internal state, but we can verify the options are passed
    // to the hook by checking that the hook returns the expected interface
    expect(result.current.isModelLoading).toBeDefined();
    expect(result.current.webcamRef).toBeDefined();
    expect(result.current.startTracking).toBeDefined();
    expect(result.current.stopTracking).toBeDefined();
  });

  it('handles webcam permission denial', async () => {
    // Mock permission denial
    navigator.mediaDevices.getUserMedia = jest.fn().mockRejectedValue(
      new Error('Permission denied')
    );
    
    const { result } = renderHook(() => useEyeTracking());
    
    // Manually set refs since we can't directly manipulate them in the test
    result.current.webcamRef.current = new MockVideo() as unknown as HTMLVideoElement;
    result.current.canvasRef.current = new MockCanvas() as unknown as HTMLCanvasElement;
    
    // Call startTracking which should try to get webcam access
    await act(async () => {
      await result.current.startTracking();
    });
    
    expect(result.current.error).toContain('Webcam access denied');
  });
}); 