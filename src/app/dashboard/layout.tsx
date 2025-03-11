'use client';

import { UserButton } from '@clerk/nextjs';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  const isActive = (path: string) => {
    return pathname === path
      ? 'bg-gray-100 text-gray-900 dark:bg-gray-800 dark:text-white'
      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900 dark:text-gray-300 dark:hover:bg-gray-800 dark:hover:text-white';
  };

  return (
    <div className="flex flex-col h-screen">
      <header className="border-b px-4 sm:px-6 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" className="font-medium text-lg">
              Autism Detector
            </Link>
            <span className="text-gray-400 hidden sm:inline">|</span>
            <span className="text-sm text-gray-500 hidden sm:inline">Dashboard</span>
          </div>
          <UserButton
            afterSignOutUrl="/"
            appearance={{
              elements: {
                userButtonAvatarBox: 'w-9 h-9',
              },
            }}
          />
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        <nav className="w-64 border-r bg-gray-50 dark:bg-gray-900 p-4 hidden sm:block overflow-y-auto">
          <div className="space-y-1">
            <Link
              href="/dashboard"
              className={`flex items-center px-4 py-2 text-sm font-medium rounded-md ${isActive('/dashboard')}`}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="mr-3"
              >
                <rect width="7" height="9" x="3" y="3" rx="1"></rect>
                <rect width="7" height="5" x="14" y="3" rx="1"></rect>
                <rect width="7" height="9" x="14" y="12" rx="1"></rect>
                <rect width="7" height="5" x="3" y="16" rx="1"></rect>
              </svg>
              Dashboard
            </Link>
            <Link
              href="/dashboard/new-test"
              className={`flex items-center px-4 py-2 text-sm font-medium rounded-md ${isActive('/dashboard/new-test')}`}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="mr-3"
              >
                <line x1="12" x2="12" y1="19" y2="5"></line>
                <line x1="5" x2="19" y1="12" y2="12"></line>
              </svg>
              Start New Test
            </Link>
            <Link
              href="/dashboard/reports"
              className={`flex items-center px-4 py-2 text-sm font-medium rounded-md ${isActive('/dashboard/reports')}`}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="mr-3"
              >
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                <path d="M14 2v6h6"></path>
                <path d="M16 13H8"></path>
                <path d="M16 17H8"></path>
                <path d="M10 9H8"></path>
              </svg>
              View Reports
            </Link>
            <Link
              href="/dashboard/settings"
              className={`flex items-center px-4 py-2 text-sm font-medium rounded-md ${isActive('/dashboard/settings')}`}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="mr-3"
              >
                <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"></path>
                <circle cx="12" cy="12" r="3"></circle>
              </svg>
              Settings
            </Link>
          </div>
        </nav>

        <div className="flex-1 p-5 overflow-auto">
          <div className="block sm:hidden mb-5">
            <div className="flex flex-col space-y-2">
              <Link
                href="/dashboard"
                className={`flex items-center px-4 py-2 text-sm font-medium rounded-md ${isActive('/dashboard')}`}
              >
                Dashboard
              </Link>
              <Link
                href="/dashboard/new-test"
                className={`flex items-center px-4 py-2 text-sm font-medium rounded-md ${isActive('/dashboard/new-test')}`}
              >
                Start New Test
              </Link>
              <Link
                href="/dashboard/reports"
                className={`flex items-center px-4 py-2 text-sm font-medium rounded-md ${isActive('/dashboard/reports')}`}
              >
                View Reports
              </Link>
              <Link
                href="/dashboard/settings"
                className={`flex items-center px-4 py-2 text-sm font-medium rounded-md ${isActive('/dashboard/settings')}`}
              >
                Settings
              </Link>
            </div>
          </div>
          {children}
        </div>
      </div>
    </div>
  );
}
