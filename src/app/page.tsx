import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { HomeClient } from "@/components/HomeClient"

export default async function Home() {
  const session = await auth()
  
  if (!session?.user) {
    redirect("/login")
  }

  return (
    <main className="flex min-h-screen flex-col items-center p-6 bg-background selection:bg-primary/20">
      <header className="w-full max-w-md flex justify-between items-center py-6 mb-6 border-b border-border/50">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Assalamu Alaikum, {session.user.name?.split(' ')[0] || 'Friend'}</h1>
          <p className="text-muted-foreground text-sm mt-1">Let's catch up together.</p>
        </div>
        <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-lg shadow-sm border border-primary/20">
          {session.user.name?.charAt(0) || 'U'}
        </div>
      </header>

      <HomeClient />
    </main>
  )
}
