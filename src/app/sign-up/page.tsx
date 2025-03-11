'use client';

import { SignUp } from '@clerk/nextjs';
import Link from 'next/link';

export default function SignUpPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4">
      <div className="w-full max-w-md">
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-bold">Create an Account</h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Sign up to access assessment tools and personalized reports.
          </p>
        </div>

        <div className="flex justify-center">
          <SignUp
            path="/sign-up"
            signInUrl="/sign-in"
            afterSignUpUrl="/dashboard"
            routing="hash"
            appearance={{
              elements: {
                formButtonPrimary:
                  'bg-foreground text-background hover:bg-[#383838] dark:hover:bg-[#ccc]',
                card: 'w-full',
              },
            }}
          />
        </div>

        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Already have an account?{' '}
            <Link
              href="/sign-in"
              className="font-medium text-blue-600 hover:underline dark:text-blue-400"
            >
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
