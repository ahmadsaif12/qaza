import { NextResponse } from 'next/server';
import webpush from 'web-push';
import { db } from '@/db';
import { pushSubscriptions } from '@/db/schema';

// Setup VAPID keys
// webpush.setVapidDetails(
//   'mailto:admin@qazatrack.com',
//   process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
//   process.env.VAPID_PRIVATE_KEY!
// );

export async function GET(req: Request) {
  // Verify Cron secret for Vercel Cron
  if (req.headers.get('Authorization') !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // In production, fetch users and their subscriptions, and send customized reminders
    const subs = await db.select().from(pushSubscriptions);

    for (const sub of subs) {
      const payload = JSON.stringify({
        title: 'Qaza',
        body: "Just checking in, friend! Don't forget to track your prayers today.",
        icon: '/icon.png',
      });

      // Uncomment to actually send when VAPID keys are configured
      // await webpush.sendNotification({
      //   endpoint: sub.endpoint,
      //   keys: { p256dh: sub.p256dh, auth: sub.auth }
      // }, payload);
    }

    return NextResponse.json({ success: true, count: subs.length });
  } catch (error) {
    console.error('Error sending push notifications', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
