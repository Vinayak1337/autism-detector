'use client';

// Define types first so they're available for import
export interface FaceLandmarksDetector {
  estimateFaces(image: HTMLVideoElement | HTMLImageElement | HTMLCanvasElement): Promise<unknown[]>;
}

// Declare window properties
declare global {
  interface Window {
    _useDummyDetector?: boolean;
    _dummyDetectorStable?: boolean;
  }
}

// Define face landmarks detection module type
interface FaceLandmarksDetectionModule {
  SupportedModels: {
    MediaPipeFaceMesh: string;
  };
  createDetector(model: string, config?: Record<string, unknown>): Promise<FaceLandmarksDetector>;
}

// Variable to track if we've warned about server-side usage
let hasWarnedAboutServer = false;

// Helper function to check if we're in a browser environment
const isBrowser = () => typeof window !== 'undefined' && typeof navigator !== 'undefined';

/**
 * Dynamically loads TensorFlow.js using proper npm imports
 */
async function ensureTensorFlowLoaded() {
  // Load TensorFlow.js dynamically only in browser
  if (!isBrowser()) {
    throw new Error('TensorFlow.js can only be loaded in a browser environment');
  }

  try {
    console.log('Loading TensorFlow.js from npm package...');
    const tf = await import('@tensorflow/tfjs');
    console.log('TensorFlow.js loaded successfully:', tf.version_core || 'unknown version');

    // Attach TensorFlow to window object
    if (typeof window !== 'undefined') {
      // @ts-ignore - Attaching to window for debugging
      window.tf = tf;
      console.log('Attached TensorFlow.js to window object');
    }

    // Initialize TensorFlow
    await tf.ready();
    console.log('TensorFlow.js ready. Using backend:', tf.getBackend());

    // Try to use WebGL backend if possible
    if (tf.getBackend() !== 'webgl') {
      try {
        await tf.setBackend('webgl');
        console.log('Switched to WebGL backend:', tf.getBackend());
      } catch (e) {
        const errorMessage = e instanceof Error ? e.message : String(e);
        console.warn(
          'Could not switch to WebGL backend, using:',
          tf.getBackend(),
          'Error:',
          errorMessage
        );
      }
    }

    return tf;
  } catch (err) {
    console.error('Failed to load TensorFlow.js:', err);
    throw err;
  }
}

/**
 * Dynamically loads face-landmarks-detection module
 */
async function loadFaceLandmarksDetection(): Promise<FaceLandmarksDetectionModule> {
  try {
    console.log('Loading face-landmarks-detection module...');
    const faceLandmarksDetection = await import('@tensorflow-models/face-landmarks-detection');
    console.log('Face landmarks detection module loaded successfully');
    return faceLandmarksDetection as unknown as FaceLandmarksDetectionModule;
  } catch (err) {
    console.error('Error importing face-landmarks-detection module:', err);
    throw err;
  }
}

/**
 * Creates a face landmarks detector using TensorFlow.js
 * Only imports the libraries when actually called, ensuring server-side safety
 */
