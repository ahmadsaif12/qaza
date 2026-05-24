import webpush from 'web-push';

const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY;
const vapidSubject = process.env.NEXT_PUBLIC_VAPID_SUBJECT || 'mailto:admin@qaza.com';

if (vapidPublicKey && vapidPrivateKey) {
  webpush.setVapidDetails(
    vapidSubject,
    vapidPublicKey,
    vapidPrivateKey
  );
}

export async function sendPushNotification(
  subscription: { endpoint: string; keys: { p256dh: string; auth: string } },
  payload: any
) {
  if (!vapidPublicKey || !vapidPrivateKey) {
    console.warn("VAPID keys missing, skipping push");
    return { success: false, error: "VAPID keys missing" };
  }

  try {
    await webpush.sendNotification(subscription, JSON.stringify(payload));
    return { success: true };
  } catch (error: any) {
    console.error("Error sending push notification:", error);
    return { success: false, error: error.message };
  }
}
