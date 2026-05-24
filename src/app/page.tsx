import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { HomeClient } from "@/components/HomeClient"
import { Suspense } from "react"

export default async function Home() {
  const session = await auth()
  
  if (!session?.user) {
    redirect("/login")
  }

  return (
    <main className="flex min-h-full flex-col items-center p-6 bg-background selection:bg-primary/20">
      <Suspense fallback={null}>
        <HomeClient userName={session.user.name?.split(' ')[0] || 'Friend'} />
      </Suspense>
    </main>
  )
}
