'use client';

/**
 * This file provides utilities for caching TensorFlow.js models locally
 * to avoid CORS issues and improve loading performance.
 */

// Extend Window interface for TypeScript
declare global {
  interface Window {
    _useDummyDetector?: boolean;
    _dummyDetectorStable?: boolean;
    _modelLoadAttempts?: number;
    _modelLoadUrls?: string[];
  }
}

// Flag to track if we've shown the model loading error message
let hasShownModelLoadingError = false;

/**
 * Enables the dummy detector as a fallback when model loading fails
 */
export function enableDummyDetector(): void {
  if (typeof window !== 'undefined') {
    console.log('Enabling dummy detector due to model loading issues');
    window._useDummyDetector = true;

    // Only show the error message once
    if (!hasShownModelLoadingError) {
      hasShownModelLoadingError = true;

      // Show a user-friendly message about the fallback
      console.warn(
        'Face detection model could not be loaded due to network restrictions. ' +
          'Using a fallback detector which may be less accurate but will allow the application to function.'
      );
    }
  }
}

/**
 * Checks if the browser supports IndexedDB for model caching
 */
export function supportsIndexedDB(): boolean {
  return typeof window !== 'undefined' && 'indexedDB' in window;
}

/**
 * Attempts to preload the TensorFlow.js model to avoid CORS issues
 * This can be called early in the application lifecycle
 */
export async function preloadModel(): Promise<void> {
  if (typeof window === 'undefined') return;

  try {
    // Import TensorFlow.js dynamically
    const tf = await import('@tensorflow/tfjs');

    // Try to load the model from a CORS-friendly CDN
    const modelUrl =
      'https://cdn.jsdelivr.net/npm/@tensorflow-models/face-landmarks-detection@0.0.1/model/model.json';

    console.log('Preloading face detection model...');

    // Load and cache the model
    await tf.loadGraphModel(modelUrl, {
      fromTFHub: false,
    });

    console.log('Face detection model successfully preloaded and cached');
  } catch (error) {
    console.error('Failed to preload face detection model:', error);

    // Enable the dummy detector as fallback
    enableDummyDetector();
  }
}

/**
 * Initializes the model cache system
 * Call this function early in your application
 */
export function initModelCache(): void {
  if (typeof window === 'undefined') return;

  // Check if we're in development mode
  const isDev = process.env.NODE_ENV === 'development';

  // In development, we might want to use the dummy detector by default
  // to avoid CORS issues during development
  if (isDev && window.location.hostname === 'localhost') {
    const urlParams = new URLSearchParams(window.location.search);
    const forceDummy = urlParams.get('forceDummy') === 'true';
    const forceReal = urlParams.get('forceReal') === 'true';

    if (forceDummy) {
      console.log('Using dummy detector as requested by URL parameter');
      window._useDummyDetector = true;
    } else if (forceReal) {
      console.log('Using real detector as requested by URL parameter');
      window._useDummyDetector = false;

      // Try to preload the model
      preloadModel().catch(console.error);
    } else {
      // Default behavior - try to load the real model
      preloadModel().catch(console.error);
    }
  } else {
    // In production, always try to use the real model
    preloadModel().catch(console.error);
  }
}
