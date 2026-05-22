"use client"

import { useState, useEffect, useCallback } from "react"
import { PrayerList } from "@/components/PrayerList"
import { DateStrip } from "@/components/DateStrip"
import { DailyProgress } from "@/components/DailyProgress"
import { format, isSameDay } from "date-fns"
import { useQuery } from "@tanstack/react-query"
import { getWeeklyConsistency } from "@/actions/prayers"

export function HomeClient() {
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [progress, setProgress] = useState({ completed: 0, total: 5 })
  const [isMounted, setIsMounted] = useState(false)

  const handleProgressChange = useCallback((completed: number, total: number) => {
    setProgress(prev => (prev.completed === completed && prev.total === total) ? prev : { completed, total })
  }, [])

  useEffect(() => {
    setIsMounted(true)
  }, [])

  const isToday = isMounted ? isSameDay(selectedDate, new Date()) : true
  
  const { data: consistencyRes } = useQuery({
    queryKey: ['weeklyConsistency'],
    queryFn: async () => await getWeeklyConsistency(),
  })

  const totalWeekly = consistencyRes?.success && consistencyRes.data 
    ? consistencyRes.data.reduce((acc: number, curr: any) => acc + curr.prayers, 0)
    : 0;
  
  const weeklyPercentage = Math.round((totalWeekly / 35) * 100);
  
  return (
    <div className="w-full max-w-md space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-foreground">
            {isToday ? "Today's Prayers" : format(selectedDate, "MMMM d, yyyy")}
          </h2>
          <p className="text-sm text-muted-foreground">
            {isToday ? "Stay consistent, stay blessed." : "Reviewing past logs."}
          </p>
        </div>
        <DailyProgress completed={progress.completed} total={progress.total} />
      </div>

      <div className="flex items-center gap-4 bg-primary/5 border border-primary/10 rounded-2xl p-4">
        <div className="flex-1">
          <h4 className="text-sm font-semibold text-foreground">Weekly Completion</h4>
          <p className="text-xs text-muted-foreground mt-1">Based on the last 7 days</p>
        </div>
        <div className="text-2xl font-bold text-primary">{weeklyPercentage}%</div>
      </div>

      <DateStrip selectedDate={selectedDate} onSelectDate={setSelectedDate} />
      
      <PrayerList 
        selectedDate={selectedDate} 
        onProgressChange={handleProgressChange} 
      />
    </div>
  )
}
