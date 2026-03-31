# ------------------
# Stage 1: Build
# ------------------
FROM node:22-bookworm-slim AS builder

WORKDIR /app

ENV PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1

# Copy dependency files first for layer caching
COPY package.json yarn.lock .yarnrc.yml ./
COPY .yarn .yarn

RUN corepack enable && yarn install --immutable

# Copy source code (invalidates cache on code changes only)
COPY . .

# Build, prune dev deps, clean up
RUN yarn build \
  && yarn workspaces focus --all --production \
  && rm -rf .yarn/


# ------------------
# Stage 2: Production
# ------------------
FROM node:22-bookworm-slim

ARG DEBIAN_FRONTEND=noninteractive
ARG TZ=America/Los_Angeles
ARG VERSION=dev

ENV VERSION=$VERSION
ENV TZ=$TZ
ENV NODE_ENV=production
ENV IN_DOCKER=true
ENV PLAYWRIGHT_BROWSERS_PATH=/ms-playwright

# OCI labels
LABEL org.opencontainers.image.source=https://github.com/algolia/renderscript
LABEL org.opencontainers.image.revision=$VERSION

WORKDIR /app/renderscript

COPY --from=builder --chown=node:node /app/package.json ./
COPY --from=builder --chown=node:node /app/node_modules ./node_modules

RUN apt-get update \
  && apt-get install -y --no-install-recommends tzdata \
  && ln -snf /usr/share/zoneinfo/$TZ /etc/localtime \
  && echo $TZ > /etc/timezone \
  && npx playwright install --with-deps chromium firefox \
  && chown -R node:node /ms-playwright \
  && rm -rf /var/lib/apt/lists/*

ENV PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1

COPY --from=builder --chown=node:node /app/dist ./dist
COPY --from=builder --chown=node:node /app/public ./public

USER node

CMD [ "node", "dist/index.js" ]
