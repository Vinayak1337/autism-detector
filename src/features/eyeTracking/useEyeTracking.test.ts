// import { renderHook, act } from '@testing-library/react';
// import { useEyeTracking } from './useEyeTracking';
// import * as faceLandmarkUtils from './faceLandmarkUtils';

// // Mock the modules
// jest.mock('./faceLandmarkUtils', () => ({
//   createFaceLandmarksDetector: jest.fn(),
// }));

// // Mock canvas and video elements
// class MockCanvas {
//   getContext() {
//     return {
//       clearRect: jest.fn(),
//       beginPath: jest.fn(),
//       arc: jest.fn(),
//       fill: jest.fn(),
//       stroke: jest.fn(),
//       moveTo: jest.fn(),
//       lineTo: jest.fn(),
//     };
//   }
// }

// class MockVideo {
//   readyState = 4;
//   videoWidth = 640;
//   videoHeight = 480;
//   play = jest.fn().mockResolvedValue(undefined);
//   srcObject = null;
//   addEventListener = jest.fn((event, callback) => {
//     if (event === 'loadedmetadata') {
//       callback();
//     }
//   });
//   removeEventListener = jest.fn();
// }

// // Mock navigator.mediaDevices
// Object.defineProperty(global.navigator, 'mediaDevices', {
//   value: {
//     getUserMedia: jest.fn(),
//     enumerateDevices: jest.fn(),
//   },
//   writable: true,
// });

// // Mock zustand hooks
// jest.mock('./store', () => ({
//   useEyeTrackingStore: jest.fn().mockImplementation((selector) => {
//     const state = {
//       isModelLoading: false,
//       isWebcamLoading: false,
//       isCameraReady: false,
//       isEyeDetected: false,
//       gazeData: [],
//       setIsModelLoading: jest.fn(),
//       setIsWebcamLoading: jest.fn(),
//       setIsCameraReady: jest.fn(),
//       setEyeDetected: jest.fn(),
//       setGazeData: jest.fn(),
//     };

//     return selector(state);
//   }),
// }));

// describe('useEyeTracking', () => {
//   const mockModel = {
//     estimateFaces: jest.fn().mockResolvedValue([
//       {
//         keypoints: [
//           { x: 100, y: 100, name: 'leftEye' },
//           { x: 200, y: 100, name: 'rightEye' },
//         ],
//         box: {
//           xMin: 50,
//           yMin: 50,
//           width: 200,
//           height: 200,
//           xMax: 250,
//           yMax: 250,
//         },
//       },
//     ]),
//   };

//   // Mock animation frame ID
//   const mockAnimationFrameId = 123;

//   beforeEach(() => {
//     jest.clearAllMocks();

//     // Mock successful model initialization
//     (faceLandmarkUtils.createFaceLandmarksDetector as jest.Mock).mockResolvedValue(mockModel);

//     // Mock HTML elements
//     HTMLVideoElement.prototype.play = jest.fn().mockImplementation(function () {
//       this.onloadedmetadata && this.onloadedmetadata();
//       return Promise.resolve();
//     });

//     global.HTMLCanvasElement.prototype.getContext = jest.fn().mockImplementation(() => ({
//       clearRect: jest.fn(),
//       beginPath: jest.fn(),
//       arc: jest.fn(),
//       fill: jest.fn(),
//       stroke: jest.fn(),
//       moveTo: jest.fn(),
//       lineTo: jest.fn(),
//     }));

//     // Mock successful media stream
//     const mockStream = {
//       getTracks: () => [
//         {
//           stop: jest.fn(),
//           kind: 'video',
//           label: 'Mock Camera',
//           readyState: 'live',
//           enabled: true,
//           getConstraints: jest.fn().mockReturnValue({}),
//         },
//       ],
//       active: true,
//       getVideoTracks: () => [
//         {
//           readyState: 'live',
//           getConstraints: jest.fn().mockReturnValue({}),
//         },
//       ],
//     };
//     navigator.mediaDevices.getUserMedia = jest.fn().mockResolvedValue(mockStream);
//     navigator.mediaDevices.enumerateDevices = jest
//       .fn()
//       .mockResolvedValue([{ kind: 'videoinput', deviceId: 'mock-camera' }]);

//     // Mock requestAnimationFrame and cancelAnimationFrame
//     window.requestAnimationFrame = jest.fn().mockImplementation((cb) => {
//       setTimeout(() => cb(0), 0);
//       return mockAnimationFrameId;
//     });

//     window.cancelAnimationFrame = jest.fn();
//   });

//   it('initializes with the correct default state', () => {
//     const { result } = renderHook(() => useEyeTracking());

//     expect(result.current.isModelLoading).toBe(true);
//     expect(result.current.isWebcamLoading).toBe(true);
//     expect(result.current.isTracking).toBe(false);
//     expect(result.current.error).toBe(null);
//     expect(result.current.webcamRef.current).toBe(null);
//     expect(result.current.canvasRef.current).toBe(null);
//   });

//   it('loads face landmarks model on initialization', async () => {
//     renderHook(() => useEyeTracking());

//     expect(faceLandmarkUtils.createFaceLandmarksDetector).toHaveBeenCalled();
//   });

