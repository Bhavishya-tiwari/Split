'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { useState } from 'react';

/**
 * React Query Provider with optimized configuration
 *
 * Benefits over custom cache:
 * - Automatic background refetching
 * - Request deduplication
 * - Built-in loading/error states
 * - Optimistic updates
 * - DevTools for debugging
 * - Automatic garbage collection
 */

export function QueryProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // Cache data for 1 minute by default
            staleTime: 60 * 1000, // 60 seconds

            // Keep unused data in cache for 5 minutes
            gcTime: 5 * 60 * 1000, // 5 minutes (previously cacheTime)

            // Retry failed requests once
            retry: 1,

            // Refetch on window focus for fresh data
            refetchOnWindowFocus: true,

            // Don't refetch on mount if data is fresh
            refetchOnMount: false,

            // Don't refetch on reconnect
            refetchOnReconnect: false,
          },
          mutations: {
            // Retry failed mutations once
            retry: 1,
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      {/* DevTools only in development */}
      {process.env.NODE_ENV === 'development' && <ReactQueryDevtools initialIsOpen={false} />}
    </QueryClientProvider>
  );
}
