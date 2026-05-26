import assert from "node:assert/strict"
import { describe, it } from "node:test"
import { createNotificationActionToken } from "@/lib/notification-tokens"
import { resolveNotificationActionUserId } from "@/lib/notification-actions"

process.env.NOTIFICATION_ACTION_SECRET = "test-notification-action-secret"

describe("resolveNotificationActionUserId", () => {
  it("uses a valid signed notification token even when a different session user exists", () => {
    const actionToken = createNotificationActionToken({
      userId: "notification-user",
      prayerName: "fajr",
      date: "2026-05-26",
      action: "completed",
    })

    const result = resolveNotificationActionUserId({
      sessionUserId: "session-user",
      actionToken,
      prayerName: "fajr",
      date: "2026-05-26",
      action: "completed",
    })

    assert.deepEqual(result, { success: true, userId: "notification-user" })
  })

  it("rejects an invalid signed token instead of falling back to the session user", () => {
    const result = resolveNotificationActionUserId({
      sessionUserId: "session-user",
      actionToken: "invalid.token",
      prayerName: "fajr",
      date: "2026-05-26",
      action: "completed",
    })

    assert.deepEqual(result, { success: false, status: 401, error: "Unauthorized" })
  })

  it("allows tokenless in-app actions for the current session user on non-future dates", () => {
    const today = new Date()
    const localToday = new Date(today.getTime() - today.getTimezoneOffset() * 60000).toISOString().slice(0, 10)

    const result = resolveNotificationActionUserId({
      sessionUserId: "session-user",
      actionToken: undefined,
      prayerName: "dhuhr",
      date: localToday,
      action: "missed",
    })

    assert.deepEqual(result, { success: true, userId: "session-user" })
  })

  it("rejects tokenless in-app actions for future dates", () => {
    const result = resolveNotificationActionUserId({
      sessionUserId: "session-user",
      actionToken: undefined,
      prayerName: "isha",
      date: "9999-01-01",
      action: "missed",
    })

    assert.equal(result.success, false)
    if (!result.success) {
      assert.equal(result.status, 400)
    }
  })

  it("requires either a session user or a valid signed token", () => {
    const result = resolveNotificationActionUserId({
      sessionUserId: undefined,
      actionToken: undefined,
      prayerName: "asr",
      date: "2026-05-26",
      action: "completed",
    })

    assert.deepEqual(result, { success: false, status: 401, error: "Unauthorized" })
  })
})
