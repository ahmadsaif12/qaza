import assert from "node:assert/strict"
import { describe, it } from "node:test"
import { pushUnsubscribeBodySchema } from "@/lib/validation"
import { shouldDeletePushSubscription } from "@/lib/web-push"

describe("push notification delivery helpers", () => {
  it("classifies gone and not-found push endpoints as removable subscriptions", () => {
    assert.equal(shouldDeletePushSubscription(404), true)
    assert.equal(shouldDeletePushSubscription(410), true)
  })

  it("does not remove subscriptions for transient push delivery failures", () => {
    assert.equal(shouldDeletePushSubscription(undefined), false)
    assert.equal(shouldDeletePushSubscription(400), false)
    assert.equal(shouldDeletePushSubscription(429), false)
    assert.equal(shouldDeletePushSubscription(500), false)
    assert.equal(shouldDeletePushSubscription(503), false)
  })

  it("validates unsubscribe requests by endpoint URL", () => {
    assert.equal(
      pushUnsubscribeBodySchema.safeParse({ endpoint: "https://fcm.googleapis.com/fcm/send/test" }).success,
      true
    )
    assert.equal(pushUnsubscribeBodySchema.safeParse({ endpoint: "not-a-url" }).success, false)
    assert.equal(pushUnsubscribeBodySchema.safeParse({}).success, false)
  })
})
