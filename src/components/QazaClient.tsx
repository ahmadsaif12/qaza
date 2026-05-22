"use client"

import { Card } from "@/components/ui/card"
import { useState } from "react"
import { ChevronRight } from "lucide-react"
import { DonutChart } from "@/components/DonutChart"
import { QazaDetailSheet } from "@/components/QazaDetailSheet"

interface QazaClientProps {
  stats: {
    backlog: Record<string, number>;
    donut: { totalMissed: number, totalCovered: number, remaining: number };
    weeklyMissed: number;
  };
}

export function QazaClient({ stats }: QazaClientProps) {
  const [selectedPrayer, setSelectedPrayer] = useState<string | null>(null)
  
  return (
    <div className="w-full max-w-md space-y-6">
      
      {/* Visualizations */}
      <DonutChart 
        totalMissed={stats.donut.totalMissed} 
        totalCovered={stats.donut.totalCovered} 
        weeklyMissed={stats.weeklyMissed} 
      />

      <div className="pt-2">
        <h3 className="text-lg font-bold mb-4">Your Qaza List</h3>
        <div className="grid grid-cols-2 gap-3">
          {Object.entries(stats.backlog).map(([prayer, count], index, arr) => {
            const isLast = index === arr.length - 1;
            return (
              <Card 
                key={prayer} 
                onClick={() => setSelectedPrayer(prayer)}
                className={`border-border/60 shadow-sm bg-card hover:border-primary/30 transition-all overflow-hidden cursor-pointer active:scale-[0.98] flex flex-col justify-center p-4 min-h-[100px] ${isLast ? 'col-span-2 mx-auto w-full max-w-[50%]' : ''}`}
              >
                <div className="flex flex-col items-center text-center">
                  <h3 className="text-lg font-bold">{prayer}</h3>
                  <p className="text-xs text-muted-foreground mt-1">
                    <span className="font-semibold text-foreground text-sm">{count}</span> remaining
                  </p>
                </div>
              </Card>
            )
          })}
        </div>
      </div>

      <QazaDetailSheet 
        prayer={selectedPrayer || ""} 
        isOpen={!!selectedPrayer} 
        onClose={() => {
          setSelectedPrayer(null);
          window.location.reload(); // Reload to refresh main stats
        }} 
      />
    </div>
  )
}
