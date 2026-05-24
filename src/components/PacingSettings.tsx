"use client"

import { useAppStore } from "@/store"
import { toast } from "sonner"
import { updateUserPreferences } from "@/actions/user"
import { useMounted } from "@/hooks/useMounted"

const PACE_MODES = [
  { id: "none", name: "Free Pace (Log whenever you pray)" },
  { id: "1:1", name: "Standard (1 Qaza per daily prayer)" },
  { id: "2:1", name: "Double Speed (2 Qaza per daily prayer)" },
  { id: "3:1", name: "High Speed (3 Qaza per daily prayer)" },
]

export function PacingSettings() {
  const qazaPace = useAppStore(state => state.qazaPace)
  const setQazaPace = useAppStore(state => state.setQazaPace)
  const mounted = useMounted()

  if (!mounted) return null

  const currentMode = qazaPace?.paceMode || "none"

  const handlePaceChange = async (mode: string) => {
    const newPace = { paceMode: mode }
    setQazaPace(newPace)
    
    const res = await updateUserPreferences({ qazaPace: newPace })
    if (res.success) {
      toast.success("Catch-up pace target updated!")
    } else {
      toast.error("Failed to update pace settings")
    }
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <label className="text-base font-medium block">Daily Catch-up Target</label>
        <p className="text-xs text-muted-foreground mb-2">Set a target to break your backlog into manageable daily amounts.</p>
        <select
          value={currentMode}
          onChange={(e) => handlePaceChange(e.target.value)}
          className="w-full bg-background border border-border/60 rounded-xl px-3 py-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/45 focus:border-primary transition-all shadow-sm"
        >
          {PACE_MODES.map((m) => (
            <option key={m.id} value={m.id}>
              {m.name}
            </option>
          ))}
        </select>
      </div>
    </div>
  )
}
