# ------------------
# Stage 1: Build
# ------------------
FROM mcr.microsoft.com/playwright:v1.49.0-noble AS builder

WORKDIR /app

ENV PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=true

# Copy dependency files first for layer caching
COPY package.json yarn.lock .yarnrc.yml ./
COPY .yarn .yarn

RUN yarn install

# Copy source code (invalidates cache on code changes only)
COPY . .

# Build, prune dev deps, clean up
RUN yarn build \
  && yarn workspaces focus --all --production \
  && rm -rf .yarn/


# ------------------
# Stage 2: Production
# ------------------
FROM mcr.microsoft.com/playwright:v1.49.0-noble

ARG VERSION
ENV VERSION=${VERSION:-dev}
ENV NODE_ENV=production
ENV IN_DOCKER=true
ENV PLAYWRIGHT_BROWSERS_PATH=/ms-playwright
ENV PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=true

# OCI labels
LABEL org.opencontainers.image.source=https://github.com/algolia/renderscript
LABEL org.opencontainers.image.revision=$VERSION

# Create non-root user
RUN adduser --disabled-password pwuser

USER pwuser

WORKDIR /app/renderscript
COPY --from=builder --chown=pwuser:pwuser /app/dist ./dist
COPY --from=builder --chown=pwuser:pwuser /app/node_modules ./node_modules
COPY --from=builder --chown=pwuser:pwuser /app/package.json ./
COPY --from=builder --chown=pwuser:pwuser /app/public ./public

CMD [ "node", "dist/index.js" ]
