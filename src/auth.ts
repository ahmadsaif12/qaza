import NextAuth from "next-auth"
import Credentials from "next-auth/providers/credentials"
import Google from "next-auth/providers/google"
import { DrizzleAdapter } from "@auth/drizzle-adapter"
import { db } from "./db"
import { users } from "./db/schema"
import { eq } from "drizzle-orm"
import bcrypt from "bcryptjs"
import { headers } from "next/headers"
import { checkRateLimit, clearRateLimit } from "@/lib/otp"

const googleClientId = process.env.AUTH_GOOGLE_ID || process.env.GOOGLE_CLIENT_ID || process.env.GOOGLE_ID
const googleClientSecret = process.env.AUTH_GOOGLE_SECRET || process.env.GOOGLE_CLIENT_SECRET || process.env.GOOGLE_SECRET
export const isGoogleAuthConfigured = Boolean(googleClientId && googleClientSecret)

const DUMMY_PASSWORD_HASH = "$2b$10$pEY6hgWKhUyceHaqg8eDY./.7nESPjx2Qfw0Qn0.IkZ8zRl0dyd3."
const LOGIN_RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000
const LOGIN_MAX_ATTEMPTS = 10

async function getClientIp() {
  const headerStore = await headers()

  return (
    headerStore.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    headerStore.get("x-real-ip") ||
    "unknown"
  )
}

async function enforceLoginRateLimit(email: string) {
  const ip = await getClientIp()
  const emailKey = `auth:login:email:${email}`
  const ipKey = `auth:login:ip:${ip}`
  const emailError = await checkRateLimit(emailKey, LOGIN_MAX_ATTEMPTS, LOGIN_RATE_LIMIT_WINDOW_MS)
  const ipError = emailError ? null : await checkRateLimit(ipKey, LOGIN_MAX_ATTEMPTS, LOGIN_RATE_LIMIT_WINDOW_MS)

  return {
    error: emailError || ipError,
    clear: async () => {
      await Promise.all([clearRateLimit(emailKey), clearRateLimit(ipKey)])
    },
  }
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  adapter: DrizzleAdapter(db),
  providers: [
    ...(isGoogleAuthConfigured
      ? [
          Google({
            clientId: googleClientId,
            clientSecret: googleClientSecret,
          }),
        ]
      : []),
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      authorize: async (credentials) => {
        if (!credentials?.email || !credentials?.password) return null;
        const email = String(credentials.email).trim().toLowerCase();
        const password = String(credentials.password)

        if (email.length > 320 || password.length > 128) return null

        const rateLimit = await enforceLoginRateLimit(email)
        if (rateLimit.error) {
          throw new Error("RateLimited")
        }
        
        const user = await db.query.users.findFirst({ 
          where: eq(users.email, email) 
        });

        const passwordHash = user?.password || DUMMY_PASSWORD_HASH
        const isValid = await bcrypt.compare(password, passwordHash);

        if (!user || !user.password || !isValid) return null;

        if (!user.emailVerified) {
          throw new Error("EmailNotVerified");
        }

        await rateLimit.clear()
        return { id: user.id, name: user.name, email: user.email }
      },
    }),
  ],
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
      }
      return token
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = (token.id || token.sub) as string
      }
      return session
    }
  }
})
