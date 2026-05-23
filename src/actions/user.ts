"use server"

import { db } from "@/db"
import { users } from "@/db/schema"
import { eq } from "drizzle-orm"
import { auth } from "@/auth"
import { revalidatePath } from "next/cache"

export async function getUserPreferences() {
  const session = await auth()
  if (!session?.user?.id) return { error: "Unauthorized" }
  
  try {
    const user = await db.query.users.findFirst({
      where: eq(users.id, session.user.id),
      columns: {
        latitude: true,
        longitude: true,
        timezone: true,
        calcMethod: true,
        asrMethod: true,
        trackWitr: true,
        qazaPace: true,
        excusedRanges: true,
      }
    })
    
    if (!user) return { error: "User not found" }
    
    return {
      success: true,
      data: {
        ...user,
        qazaPace: user.qazaPace ? JSON.parse(user.qazaPace) : null,
        excusedRanges: user.excusedRanges ? JSON.parse(user.excusedRanges) : [],
      }
    }
  } catch (e) {
    console.error(e)
    return { error: "Failed to fetch user preferences" }
  }
}

export async function updateUserPreferences(data: {
  calcMethod?: number
  asrMethod?: number
  trackWitr?: boolean
  qazaPace?: any
  excusedRanges?: any
}) {
  const session = await auth()
  if (!session?.user?.id) return { error: "Unauthorized" }

  const updateData: any = {}
  if (data.calcMethod !== undefined) updateData.calcMethod = data.calcMethod
  if (data.asrMethod !== undefined) updateData.asrMethod = data.asrMethod
  if (data.trackWitr !== undefined) updateData.trackWitr = data.trackWitr
  if (data.qazaPace !== undefined) updateData.qazaPace = JSON.stringify(data.qazaPace)
  if (data.excusedRanges !== undefined) updateData.excusedRanges = JSON.stringify(data.excusedRanges)

  try {
    await db.update(users).set(updateData).where(eq(users.id, session.user.id))
    revalidatePath("/")
    revalidatePath("/settings")
    revalidatePath("/qaza")
    revalidatePath("/analytics")
    return { success: true }
  } catch (e) {
    console.error(e)
    return { error: "Failed to update user preferences" }
  }
}

export async function updateUserLocation(lat: number, lng: number, timezone: string) {
  const session = await auth()
  if (!session?.user?.id) return { error: "Unauthorized" }

  try {
    await db.update(users).set({
      latitude: lat,
      longitude: lng,
      timezone,
    }).where(eq(users.id, session.user.id))
    
    revalidatePath("/")
    revalidatePath("/settings")
    return { success: true }
  } catch (e) {
    console.error(e)
    return { error: "Failed to update location" }
  }
}
