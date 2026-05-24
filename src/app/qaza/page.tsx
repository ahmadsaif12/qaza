import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { getQazaStats } from "@/actions/prayers"
import { QazaClient } from "@/components/QazaClient"

export default async function QazaPage() {
  const session = await auth()
  if (!session?.user) redirect("/login")

  const statsRes = await getQazaStats()
  const stats = statsRes.success && statsRes.data ? statsRes.data : {
    backlog: { Fajr: 0, Dhuhr: 0, Asr: 0, Maghrib: 0, Isha: 0 },
    donut: { totalMissed: 0, totalCovered: 0, remaining: 0 },
    weeklyMissed: 0,
    todayCompletedCount: 0
  }

  return (
    <main className="flex min-h-full flex-col items-center p-6 bg-background">
      <header className="w-full max-w-md py-6 mb-4 border-b border-border/50 text-center">
        <h1 className="text-2xl font-bold text-foreground">Qaza Tracker</h1>
        <p className="text-muted-foreground text-sm mt-1">Don't rush. Let's catch up one prayer at a time.</p>
      </header>

      <section className="w-full max-w-md space-y-4">
        <QazaClient stats={stats} />
      </section>
    </main>
  )
}
