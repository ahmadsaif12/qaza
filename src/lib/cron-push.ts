import { db } from "@/db";
import { pushSubscriptions } from "@/db/schema";
import { sendPushNotification } from "@/lib/web-push";
import { and, eq } from "drizzle-orm";

type PushSubscriptionRecord = {
  id: string;
  endpoint: string;
  p256dh: string;
  auth: string;
};

type CronPushDeliveryResult = {
  sentToAtLeastOne: boolean;
  expiredSubscriptions: number;
  failures: number;
};

export async function sendCronPushNotifications({
  userId,
  subscriptions,
  payload,
}: {
  userId: string;
  subscriptions: PushSubscriptionRecord[];
  payload: Record<string, unknown>;
}): Promise<CronPushDeliveryResult> {
  let sentToAtLeastOne = false;
  let expiredSubscriptions = 0;
  let failures = 0;

  for (const sub of subscriptions) {
    const result = await sendPushNotification(
      { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
      payload
    );

    if (result.success) {
      sentToAtLeastOne = true;
      continue;
    }

    if (result.shouldDeleteSubscription) {
      await db
        .delete(pushSubscriptions)
        .where(and(eq(pushSubscriptions.id, sub.id), eq(pushSubscriptions.userId, userId)));
      expiredSubscriptions++;
      continue;
    }

    failures++;
    console.error("Error sending push notification", {
      userId,
      subscriptionId: sub.id,
      statusCode: result.statusCode,
      error: result.error,
    });
  }

  return { sentToAtLeastOne, expiredSubscriptions, failures };
}
