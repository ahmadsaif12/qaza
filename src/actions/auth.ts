"use server"

import { db } from "@/db"
import { users } from "@/db/schema"
import { eq } from "drizzle-orm"
import bcrypt from "bcryptjs"

export async function registerUser(formData: FormData) {
  const name = formData.get("name") as string
  const email = formData.get("email") as string
  const password = formData.get("password") as string

  if (!name || !email || !password) {
    return { error: "Missing required fields." }
  }

  try {
    const existing = await db.query.users.findFirst({
      where: eq(users.email, email)
    })

    if (existing) {
      return { error: "User already exists. Please log in." }
    }

    const salt = await bcrypt.genSalt(10)
    const hashedPassword = await bcrypt.hash(password, salt)

    await db.insert(users).values({
      name,
      email,
      password: hashedPassword
    })

    return { success: true }
  } catch (error) {
    console.error("Registration error", error)
    return { error: "An unexpected error occurred." }
  }
}
