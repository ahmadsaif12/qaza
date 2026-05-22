"use client"

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useState } from 'react'
import { useSyncMutations } from '@/hooks/useSyncMutations'

function SyncRunner() {
  useSyncMutations();
  return null;
}

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60 * 1000 * 60, // 1 hour
      },
    },
  }))

  return (
    <QueryClientProvider client={queryClient}>
      <SyncRunner />
      {children}
    </QueryClientProvider>
  )
}
