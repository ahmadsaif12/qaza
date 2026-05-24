import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { markPrayerMissed } from "@/lib/prayer-writes"
import { verifyNotificationActionToken } from "@/lib/notification-tokens"
import { getZodError, notificationActionRequestSchema } from "@/lib/validation"

export async function POST(request: Request) {
  try {
    const session = await auth()
    const parsed = notificationActionRequestSchema.safeParse(await request.json())

    if (!parsed.success) {
      return NextResponse.json({ success: false, error: getZodError(parsed.error) }, { status: 400 })
    }

    const { prayerName, date, actionToken } = parsed.data
    let userId = session?.user?.id

    if (!userId) {
      const tokenPayload = verifyNotificationActionToken(actionToken, {
        prayerName,
        date,
        action: "missed",
      })

      if (!tokenPayload) {
        return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
      }

      userId = tokenPayload.userId
    }

    await markPrayerMissed({ userId, prayerName, date })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Notification qaza action failed", error)
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}
