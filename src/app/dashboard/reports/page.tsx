'use client';

import { useState } from 'react';
import Link from 'next/link';

// Mock data for reports
const MOCK_REPORTS = [
  {
    id: '1',
    date: '2024-03-10',
    title: 'Adult Assessment',
    score: 'Low likelihood',
    status: 'complete',
  },
  {
    id: '2',
    date: '2024-02-15',
    title: 'Child Assessment',
    score: 'Moderate likelihood',
    status: 'complete',
  },
];

export default function ReportsPage() {
  const [reports] = useState(MOCK_REPORTS);

  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Assessment Reports</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            View and analyze your previous assessment results.
          </p>
        </div>
        <Link
          href="/dashboard/new-test"
          className="py-2 px-4 rounded-md bg-blue-600 hover:bg-blue-700 text-white transition-colors hidden sm:block"
        >
          Start New Assessment
        </Link>
      </div>

      {reports.length > 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-900">
                <tr>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
                  >
                    Date
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
                  >
                    Assessment
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
                  >
                    Result
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
                  >
                    Status
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
                  >
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {reports.map((report) => (
                  <tr key={report.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {new Date(report.date).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-100">
                      {report.title}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          report.score.includes('Low')
                            ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
                            : report.score.includes('Moderate')
                              ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300'
                              : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
                        }`}
                      >
                        {report.score}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      <span className="capitalize">{report.status}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <Link
                        href={`/dashboard/reports/${report.id}`}
                        className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                      >
                        View
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 p-8 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-900 text-gray-500 mb-4">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="28"
              height="28"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
              <path d="M14 2v6h6"></path>
              <path d="M16 13H8"></path>
              <path d="M16 17H8"></path>
              <path d="M10 9H8"></path>
            </svg>
          </div>
          <h2 className="text-lg font-medium mb-2">No reports found</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            You haven&apos;t completed any assessments yet.
          </p>
          <Link
            href="/dashboard/new-test"
            className="py-2 px-4 rounded-md bg-blue-600 hover:bg-blue-700 text-white transition-colors inline-block"
          >
            Start Your First Assessment
          </Link>
        </div>
      )}

      <div className="mt-6 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm p-4">
        <h2 className="text-lg font-medium mb-2">Understanding Your Results</h2>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Our assessments provide indicators based on validated screening tools. Results suggest
          likelihood but are not diagnostic. For a formal diagnosis, please consult with a
          healthcare professional.
        </p>
      </div>
    </div>
  );
}
