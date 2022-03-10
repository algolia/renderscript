# Base image
FROM ubuntu:focal

# For tzdata
ARG DEBIAN_FRONTEND=noninteractive
ARG TZ=America/Los_Angeles

# Autolink repository https://docs.github.com/en/packages/learn-github-packages/connecting-a-repository-to-a-package
LABEL org.opencontainers.image.source=https://github.com/algolia/renderscript
LABEL org.opencontainers.image.revision=$VERSION

# === INSTALL Node.js ===
RUN apt-get update && \
  # Install node16
  apt-get install -y curl wget && \
  curl -sL https://deb.nodesource.com/setup_16.x | bash - && \
  apt-get install -y nodejs && \
  # Feature-parity with node.js base images.
  apt-get install -y --no-install-recommends git openssh-client && \
  npm install -g yarn && \
  # clean apt cache
  rm -rf /var/lib/apt/lists/* && \
  # Create the pwuser
  adduser pwuser

# Setup the app WORKDIR
WORKDIR /app/tmp

# Copy and install dependencies separately from the app's code
# To leverage Docker's cache when no dependency has change
COPY package.json yarn.lock .yarnrc.yml ./
COPY .yarn .yarn
RUN ls -lah /app/tmp
ENV PLAYWRIGHT_BROWSERS_PATH="/app/tmp/pw-browsers"
ENV PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD="true"

# Install dev dependencies
RUN true \
  # Use local version instead of letting yarn auto upgrade itself
  && yarn set version $(ls -d $PWD/.yarn/releases/*) \
  && yarn install \
  && npx playwright install chromium \
  && npx playwright install-deps chromium

# This step will invalidates cache
COPY . /app/tmp
RUN ls -lah /app/tmp

ARG VERSION
ENV VERSION ${VERSION:-dev}
ENV NODE_ENV production
ENV IN_DOCKER true

# Builds the UI, install chrome and remove dev dependencies
RUN true \
  && yarn build \
  && yarn workspaces focus --all --production \
  && rm -rf .yarn/

CMD [ "node", "dist/index.js" ]
