"use client"

import { useState } from "react"
import { useQueryClient } from "@tanstack/react-query"
import { Button } from "@/components/ui/button"
import { logout } from "@/actions/session"
import { clearQazaClientStorage } from "@/lib/client-storage"

export function LogoutButton() {
  const queryClient = useQueryClient()
  const [isLoggingOut, setIsLoggingOut] = useState(false)

  const handleLogout = async () => {
    setIsLoggingOut(true)
    queryClient.clear()
    await clearQazaClientStorage()
    await logout()
  }

  return (
    <Button
      type="button"
      variant="secondary"
      className="w-full rounded-xl h-12 font-semibold bg-muted text-foreground hover:bg-muted/80 transition-colors"
      disabled={isLoggingOut}
      onClick={handleLogout}
    >
      {isLoggingOut ? "Logging out..." : "Log Out"}
    </Button>
  )
}