export async function createFaceLandmarksDetector(): Promise<FaceLandmarksDetector> {
  if (!isBrowser()) {
    // Only show warning once to avoid console spam
    if (!hasWarnedAboutServer) {
      console.warn('Face landmarks detector can only be created in a browser environment');
      hasWarnedAboutServer = true;
    }

    // Return a dummy detector that doesn't do anything when called in SSR
    return {
      estimateFaces: async () => {
        console.warn('Attempted to use face detector in non-browser environment');
        return [];
      },
    };
  }

  // Check if we should use the dummy detector
  if (typeof window !== 'undefined' && window._useDummyDetector) {
    console.log('Using dummy detector as requested by debug setting');
    return createDummyDetector();
  }

  try {
    console.log('Dynamic imports starting...', new Date().toISOString());

    // Load TensorFlow.js using npm package
    const tf = await ensureTensorFlowLoaded();

    // Load face landmarks detection module
    const faceLandmarksDetection = await loadFaceLandmarksDetection();

    // Create detector with MediaPipe FaceMesh model
    console.log('Creating face detector...');

    // IMPORTANT: Always use tfjs runtime to avoid FaceMesh constructor issues
    const modelOptions = {
      runtime: 'tfjs', // Never use 'mediapipe' runtime as it causes constructor issues
      refineLandmarks: false, // Don't need refined landmarks for basic eye tracking
      maxFaces: 1, // Only track one face to improve performance
      scoreThreshold: 0.2, // Lower the detection threshold (default is 0.5)
      enableFaceGeometry: false, // Disable additional geometry calculations for better performance
    };

    try {
      console.log('Creating face landmarks detector with options:', JSON.stringify(modelOptions));
      const detector = await faceLandmarksDetection.createDetector(
        faceLandmarksDetection.SupportedModels.MediaPipeFaceMesh,
        modelOptions
      );

      console.log('Face detector created successfully');
      return detector;
    } catch (modelError) {
      console.warn('Failed to create detector with standard options:', modelError);

      // Try with CPU backend as fallback with simpler config
      try {
        console.log('Falling back to CPU backend...');
        await tf.setBackend('cpu');
        console.log('Switched to CPU backend, trying again...');

        // Try with even more basic options for CPU
        const cpuModelOptions = {
          runtime: 'tfjs',
          maxFaces: 1,
          shouldLoadIrisModel: false, // Disable iris model to reduce complexity
          scoreThreshold: 0.1, // Even lower threshold for CPU mode
        };

        console.log('Creating CPU-based detector with options:', JSON.stringify(cpuModelOptions));
        const cpuDetector = await faceLandmarksDetection.createDetector(
          faceLandmarksDetection.SupportedModels.MediaPipeFaceMesh,
          cpuModelOptions
        );

        console.log('CPU-based detector created successfully');
        return cpuDetector;
      } catch (fallbackError) {
        console.error('All detector creation approaches failed:', fallbackError);
        throw fallbackError;
      }
    }
  } catch (error) {
    console.error('Error creating face landmarks detector:', error);

    // Create a dummy detector as last resort
    console.log('Creating dummy detector to allow application to continue');
    return createDummyDetector();
  }
}

/**
 * Creates a dummy detector that returns mock face data
 * Used as fallback when real detection fails
 */
function createDummyDetector(): FaceLandmarksDetector {
  console.log('Creating dummy face detector as fallback');

  // Store stable coordinates to avoid jitter between frames
  let stableCoords = {
    leftEyeX: 0,
    leftEyeY: 0,
    rightEyeX: 0,
    rightEyeY: 0,
    noseX: 0,
    noseY: 0,
    mouthX: 0,
    mouthY: 0,
  };

  let frameCount = 0;
  const STABLE_MODE = typeof window !== 'undefined' && window._dummyDetectorStable;

  if (STABLE_MODE) {
    console.log('Dummy detector in STABLE mode - will produce consistent landmarks');
  }

  return {
    estimateFaces: async (image) => {
      // Get image dimensions if possible
      let width = 640;
      let height = 480;

      if (image) {
        width =
          (image as HTMLImageElement).width || (image as HTMLVideoElement).videoWidth || width;

        height =
          (image as HTMLImageElement).height || (image as HTMLVideoElement).videoHeight || height;
      }

      // Only log dimensions occasionally to avoid console spam
      if (frameCount % 100 === 0) {
        console.log('Using dummy detector with dimensions:', { width, height, frameCount });
      }

      frameCount++;

      // First time initialization of stable coordinates
      if (frameCount === 1 || !STABLE_MODE) {
        stableCoords = {
          leftEyeX: width * 0.35,
          leftEyeY: height * 0.4,
          rightEyeX: width * 0.65,
          rightEyeY: height * 0.4,
          noseX: width * 0.5,
          noseY: height * 0.55,
          mouthX: width * 0.5,
          mouthY: height * 0.7,
        };
      }

      // In stable mode, we always return the same coordinates
      // In normal mode, we add small random movements to simulate real tracking
      const jitter = STABLE_MODE ? 0 : 5;
      const getCoord = (base: number) => base + (STABLE_MODE ? 0 : (Math.random() - 0.5) * jitter);

      // Return fake face data with eye landmarks
      return [
        {
          keypoints: [
            {
              x: getCoord(stableCoords.leftEyeX),
              y: getCoord(stableCoords.leftEyeY),
              name: 'leftEye',
            },
            {
              x: getCoord(stableCoords.rightEyeX),
              y: getCoord(stableCoords.rightEyeY),
              name: 'rightEye',
            },
            // Add more keypoints to make detection more robust
            {
              x: getCoord(stableCoords.noseX),
              y: getCoord(stableCoords.noseY),
              name: 'nose',
            },
            {
              x: getCoord(stableCoords.mouthX),
              y: getCoord(stableCoords.mouthY),
              name: 'mouth',
            },
          ],
          box: {
            xMin: width * 0.25,
            yMin: height * 0.2,
            width: width * 0.5,
            height: height * 0.6,
            xMax: width * 0.75,
            yMax: height * 0.8,
          },
        },
      ];
    },
  };
}
