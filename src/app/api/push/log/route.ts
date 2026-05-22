import { NextResponse } from 'next/server';
import { db } from '@/db';
import { prayerLogs, qazaItems } from '@/db/schema';
import { auth } from '@/auth';
import { eq, and } from 'drizzle-orm';

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { prayerName, status, date } = body;
    const userId = session.user.id;
    const targetDate = new Date(date).toISOString().split('T')[0];

    // Log the prayer
    const existing = await db.query.prayerLogs.findFirst({
      where: and(
        eq(prayerLogs.userId, userId),
        eq(prayerLogs.prayerName, prayerName),
        eq(prayerLogs.date, targetDate)
      )
    });

    if (existing) {
      await db.update(prayerLogs).set({
        status,
        completedAt: status === 'completed' ? new Date() : null,
      }).where(eq(prayerLogs.id, existing.id));
    } else {
      await db.insert(prayerLogs).values({
        userId,
        prayerName,
        date: targetDate,
        status,
        completedAt: status === 'completed' ? new Date() : null,
      });
    }

    // If marked as missed, also add it to QazaItems directly
    if (status === 'missed') {
      await db.insert(qazaItems).values({
        userId,
        prayerName,
        dateMissed: targetDate,
        isCompleted: false,
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error logging from push:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
