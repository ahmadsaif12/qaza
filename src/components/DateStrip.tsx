"use client"

import { format, subDays, isSameDay } from "date-fns"
import { useRef, useEffect } from "react"
import { motion } from "framer-motion"

interface DateStripProps {
  selectedDate: Date;
  onSelectDate: (date: Date) => void;
}

export function DateStrip({ selectedDate, onSelectDate }: DateStripProps) {
  const stripRef = useRef<HTMLDivElement>(null)
  
  // Generate last 14 days and today (no future days)
  const today = new Date()
  const dates = Array.from({ length: 15 }).map((_, i) => subDays(today, 14 - i))

  useEffect(() => {
    // Scroll to the end on mount (to show today)
    if (stripRef.current) {
      stripRef.current.scrollLeft = stripRef.current.scrollWidth
    }
  }, [])

  return (
    <div 
      ref={stripRef}
      className="flex overflow-x-auto gap-2 pb-2 w-full snap-x hide-scrollbar"
      style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
    >
      {dates.map((date, i) => {
        const isSelected = isSameDay(date, selectedDate)
        const isToday = isSameDay(date, today)

        return (
          <motion.button
            key={i}
            whileTap={{ scale: 0.9 }}
            onClick={() => onSelectDate(date)}
            className={`
              flex flex-col items-center justify-center min-w-[60px] h-20 rounded-2xl snap-center transition-colors
              ${isSelected ? 'bg-primary text-primary-foreground shadow-md' : 'bg-card text-muted-foreground border border-border/50 hover:border-primary/30'}
            `}
          >
            <span className="text-xs font-medium uppercase tracking-wider">{format(date, "EEE")}</span>
            <span className={`text-xl font-bold mt-1 ${isSelected ? 'text-primary-foreground' : 'text-foreground'}`}>
              {format(date, "d")}
            </span>
            {isToday && (
              <span className={`w-1 h-1 rounded-full mt-1 ${isSelected ? 'bg-primary-foreground' : 'bg-primary'}`} />
            )}
          </motion.button>
        )
      })}
    </div>
  )
}
