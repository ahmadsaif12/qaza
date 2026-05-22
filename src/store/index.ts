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

interface AppState {
  offlineMutations: any[]
  addMutation: (mutation: any) => void
  clearMutations: () => void
  userLocation: { lat: number; lng: number } | null
  setUserLocation: (location: { lat: number; lng: number }) => void
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      offlineMutations: [],
      addMutation: (mutation) => set((state) => ({ offlineMutations: [...state.offlineMutations, mutation] })),
      clearMutations: () => set({ offlineMutations: [] }),
      userLocation: null,
      setUserLocation: (userLocation) => set({ userLocation }),
    }),
    {
      name: 'qazatrack-storage',
      storage: createJSONStorage(() => storage),
    }
  )
)
