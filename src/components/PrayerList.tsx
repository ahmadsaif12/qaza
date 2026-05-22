"use client"

import { usePrayerTimes } from "@/hooks/usePrayerTimes"
import { motion } from "framer-motion"
import { Check } from "lucide-react"
import { useEffect, useMemo } from "react"
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
  
  const addMutation = useAppStore(state => state.addMutation)
  const offlineMutations = useAppStore(state => state.offlineMutations)

  const { data: dbPrayersRes, isLoading: isDbLoading } = useQuery({
    queryKey: ['prayers', dateStr],
    queryFn: async () => await getTodayPrayers(dateStr),
  })

  // Compute completed state instantly from DB results + pending offline mutations
  const completed = useMemo(() => {
    const state: Record<string, boolean> = {};
    
    // 1. Start with database state
    if (dbPrayersRes?.success && dbPrayersRes.data) {
      dbPrayersRes.data.forEach((log: any) => {
        state[log.prayerName] = log.status === "completed";
      });
    }
    
    // 2. Overlay any pending local mutations (last mutation wins)
    offlineMutations.forEach(mut => {
      if (mut.type === "LOG_PRAYER" && mut.payload.date.startsWith(dateStr)) {
        state[mut.payload.prayerName] = mut.payload.status === "completed";
      }
    });
    
    return state;
  }, [dbPrayersRes, offlineMutations, dateStr]);

  const completedCount = Object.values(completed).filter(Boolean).length;

  useEffect(() => {
    onProgressChange?.(completedCount, 5);
  }, [completedCount, onProgressChange]);

  if (isTimingsLoading || isDbLoading) {
    return <div className="animate-pulse space-y-3">
      {requiredPrayers.map((p) => (
        <div key={p} className="h-16 bg-muted rounded-2xl w-full" />
      ))}
    </div>
  }

  const todayStr = new Date().toISOString().split('T')[0];
  const isFuture = dateStr > todayStr;

  const handleToggle = (prayer: string) => {
    if (isFuture) {
      toast.error("You cannot log prayers for future dates!");
      return;
    }

    const isCompleted = !completed[prayer]
    
    if (isCompleted) {
      toast.success(`Alhamdulillah, ${prayer} logged!`)
    }
    
    addMutation({
      type: "LOG_PRAYER",
      payload: { prayerName: prayer, date: selectedDate.toISOString(), status: isCompleted ? "completed" : "missed" }
    })
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
              p-5 rounded-2xl flex items-center justify-between transition-all border
              ${isFuture ? 'bg-muted/30 border-border/30 cursor-not-allowed opacity-60' : 
                isDone ? 'bg-primary/5 border-primary/30 shadow-sm cursor-pointer' : 
                'bg-card border-border/60 hover:border-primary/30 shadow-sm cursor-pointer'}
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

