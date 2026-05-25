"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Home, ListTodo, BarChart2, Settings } from "lucide-react"
import { motion } from "framer-motion"
import { QuickCatchUp } from "@/components/QuickCatchUp"

export function BottomNav() {
  const pathname = usePathname()
  if (pathname === "/login" || pathname === "/register" || pathname === "/verify" || pathname === "/forgot-password") return null

  const navItems = [
    { name: "Today", href: "/", icon: Home },
    { name: "Qaza", href: "/qaza", icon: ListTodo },
    { name: "Review", href: "/analytics", icon: BarChart2 },
    { name: "Settings", href: "/settings", icon: Settings },
  ]

  return (
    <div className="fixed bottom-0 left-0 right-0 pt-3 pb-[max(1.25rem,env(safe-area-inset-bottom))] bg-background/80 backdrop-blur-md border-t border-border/50 flex justify-center z-[100]">
      <nav className="flex items-center justify-around w-full max-w-md relative px-4">
        {navItems.slice(0, 2).map((item) => {
          const isActive = pathname === item.href
          return (
            <Link key={item.name} href={item.href} prefetch={false} className="relative flex flex-col items-center p-3 w-16 min-h-[44px] min-w-[44px] active:scale-95 transition-transform">
              <item.icon className={`mb-1 transition-colors ${isActive ? 'text-primary' : 'text-muted-foreground'}`} size={24} />
              <span className={`text-[10px] font-medium transition-colors ${isActive ? 'text-primary' : 'text-muted-foreground'}`}>
                {item.name}
              </span>
              {isActive && (
                <motion.div
                  layoutId="bottom-nav-indicator"
                  className="absolute -top-1 w-8 h-1 bg-primary rounded-full pointer-events-none"
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                />
              )}
            </Link>
          )
        })}

        {/* Central Bulge Button for Quick Catch-Up */}
        <QuickCatchUp />

        {navItems.slice(2, 4).map((item) => {
          const isActive = pathname === item.href
          return (
            <Link key={item.name} href={item.href} prefetch={false} className="relative flex flex-col items-center p-3 w-16 min-h-[44px] min-w-[44px] active:scale-95 transition-transform">
              <item.icon className={`mb-1 transition-colors ${isActive ? 'text-primary' : 'text-muted-foreground'}`} size={24} />
              <span className={`text-[10px] font-medium transition-colors ${isActive ? 'text-primary' : 'text-muted-foreground'}`}>
                {item.name}
              </span>
              {isActive && (
                <motion.div
                  layoutId="bottom-nav-indicator"
                  className="absolute -top-1 w-8 h-1 bg-primary rounded-full pointer-events-none"
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                />
              )}
            </Link>
          )
        })}
      </nav>
    </div>
  )
}
