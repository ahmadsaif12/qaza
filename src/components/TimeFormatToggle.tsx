"use client"

import { useAppStore } from "@/store"
import { Switch } from "@/components/ui/switch"
import { useMounted } from "@/hooks/useMounted"

export function TimeFormatToggle() {
  const timeFormat = useAppStore(state => state.timeFormat)
  const setTimeFormat = useAppStore(state => state.setTimeFormat)
  const mounted = useMounted()

  if (!mounted) {
    return <div className="h-6 w-11 bg-muted rounded-full animate-pulse" />
  }

  const is24h = timeFormat === '24h'

  return (
    <div className="flex items-center justify-between">
      <div className="space-y-0.5">
        <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
          24-Hour Clock
        </label>
        <p className="text-[0.8rem] text-muted-foreground">
          {is24h ? "15:30" : "3:30 PM"}
        </p>
      </div>
      <Switch 
        checked={is24h}
        onCheckedChange={(checked) => setTimeFormat(checked ? '24h' : '12h')}
      />
    </div>
  )
}
