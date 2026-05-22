import { auth, signOut } from "@/auth"
import { redirect } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { PushToggle } from "@/components/PushToggle"

export default async function SettingsPage() {
  const session = await auth()
  if (!session?.user) redirect("/login")

  return (
    <main className="flex min-h-full flex-col items-center p-6 bg-background pb-24">
      <header className="w-full max-w-md py-6 mb-4 border-b border-border/50 text-center">
        <h1 className="text-2xl font-bold text-foreground">Settings</h1>
        <p className="text-muted-foreground text-sm mt-1">Manage your account and preferences.</p>
      </header>

      <section className="w-full max-w-md space-y-4">
        <Card className="border-border/60 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg">Notifications</CardTitle>
          </CardHeader>
          <CardContent>
            <PushToggle />
          </CardContent>
        </Card>

        <Card className="border-border/60 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg">Account Profile</CardTitle>
            <CardDescription>Logged in as {session.user.email}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <form
              action={async () => {
                "use server"
                await signOut({ redirectTo: "/login" })
              }}
            >
              <Button type="submit" variant="destructive" className="w-full rounded-xl h-11 font-medium">
                Log Out
              </Button>
            </form>
          </CardContent>
        </Card>
      </section>
    </main>
  )
}
