"use client"

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ThemeProvider } from 'next-themes'
import { useState } from 'react'
import { useSyncMutations } from '@/hooks/useSyncMutations'

import { useEffect } from 'react'
import { getUserPreferences } from '@/actions/user'
import { useAppStore } from '@/store'

function SyncRunner() {
  useSyncMutations();
  return null;
}

function PreferenceSync() {
  const setUserLocation = useAppStore(state => state.setUserLocation)
  const setCalcMethod = useAppStore(state => state.setCalcMethod)
  const setAsrMethod = useAppStore(state => state.setAsrMethod)
  const setTrackWitr = useAppStore(state => state.setTrackWitr)
  const setExcusedRanges = useAppStore(state => state.setExcusedRanges)
  const setQazaPace = useAppStore(state => state.setQazaPace)

  useEffect(() => {
    getUserPreferences().then(res => {
      if (res.success && res.data) {
        const { latitude, longitude, calcMethod, asrMethod, trackWitr, excusedRanges, qazaPace } = res.data
        if (latitude !== null && longitude !== null) {
          setUserLocation({ lat: latitude, lng: longitude })
        }
        if (calcMethod !== null) setCalcMethod(calcMethod)
        if (asrMethod !== null) setAsrMethod(asrMethod)
        if (trackWitr !== null) setTrackWitr(trackWitr)
        if (excusedRanges !== null) setExcusedRanges(excusedRanges)
        if (qazaPace !== null) setQazaPace(qazaPace)
      }
    })
  }, [setUserLocation, setCalcMethod, setAsrMethod, setTrackWitr, setExcusedRanges, setQazaPace])

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
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
        <SyncRunner />
        <PreferenceSync />
        {children}
      </ThemeProvider>
    </QueryClientProvider>
  )
}
