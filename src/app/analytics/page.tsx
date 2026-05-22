"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts"
import { useQuery } from "@tanstack/react-query"
import { getWeeklyConsistency } from "@/actions/prayers"

export default function AnalyticsPage() {
  const { data: consistencyRes, isLoading } = useQuery({
    queryKey: ['weeklyConsistency'],
    queryFn: async () => await getWeeklyConsistency(),
  })

  const data = consistencyRes?.success && consistencyRes.data ? consistencyRes.data : [
    { name: "Mon", prayers: 0 },
    { name: "Tue", prayers: 0 },
    { name: "Wed", prayers: 0 },
    { name: "Thu", prayers: 0 },
    { name: "Fri", prayers: 0 },
    { name: "Sat", prayers: 0 },
    { name: "Sun", prayers: 0 },
  ]

  if (isLoading) {
    return <div className="min-h-full flex items-center justify-center bg-background"><div className="animate-pulse h-16 w-16 bg-primary/20 rounded-full" /></div>
  }

  return (
    <main className="flex min-h-full flex-col items-center p-6 bg-background pb-24">
      <header className="w-full max-w-md py-6 mb-4 border-b border-border/50 text-center">
        <h1 className="text-2xl font-bold text-foreground">Your Review</h1>
        <p className="text-muted-foreground text-sm mt-1">Alhamdulillah, look at your progress.</p>
      </header>

      <section className="w-full max-w-md space-y-4">
        <Card className="border-border/60 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg">This Week's Consistency</CardTitle>
          </CardHeader>
          <CardContent className="h-[250px] w-full min-h-[250px]">
            <ResponsiveContainer width="100%" height="100%" minHeight={250}>
              <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: 'var(--muted-foreground)' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: 'var(--muted-foreground)' }} domain={[0, 5]} />
                <Tooltip cursor={{ fill: 'var(--primary)', opacity: 0.1 }} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                <Bar dataKey="prayers" fill="var(--primary)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="border-border/60 shadow-sm bg-primary/5 border-primary/20">
          <CardHeader>
            <CardTitle className="text-lg text-primary">Streaks & Motivation</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-foreground/80">
              {(() => {
                // data[6] is today, data[5] is yesterday
                let streak = 0;
                // Count backwards from yesterday
                for (let i = 5; i >= 0; i--) {
                  if (data[i].prayers >= 5) streak++;
                  else break;
                }
                // Add today if completed
                if (data[6] && data[6].prayers >= 5) {
                  streak++;
                }

                if (streak === 0) {
                  return "Try to hit all 5 prayers today to start a new streak! May Allah make it easy for you.";
                } else if (streak === 1) {
                  return "You've hit all 5 prayers today! Great start, keep the momentum going tomorrow.";
                } else {
                  return `You've hit all 5 prayers for ${streak} days in a row. Keep up the great momentum! May Allah reward your efforts.`;
                }
              })()}
            </p>
          </CardContent>
        </Card>
      </section>
    </main>
  )
}
