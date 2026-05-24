"use client"

import { useState, useSyncExternalStore } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { CheckCircle2, History, Star, ChevronRight, X } from "lucide-react"
import { Button } from "@/components/ui/button"

const steps = [
  {
    title: "Track Daily Prayers",
    description: "Easily log your 5 daily prayers to stay consistent and accountable with your faith.",
    icon: <CheckCircle2 className="w-16 h-16 text-primary" />,
    color: "bg-primary/10 border-primary/20",
  },
  {
    title: "Recover Missed Qaza",
    description: "Automatically calculate and recover your past missed prayers over time.",
    icon: <History className="w-16 h-16 text-blue-500" />,
    color: "bg-blue-500/10 border-blue-500/20",
  },
  {
    title: "Build Your Streak",
    description: "Gamify your consistency. Review your weekly progress and earn daily streaks!",
    icon: <Star className="w-16 h-16 text-amber-500 fill-amber-500" />,
    color: "bg-amber-500/10 border-amber-500/20",
  },
]

function subscribeToOnboarding(callback: () => void) {
  window.addEventListener("storage", callback)
  return () => window.removeEventListener("storage", callback)
}

function getOnboardingSnapshot() {
  return localStorage.getItem("qazatrack_onboarded") !== "true"
}

export function OnboardingWizard() {
  const shouldShowOnboarding = useSyncExternalStore(subscribeToOnboarding, getOnboardingSnapshot, () => false)
  const [dismissed, setDismissed] = useState(false)
  const [currentStep, setCurrentStep] = useState(0)
  const isOpen = shouldShowOnboarding && !dismissed

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(prev => prev + 1)
    } else {
      finishOnboarding()
    }
  }

  const finishOnboarding = () => {
    localStorage.setItem("qazatrack_onboarded", "true")
    setDismissed(true)
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[110] flex flex-col items-center justify-center bg-black/40 backdrop-blur-sm p-4 sm:p-6"
        >
          <motion.div
            initial={{ y: "100%", opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: "100%", opacity: 0 }}
            transition={{ type: "spring", bounce: 0, duration: 0.4 }}
            className="w-full max-w-md bg-card rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden flex flex-col relative"
          >
            <button 
              onClick={finishOnboarding}
              className="absolute top-4 right-4 p-2 text-muted-foreground hover:bg-muted rounded-full z-10 transition-colors"
            >
              <X size={20} />
            </button>

            <div className="p-8 pt-12 flex flex-col items-center text-center min-h-[320px]">
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentStep}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.2 }}
                  className="flex flex-col items-center"
                >
                  <div className={`w-32 h-32 rounded-full flex items-center justify-center mb-6 border-2 ${steps[currentStep].color}`}>
                    {steps[currentStep].icon}
                  </div>
                  <h2 className="text-2xl font-bold mb-3">{steps[currentStep].title}</h2>
                  <p className="text-muted-foreground">{steps[currentStep].description}</p>
                </motion.div>
              </AnimatePresence>
            </div>

            <div className="px-8 pb-8 flex flex-col gap-6">
              <div className="flex justify-center gap-2">
                {steps.map((_, i) => (
                  <div 
                    key={i} 
                    className={`h-2 rounded-full transition-all duration-300 ${
                      i === currentStep ? "w-8 bg-primary" : "w-2 bg-primary/20"
                    }`}
                  />
                ))}
              </div>

              <Button 
                onClick={handleNext} 
                className="w-full h-12 rounded-xl text-lg font-semibold"
              >
                {currentStep === steps.length - 1 ? "Start My Journey" : "Continue"}
                {currentStep < steps.length - 1 && <ChevronRight className="ml-2 w-5 h-5" />}
              </Button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
