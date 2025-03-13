'use client';

import React from 'react';
import dynamic from 'next/dynamic';

// Instead of importing directly, we'll load components dynamically
const EyeDetector = dynamic(() => import('./EyeDetector'), {
  ssr: false,
  loading: () => <p>Loading face mesh detector...</p>,
});

export default function Page() {
  return <EyeDetector />;
}
