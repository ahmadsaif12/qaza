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
      <div className="space-y-4">
        <DonutChart totalMissed={stats.donut.totalMissed} totalCovered={stats.donut.totalCovered} />
        
        <div className="flex items-center gap-4 bg-primary/5 border border-primary/10 rounded-2xl p-4">
          <div className="flex-1">
            <h4 className="text-sm font-semibold text-foreground">Weekly Additions</h4>
            <p className="text-xs text-muted-foreground mt-1">Missed in the last 7 days</p>
          </div>
          <div className="text-2xl font-bold text-primary">+{stats.weeklyMissed}</div>
        </div>
      </div>

      <div className="pt-2">
        <h3 className="text-lg font-bold mb-4">Your Qaza List</h3>
        <div className="space-y-3">
          {Object.entries(stats.backlog).map(([prayer, count]) => {
            return (
              <Card 
                key={prayer} 
                onClick={() => setSelectedPrayer(prayer)}
                className="border-border/60 shadow-sm bg-card hover:border-primary/30 transition-all overflow-hidden cursor-pointer active:scale-[0.98]"
              >
                <div className="flex items-center justify-between p-5">
                  <div>
                    <h3 className="text-lg font-bold">{prayer}</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      <span className="font-semibold text-foreground">{count}</span> remaining
                    </p>
                  </div>
                  <ChevronRight className="text-muted-foreground/50" />
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
