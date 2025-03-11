import * as faceLandmarksDetection from '@tensorflow-models/face-landmarks-detection';
import { FaceLandmarksDetector } from '@tensorflow-models/face-landmarks-detection/dist/types';

/**
 * Creates a face landmarks detector using TensorFlow.js
 * @returns A promise that resolves to a face landmarks detector
 */
export async function createFaceLandmarksDetector(): Promise<FaceLandmarksDetector> {
  try {
    // Create detector with MediaPipe FaceMesh model
    const detector = await faceLandmarksDetection.createDetector(
      faceLandmarksDetection.SupportedModels.MediaPipeFaceMesh,
      {
        runtime: 'tfjs',
        refineLandmarks: true,
        maxFaces: 1,
      }
    );
    return detector;
  } catch (error) {
    console.error('Error creating face landmarks detector:', error);
    throw error;
  }
}

// Export type for easier imports
export type { FaceLandmarksDetector };
