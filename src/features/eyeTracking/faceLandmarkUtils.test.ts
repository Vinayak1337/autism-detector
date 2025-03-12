// import { createFaceLandmarksDetector } from './faceLandmarkUtils';
// import * as tf from '@tensorflow/tfjs';
// import * as faceLandmarksDetection from '@tensorflow-models/face-landmarks-detection';

// // Mock the modules
// jest.mock('@tensorflow/tfjs', () => ({
//   ready: jest.fn().mockResolvedValue(undefined),
//   setBackend: jest.fn().mockResolvedValue(true),
//   getBackend: jest.fn().mockReturnValue('webgl'),
//   version_core: '4.22.0',
// }));

// jest.mock('@tensorflow-models/face-landmarks-detection', () => ({
//   SupportedModels: {
//     MediaPipeFaceMesh: 'MediaPipeFaceMesh',
//   },
//   createDetector: jest.fn(),
// }));

// describe('faceLandmarkUtils', () => {
//   beforeEach(() => {
//     jest.clearAllMocks();
//   });

//   describe('createFaceLandmarksDetector', () => {
//     it('loads TensorFlow.js correctly', async () => {
//       // Create a mock detector that responds with expected data
//       const mockDetector = {
//         estimateFaces: jest.fn().mockResolvedValue([
//           {
//             keypoints: [
//               { x: 100, y: 100, name: 'leftEye' },
//               { x: 200, y: 100, name: 'rightEye' },
//             ],
//             box: {
//               xMin: 50,
//               yMin: 50,
//               width: 200,
//               height: 200,
//               xMax: 250,
//               yMax: 250,
//             },
//           },
//         ]),
//       };

//       // Mock successful detector creation
//       (faceLandmarksDetection.createDetector as jest.Mock).mockResolvedValue(mockDetector);

//       // Call our function
//       const detector = await createFaceLandmarksDetector();

//       // Verify TensorFlow.js was properly initialized
//       expect(tf.ready).toHaveBeenCalled();
//       expect(tf.getBackend).toHaveBeenCalled();

//       // Verify detector creation with the correct parameters
//       expect(faceLandmarksDetection.createDetector).toHaveBeenCalledWith(
//         faceLandmarksDetection.SupportedModels.MediaPipeFaceMesh,
//         expect.objectContaining({
//           runtime: 'tfjs',
//           refineLandmarks: false,
//           maxFaces: 1,
//         })
//       );

//       // Verify our function returns the detector
//       expect(detector).toBe(mockDetector);
//     });

//     it('falls back to CPU when WebGL fails', async () => {
//       // Mock WebGL failure
//       const firstCall = true;
//       (faceLandmarksDetection.createDetector as jest.Mock).mockImplementation(() => {
//         if (firstCall) {
//           // First call fails
//           (faceLandmarksDetection.createDetector as jest.Mock).mockImplementation = () =>
//             Promise.resolve({ estimateFaces: jest.fn() });
//           return Promise.reject(new Error('WebGL context lost'));
//         } else {
//           // Second call succeeds after switching to CPU
//           return Promise.resolve({ estimateFaces: jest.fn() });
//         }
//       });

//       // Call our function
//       await createFaceLandmarksDetector();

//       // Verify it tried to fall back to CPU
//       expect(tf.setBackend).toHaveBeenCalledWith('cpu');
//     });

//     it('creates a dummy detector when everything fails', async () => {
//       // Make all detector creation attempts fail
//       (faceLandmarksDetection.createDetector as jest.Mock).mockRejectedValue(
//         new Error('Failed to create detector')
//       );
//       (tf.setBackend as jest.Mock).mockRejectedValue(new Error('Failed to set backend'));

//       // Call our function
//       const detector = await createFaceLandmarksDetector();

//       // Verify we got a dummy detector
//       expect(detector).toBeDefined();
//       expect(detector.estimateFaces).toBeDefined();

//       // Test that the dummy detector returns mock data
//       const mockVideo = {
//         videoWidth: 640,
//         videoHeight: 480,
//       } as unknown as HTMLVideoElement;

//       const result = await detector.estimateFaces(mockVideo);

//       // Verify the dummy detector returns the expected format
//       expect(result).toHaveLength(1);
//       expect(result[0].keypoints).toHaveLength(2);
//       expect(result[0].box).toBeDefined();
//     });
//   });
// });
