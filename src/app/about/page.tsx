'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';

export default function AboutPage() {
  const [imageError, setImageError] = useState(false);

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">About Autism Detection</h1>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden">
        <div className="relative h-64 sm:h-80">
          {!imageError ? (
            <Image
              src="/images/eye-tracking.jpg"
              alt="Eye tracking visualization"
              fill
              priority
              className="object-cover"
              onError={() => setImageError(true)}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gray-200 dark:bg-gray-700">
              <p className="text-center text-gray-600 dark:text-gray-300 px-4">
                Eye tracking visualization image
              </p>
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end">
            <h2 className="text-white text-2xl font-bold p-6">Eye Movement and Autism Detection</h2>
          </div>
        </div>

        <div className="p-6">
          <h3 className="text-xl font-semibold mb-4">The Science Behind Eye Movement</h3>
          <p className="mb-4">
            Research has shown that individuals with autism spectrum disorder (ASD) often display
            distinctive patterns in eye movement and visual attention. These differences can be
            observed from early childhood and have become an important area of study for early
            diagnosis.
          </p>

          <h3 className="text-xl font-semibold mb-4 mt-6">Key Eye Movement Characteristics</h3>
          <ul className="list-disc pl-5 space-y-2 mb-4">
            <li>
              <span className="font-medium">Social Attention:</span> People with autism often show
              reduced attention to social cues, including faces, especially the eye region. They may
              focus more on objects or non-social elements.
            </li>
            <li>
              <span className="font-medium">Visual Scanning Patterns:</span> Different scanning
              patterns when observing scenes, faces, or social interactions, often focusing on
              details rather than the whole picture.
            </li>
            <li>
              <span className="font-medium">Attention Shifting:</span> Potential delays in shifting
              attention between different visual stimuli compared to neurotypical individuals.
            </li>
            <li>
              <span className="font-medium">Joint Attention:</span> Differences in the ability to
              follow another person&apos;s gaze or establish shared attention on objects.
            </li>
          </ul>

          <h3 className="text-xl font-semibold mb-4 mt-6">Detection Through Eye Tracking</h3>
          <p className="mb-4">
            Modern eye-tracking technology allows researchers and clinicians to measure these
            patterns with precision. By analyzing where a person looks, for how long, and in what
            sequence, we can identify potential indicators of autism. This non-invasive approach has
            shown promise as a complementary tool for early diagnosis.
          </p>

          <p className="mb-4">
            Our assessment incorporates insights from this research, evaluating attention patterns
            through carefully designed visual tasks. While not a standalone diagnostic tool, it can
            help identify traits that may warrant further professional evaluation.
          </p>

          <div className="bg-blue-50 dark:bg-blue-900/30 p-4 rounded-lg mt-6">
            <h4 className="text-lg font-medium text-blue-700 dark:text-blue-300 mb-2">
              Important Note
            </h4>
            <p className="text-blue-700 dark:text-blue-300">
              This assessment is designed as a screening tool and not as a clinical diagnosis. If
              patterns suggesting autism are detected, we recommend consulting with healthcare
              professionals for a comprehensive evaluation.
            </p>
          </div>
        </div>
      </div>

      <div className="mt-8 flex justify-between">
        <Link
          href="/"
          className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-md hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
        >
          Back to Home
        </Link>
        <Link
          href="/sign-up"
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
        >
          Get Started
        </Link>
      </div>
    </div>
  );
}
