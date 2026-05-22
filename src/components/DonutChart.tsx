"use client"

import { motion } from "framer-motion"

interface DonutChartProps {
  totalMissed: number;
  totalCovered: number;
  weeklyMissed: number;
}

export function DonutChart({ totalMissed, totalCovered, weeklyMissed }: DonutChartProps) {
  const radius = 40;
  const circumference = 2 * Math.PI * radius;
  
  // If there are no missed prayers at all, we show 100% covered.
  const percentage = totalMissed === 0 ? 100 : Math.round((totalCovered / totalMissed) * 100);
  
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <div className="flex items-center gap-6 bg-card border border-border/60 p-5 rounded-3xl shadow-sm w-full">
      <div className="relative w-28 h-28 flex-shrink-0">
        {/* Background circle */}
        <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
          <circle
            cx="50"
            cy="50"
            r={radius}
            stroke="currentColor"
            strokeWidth="10"
            fill="transparent"
            className="text-muted/30"
          />
          {/* Progress circle */}
          <motion.circle
            cx="50"
            cy="50"
            r={radius}
            stroke="currentColor"
            strokeWidth="10"
            fill="transparent"
            className="text-primary"
            strokeLinecap="round"
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset }}
            transition={{ duration: 1, ease: "easeOut" }}
            style={{
              strokeDasharray: circumference,
            }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-bold text-foreground">{percentage}%</span>
        </div>
      </div>
      
      <div className="flex-1 flex flex-col justify-center gap-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Missed</h4>
            <p className="text-2xl font-bold text-foreground leading-none mt-1">{totalMissed.toLocaleString()}</p>
          </div>
          <div>
            <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Covered</h4>
            <p className="text-2xl font-bold text-primary leading-none mt-1">{totalCovered.toLocaleString()}</p>
          </div>
        </div>
        
        <div className="flex items-center justify-between bg-primary/5 rounded-xl px-3 py-2 border border-primary/10">
          <h4 className="text-xs font-medium text-foreground">Weekly Additions</h4>
          <p className="text-sm font-bold text-primary">+{weeklyMissed}</p>
        </div>
      </div>
    </div>
  )
}
