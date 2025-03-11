'use client';

import Link from 'next/link';
import { useState } from 'react';

export default function NewTestPage() {
  const [step, setStep] = useState(1);

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Start New Assessment</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          Complete the following questionnaire to get a detailed analysis.
        </p>
      </div>

      {/* Steps progress */}
      <div className="mb-8">
        <div className="flex items-center">
          <div
            className={`flex items-center justify-center w-8 h-8 rounded-full ${step >= 1 ? 'bg-blue-600 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400'}`}
          >
            1
          </div>
          <div
            className={`flex-1 h-1 mx-2 ${step >= 2 ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-700'}`}
          ></div>
          <div
            className={`flex items-center justify-center w-8 h-8 rounded-full ${step >= 2 ? 'bg-blue-600 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400'}`}
          >
            2
          </div>
          <div
            className={`flex-1 h-1 mx-2 ${step >= 3 ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-700'}`}
          ></div>
          <div
            className={`flex items-center justify-center w-8 h-8 rounded-full ${step >= 3 ? 'bg-blue-600 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400'}`}
          >
            3
          </div>
        </div>
        <div className="flex justify-between mt-2 text-sm text-gray-600 dark:text-gray-400">
          <span>Basic Info</span>
          <span>Assessment</span>
          <span>Results</span>
        </div>
      </div>

      {/* Step 1: Basic Info */}
      {step === 1 && (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
          <h2 className="text-lg font-medium mb-4">Personal Information</h2>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              setStep(2);
            }}
          >
            <div className="space-y-4">
              <div>
                <label htmlFor="age" className="block text-sm font-medium mb-1">
                  Age
                </label>
                <select
                  id="age"
                  className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700"
                  required
                >
                  <option value="">Select age range</option>
                  <option value="child">Child (2-12 years)</option>
                  <option value="adolescent">Adolescent (13-17 years)</option>
                  <option value="adult">Adult (18+ years)</option>
                </select>
              </div>

              <div>
                <label htmlFor="gender" className="block text-sm font-medium mb-1">
                  Gender
                </label>
                <select
                  id="gender"
                  className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700"
                  required
                >
                  <option value="">Select gender</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="nonbinary">Non-binary</option>
                  <option value="other">Other</option>
                  <option value="prefer-not">Prefer not to say</option>
                </select>
              </div>

              <div className="pt-4">
                <button
                  type="submit"
                  className="w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-md transition-colors"
                >
                  Continue to Assessment
                </button>
              </div>
            </div>
          </form>
        </div>
      )}

      {/* Step 2: Assessment */}
      {step === 2 && (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
          <h2 className="text-lg font-medium mb-4">Assessment Questions</h2>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              setStep(3);
            }}
          >
            <div className="space-y-6">
              {/* Sample questions - would be expanded in a real implementation */}
              <div className="border-b border-gray-200 dark:border-gray-700 pb-4">
                <p className="mb-2">1. I find social situations easy.</p>
                <div className="flex items-center space-x-4">
                  <label className="flex items-center">
                    <input type="radio" name="q1" value="1" className="mr-2" required />
                    <span>Strongly Disagree</span>
                  </label>
                  <label className="flex items-center">
                    <input type="radio" name="q1" value="2" className="mr-2" />
                    <span>Disagree</span>
                  </label>
                  <label className="flex items-center">
                    <input type="radio" name="q1" value="3" className="mr-2" />
                    <span>Agree</span>
                  </label>
                  <label className="flex items-center">
                    <input type="radio" name="q1" value="4" className="mr-2" />
                    <span>Strongly Agree</span>
                  </label>
                </div>
              </div>

              <div className="border-b border-gray-200 dark:border-gray-700 pb-4">
                <p className="mb-2">2. I find it hard to make new friends.</p>
                <div className="flex items-center space-x-4">
                  <label className="flex items-center">
                    <input type="radio" name="q2" value="1" className="mr-2" required />
                    <span>Strongly Disagree</span>
                  </label>
                  <label className="flex items-center">
                    <input type="radio" name="q2" value="2" className="mr-2" />
                    <span>Disagree</span>
                  </label>
                  <label className="flex items-center">
                    <input type="radio" name="q2" value="3" className="mr-2" />
                    <span>Agree</span>
                  </label>
                  <label className="flex items-center">
                    <input type="radio" name="q2" value="4" className="mr-2" />
                    <span>Strongly Agree</span>
                  </label>
                </div>
              </div>

              <div className="border-b border-gray-200 dark:border-gray-700 pb-4">
                <p className="mb-2">
                  3. I find it easy to work out what someone is thinking or feeling.
                </p>
                <div className="flex items-center space-x-4">
                  <label className="flex items-center">
                    <input type="radio" name="q3" value="1" className="mr-2" required />
                    <span>Strongly Disagree</span>
                  </label>
                  <label className="flex items-center">
                    <input type="radio" name="q3" value="2" className="mr-2" />
                    <span>Disagree</span>
                  </label>
                  <label className="flex items-center">
                    <input type="radio" name="q3" value="3" className="mr-2" />
                    <span>Agree</span>
                  </label>
                  <label className="flex items-center">
                    <input type="radio" name="q3" value="4" className="mr-2" />
                    <span>Strongly Agree</span>
                  </label>
                </div>
              </div>

              <div className="flex justify-between pt-4">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="py-2 px-4 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-white font-medium rounded-md transition-colors"
                >
                  Back
                </button>
                <button
                  type="submit"
                  className="py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-md transition-colors"
                >
                  See Results
                </button>
              </div>
            </div>
          </form>
        </div>
      )}

      {/* Step 3: Results */}
      {step === 3 && (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 dark:bg-green-900 text-green-500 mb-4">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="32"
                height="32"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                <polyline points="22 4 12 14.01 9 11.01"></polyline>
              </svg>
            </div>
            <h2 className="text-2xl font-bold mb-2">Assessment Completed!</h2>
            <p className="text-gray-600 dark:text-gray-400 max-w-md mx-auto">
              Your assessment has been analyzed and your report is ready to view.
            </p>
          </div>

          <div className="bg-gray-50 dark:bg-gray-900 p-6 rounded-lg mb-6">
            <h3 className="font-medium mb-4">Assessment Summary</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span>Social Communication:</span>
                <span className="font-medium">Moderate</span>
              </div>
              <div className="flex justify-between">
                <span>Repetitive Behaviors:</span>
                <span className="font-medium">Mild</span>
              </div>
              <div className="flex justify-between">
                <span>Sensory Sensitivities:</span>
                <span className="font-medium">Minimal</span>
              </div>
              <div className="border-t pt-3 mt-3 border-gray-200 dark:border-gray-700">
                <div className="flex justify-between font-medium">
                  <span>Overall Result:</span>
                  <span className="text-blue-600 dark:text-blue-400">Low likelihood</span>
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row justify-center space-y-3 sm:space-y-0 sm:space-x-4">
            <Link
              href="/dashboard/reports"
              className="py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-md transition-colors text-center"
            >
              View Detailed Report
            </Link>
            <Link
              href="/dashboard"
              className="py-2 px-4 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-white font-medium rounded-md transition-colors text-center"
            >
              Return to Dashboard
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
