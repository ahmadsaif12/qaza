import { NextResponse } from 'next/server';
import { db } from '@/db';
import webpush from 'web-push';

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

    const subs = await db.query.pushSubscriptions.findMany();
    const prayerName = searchParams.get('prayer') || 'Isha';
    const dateStr = new Date().toISOString();

    const payload = JSON.stringify({
      title: `${prayerName} Reminder`,
      body: `Have you offered your ${prayerName} prayer?`,
      payload: {
        prayerName: prayerName,
        date: dateStr
      }
    });

    let sentCount = 0;
    const notifications = subs.map(sub => {
      const pushSubscription = {
        endpoint: sub.endpoint,
        keys: {
          p256dh: sub.p256dh,
          auth: sub.auth
        }
      };
      return webpush.sendNotification(pushSubscription, payload).then(() => {
        sentCount++;
      }).catch(e => {
        console.error('Error sending push to', sub.userId, e);
      });
    });

    await Promise.all(notifications);

    return NextResponse.json({ success: true, totalSubscriptions: subs.length, sent: sentCount });
  } catch (error) {
    console.error('Cron push error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
