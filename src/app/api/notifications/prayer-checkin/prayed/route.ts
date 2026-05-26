import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { markPrayerCompleted } from "@/lib/prayer-writes"
import { resolveNotificationActionUserId } from "@/lib/notification-actions"
import { getZodError, notificationActionRequestSchema } from "@/lib/validation"

export async function POST(request: Request) {
  try {
    const session = await auth()
    const parsed = notificationActionRequestSchema.safeParse(await request.json())

    if (!parsed.success) {
      return NextResponse.json({ success: false, error: getZodError(parsed.error) }, { status: 400 })
    }

    const { prayerName, date, actionToken } = parsed.data
    const actionUser = resolveNotificationActionUserId({
      sessionUserId: session?.user?.id,
      actionToken,
      prayerName,
      date,
      action: "completed",
    })

    if (!actionUser.success) {
      return NextResponse.json(
        { success: false, error: actionUser.error },
        { status: actionUser.status }
      )
    }

    await markPrayerCompleted({ userId: actionUser.userId, prayerName, date })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Notification prayed action failed", error)
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}
