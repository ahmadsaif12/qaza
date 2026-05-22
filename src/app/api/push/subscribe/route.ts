import { NextResponse } from 'next/server';
import { db } from '@/db';
import { pushSubscriptions, users } from '@/db/schema';
import { auth } from '@/auth';
import { eq, and } from 'drizzle-orm';

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const subscription = body.subscription || body; // Support old and new format
    const location = body.location;

    if (!subscription || !subscription.endpoint || !subscription.keys) {
      return NextResponse.json({ error: 'Invalid subscription object' }, { status: 400 });
    }

    if (location && location.lat && location.lng) {
      // Update user location
      await db.update(users).set({
        latitude: location.lat,
        longitude: location.lng,
        timezone: location.timezone
      }).where(eq(users.id, session.user.id));
    }

    // Check if exactly this endpoint is already subscribed for the user
    const existing = await db.query.pushSubscriptions.findFirst({
      where: and(
        eq(pushSubscriptions.userId, session.user.id),
        eq(pushSubscriptions.endpoint, subscription.endpoint)
      )
    });

    if (existing) {
      // Update keys if they changed
      await db.update(pushSubscriptions).set({
        p256dh: subscription.keys.p256dh,
        auth: subscription.keys.auth,
      }).where(eq(pushSubscriptions.id, existing.id));
      
      return NextResponse.json({ success: true, message: 'Subscription updated' });
    }

    // Insert new subscription
    await db.insert(pushSubscriptions).values({
      userId: session.user.id,
      endpoint: subscription.endpoint,
      p256dh: subscription.keys.p256dh,
      auth: subscription.keys.auth,
    });

    return NextResponse.json({ success: true, message: 'Subscribed successfully' }, { status: 201 });
  } catch (error) {
    console.error('Error saving subscription:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
