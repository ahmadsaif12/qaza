FROM node:20-alpine AS deps

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

FROM node:20-alpine AS builder
WORKDIR /app

ENV NEXT_TELEMETRY_DISABLED=1
ENV DATABASE_URL=postgres://postgres:postgres@localhost:5432/qaza
ENV DATABASE_SSL=false
ENV AUTH_SECRET=build-time-placeholder-secret
ENV NEXTAUTH_SECRET=build-time-placeholder-secret
ENV OTP_SECRET=build-time-placeholder-secret
ENV NOTIFICATION_ACTION_SECRET=build-time-placeholder-secret

COPY --from=deps /app/node_modules ./node_modules
COPY . .

RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/next.config.mjs ./next.config.mjs
COPY --from=builder /app/package.json ./package.json

RUN chown -R node:node /app
USER node

EXPOSE 3000

CMD ["npm", "run", "start"]
