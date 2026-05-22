"use client"

import { motion } from "framer-motion"

interface DonutChartProps {
  totalMissed: number;
  totalCovered: number;
}

export function DonutChart({ totalMissed, totalCovered }: DonutChartProps) {
  const radius = 40;
  const circumference = 2 * Math.PI * radius;
  
  // If there are no missed prayers at all, we show 100% covered.
  const percentage = totalMissed === 0 ? 100 : Math.round((totalCovered / totalMissed) * 100);
  
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <div className="flex items-center gap-6 bg-card border border-border/60 p-5 rounded-3xl shadow-sm w-full">
      <div className="relative w-24 h-24 flex-shrink-0">
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
          <span className="text-xl font-bold text-foreground">{percentage}%</span>
        </div>
      </div>
      
      <div className="flex-1 space-y-3">
        <div>
          <h4 className="text-sm font-medium text-muted-foreground">Total Missed</h4>
          <p className="text-xl font-bold text-foreground">{totalMissed.toLocaleString()}</p>
        </div>
        <div>
          <h4 className="text-sm font-medium text-muted-foreground">Covered</h4>
          <p className="text-xl font-bold text-primary">{totalCovered.toLocaleString()}</p>
        </div>
      </div>
    </div>
  )
}
