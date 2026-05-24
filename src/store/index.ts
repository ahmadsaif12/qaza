import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { set, get, del } from 'idb-keyval'

// Custom storage for Zustand using IndexedDB
const storage = {
  getItem: async (name: string): Promise<string | null> => {
    return (await get(name)) || null
  },
  setItem: async (name: string, value: string): Promise<void> => {
    await set(name, value)
  },
  removeItem: async (name: string): Promise<void> => {
    await del(name)
  },
}

type PrayerStatus = "completed" | "missed" | "qaza_completed" | "excused"

export type OfflinePrayerMutation = {
  id: string
  type: "LOG_PRAYER"
  payload: {
    prayerName: string
    date: string
    status: PrayerStatus
  }
}

type NewOfflinePrayerMutation = Omit<OfflinePrayerMutation, "id"> & {
  id?: string
}

interface AppState {
  offlineMutations: OfflinePrayerMutation[]
  addMutation: (mutation: NewOfflinePrayerMutation) => void
  removeMutations: (ids: string[]) => void
  userLocation: { lat: number; lng: number } | null
  setUserLocation: (location: { lat: number; lng: number } | null) => void
  timeFormat: '12h' | '24h'
  setTimeFormat: (format: '12h' | '24h') => void
  calcMethod: number
  setCalcMethod: (method: number) => void
  asrMethod: number
  setAsrMethod: (method: number) => void
  trackWitr: boolean
  setTrackWitr: (track: boolean) => void
  excusedRanges: { start: string; end: string }[]
  setExcusedRanges: (ranges: { start: string; end: string }[]) => void
  qazaPace: { paceMode: string } | null
  setQazaPace: (pace: { paceMode: string } | null) => void
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      offlineMutations: [],
      addMutation: (mutation) => set((state) => ({ 
        offlineMutations: [...state.offlineMutations, { ...mutation, id: mutation.id || crypto.randomUUID() }] 
      })),
      removeMutations: (ids) => set((state) => ({ 
        offlineMutations: state.offlineMutations.filter(m => !ids.includes(m.id)) 
      })),
      userLocation: null,
      setUserLocation: (userLocation) => set({ userLocation }),
      timeFormat: '12h',
      setTimeFormat: (timeFormat) => set({ timeFormat }),
      calcMethod: 2, // Default to ISNA (2)
      setCalcMethod: (calcMethod) => set({ calcMethod }),
      asrMethod: 0, // Default to Standard (0)
      setAsrMethod: (asrMethod) => set({ asrMethod }),
      trackWitr: false, // Default to false
      setTrackWitr: (trackWitr) => set({ trackWitr }),
      excusedRanges: [],
      setExcusedRanges: (excusedRanges) => set({ excusedRanges }),
      qazaPace: null,
      setQazaPace: (qazaPace) => set({ qazaPace }),
    }),
    {
      name: 'qazatrack-storage',
      storage: createJSONStorage(() => storage),
    }
  )
)
