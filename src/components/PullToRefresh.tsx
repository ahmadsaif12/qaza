"use client"

import { useState, useRef, useEffect } from "react"
import { motion, useAnimation } from "framer-motion"
import { useQueryClient } from "@tanstack/react-query"
import { Loader2 } from "lucide-react"

interface PullToRefreshProps {
  children: React.ReactNode
}

const THRESHOLD = 80 // Pull distance required to trigger refresh
const MAX_PULL = 150 // Maximum visual pull distance

export function PullToRefresh({ children }: PullToRefreshProps) {
  const [isPulling, setIsPulling] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [pullProgress, setPullProgress] = useState(0) // 0 to 1
  
  const queryClient = useQueryClient()
  const controls = useAnimation()
  
  const containerRef = useRef<HTMLDivElement>(null)
  const startY = useRef(0)
  const currentY = useRef(0)
  
  useEffect(() => {
    const el = containerRef.current
    if (!el) return

    const handleTouchStart = (e: TouchEvent) => {
      if (el.scrollTop > 0) return // Only start if at top
      startY.current = e.touches[0].clientY
      currentY.current = e.touches[0].clientY
      setIsPulling(true)
    }

    const handleTouchMove = (e: TouchEvent) => {
      if (!isPulling || isRefreshing) return
      
      currentY.current = e.touches[0].clientY
      const deltaY = currentY.current - startY.current
      
      // Only care about pulling down
      if (deltaY > 0 && el.scrollTop <= 0) {
        // Prevent default scroll behavior if we're pulling down at the top
        if (e.cancelable) {
          e.preventDefault()
        }
        
        // Add resistance (e.g. logarithmic or fractional)
        const pullDistance = Math.min(deltaY * 0.4, MAX_PULL)
        const progress = Math.min(pullDistance / THRESHOLD, 1)
        
        setPullProgress(progress)
        controls.set({ y: pullDistance })
      }
    }

    const handleTouchEnd = async () => {
      if (!isPulling) return
      setIsPulling(false)
      
      const deltaY = currentY.current - startY.current
      const pullDistance = Math.min(deltaY * 0.4, MAX_PULL)

      if (pullDistance >= THRESHOLD && !isRefreshing) {
        setIsRefreshing(true)
        controls.start({ y: 50, transition: { type: "spring", stiffness: 300, damping: 25 } })
        
        // Trigger the refresh!
        try {
          await queryClient.invalidateQueries()
          // Optionally add a minimum delay so the loading state feels satisfying
          await new Promise(resolve => setTimeout(resolve, 600))
        } finally {
          setIsRefreshing(false)
          controls.start({ y: 0, transition: { type: "spring", stiffness: 300, damping: 25 } })
          setPullProgress(0)
        }
      } else {
        // Snap back if threshold not met
        controls.start({ y: 0, transition: { type: "spring", stiffness: 300, damping: 25 } })
        setPullProgress(0)
      }
    }

    el.addEventListener("touchstart", handleTouchStart, { passive: true })
    el.addEventListener("touchmove", handleTouchMove, { passive: false }) // non-passive to allow preventDefault
    el.addEventListener("touchend", handleTouchEnd, { passive: true })

    return () => {
      el.removeEventListener("touchstart", handleTouchStart)
      el.removeEventListener("touchmove", handleTouchMove)
      el.removeEventListener("touchend", handleTouchEnd)
    }
  }, [isPulling, isRefreshing, controls, queryClient])

  return (
    <div 
      ref={containerRef} 
      className="flex-1 w-full overflow-y-auto overscroll-y-contain relative flex flex-col"
    >
      {/* Background fixed pull indicator */}
      <div className="absolute top-0 left-0 right-0 h-16 flex items-center justify-center -z-10">
        <motion.div 
          className="flex items-center justify-center bg-primary/10 text-primary rounded-full px-4 py-2"
          animate={{ 
            opacity: isRefreshing ? 1 : pullProgress,
            scale: isRefreshing ? 1 : 0.8 + (pullProgress * 0.2)
          }}
        >
          {isRefreshing ? (
            <div className="flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span className="text-xs font-semibold">Refreshing...</span>
            </div>
          ) : (
            <span className="text-xs font-semibold">
              {pullProgress >= 1 ? "Release to refresh" : "Pull to refresh"}
            </span>
          )}
        </motion.div>
      </div>

      {/* Foreground content that moves down */}
      <motion.div 
        animate={controls}
        className="flex-1 w-full flex flex-col bg-background relative z-0"
        style={{ touchAction: isPulling ? "none" : "auto" }}
      >
        {children}
      </motion.div>
    </div>
  )
}
