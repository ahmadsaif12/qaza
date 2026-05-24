"use client"

import { useTheme } from "next-themes"
import { useEffect, useState } from "react"
import { Monitor, Moon, Sun, Check } from "lucide-react"

const THEMES = [
  { id: "system", name: "Auto", icon: <Monitor className="w-4 h-4" />, colorClass: "" },
  { id: "light", name: "Light", icon: <Sun className="w-4 h-4" />, colorClass: "" },
  { id: "dark", name: "Dark", icon: <Moon className="w-4 h-4" />, colorClass: "" },
  { id: "ocean", name: "Ocean", icon: null, colorClass: "bg-[#258296]" }, // Cyan/Blue
  { id: "rose", name: "Rose", icon: null, colorClass: "bg-[#e14d7a]" }, // Rose/Pink
  { id: "lavender", name: "Lavender", icon: null, colorClass: "bg-[#8b5a96]" }, // Purple
]

export function ThemeToggle() {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  // Avoid hydration mismatch
  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return <div className="h-24 w-full bg-muted rounded-xl animate-pulse" />
  }

  return (
    <div className="grid grid-cols-3 gap-3">
      {THEMES.map((t) => {
        const isActive = theme === t.id
        return (
          <button
            key={t.id}
            onClick={() => setTheme(t.id)}
            className={`
              relative flex items-center justify-center gap-2 p-3 rounded-2xl border transition-all select-none
              ${isActive 
                ? 'bg-card border-primary ring-1 ring-primary/30 shadow-sm' 
                : 'bg-muted/30 border-border/50 hover:bg-muted/60 text-muted-foreground hover:text-foreground'}
            `}
          >
            {isActive && (
              <div className="absolute top-1.5 right-1.5 w-3.5 h-3.5 bg-primary rounded-full flex items-center justify-center shadow-sm">
                <Check className="w-2.5 h-2.5 text-primary-foreground" />
              </div>
            )}
            
            {t.icon ? (
              <span className={isActive ? "text-primary" : ""}>{t.icon}</span>
            ) : (
              <span className={`shrink-0 w-4 h-4 rounded-full shadow-sm border border-black/10 ${t.colorClass}`} />
            )}
            <span className={`text-sm font-semibold ${isActive ? "text-foreground" : ""}`}>
              {t.name}
            </span>
          </button>
        )
      })}
    </div>
  )
}
