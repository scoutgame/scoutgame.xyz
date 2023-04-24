# Install dependencies only when needed

# Use node-slim because node-alpine does not seem to supports the `sharp` npm library that gets built
FROM node:18-slim AS BASE_APP

# useful for node-alpine
# RUN apk add --no-cache libc6-compat git

WORKDIR /app

COPY /app/.next/standalone ./
COPY /app/.next/static ./.next/static
COPY /app/public ./public
COPY /app/.next/server/websockets.js ./websockets.js
COPY /app/.next/server/cron.js ./cron.js

ENV PORT 3000

# Next.js collects completely anonymous telemetry data about general usage.
# Learn more here: https://nextjs.org/telemetry
# Uncomment the following line in case you want to disable telemetry.
ENV NEXT_TELEMETRY_DISABLED 1
ENV LOG_LEVEL debug

EXPOSE 3000
CMD ["npm", "run", "start:test"]
