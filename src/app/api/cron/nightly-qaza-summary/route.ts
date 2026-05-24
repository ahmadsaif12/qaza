import { NextResponse } from 'next/server';
import { db } from '@/db';
import { users, pushSubscriptions, notificationLogs, prayerLogs } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { getUserLocalDate } from '@/lib/date-utils';
import { sendPushNotification } from '@/lib/web-push';

export const maxDuration = 300;

export async function GET(request: Request) {
  const allUsers = await db.query.users.findMany({
    where: eq(users.nightSummaryEnabled, true)
  });

  let processed = 0;
  let sent = 0;
  let skipped = 0;
  let errors = 0;

  const prayersList = ["fajr", "dhuhr", "asr", "maghrib", "isha"];

  for (const user of allUsers) {
    processed++;
    try {
      const localDate = getUserLocalDate(user.timezone);
      
      const subs = await db.query.pushSubscriptions.findMany({
        where: eq(pushSubscriptions.userId, user.id)
      });

      if (subs.length === 0) {
        skipped++;
        continue;
      }

      const uniqueKey = `${user.id}:${localDate}:night_summary`;
      const existingLog = await db.query.notificationLogs.findFirst({
        where: eq(notificationLogs.uniqueKey, uniqueKey)
      });

      if (existingLog) {
        skipped++;
        continue;
      }

      const todaysLogs = await db.query.prayerLogs.findMany({
        where: and(
          eq(prayerLogs.userId, user.id),
          eq(prayerLogs.date, localDate)
        )
      });

      const prayed = todaysLogs.filter(l => l.status === 'completed' || l.status === 'qaza_completed' || l.status === 'excused');
      const missed = todaysLogs.filter(l => l.status === 'missed' || l.status === 'qaza');
      
      let prayedNames = prayed.map(l => l.prayerName.charAt(0).toUpperCase() + l.prayerName.slice(1));
      let missedNames = missed.map(l => l.prayerName.charAt(0).toUpperCase() + l.prayerName.slice(1));
      
      const totalRequired = user.trackWitr ? 6 : 5;
      const allDone = prayed.length >= totalRequired;

      let title = "Today's Qaza summary";
      let body = "";

      if (allDone) {
        title = "Alhamdulillah, all prayers completed";
        body = "You prayed all your namazein today. Keep it going tomorrow and protect your streak.";
      } else if (missed.length > 0 && prayed.length > 0) {
        const pList = prayedNames.join(", ");
        const mList = missedNames.join(", ");
        body = `You prayed ${pList}. ${mList} are pending as Qaza. Take a small step before sleeping.`;
      } else if (missed.length > 0 && prayed.length === 0) {
        body = `It was a tough day. Don't worry, start fresh tomorrow and log these as Qaza so you can catch up slowly.`;
      } else {
        body = "Some prayers are still unconfirmed today. Review them now so your Qaza record stays accurate.";
      }

      const payload = {
        title,
        body,
        payload: {
          url: `/?date=${localDate}`,
          type: "night_summary"
        }
      };

      let sentToAtLeastOne = false;
      for (const sub of subs) {
        const result = await sendPushNotification(
          { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
          payload
        );
        if (result.success) sentToAtLeastOne = true;
      }

      if (sentToAtLeastOne) {
        await db.insert(notificationLogs).values({
          userId: user.id,
          uniqueKey,
          type: "night_summary",
        });
        sent++;
      } else {
        errors++;
      }
    } catch (e) {
      console.error("Error processing user", user.id, e);
      errors++;
    }
  }

  return NextResponse.json({ ok: true, processed, sent, skipped, errors });
}
