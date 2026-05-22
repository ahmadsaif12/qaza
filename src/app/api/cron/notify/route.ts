import { NextResponse } from 'next/server';
import { db } from '@/db';
import webpush from 'web-push';
import { prayerLogs } from '@/db/schema';
import { and, eq } from 'drizzle-orm';

const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY;

if (vapidPublicKey && vapidPrivateKey) {
  webpush.setVapidDetails(
    process.env.NEXT_PUBLIC_VAPID_SUBJECT || 'mailto:admin@qazatracker.com',
    vapidPublicKey,
    vapidPrivateKey
  );
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    if (searchParams.get('secret') !== process.env.CRON_SECRET) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!vapidPublicKey || !vapidPrivateKey) {
      return NextResponse.json({ error: 'VAPID keys not configured' }, { status: 500 });
    }

    // Get all subscriptions with user details
    const subs = await db.query.pushSubscriptions.findMany({
      with: {
        user: true
      }
    });

    const now = new Date();
    let sentCount = 0;

    const notifications = subs.map(async (sub) => {
      // @ts-ignore
      const user = sub.user;
      if (!user) return;

      // Determine the user's local date
      let localDateStr = now.toISOString().split('T')[0];
      if (user.timezone) {
        try {
          localDateStr = now.toLocaleDateString('en-CA', { timeZone: user.timezone });
        } catch (e) {
          console.warn("Invalid timezone", user.timezone);
        }
      }

      // Check how many prayers they logged today
      const logsToday = await db.query.prayerLogs.findMany({
        where: and(
          eq(prayerLogs.userId, user.id),
          eq(prayerLogs.date, localDateStr)
        )
      });

      const completedCount = logsToday.filter(l => l.status === 'completed' || l.status === 'qaza_completed').length;

      // If they haven't prayed all 5, send a reminder
      if (completedCount < 5) {
        const payload = JSON.stringify({
          title: `End of Day Reminder`,
          body: `You've logged ${completedCount}/5 prayers today. Open QazaTrack to log the rest before the day ends!`,
          payload: {
            date: localDateStr
          }
        });

        const pushSubscription = {
          endpoint: sub.endpoint,
          keys: { p256dh: sub.p256dh, auth: sub.auth }
        };

        try {
          await webpush.sendNotification(pushSubscription, payload);
          sentCount++;
        } catch (e) {
           console.error('Error sending push to', user.id, e);
        }
      }
    });

    await Promise.all(notifications);

    return NextResponse.json({ success: true, processed: subs.length, sent: sentCount });
  } catch (error) {
    console.error('Cron push error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