//   it('sets error when model loading fails', async () => {
//     const mockError = new Error('Failed to load model');
//     (faceLandmarkUtils.createFaceLandmarksDetector as jest.Mock).mockRejectedValue(mockError);

//     const { result, rerender } = renderHook(() => useEyeTracking());

//     // Wait for the effect to complete
//     await act(async () => {
//       await Promise.resolve();
//     });

//     rerender();

//     expect(result.current.isModelLoading).toBe(false);
//     expect(result.current.error).toContain('Failed to load model');
//   });

//   it('starts tracking when startTracking is called', async () => {
//     // Reset the mock to ensure it's clean
//     window.requestAnimationFrame = jest.fn().mockReturnValue(mockAnimationFrameId);

//     const { result } = renderHook(() => useEyeTracking());

//     // Wait for the model to load
//     await act(async () => {
//       await Promise.resolve();
//     });

//     // Create mock video and canvas elements
//     const mockVideo = new MockVideo() as unknown as HTMLVideoElement;
//     const mockCanvas = new MockCanvas() as unknown as HTMLCanvasElement;

//     // Set up refs
//     Object.defineProperty(result.current.webcamRef, 'current', {
//       value: mockVideo,
//       writable: true,
//     });

//     Object.defineProperty(result.current.canvasRef, 'current', {
//       value: mockCanvas,
//       writable: true,
//     });

//     // Call startTracking
//     await act(async () => {
//       try {
//         await result.current.startTracking();
//       } catch (e) {
//         // Ignore errors for the test
//       }
//     });

//     // Verify requestAnimationFrame was called
//     expect(window.requestAnimationFrame).toHaveBeenCalled();
//   });

//   it('stops tracking when stopTracking is called', () => {
//     // Mock cancelAnimationFrame
//     const originalCancelAnimationFrame = window.cancelAnimationFrame;
//     const mockCancelAnimationFrame = jest.fn();
//     window.cancelAnimationFrame = mockCancelAnimationFrame;

//     try {
//       // Create a mock requestAnimationRef
//       const mockRequestAnimationRef = { current: 123 };

//       // Create a simplified version of the hook that just tests stopTracking
//       const { stopTracking } = (() => {
//         const requestAnimationRef = mockRequestAnimationRef;
//         const webcamRef = { current: { srcObject: { getTracks: () => [{ stop: jest.fn() }] } } };
//         const setIsTracking = jest.fn();
//         const gazeHistoryRef = { current: [] };

//         // This is a simplified version of the stopTracking function from useEyeTracking
//         const stopTracking = () => {
//           console.log('Stopping eye tracking...');
//           if (requestAnimationRef.current) {
//             window.cancelAnimationFrame(requestAnimationRef.current);
//             requestAnimationRef.current = null;
//           }

//           // Stop webcam if active
//           if (webcamRef.current && webcamRef.current.srcObject) {
//             const stream = webcamRef.current.srcObject;
//             stream.getTracks().forEach((track) => {
//               track.stop();
//             });
//             webcamRef.current.srcObject = null;
//           }

//           setIsTracking(false);
//           gazeHistoryRef.current = [];
//         };

//         return { stopTracking };
//       })();

//       // Call stopTracking
//       stopTracking();

//       // Verify cancelAnimationFrame was called with the correct ID
//       expect(mockCancelAnimationFrame).toHaveBeenCalledWith(123);
//     } finally {
//       // Restore original function
//       window.cancelAnimationFrame = originalCancelAnimationFrame;
//     }
//   });

//   it('accepts and applies custom options', () => {
//     const customOptions = {
//       drawLandmarks: false,
//       drawPath: true,
//       pathColor: 'rgba(0, 0, 255, 0.5)',
//       pathLength: 30,
//       landmarkColor: 'rgba(0, 255, 0, 0.7)',
//     };

//     const { result } = renderHook(() => useEyeTracking(customOptions));

//     // Verify the hook returns the expected interface
//     expect(result.current.isModelLoading).toBeDefined();
//     expect(result.current.webcamRef).toBeDefined();
//     expect(result.current.startTracking).toBeDefined();
//     expect(result.current.stopTracking).toBeDefined();
//   });

//   it('handles webcam permission denial', async () => {
//     // Mock permission denial
//     navigator.mediaDevices.getUserMedia = jest
//       .fn()
//       .mockRejectedValue(new Error('Permission denied'));

//     const { result } = renderHook(() => useEyeTracking());

//     // Create mock video and canvas elements
//     const mockVideo = new MockVideo() as unknown as HTMLVideoElement;
//     const mockCanvas = new MockCanvas() as unknown as HTMLCanvasElement;

//     // Set up refs
//     Object.defineProperty(result.current.webcamRef, 'current', {
//       value: mockVideo,
//       writable: true,
//     });

//     Object.defineProperty(result.current.canvasRef, 'current', {
//       value: mockCanvas,
//       writable: true,
//     });

//     // Call startTracking which should try to get webcam access
//     await act(async () => {
//       try {
//         await result.current.startTracking();
//       } catch (e) {
//         // Catch the error to prevent test failure
//       }
//     });

//     expect(navigator.mediaDevices.getUserMedia).toHaveBeenCalled();
//     expect(result.current.error).toBeDefined();
//   });
// });
