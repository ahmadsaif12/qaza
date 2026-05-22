"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { verifyOtp, resendOtp } from "@/actions/auth"
import { useState, use } from "react"
import { toast } from "sonner"
import { useRouter } from "next/navigation"

export default function VerifyPage(props: { searchParams?: Promise<{ email?: string }> }) {
  const searchParams = props.searchParams ? use(props.searchParams) : undefined;
  const email = searchParams?.email || ""

  const [loading, setLoading] = useState(false)
  const [resending, setResending] = useState(false)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    const formData = new FormData(e.currentTarget)
    formData.append("email", email)
    
    const result = await verifyOtp(formData)
    
    if (result.error) {
      toast.error(result.error)
      setLoading(false)
    } else {
      toast.success("Email verified successfully! You can now log in.")
      router.push("/login")
    }
  }

  const handleResend = async () => {
    setResending(true)
    const formData = new FormData()
    formData.append("email", email)
    const result = await resendOtp(formData)
    
    if (result.error) {
      toast.error(result.error)
    } else {
      toast.success("A new verification code has been sent to your email.")
    }
    setResending(false)
  }

  return (
    <div className="flex min-h-full items-center justify-center p-4 bg-background">
      <Card className="w-full max-w-md shadow-lg border-primary/10">
        <CardHeader className="space-y-2 text-center">
          <CardTitle className="text-3xl font-bold tracking-tight text-primary">Verify Email</CardTitle>
          <CardDescription>
            {email ? `We sent a 6-digit code to ${email}` : "Enter your verification code."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2 text-left">
              <Label htmlFor="otp">Verification Code</Label>
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
            <Button type="submit" disabled={loading || !email} className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-medium rounded-xl h-11">
              {loading ? "Verifying..." : "Verify Code"}
            </Button>
          </form>

          <div className="mt-4 text-center text-sm text-muted-foreground">
            Didn't receive the code?{" "}
            <button 
              type="button"
              onClick={handleResend}
              disabled={resending || !email}
              className="text-primary hover:underline font-medium disabled:opacity-50"
            >
              {resending ? "Sending..." : "Resend"}
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
