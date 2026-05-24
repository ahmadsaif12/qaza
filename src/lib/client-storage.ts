"use client"

import { del } from "idb-keyval"
import { useAppStore } from "@/store"

export async function clearQazaClientStorage() {
  useAppStore.setState({
    offlineMutations: [],
    userLocation: null,
    calcMethod: 2,
    asrMethod: 0,
    trackWitr: false,
    excusedRanges: [],
    qazaPace: null,
  })

  await Promise.all([
    del("qazatrack-storage"),
    del("qazatrack-query-cache"),
  ])
}
