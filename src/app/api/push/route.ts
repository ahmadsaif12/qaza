import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { db } from "@/db"
import { pushSubscriptions } from "@/db/schema"
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

    const { subscription } = parsed.data

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
    console.error("Error saving subscription", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
