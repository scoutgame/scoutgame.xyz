# Install dependencies only when needed
FROM node:16-alpine AS base_app

# Check https://github.com/nodejs/docker-node/tree/b4117f9333da4138b03a546ec926ef50a31506c3#nodealpine to understand why libc6-compat might be needed.
RUN apk add --no-cache libc6-compat git
WORKDIR /app

ENV PORT 3000

# Next.js collects completely anonymous telemetry data about general usage.
# Learn more here: https://nextjs.org/telemetry
# Uncomment the following line in case you want to disable telemetry.
ENV NEXT_TELEMETRY_DISABLED 1

EXPOSE 3000


# --- Image built in Github and used by ElasticBeanstalk
#     Code built in github and dev libraries pruned in Github
FROM base_app AS elasticbeanstalk_app
COPY . .
CMD ["npm", "run", "start:staging"]


# --- Image with code built inside docker from ground up. 
FROM base_app AS localdev_app
COPY *.json ./
COPY patches/. patches/
RUN  npm ci --no-audit --no-fund

COPY . ./
RUN npm run build:prisma
RUN npm run build
CMD ["npm", "run", "start"]


# --- Image used locally with compose builds on top of compiled_locally_server_app
FROM localdev_app AS docker_built_server_app
RUN  npm prune --production

CMD ["npm", "run", "start:staging"]

