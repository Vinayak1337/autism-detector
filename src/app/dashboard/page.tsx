'use client';

import { useUser } from '@clerk/nextjs';
import Link from 'next/link';

export default function DashboardPage() {
  const { user, isLoaded } = useUser();

  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin h-10 w-10 border-4 border-blue-500 rounded-full border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold">Welcome, {user?.firstName || 'User'}</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          Here&apos;s your autism assessment dashboard.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-lg font-medium">Autism Detection Assessment</h2>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                Complete a new assessment to analyze traits and get a detailed report.
              </p>
            </div>
            <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="text-blue-500"
              >
                <line x1="12" x2="12" y1="19" y2="5"></line>
                <line x1="5" x2="19" y1="12" y2="12"></line>
              </svg>
            </div>
          </div>
          <div className="mt-4">
            <Link
              href="/dashboard/new-test"
              className="inline-flex items-center justify-center bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md transition-colors w-full"
            >
              Start New Test
            </Link>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-lg font-medium">Eye Tracking Test</h2>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                Complete an eye tracking assessment to detect eye movement patterns.
              </p>
            </div>
            <div className="w-10 h-10 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="text-green-500"
              >
                <circle cx="12" cy="12" r="10"></circle>
                <circle cx="12" cy="12" r="2"></circle>
              </svg>
            </div>
          </div>
          <div className="mt-4">
            <Link
              href="/eye-tracking-test"
              className="inline-flex items-center justify-center bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded-md transition-colors w-full"
            >
              Start Eye Tracking
            </Link>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-lg font-medium">Past Reports</h2>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                View and analyze your previous assessment results and track changes over time.
              </p>
            </div>
            <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900 rounded-full flex items-center justify-center">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="text-purple-500"
              >
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                <path d="M14 2v6h6"></path>
                <path d="M16 13H8"></path>
                <path d="M16 17H8"></path>
                <path d="M10 9H8"></path>
              </svg>
            </div>
          </div>
          <div className="mt-4">
            <Link
              href="/dashboard/reports"
              className="inline-flex items-center justify-center bg-purple-600 hover:bg-purple-700 text-white font-medium py-2 px-4 rounded-md transition-colors w-full"
            >
              View Reports
            </Link>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
        <h2 className="text-lg font-medium mb-4">Recent Activity</h2>
        <div className="text-gray-500 text-center py-6">
          <p>You haven&apos;t completed any assessments yet.</p>
          <p className="mt-2">
            <Link href="/dashboard/new-test" className="text-blue-500 hover:underline">
              Start your first assessment
            </Link>
            {' or '}
            <Link href="/eye-tracking-test" className="text-green-500 hover:underline">
              try the eye tracking test
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
