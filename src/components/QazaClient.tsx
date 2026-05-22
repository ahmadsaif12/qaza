"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useState } from "react"
import { toast } from "sonner"
import { updateBulkQaza } from "@/actions/prayers"
import { Minus, Plus, Calculator } from "lucide-react"

interface QazaClientProps {
  initialBacklog: Record<string, number>;
}

export function QazaClient({ initialBacklog }: QazaClientProps) {
  const [backlog, setBacklog] = useState(initialBacklog)
  const [loading, setLoading] = useState<string | null>(null)
  const [showCalc, setShowCalc] = useState(false)
  
  // Calc state
  const [years, setYears] = useState("")
  const [months, setMonths] = useState("")

  const handleUpdate = async (prayer: string, amount: number) => {
    if (backlog[prayer] + amount < 0) return;
    setLoading(prayer)
    
    // Optimistic
    setBacklog(prev => ({ ...prev, [prayer]: prev[prayer] + amount }))
    
    const res = await updateBulkQaza(prayer, amount)
    if (res.error) {
      toast.error(res.error)
      // Revert
      setBacklog(prev => ({ ...prev, [prayer]: prev[prayer] - amount }))
    } else {
      if (amount < 0) toast.success(`Alhamdulillah! Masha'Allah on making up ${prayer}.`)
    }
    setLoading(null)
  }

  const handleCalculate = async () => {
    const totalDays = (parseInt(years || "0") * 365) + (parseInt(months || "0") * 30);
    if (totalDays <= 0) return;

    setLoading("calc")
    toast.loading("Calculating and saving bulk Qaza...", { id: "calc" })
    
    let error = false;
    for (const prayer of ["Fajr", "Dhuhr", "Asr", "Maghrib", "Isha"]) {
      const res = await updateBulkQaza(prayer, totalDays)
      if (res.error) error = true;
    }

    if (error) {
      toast.error("An error occurred during calculation.", { id: "calc" })
    } else {
      toast.success(`${totalDays} days of Qaza added. May Allah make it easy for you.`, { id: "calc" })
      // Reload page to fetch new counts
      window.location.reload()
    }
    setLoading(null)
    setShowCalc(false)
  }

  return (
    <div className="w-full max-w-md space-y-4">
      <div className="flex justify-end mb-4">
        <Button variant="outline" size="sm" onClick={() => setShowCalc(!showCalc)} className="flex items-center gap-2 rounded-xl text-primary border-primary/20">
          <Calculator size={16} />
          Lifetime Calculator
        </Button>
      </div>

      {showCalc && (
        <Card className="border-primary/20 bg-primary/5 shadow-sm mb-6">
          <CardHeader>
            <CardTitle className="text-md">Estimate Missed Prayers</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-4">
              <div className="space-y-2">
                <Label>Years missed</Label>
                <Input type="number" placeholder="e.g. 5" value={years} onChange={e => setYears(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Months missed</Label>
                <Input type="number" placeholder="e.g. 6" value={months} onChange={e => setMonths(e.target.value)} />
              </div>
            </div>
            <Button onClick={handleCalculate} disabled={loading === "calc"} className="w-full rounded-xl">
              Apply to Backlog
            </Button>
          </CardContent>
        </Card>
      )}

      {Object.entries(backlog).map(([prayer, count]) => {
        return (
          <Card key={prayer} className="border-border/60 shadow-sm bg-card hover:border-primary/30 transition-colors overflow-hidden">
            <div className="flex items-center justify-between p-4">
              <div>
                <h3 className="text-lg font-bold">{prayer}</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  <span className="font-semibold text-foreground">{count}</span> prayers left
                </p>
              </div>
              
              <div className="flex items-center gap-2 bg-muted/50 p-1 rounded-2xl">
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-10 w-10 rounded-xl hover:bg-background hover:shadow-sm"
                  onClick={() => handleUpdate(prayer, 1)}
                  disabled={loading === prayer}
                >
                  <Plus size={18} className="text-muted-foreground" />
                </Button>
                <div className="w-px h-6 bg-border/50" />
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-10 w-10 rounded-xl hover:bg-background hover:shadow-sm text-primary"
                  onClick={() => handleUpdate(prayer, -1)}
                  disabled={loading === prayer || count === 0}
                >
                  <Minus size={18} />
                </Button>
              </div>
            </div>
          </Card>
        )
      })}
    </div>
  )
}
