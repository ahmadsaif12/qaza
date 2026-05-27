import { z } from "zod"

export const PRAYER_NAMES = ["fajr", "dhuhr", "asr", "maghrib", "isha", "witr"] as const
export const PRAYER_STATUSES = ["completed", "missed", "qaza_completed", "excused"] as const
export const CALC_METHODS = [1, 2, 3, 4, 5, 7, 8, 9, 10, 11, 13, 14] as const
export const ASR_METHODS = [0, 1] as const

export const prayerNameSchema = z
  .string()
  .trim()
  .transform((value) => value.toLowerCase())
  .pipe(z.enum(PRAYER_NAMES))

export const prayerStatusSchema = z.enum(PRAYER_STATUSES)

export const isoDateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be YYYY-MM-DD")
  .refine((value) => {
    const parsed = new Date(`${value}T00:00:00.000Z`)
    return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value
  }, "Invalid date")

export const notFutureIsoDateSchema = isoDateSchema.refine((value) => {
  const now = new Date()
  const today = new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0, 10)
  return value <= today
}, "Future dates cannot be logged")

export const emailSchema = z.string().trim().toLowerCase().email("Invalid email address")
export const passwordSchema = z.string().min(8, "Password must be at least 8 characters").max(128, "Password is too long")
export const otpSchema = z.string().trim().regex(/^\d{6}$/, "OTP must be a 6-digit code")

export const registerSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters").max(100, "Name is too long"),
  email: emailSchema,
  password: passwordSchema,
})

export const passwordResetSchema = z.object({
  email: emailSchema,
  otp: otpSchema,
  newPassword: passwordSchema,
})

export const emailOnlySchema = z.object({
  email: emailSchema,
})

export const otpVerificationSchema = z.object({
  email: emailSchema,
  otp: otpSchema,
})

export const qazaAmountSchema = z.coerce
  .number()
  .int("Amount must be a whole number")
  .min(-1000, "Amount is too large")
  .max(1000, "Amount is too large")
  .refine((value) => value !== 0, "Amount cannot be zero")

export const qazaPaceSchema = z
  .object({
    paceMode: z.enum(["none", "1:1", "2:1", "3:1"]),
  })
  .strict()

export const excusedRangeSchema = z
  .object({
    start: isoDateSchema,
    end: isoDateSchema,
  })
  .refine((range) => range.start <= range.end, "Start date cannot be after end date")

const calcMethodSchema = z.union([
  z.enum(CALC_METHODS.map(String) as [string, ...string[]]).transform(Number),
  z.number().int().refine((value) => (CALC_METHODS as readonly number[]).includes(value), "Invalid calculation method"),
])

const asrMethodSchema = z.union([
  z.enum(ASR_METHODS.map(String) as [string, ...string[]]).transform(Number),
  z.number().int().refine((value) => (ASR_METHODS as readonly number[]).includes(value), "Invalid Asr method"),
])

export const userPreferencesSchema = z
  .object({
    calcMethod: calcMethodSchema.optional(),
    asrMethod: asrMethodSchema.optional(),
    trackWitr: z.boolean().optional(),
    qazaPace: qazaPaceSchema.nullable().optional(),
    excusedRanges: z.array(excusedRangeSchema).max(100, "Too many excused ranges").optional(),
  })
  .strict()
  .refine((value) => Object.keys(value).length > 0, "No preferences provided")

export const geolocationSchema = z.object({
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
  timezone: z.string().trim().min(1).max(100),
})

export const pushSubscriptionSchema = z.object({
  endpoint: z.string().url().max(2048),
  keys: z.object({
    p256dh: z.string().min(16).max(512),
    auth: z.string().min(8).max(256),
  }),
})

export const pushSubscribeBodySchema = z
  .object({
    subscription: pushSubscriptionSchema.optional(),
    endpoint: z.string().url().max(2048).optional(),
    keys: pushSubscriptionSchema.shape.keys.optional(),
    location: geolocationSchema.optional(),
  })
  .passthrough()
  .transform((value) => ({
    subscription: value.subscription ?? {
      endpoint: value.endpoint,
      keys: value.keys,
    },
    location: value.location,
  }))
  .pipe(
    z.object({
      subscription: pushSubscriptionSchema,
      location: geolocationSchema.optional(),
    })
  )

export const pushUnsubscribeBodySchema = z.object({
  endpoint: z.string().url().max(2048),
})

export const notificationActionRequestSchema = z.object({
  prayerName: prayerNameSchema,
  date: isoDateSchema,
  actionToken: z.string().min(20).optional(),
})

export const pushLogSchema = z.object({
  prayerName: prayerNameSchema,
  status: prayerStatusSchema,
  date: notFutureIsoDateSchema,
})

export const syncPrayerMutationSchema = z.object({
  id: z.string().optional(),
  type: z.literal("LOG_PRAYER"),
  payload: z.object({
    prayerName: prayerNameSchema,
    status: prayerStatusSchema,
    date: notFutureIsoDateSchema,
  }),
})

export const syncPrayerMutationListSchema = z.array(syncPrayerMutationSchema).max(200, "Too many pending mutations")

export type PrayerName = z.infer<typeof prayerNameSchema>
export type PrayerStatus = z.infer<typeof prayerStatusSchema>
export type QazaPace = z.infer<typeof qazaPaceSchema>
export type ExcusedRange = z.infer<typeof excusedRangeSchema>
export type SyncPrayerMutation = z.infer<typeof syncPrayerMutationSchema>

export function getZodError(error: z.ZodError) {
  return error.issues[0]?.message || "Invalid input"
}
