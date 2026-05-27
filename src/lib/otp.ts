import crypto from "node:crypto"
import { eq, sql } from "drizzle-orm"
import { db } from "@/db"
import { rateLimits } from "@/db/schema"

function getOtpSecret() {
  const secret = process.env.OTP_SECRET || process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET

  if (!secret && process.env.NODE_ENV === "production") {
    throw new Error("OTP_SECRET or AUTH_SECRET must be configured in production")
  }

  return secret || "development-otp-secret"
}

function getRateLimitStorageKey(key: string) {
  return crypto.createHmac("sha256", getOtpSecret()).update(key).digest("hex")
}

export function createOtp() {
  return crypto.randomInt(100000, 1000000).toString()
}

export function hashOtp(email: string, otp: string) {
  return crypto
    .createHmac("sha256", getOtpSecret())
    .update(`${email.toLowerCase()}:${otp}`)
    .digest("hex")
}

export function verifyOtpHash(email: string, otp: string, hash: string) {
  const expected = hashOtp(email, otp)
  const expectedBytes = Buffer.from(expected)
  const hashBytes = Buffer.from(hash)

  return hashBytes.length === expectedBytes.length && crypto.timingSafeEqual(hashBytes, expectedBytes)
}

export async function checkRateLimit(key: string, maxAttempts: number, windowMs: number) {
  const storageKey = getRateLimitStorageKey(key)
  const windowSeconds = Math.ceil(windowMs / 1000)

  const result = await db.execute<{
    count: number
    retryAfterSeconds: number
  }>(sql`
    INSERT INTO "rate_limit" ("key", "count", "resetAt", "updatedAt")
    VALUES (${storageKey}, 1, now() + (${windowSeconds} * interval '1 second'), now())
    ON CONFLICT ("key") DO UPDATE SET
      "count" = CASE
        WHEN "rate_limit"."resetAt" <= now() THEN 1
        ELSE "rate_limit"."count" + 1
      END,
      "resetAt" = CASE
        WHEN "rate_limit"."resetAt" <= now() THEN now() + (${windowSeconds} * interval '1 second')
        ELSE "rate_limit"."resetAt"
      END,
      "updatedAt" = now()
    RETURNING
      "count" AS count,
      GREATEST(1, CEIL(EXTRACT(EPOCH FROM ("resetAt" - now())))::int) AS "retryAfterSeconds"
  `)
  const entry = result[0]

  if (entry.count > maxAttempts) {
    return `Too many attempts. Try again in ${entry.retryAfterSeconds} seconds.`
  }

  return null
}

export async function clearRateLimit(key: string) {
  await db.delete(rateLimits).where(eq(rateLimits.key, getRateLimitStorageKey(key)))
}
