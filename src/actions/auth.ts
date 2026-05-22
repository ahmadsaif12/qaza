"use server"

import { db } from "@/db"
import { users, verificationTokens } from "@/db/schema"
import { eq, and } from "drizzle-orm"
import bcrypt from "bcryptjs"
import { z } from "zod"
import nodemailer from "nodemailer"
import { signIn } from "@/auth"

const registerSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
})

export async function registerUser(formData: FormData) {
  try {
    const rawData = {
      name: formData.get("name") as string,
      email: formData.get("email") as string,
      password: formData.get("password") as string,
    }

    const parsed = registerSchema.safeParse(rawData)

    if (!parsed.success) {
      return { error: parsed.error.issues[0]?.message || "Invalid input" }
    }

    const { name, email, password } = parsed.data

    const existing = await db.query.users.findFirst({
      where: eq(users.email, email)
    })

    if (existing) {
      if (existing.emailVerified) {
        return { error: "User already exists. Please log in." }
      }
      // If not verified, we'll just update their details and send a new OTP
    }

    const salt = await bcrypt.genSalt(10)
    const hashedPassword = await bcrypt.hash(password, salt)

    if (existing) {
      await db.update(users).set({
        name,
        password: hashedPassword
      }).where(eq(users.email, email))
    } else {
      await db.insert(users).values({
        name,
        email,
        password: hashedPassword
        // emailVerified is null by default as per schema (it's not set)
      })
    }

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString()

    // Delete existing token
    await db.delete(verificationTokens).where(eq(verificationTokens.identifier, email))

    // Insert new token (expires in 15 mins)
    const expires = new Date(Date.now() + 15 * 60 * 1000)
    await db.insert(verificationTokens).values({
      identifier: email,
      token: otp,
      expires
    })

    // Send email
    if (process.env.SMTP_HOST) {
      const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: Number(process.env.SMTP_PORT) || 587,
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
      })

      await transporter.sendMail({
        from: process.env.SMTP_FROM,
        to: email,
        subject: "Verify your email for Qaza Tracker",
        text: `Your verification code is: ${otp}`,
        html: `<p>Your verification code is: <strong>${otp}</strong></p>`
      })
    } else {
      console.warn("SMTP settings not configured. OTP generated:", otp);
    }

    return { success: true }
  } catch (error) {
    console.error("Registration error", error)
    return { error: "An unexpected error occurred." }
  }
}

export async function verifyOtp(formData: FormData) {
  try {
    const email = formData.get("email") as string
    const otp = formData.get("otp") as string

    if (!email || !otp) {
      return { error: "Missing required fields" }
    }

    const tokenRecord = await db.query.verificationTokens.findFirst({
      where: and(
        eq(verificationTokens.identifier, email),
        eq(verificationTokens.token, otp)
      )
    })

    if (!tokenRecord) {
      return { error: "Invalid OTP code" }
    }

    if (new Date() > new Date(tokenRecord.expires)) {
      return { error: "OTP expired" }
    }

    // Mark email as verified
    await db.update(users)
      .set({ emailVerified: new Date() })
      .where(eq(users.email, email))

    // Delete token
    await db.delete(verificationTokens).where(eq(verificationTokens.identifier, email))

    return { success: true }
  } catch (error) {
    console.error("Verification error", error)
    return { error: "An unexpected error occurred" }
  }
}

export async function resendOtp(formData: FormData) {
  try {
    const email = formData.get("email") as string
    if (!email) return { error: "Email is required" }

    const existingUser = await db.query.users.findFirst({
      where: eq(users.email, email)
    })

    if (!existingUser) {
      return { error: "User not found" }
    }

    if (existingUser.emailVerified) {
      return { error: "Email is already verified" }
    }

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString()

    // Delete existing token
    await db.delete(verificationTokens).where(eq(verificationTokens.identifier, email))

    // Insert new token (expires in 15 mins)
    const expires = new Date(Date.now() + 15 * 60 * 1000)
    await db.insert(verificationTokens).values({
      identifier: email,
      token: otp,
      expires
    })

    // Send email
    if (process.env.SMTP_HOST) {
      const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: Number(process.env.SMTP_PORT) || 587,
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
      })

      await transporter.sendMail({
        from: process.env.SMTP_FROM,
        to: email,
        subject: "Verify your email for Qaza Tracker",
        text: `Your verification code is: ${otp}`,
        html: `<p>Your verification code is: <strong>${otp}</strong></p>`
      })
    } else {
       console.warn("SMTP settings not configured. OTP generated:", otp);
    }

    return { success: true }
  } catch (error) {
    console.error("Resend OTP error", error)
    return { error: "Failed to resend OTP" }
  }
}

export async function googleSignIn() {
  await signIn("google", { redirectTo: "/" })
}
