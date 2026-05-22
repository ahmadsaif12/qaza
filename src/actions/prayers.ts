"use server"

import { and, eq, count, gte, inArray } from "drizzle-orm"
import { qazaItems, prayerLogs, users } from "@/db/schema"
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

export async function getQazaStats() {
  const session = await auth()
  if (!session?.user?.id) return { error: "Unauthorized" }

  const userId = session.user.id;
  
  // Implicitly run auto-backfill whenever we fetch qaza stats!
  await autoBackfillMissedPrayers(userId);

  try {
    const qazaCounts = await db.select({
      prayerName: prayerLogs.prayerName,
      count: count(),
    }).from(prayerLogs)
      .where(and(eq(prayerLogs.userId, userId), inArray(prayerLogs.status, ["missed", "qaza_completed"])))
      .groupBy(prayerLogs.prayerName);

    const manualQazaCounts = await db.select({
      prayerName: qazaItems.prayerName,
      count: count(),
    }).from(qazaItems)
      .where(eq(qazaItems.userId, userId))
      .groupBy(qazaItems.prayerName);

    // Also find completed ones
    const completedPrayerLogs = await db.select({
      prayerName: prayerLogs.prayerName,
      count: count(),
    }).from(prayerLogs)
      .where(and(eq(prayerLogs.userId, userId), eq(prayerLogs.status, "qaza_completed")))
      .groupBy(prayerLogs.prayerName);

    const completedManualQaza = await db.select({
      prayerName: qazaItems.prayerName,
      count: count(),
    }).from(qazaItems)
      .where(and(eq(qazaItems.userId, userId), eq(qazaItems.isCompleted, true)))
      .groupBy(qazaItems.prayerName);

    const backlog: Record<string, number> = {
      Fajr: 0, Dhuhr: 0, Asr: 0, Maghrib: 0, Isha: 0
    };
    
    let totalMissed = 0;
    let totalCovered = 0;

    qazaCounts.forEach(q => {
      const name = q.prayerName.charAt(0).toUpperCase() + q.prayerName.slice(1);
      if (name in backlog) {
        backlog[name] += q.count;
        totalMissed += q.count;
      }
    });

    manualQazaCounts.forEach(q => {
      const name = q.prayerName.charAt(0).toUpperCase() + q.prayerName.slice(1);
      if (name in backlog) {
        backlog[name] += q.count;
        totalMissed += q.count;
      }
    });

    completedPrayerLogs.forEach(q => {
      const name = q.prayerName.charAt(0).toUpperCase() + q.prayerName.slice(1);
      if (name in backlog) {
        backlog[name] -= q.count;
        totalCovered += q.count;
      }
    });

    completedManualQaza.forEach(q => {
      const name = q.prayerName.charAt(0).toUpperCase() + q.prayerName.slice(1);
      if (name in backlog) {
        backlog[name] -= q.count;
        totalCovered += q.count;
      }
    });

    // Weekly stats
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const dateStr = sevenDaysAgo.toISOString().split('T')[0];

    const weeklyMissed = await db.select({ count: count() })
      .from(prayerLogs)
      .where(and(
        eq(prayerLogs.userId, userId),
        inArray(prayerLogs.status, ["missed", "qaza_completed"]),
        gte(prayerLogs.date, dateStr)
      ));

    return { 
      success: true, 
      data: {
        backlog,
        donut: { totalMissed, totalCovered, remaining: totalMissed - totalCovered },
        weeklyMissed: weeklyMissed[0]?.count || 0
      } 
    };
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

export async function getWeeklyConsistency(clientDateStr?: string) {
  const session = await auth()
  if (!session?.user?.id) return { error: "Unauthorized" }

  const userId = session.user.id;
  
  const todayStr = clientDateStr || new Date().toISOString().split('T')[0];
  const todayDate = new Date(todayStr); // Parses strictly as midnight UTC
  
  const sevenDaysAgo = new Date(todayDate);
  sevenDaysAgo.setUTCDate(sevenDaysAgo.getUTCDate() - 6);
  const dateStr = sevenDaysAgo.toISOString().split('T')[0];

  try {
    const logs = await db.query.prayerLogs.findMany({
      where: and(
        eq(prayerLogs.userId, userId),
        inArray(prayerLogs.status, ["completed", "qaza_completed"]),
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
      // Use getUTCDay() because '2026-05-22' is parsed as midnight UTC.
      // Server's local timezone (e.g. EDT) caused getDay() to shift backwards by 1 day!
      consistency[d.getUTCDay()].prayers += 1;
    });

    const todayDay = todayDate.getUTCDay();
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
        const dStr = String(mut.payload.date).split('T')[0];
        const key = `${mut.payload.prayerName}-${dStr}`;
        latestMutations.set(key, mut.payload);
      }
    }

    for (const [_, payload] of latestMutations) {
      const { prayerName, date, status } = payload;
      const targetDate = String(date).split('T')[0];
      
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

export async function autoBackfillMissedPrayers(userId: string) {
  try {
    const user = await db.query.users.findFirst({ where: eq(users.id, userId) });
    if (!user) return { error: "User not found" };

    const startDate = new Date(user.createdAt);
    // Set to start of the day in local time/UTC so it correctly compares with yesterday
    startDate.setHours(0, 0, 0, 0);
    
    // Safety check: Don't backfill more than 30 days at once to prevent timeouts
    const maxBackfillDate = new Date();
    maxBackfillDate.setHours(0, 0, 0, 0);
    maxBackfillDate.setDate(maxBackfillDate.getDate() - 30);
    if (startDate < maxBackfillDate) {
      startDate.setTime(maxBackfillDate.getTime());
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (startDate > yesterday) return { success: true };

    const startStr = startDate.toISOString().split('T')[0];

    const logs = await db.query.prayerLogs.findMany({
      where: and(
        eq(prayerLogs.userId, userId),
        gte(prayerLogs.date, startStr)
      )
    });

    const existingSet = new Set();
    logs.forEach(l => existingSet.add(`${l.date}-${l.prayerName.toLowerCase()}`));

    const prayers = ["fajr", "dhuhr", "asr", "maghrib", "isha"];
    const missing: { userId: string, prayerName: string, date: string, status: string }[] = [];

    let current = new Date(startDate);
    while (current <= yesterday) {
      const dStr = current.toISOString().split('T')[0];
      prayers.forEach(p => {
        if (!existingSet.has(`${dStr}-${p}`)) {
          missing.push({
            userId,
            prayerName: p,
            date: dStr,
            status: "missed"
          });
        }
      });
      current.setDate(current.getDate() + 1);
    }

    if (missing.length > 0) {
      const chunkSize = 1000;
      for (let i = 0; i < missing.length; i += chunkSize) {
        await db.insert(prayerLogs).values(missing.slice(i, i + chunkSize));
      }
    }

    return { success: true, count: missing.length };
  } catch (e) {
    console.error("Backfill error:", e);
    return { error: "Failed to backfill" };
  }
}

export async function getDetailedQaza(prayerName: string) {
  const session = await auth()
  if (!session?.user?.id) return { error: "Unauthorized" }
  const userId = session.user.id;

  try {
    const pNameLower = prayerName.toLowerCase();
    const pNameTitle = pNameLower.charAt(0).toUpperCase() + pNameLower.slice(1);

    const logs = await db.query.prayerLogs.findMany({
      where: and(
        eq(prayerLogs.userId, userId),
        inArray(prayerLogs.prayerName, [pNameLower, pNameTitle]),
        eq(prayerLogs.status, "missed")
      ),
      orderBy: (prayerLogs, { desc }) => [desc(prayerLogs.date)]
    });

    const items = await db.query.qazaItems.findMany({
      where: and(
        eq(qazaItems.userId, userId),
        inArray(qazaItems.prayerName, [pNameLower, pNameTitle]),
        eq(qazaItems.isCompleted, false)
      )
    });

    let bulkCount = 0;
    const specificDates: { id: string, date: string, type: 'log' | 'item' }[] = [];

    logs.forEach(l => {
      specificDates.push({ id: l.id, date: l.date, type: 'log' });
    });

    items.forEach(i => {
      if (i.dateMissed) {
        specificDates.push({ id: i.id, date: i.dateMissed, type: 'item' });
      } else {
        bulkCount++;
      }
    });

    // Sort descending by date
    specificDates.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    return { success: true, data: { bulkCount, specificDates } };
  } catch (e) {
    return { error: "Failed to fetch detailed qaza" };
  }
}

export async function completeDetailedQaza(id: string, type: 'log' | 'item') {
  const session = await auth()
  if (!session?.user?.id) return { error: "Unauthorized" }
  const userId = session.user.id;

  try {
    if (type === 'log') {
      await db.update(prayerLogs)
        .set({ status: 'qaza_completed', completedAt: new Date() })
        .where(and(eq(prayerLogs.id, id), eq(prayerLogs.userId, userId)));
    } else {
      await db.update(qazaItems)
        .set({ isCompleted: true, completedAt: new Date() })
        .where(and(eq(qazaItems.id, id), eq(qazaItems.userId, userId)));
    }
    return { success: true };
  } catch (e) {
    return { error: "Failed to complete" };
  }
}

