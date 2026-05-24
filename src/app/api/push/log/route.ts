import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { getZodError, pushLogSchema } from "@/lib/validation"
import { markPrayerMissed, upsertPrayerStatus } from "@/lib/prayer-writes"

export async function POST(req: Request) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const parsed = pushLogSchema.safeParse(await req.json())
    if (!parsed.success) {
      return NextResponse.json({ error: getZodError(parsed.error) }, { status: 400 })
    }

    const { prayerName, status, date } = parsed.data

    if (status === "missed") {
      await markPrayerMissed({ userId: session.user.id, prayerName, date })
    } else {
      await upsertPrayerStatus({ userId: session.user.id, prayerName, date, status })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error logging from push:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
