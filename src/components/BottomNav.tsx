"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Home, ListTodo, BarChart2, Settings } from "lucide-react"
import { motion } from "framer-motion"

export function BottomNav() {
  const pathname = usePathname()
  if (pathname === "/login" || pathname === "/register") return null

  const navItems = [
    { name: "Today", href: "/", icon: Home },
    { name: "Qaza", href: "/qaza", icon: ListTodo },
    { name: "Review", href: "/analytics", icon: BarChart2 },
    { name: "Settings", href: "/settings", icon: Settings },
  ]

  return (
    <div className="fixed bottom-0 left-0 right-0 p-4 pb-safe bg-background/80 backdrop-blur-md border-t border-border/50 flex justify-center z-50">
      <nav className="flex justify-around w-full max-w-md relative">
        {navItems.map((item) => {
          const isActive = pathname === item.href
          return (
            <Link key={item.name} href={item.href} className="relative flex flex-col items-center p-2 w-16">
              <item.icon className={`mb-1 transition-colors ${isActive ? 'text-primary' : 'text-muted-foreground'}`} size={24} />
              <span className={`text-[10px] font-medium transition-colors ${isActive ? 'text-primary' : 'text-muted-foreground'}`}>
                {item.name}
              </span>
              {isActive && (
                <motion.div
                  layoutId="bottom-nav-indicator"
                  className="absolute -top-1 w-8 h-1 bg-primary rounded-full"
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
