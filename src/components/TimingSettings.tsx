"use client"

import { useState, useEffect } from "react"
import { useAppStore } from "@/store"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Compass, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { updateUserPreferences, updateUserLocation } from "@/actions/user"

const CALC_METHODS = [
  { id: 1, name: "Karachi (Univ of Islamic Sciences)" },
  { id: 2, name: "ISNA (North America)" },
  { id: 3, name: "MWL (Muslim World League)" },
  { id: 4, name: "Umm Al-Qura (Makkah)" },
  { id: 5, name: "Egyptian General Authority" },
  { id: 8, name: "Gulf Region" },
  { id: 9, name: "Kuwait" },
  { id: 10, name: "Qatar" },
  { id: 11, name: "Singapore (MUIS)" },
  { id: 12, name: "France (UOIF)" },
  { id: 13, name: "Turkey (Diyanet)" },
  { id: 14, name: "Russia (SAMR)" },
]

export function TimingSettings() {
  const userLocation = useAppStore(state => state.userLocation)
  const setUserLocation = useAppStore(state => state.setUserLocation)
  
  const calcMethod = useAppStore(state => state.calcMethod)
  const setCalcMethod = useAppStore(state => state.setCalcMethod)
  
  const asrMethod = useAppStore(state => state.asrMethod)
  const setAsrMethod = useAppStore(state => state.setAsrMethod)
  
  const trackWitr = useAppStore(state => state.trackWitr)
  const setTrackWitr = useAppStore(state => state.setTrackWitr)

  const [detecting, setDetecting] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) return null

  const handleDetectLocation = () => {
    if (!("geolocation" in navigator)) {
      toast.error("Geolocation is not supported by your browser")
      return
    }

    setDetecting(true)
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords
        const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone
        
        // Save to DB
        const res = await updateUserLocation(latitude, longitude, timezone)
        if (res.success) {
          // Update Zustand store
          setUserLocation({ lat: latitude, lng: longitude })
          toast.success("Location updated successfully!")
        } else {
          toast.error(res.error || "Failed to save location")
        }
        setDetecting(false)
      },
      (error) => {
        console.error("Geolocation error", error)
        toast.error("Failed to detect location. Please check permissions.")
        setDetecting(false)
      },
      { timeout: 10000 }
    )
  }

  const handleCalcMethodChange = async (methodId: number) => {
    setCalcMethod(methodId)
    const res = await updateUserPreferences({ calcMethod: methodId })
    if (res.success) {
      toast.success("Calculation method updated")
    } else {
      toast.error("Failed to update preferences")
    }
  }

  const handleAsrMethodChange = async (schoolId: number) => {
    setAsrMethod(schoolId)
    const res = await updateUserPreferences({ asrMethod: schoolId })
    if (res.success) {
      toast.success("Asr timing method updated")
    } else {
      toast.error("Failed to update preferences")
    }
  }

  const handleWitrToggle = async (checked: boolean) => {
    setTrackWitr(checked)
    const res = await updateUserPreferences({ trackWitr: checked })
    if (res.success) {
      toast.success(checked ? "Witr tracking enabled" : "Witr tracking disabled")
    } else {
      toast.error("Failed to update preferences")
    }
  }

  return (
    <div className="space-y-6">
      {/* Geolocation Section */}
      <div className="space-y-3">
        <h3 className="text-base font-medium">Location</h3>
        <div className="flex flex-col gap-2 p-4 bg-muted/20 border border-border/50 rounded-2xl">
          <div className="text-sm text-muted-foreground flex flex-col gap-0.5">
            <span>Coordinates:</span>
            {userLocation ? (
              <span className="font-semibold text-foreground">
                {userLocation.lat.toFixed(4)}° N, {userLocation.lng.toFixed(4)}° E
              </span>
            ) : (
              <span className="font-semibold text-foreground text-amber-600">
                Default (Mecca, Saudi Arabia)
              </span>
            )}
          </div>
          <Button 
            onClick={handleDetectLocation} 
            disabled={detecting}
            variant="outline" 
            className="w-full rounded-xl mt-2 flex items-center justify-center gap-2 border-primary/20 text-primary hover:bg-primary/5"
          >
            {detecting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Detecting...
              </>
            ) : (
              <>
                <Compass className="h-4 w-4" />
                Detect My Location
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Calculation Method Select */}
      <div className="space-y-2">
        <label className="text-base font-medium block">Calculation Method</label>
        <select
          value={calcMethod}
          onChange={(e) => handleCalcMethodChange(Number(e.target.value))}
          className="w-full bg-background border border-border/60 rounded-xl px-3 py-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/45 focus:border-primary transition-all shadow-sm"
        >
          {CALC_METHODS.map((m) => (
            <option key={m.id} value={m.id}>
              {m.name}
            </option>
          ))}
        </select>
      </div>

      {/* Asr Juristic School Select */}
      <div className="space-y-2">
        <label className="text-base font-medium block">Asr Timing Method</label>
        <select
          value={asrMethod}
          onChange={(e) => handleAsrMethodChange(Number(e.target.value))}
          className="w-full bg-background border border-border/60 rounded-xl px-3 py-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/45 focus:border-primary transition-all shadow-sm"
        >
          <option value={0}>Standard (Shafi'i, Maliki, Hanbali)</option>
          <option value={1}>Hanafi (Later Asr time)</option>
        </select>
      </div>

      {/* Witr Tracking Toggle */}
      <div className="flex items-center justify-between pt-2 border-t border-border/40">
        <div className="space-y-0.5">
          <Label className="text-base font-medium cursor-pointer" htmlFor="track-witr">Track Witr Qaza</Label>
          <p className="text-xs text-muted-foreground">Add Witr as a required daily/Qaza prayer (Hanafi school).</p>
        </div>
        <Switch 
          id="track-witr" 
          checked={trackWitr} 
          onCheckedChange={handleWitrToggle} 
        />
      </div>
    </div>
  )
}
