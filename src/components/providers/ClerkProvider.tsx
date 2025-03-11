'use client';

import { ClerkProvider as NextClerkProvider } from '@clerk/nextjs';
import { ReactNode } from 'react';

interface ClerkProviderProps {
  children: ReactNode;
}

export function ClerkProvider({ children }: ClerkProviderProps) {
  return <NextClerkProvider>{children}</NextClerkProvider>;
}
