"use client"

import { usePrayerTimes } from "@/hooks/usePrayerTimes"
import { motion } from "framer-motion"
import { Check } from "lucide-react"
import { useState, useEffect } from "react"
import { useAppStore } from "@/store"
import { toast } from "sonner"
import { useQuery } from "@tanstack/react-query"
import { getTodayPrayers } from "@/actions/prayers"

const requiredPrayers = ["Fajr", "Dhuhr", "Asr", "Maghrib", "Isha"]

interface PrayerListProps {
  selectedDate: Date;
  onProgressChange?: (completed: number, total: number) => void;
}

export function PrayerList({ selectedDate, onProgressChange }: PrayerListProps) {
  const dateStr = selectedDate.toISOString().split('T')[0]
  const { data: timings, isLoading: isTimingsLoading } = usePrayerTimes(dateStr)
  const [completed, setCompleted] = useState<Record<string, boolean>>({})
  const addMutation = useAppStore(state => state.addMutation)
  const offlineMutations = useAppStore(state => state.offlineMutations)

  const { data: dbPrayersRes, isLoading: isDbLoading } = useQuery({
    queryKey: ['prayers', dateStr],
    queryFn: async () => await getTodayPrayers(dateStr),
  })

  useEffect(() => {
    let newCompletedCount = 0;
    if (dbPrayersRes?.success && dbPrayersRes.data) {
      const initialState: Record<string, boolean> = {};
      dbPrayersRes.data.forEach((log: any) => {
        initialState[log.prayerName] = log.status === "completed";
      });
      
      offlineMutations.forEach(mut => {
        if (mut.type === "LOG_PRAYER" && mut.payload.date.startsWith(dateStr)) {
          initialState[mut.payload.prayerName] = mut.payload.status === "completed";
        }
      });
      
      setCompleted(initialState);
      newCompletedCount = Object.values(initialState).filter(Boolean).length;
    } else {
      setCompleted({});
    }
    onProgressChange?.(newCompletedCount, 5);
  }, [dbPrayersRes, offlineMutations.length, dateStr]) 

  if (isTimingsLoading || isDbLoading) {
    return <div className="animate-pulse space-y-3">
      {requiredPrayers.map((p) => (
        <div key={p} className="h-16 bg-muted rounded-2xl w-full" />
      ))}
    </div>
  }

  const handleToggle = (prayer: string) => {
    const isCompleted = !completed[prayer]
    const newCompleted = { ...completed, [prayer]: isCompleted }
    setCompleted(newCompleted)
    
    if (isCompleted) {
      toast.success(`Alhamdulillah, ${prayer} logged!`)
    }
    
    addMutation({
      type: "LOG_PRAYER",
      payload: { prayerName: prayer, date: selectedDate.toISOString(), status: isCompleted ? "completed" : "missed" }
    })
    
    const count = Object.values(newCompleted).filter(Boolean).length;
    onProgressChange?.(count, 5);
  }

  return (
    <div className="w-full space-y-3 pb-24">
      {requiredPrayers.map((prayer) => {
        const time = timings ? (timings as any)[prayer] : "--:--"
        const isDone = completed[prayer]

        return (
          <motion.div
            layout
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            key={prayer}
            onClick={() => handleToggle(prayer)}
            className={`
              p-5 rounded-2xl shadow-sm flex items-center justify-between cursor-pointer transition-all border
              ${isDone ? 'bg-primary/5 border-primary/30' : 'bg-card border-border/60 hover:border-primary/30'}
            `}
          >
            <div>
              <h3 className={`font-semibold text-lg transition-colors ${isDone ? 'text-primary' : 'text-foreground'}`}>
                {prayer}
              </h3>
              <p className="text-sm text-muted-foreground">{time}</p>
            </div>
            
            <motion.button 
              className={`w-8 h-8 rounded-full border-2 flex items-center justify-center transition-colors ${
                isDone ? 'bg-primary border-primary text-primary-foreground' : 'border-border'
              }`}
              whileTap={{ scale: 0.9 }}
            >
              {isDone && <Check size={16} strokeWidth={3} />}
            </motion.button>
          </motion.div>
        )
      })}
    </div>
  )
}
