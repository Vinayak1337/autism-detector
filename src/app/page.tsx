import Image from 'next/image';
import Link from 'next/link';

export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-8 text-center">
      <main className="flex flex-col items-center max-w-4xl gap-8">
        <h1 className="text-4xl font-bold tracking-tight sm:text-6xl">Autism Detection App</h1>
        <p className="text-xl text-gray-600 dark:text-gray-400 max-w-2xl">
          An intuitive platform to help identify autism spectrum traits through simple,
          scientifically-backed assessments.
        </p>

        <div className="mt-8">
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/sign-up"
              className="rounded-full border border-solid border-transparent transition-colors flex items-center justify-center bg-foreground text-background gap-2 hover:bg-[#383838] dark:hover:bg-[#ccc] font-medium text-lg h-12 px-8"
            >
              Get Started
            </Link>
            <Link
              href="/about"
              className="rounded-full border border-solid border-gray-300 dark:border-gray-700 transition-colors flex items-center justify-center hover:bg-gray-100 dark:hover:bg-gray-800 font-medium text-lg h-12 px-8"
            >
              Learn About Autism Detection
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-8 mt-16 sm:grid-cols-3">
          <div className="flex flex-col items-center p-6 border rounded-lg border-gray-200 dark:border-gray-800">
            <div className="w-12 h-12 mb-4 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="text-blue-500"
              >
                <path d="M12 10V2"></path>
                <path d="m4.93 10.93 1.41 1.41"></path>
                <path d="M2 18h2"></path>
                <path d="M20 18h2"></path>
                <path d="m19.07 10.93-1.41 1.41"></path>
                <path d="M22 22H2"></path>
                <path d="m16 6-4 4-4-4"></path>
                <path d="M16 18a4 4 0 0 0-8 0"></path>
              </svg>
            </div>
            <h3 className="text-lg font-medium">Quick Assessment</h3>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
              Complete our assessment in less than 10 minutes
            </p>
          </div>

          <div className="flex flex-col items-center p-6 border rounded-lg border-gray-200 dark:border-gray-800">
            <div className="w-12 h-12 mb-4 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="text-green-500"
              >
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
              </svg>
            </div>
            <h3 className="text-lg font-medium">Private & Secure</h3>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
              Your data is encrypted and never shared with third parties
            </p>
          </div>

          <div className="flex flex-col items-center p-6 border rounded-lg border-gray-200 dark:border-gray-800">
            <div className="w-12 h-12 mb-4 rounded-full bg-purple-100 dark:bg-purple-900 flex items-center justify-center">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
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
            <h3 className="text-lg font-medium">Detailed Reports</h3>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
              Get comprehensive insights and recommendations
            </p>
          </div>
        </div>
      </main>

      <footer className="mt-24 text-sm text-gray-500">
        &copy; {new Date().getFullYear()} Autism Detection App. All rights reserved.
      </footer>
    </div>
  );
}
