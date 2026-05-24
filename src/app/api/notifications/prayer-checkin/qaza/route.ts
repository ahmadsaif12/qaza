import { NextResponse } from 'next/server';
import { db } from '@/db';
import { prayerLogs, qazaItems, users } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { auth } from '@/auth';

export async function POST(request: Request) {
  try {
    const session = await auth();
    let userId = session?.user?.id;

    const payload = await request.json();
    if (!userId && payload.userId) {
       userId = payload.userId; 
    }

    if (!userId) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { prayerName, date } = payload;
    if (!prayerName || !date) {
      return NextResponse.json({ success: false, error: "Missing fields" }, { status: 400 });
    }

    // 1. Mark prayer log as missed
    const existingLog = await db.query.prayerLogs.findFirst({
      where: and(
        eq(prayerLogs.userId, userId),
        eq(prayerLogs.date, date),
        eq(prayerLogs.prayerName, prayerName.toLowerCase())
      )
    });

    if (existingLog) {
      if (existingLog.status !== 'missed' && existingLog.status !== 'qaza') {
         await db.update(prayerLogs).set({
           status: 'missed',
           completedAt: null
         }).where(eq(prayerLogs.id, existingLog.id));
      }
    } else {
      await db.insert(prayerLogs).values({
        userId,
        date,
        prayerName: prayerName.toLowerCase(),
        status: 'missed'
      });
    }

    // 2. Add to Qaza items only if it doesn't already exist
    const existingQaza = await db.query.qazaItems.findFirst({
      where: and(
        eq(qazaItems.userId, userId),
        eq(qazaItems.dateMissed, date),
        eq(qazaItems.prayerName, prayerName.toLowerCase())
      )
    });

    if (!existingQaza) {
      await db.insert(qazaItems).values({
        userId,
        prayerName: prayerName.toLowerCase(),
        dateMissed: date,
        isCompleted: false
      });
    }

    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e.message }, { status: 500 });
  }
}
