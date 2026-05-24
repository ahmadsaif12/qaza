"use client"

import { QueryClient } from '@tanstack/react-query'
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client'
import { createAsyncStoragePersister } from '@tanstack/query-async-storage-persister'
import { get, set, del } from 'idb-keyval'
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

  const persister = createAsyncStoragePersister({
    storage: {
      getItem: async (key) => await get(key) || null,
      setItem: async (key, value) => await set(key, value),
      removeItem: async (key) => await del(key),
    },
    key: 'qazatrack-query-cache'
  })

  return (
    <PersistQueryClientProvider 
      client={queryClient}
      persistOptions={{
        persister,
        maxAge: 1000 * 60 * 60 * 24,
        dehydrateOptions: {
          shouldDehydrateQuery: (query) => query.queryKey[0] === 'prayerTimes',
        },
      }}
    >
      <ThemeProvider 
        attribute="class" 
        defaultTheme="system" 
        themes={['light', 'dark', 'system', 'ocean', 'rose', 'lavender']}
        enableSystem 
        disableTransitionOnChange
      >
        <SyncRunner />
        <PreferenceSync />
        {children}
      </ThemeProvider>
    </PersistQueryClientProvider>
  )
}
