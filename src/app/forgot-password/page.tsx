"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { sendForgotPasswordOtp, resetPassword } from "@/actions/auth"
import { useState } from "react"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import Link from "next/link"

export default function ForgotPasswordPage() {
  const [step, setStep] = useState<1 | 2>(1)
  const [loading, setLoading] = useState(false)
  const [email, setEmail] = useState("")
  const router = useRouter()

  const handleSendOtp = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    const formData = new FormData(e.currentTarget)
    const submittedEmail = formData.get("email") as string
    
    const result = await sendForgotPasswordOtp(formData)
    
    if (result.error) {
      toast.error(result.error)
      setLoading(false)
    } else {
      toast.success("If the email exists, a reset code has been sent.")
      setEmail(submittedEmail)
      setStep(2)
      setLoading(false)
    }
  }

  const handleResetPassword = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    const formData = new FormData(e.currentTarget)
    formData.append("email", email)
    
    const result = await resetPassword(formData)
    
    if (result.error) {
      toast.error(result.error)
      setLoading(false)
    } else {
      toast.success("Password reset successfully! You can now log in.")
      router.push("/login")
    }
  }

  return (
    <div className="flex min-h-full items-center justify-center p-4 bg-background">
      <Card className="w-full max-w-md shadow-lg border-primary/10">
        <CardHeader className="space-y-2 text-center">
          <CardTitle className="text-3xl font-bold tracking-tight text-primary">Forgot Password</CardTitle>
          <CardDescription>
            {step === 1 ? "Enter your email to receive a reset code." : "Enter your code and a new password."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {step === 1 ? (
            <form onSubmit={handleSendOtp} className="space-y-4">
              <div className="space-y-2 text-left">
                <Label htmlFor="email">Email</Label>
                <Input id="email" name="email" type="email" placeholder="test@example.com" required />
              </div>
              <Button type="submit" disabled={loading} className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-medium rounded-xl h-11">
                {loading ? "Sending..." : "Send Reset Code"}
              </Button>
            </form>
          ) : (
            <form onSubmit={handleResetPassword} className="space-y-4">
              <div className="space-y-2 text-left">
                <Label htmlFor="otp">Reset Code</Label>
                <Input 
                  id="otp" 
                  name="otp" 
                  type="text" 
                  placeholder="123456" 
                  maxLength={6}
                  required 
                  className="text-center tracking-widest text-lg"
                />
              </div>
              <div className="space-y-2 text-left">
                <Label htmlFor="newPassword">New Password</Label>
                <Input id="newPassword" name="newPassword" type="password" placeholder="••••••••" required minLength={8} />
              </div>
              <Button type="submit" disabled={loading} className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-medium rounded-xl h-11">
                {loading ? "Resetting..." : "Reset Password"}
              </Button>
            </form>
          )}

          <div className="mt-4 text-center text-sm text-muted-foreground">
            Remember your password?{" "}
            <Link href="/login" className="text-primary hover:underline font-medium">
              Log in
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
