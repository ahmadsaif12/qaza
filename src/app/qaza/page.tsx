import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { getQazaBacklog } from "@/actions/prayers"
import { QazaClient } from "@/components/QazaClient"

export default async function QazaPage() {
  const session = await auth()
  if (!session?.user) redirect("/login")

  const backlogRes = await getQazaBacklog()
  const qazaBacklog = backlogRes.success && backlogRes.data ? backlogRes.data : {
    Fajr: 0, Dhuhr: 0, Asr: 0, Maghrib: 0, Isha: 0
  }

  return (
    <main className="flex min-h-full flex-col items-center p-6 bg-background pb-24">
      <header className="w-full max-w-md py-6 mb-4 border-b border-border/50 text-center">
        <h1 className="text-2xl font-bold text-foreground">Gentle Qaza Manager</h1>
        <p className="text-muted-foreground text-sm mt-1">Don't rush. Let's catch up one prayer at a time.</p>
      </header>

      <section className="w-full max-w-md space-y-4">
        <QazaClient initialBacklog={qazaBacklog} />
      </section>
    </main>
  )
}
