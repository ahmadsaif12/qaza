import { NextResponse } from 'next/server';
import { db } from '@/db';
import webpush from 'web-push';
import { Coordinates, CalculationMethod, PrayerTimes } from 'adhan';
import { prayerLogs, users } from '@/db/schema';
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
    const currentDateStr = now.toISOString().split('T')[0];
    let sentCount = 0;

    const notifications = subs.map(async (sub) => {
      // @ts-ignore - drizzle with relation
      const user = sub.user;
      if (!user || user.latitude === null || user.longitude === null) return;

      const coords = new Coordinates(user.latitude, user.longitude);
      
      // Determine calculation method based on user preferences. Default to ISNA (2)
      let params = CalculationMethod.NorthAmerica();
      switch (user.calcMethod) {
        case 1: params = CalculationMethod.UmmAlQura(); break;
        case 2: params = CalculationMethod.NorthAmerica(); break;
        case 3: params = CalculationMethod.MuslimWorldLeague(); break;
        case 4: params = CalculationMethod.MoonsightingCommittee(); break;
        case 5: params = CalculationMethod.Egyptian(); break;
        case 6: params = CalculationMethod.Karachi(); break;
      }

      // Calculate prayer times for this user's location
      const prayerTimes = new PrayerTimes(coords, now, params);

      // Check which prayer was ~15 minutes ago
      const prayers = [
        { name: 'Fajr', time: prayerTimes.fajr },
        { name: 'Dhuhr', time: prayerTimes.dhuhr },
        { name: 'Asr', time: prayerTimes.asr },
        { name: 'Maghrib', time: prayerTimes.maghrib },
        { name: 'Isha', time: prayerTimes.isha },
      ];

      for (const prayer of prayers) {
        if (!prayer.time) continue;

        // Calculate time diff in minutes
        const diffMs = now.getTime() - prayer.time.getTime();
        const diffMins = Math.floor(diffMs / 60000);

        // If current time is between 15 and 30 minutes AFTER this namaz
        if (diffMins >= 15 && diffMins < 30) {
          
          // Check if user ALREADY logged this prayer today
          const existingLog = await db.query.prayerLogs.findFirst({
            where: and(
              eq(prayerLogs.userId, user.id),
              eq(prayerLogs.prayerName, prayer.name.toLowerCase()),
              eq(prayerLogs.date, currentDateStr)
            )
          });

          // If already logged (as completed, qaza, or excused), don't bother them
          if (existingLog) continue;

          // Send the notification!
          const payload = JSON.stringify({
            title: `${prayer.name} Reminder`,
            body: `It's been 15 minutes since ${prayer.name}. Have you offered your prayer?`,
            payload: {
              prayerName: prayer.name,
              date: currentDateStr
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
          
          // Only process one prayer notification per cron tick per user
          break;
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
