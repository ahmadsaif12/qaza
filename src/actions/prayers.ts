"use server"

import { and, eq, count, gte, inArray } from "drizzle-orm"
import { qazaItems, prayerLogs } from "@/db/schema"
import { db } from "@/db"
import { auth } from "@/auth"

export async function getTodayPrayers(dateStr?: string) {
  const session = await auth()
  if (!session?.user?.id) return { error: "Unauthorized" }

  const targetDate = dateStr || new Date().toISOString().split('T')[0];
  
  try {
    const logs = await db.query.prayerLogs.findMany({
      where: and(
        eq(prayerLogs.userId, session.user.id),
        eq(prayerLogs.date, targetDate)
      )
    });
    return { success: true, data: logs };
  } catch (error) {
    return { error: "Failed to fetch" };
  }
}

export async function getQazaBacklog() {
  const session = await auth()
  if (!session?.user?.id) return { error: "Unauthorized" }

  const userId = session.user.id;
  try {
    const qazaCounts = await db.select({
      prayerName: prayerLogs.prayerName,
      count: count(),
    }).from(prayerLogs)
      .where(and(eq(prayerLogs.userId, userId), eq(prayerLogs.status, "missed")))
      .groupBy(prayerLogs.prayerName);

    const manualQazaCounts = await db.select({
      prayerName: qazaItems.prayerName,
      count: count(),
    }).from(qazaItems)
      .where(and(eq(qazaItems.userId, userId), eq(qazaItems.isCompleted, false)))
      .groupBy(qazaItems.prayerName);

    const backlog: Record<string, number> = {
      Fajr: 0, Dhuhr: 0, Asr: 0, Maghrib: 0, Isha: 0
    };
    
    qazaCounts.forEach(q => {
      const name = q.prayerName.charAt(0).toUpperCase() + q.prayerName.slice(1);
      if (name in backlog) backlog[name] += q.count;
    });

    manualQazaCounts.forEach(q => {
      const name = q.prayerName.charAt(0).toUpperCase() + q.prayerName.slice(1);
      if (name in backlog) backlog[name] += q.count;
    });

    return { success: true, data: backlog };
  } catch (error) {
    return { error: "Failed to fetch" };
  }
}

export async function updateBulkQaza(prayerName: string, amount: number) {
  const session = await auth()
  if (!session?.user?.id) return { error: "Unauthorized" }
  const userId = session.user.id;

  try {
    if (amount > 0) {
      const values = Array(amount).fill(0).map(() => ({
        userId,
        prayerName,
        isCompleted: false,
      }));
      const chunkSize = 1000;
      for (let i = 0; i < values.length; i += chunkSize) {
        await db.insert(qazaItems).values(values.slice(i, i + chunkSize));
      }
    } else if (amount < 0) {
      const limit = Math.abs(amount);
      const toComplete = await db.query.qazaItems.findMany({
        where: and(
          eq(qazaItems.userId, userId), 
          eq(qazaItems.prayerName, prayerName), 
          eq(qazaItems.isCompleted, false)
        ),
        limit
      });
      if (toComplete.length > 0) {
        const ids = toComplete.map(t => t.id);
        await db.update(qazaItems)
          .set({ isCompleted: true, completedAt: new Date() })
          .where(inArray(qazaItems.id, ids));
      }
    }
    return { success: true }
  } catch(e) {
    return { error: "Failed to update" }
  }
}

export async function getWeeklyConsistency() {
  const session = await auth()
  if (!session?.user?.id) return { error: "Unauthorized" }

  const userId = session.user.id;
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  const dateStr = sevenDaysAgo.toISOString().split('T')[0];

  try {
    const logs = await db.query.prayerLogs.findMany({
      where: and(
        eq(prayerLogs.userId, userId),
        eq(prayerLogs.status, "completed"),
        gte(prayerLogs.date, dateStr)
      )
    });

    const consistency = [
      { name: "Sun", prayers: 0 },
      { name: "Mon", prayers: 0 },
      { name: "Tue", prayers: 0 },
      { name: "Wed", prayers: 0 },
      { name: "Thu", prayers: 0 },
      { name: "Fri", prayers: 0 },
      { name: "Sat", prayers: 0 },
    ];

    logs.forEach(log => {
      const d = new Date(log.date);
      consistency[d.getDay()].prayers += 1;
    });

    const todayDay = new Date().getDay();
    const sortedConsistency = [
      ...consistency.slice(todayDay + 1),
      ...consistency.slice(0, todayDay + 1)
    ];

    return { success: true, data: sortedConsistency };
  } catch (error) {
    return { error: "Failed to fetch" };
  }
}

export async function syncPrayerMutations(mutations: any[]) {
  const session = await auth()
  if (!session?.user?.id) return { error: "Unauthorized" }

  const userId = session.user.id;

  try {
    // Process unique mutations only (last one wins for the same prayer and date)
    const latestMutations = new Map();
    for (const mut of mutations) {
      if (mut.type === "LOG_PRAYER") {
        const key = `${mut.payload.prayerName}-${new Date(mut.payload.date).toISOString().split('T')[0]}`;
        latestMutations.set(key, mut.payload);
      }
    }

    for (const [_, payload] of latestMutations) {
      const { prayerName, date, status } = payload;
      const targetDate = new Date(date).toISOString().split('T')[0];
      
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
    }
    return { success: true };
  } catch (error) {
    console.error("Failed to sync mutations", error);
    return { error: "Failed to sync" };
  }
}
