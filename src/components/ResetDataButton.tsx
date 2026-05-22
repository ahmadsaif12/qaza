"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { resetAllData } from "@/actions/prayers"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { AlertTriangle, X } from "lucide-react"

export function ResetDataButton() {
  const [loading, setLoading] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const router = useRouter()

  const handleReset = async () => {
    setLoading(true)
    const res = await resetAllData()
    if (res?.success) {
      toast.success("All data has been wiped. Clean slate ready!")
      setShowModal(false)
      router.push("/")
    } else {
      toast.error("Failed to reset data.")
    }
    setLoading(false)
  }

  return (
    <>
      <Button 
        variant="outline" 
        onClick={() => setShowModal(true)} 
        disabled={loading}
        className="w-full border-destructive/50 text-destructive hover:bg-destructive hover:text-white rounded-xl h-11 font-medium transition-colors"
      >
        {loading ? "Wiping Data..." : "Reset All Data (Clean Slate)"}
      </Button>

      <AnimatePresence>
        {showModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="bg-card w-full max-w-sm rounded-3xl shadow-xl overflow-hidden relative"
            >
              <button 
                onClick={() => setShowModal(false)}
                className="absolute top-4 right-4 p-2 text-muted-foreground hover:bg-muted rounded-full transition-colors"
                disabled={loading}
              >
                <X size={20} />
              </button>

              <div className="p-6 pt-10 text-center flex flex-col items-center">
                <div className="w-16 h-16 bg-destructive/10 text-destructive rounded-full flex items-center justify-center mb-4">
                  <AlertTriangle size={32} />
                </div>
                <h3 className="text-xl font-bold mb-2">Are you sure?</h3>
                <p className="text-sm text-muted-foreground mb-6">
                  This will permanently delete all your prayer logs, qaza data, and streaks. This action <strong>cannot be undone</strong>.
                </p>

                <div className="flex gap-3 w-full">
                  <Button 
                    variant="outline" 
                    className="flex-1 rounded-xl h-12" 
                    onClick={() => setShowModal(false)}
                    disabled={loading}
                  >
                    Cancel
                  </Button>
                  <Button 
                    variant="destructive" 
                    className="flex-1 rounded-xl h-12" 
                    onClick={handleReset}
                    disabled={loading}
                  >
                    {loading ? "Wiping..." : "Yes, Wipe It"}
                  </Button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
