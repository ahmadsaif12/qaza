import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { db } from "@/db"
import { pushSubscriptions, users } from "@/db/schema"
import { eq } from "drizzle-orm"
import { getZodError, pushSubscribeBodySchema } from "@/lib/validation"

export async function POST(req: Request) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const parsed = pushSubscribeBodySchema.safeParse(await req.json())
    if (!parsed.success) {
      return NextResponse.json({ error: getZodError(parsed.error) }, { status: 400 })
    }

    const { subscription, location } = parsed.data

    if (location) {
      await db
        .update(users)
        .set({
          latitude: location.lat,
          longitude: location.lng,
          timezone: location.timezone,
        })
        .where(eq(users.id, session.user.id))
    }

    await db
      .insert(pushSubscriptions)
      .values({
        userId: session.user.id,
        endpoint: subscription.endpoint,
        p256dh: subscription.keys.p256dh,
        auth: subscription.keys.auth,
      })
      .onConflictDoUpdate({
        target: [pushSubscriptions.userId, pushSubscriptions.endpoint],
        set: {
          p256dh: subscription.keys.p256dh,
          auth: subscription.keys.auth,
        },
      })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error saving subscription:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
