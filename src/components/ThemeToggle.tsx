"use client"

import { useTheme } from "next-themes"
import { useEffect, useState } from "react"
import { Monitor, Moon, Sun } from "lucide-react"
import { Button } from "@/components/ui/button"

export function ThemeToggle() {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  // Avoid hydration mismatch
  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return <div className="h-10 w-full bg-muted rounded-xl animate-pulse" />
  }

  return (
    <div className="flex items-center gap-2 p-1 bg-muted rounded-xl border border-border/50">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setTheme("light")}
        className={`flex-1 rounded-lg transition-all ${
          theme === "light" ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground hover:bg-background/50"
        }`}
      >
        <Sun className="h-4 w-4 mr-2" />
        <span className="text-sm font-medium">Light</span>
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setTheme("dark")}
        className={`flex-1 rounded-lg transition-all ${
          theme === "dark" ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground hover:bg-background/50"
        }`}
      >
        <Moon className="h-4 w-4 mr-2" />
        <span className="text-sm font-medium">Dark</span>
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setTheme("system")}
        className={`flex-1 rounded-lg transition-all ${
          theme === "system" ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground hover:bg-background/50"
        }`}
      >
        <Monitor className="h-4 w-4 mr-2" />
        <span className="text-sm font-medium">System</span>
      </Button>
    </div>
  )
}
