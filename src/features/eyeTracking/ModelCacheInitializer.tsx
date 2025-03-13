'use client';

import { useEffect } from 'react';
import { initModelCache } from './modelCache';

/**
 * This component initializes the TensorFlow.js model cache
 * when the application loads. It's a client component that
 * can be safely included in the server-side layout.
 */
export function ModelCacheInitializer() {
  useEffect(() => {
    // Initialize the model cache when component mounts
    initModelCache();
  }, []);

  // This component doesn't render anything
  return null;
}
