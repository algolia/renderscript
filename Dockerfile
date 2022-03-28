# ------------------
# Build playwright
# ------------------
FROM ubuntu:focal as base

# For tzdata
ARG DEBIAN_FRONTEND=noninteractive
ARG TZ=America/Los_Angeles

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

# === BAKE BROWSERS INTO IMAGE ===
ENV PLAYWRIGHT_BROWSERS_PATH=/ms-playwright

# Browsers will be downloaded in `/ms-playwright`.
RUN mkdir /ms-playwright \
  && npx playwright install chromium \
  && npx playwright install-deps chromium \
  # Clean cache
  && rm -rf /var/lib/apt/lists/* \
  && chmod -R 777 /ms-playwright


# ------------------
# package.json cache
# ------------------
FROM apteno/alpine-jq:2022-03-27 AS deps

# To prevent cache invalidation from changes in fields other than dependencies
COPY package.json /tmp
RUN jq 'walk(if type == "object" then with_entries(select(.key | test("^jest|prettier|eslint|semantic|dotenv|nodemon") | not)) else . end) | { name, dependencies, devDependencies, packageManager }' < /tmp/package.json > /tmp/deps.json


# ------------------
# New base image
# ------------------
FROM base as tmp

ENV IN_DOCKER true
ENV PLAYWRIGHT_BROWSERS_PATH="/ms-playwright"
ENV PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD="true"

# Setup the app WORKDIR
WORKDIR /app/tmp

# Copy and install dependencies separately from the app's code
# To leverage Docker's cache when no dependency has change
COPY --from=deps /tmp/deps.json ./package.json
COPY yarn.lock .yarnrc.yml ./
COPY .yarn .yarn

# Install dev dependencies
RUN true \
  && yarn install

# This step will invalidates cache
COPY . ./

# Builds the UI, install chrome and remove dev dependencies
RUN true \
  && ls -lah /app/tmp \
  && yarn build \
  && yarn workspaces focus --all --production \
  && rm -rf .yarn/

# ------------------
#  New final image that only contains built code
# ------------------
FROM base as final

ARG VERSION
ENV VERSION ${VERSION:-dev}

# Autolink repository https://docs.github.com/en/packages/learn-github-packages/connecting-a-repository-to-a-package
LABEL org.opencontainers.image.source=https://github.com/algolia/renderscript
LABEL org.opencontainers.image.revision=$VERSION

ENV NODE_ENV production
ENV IN_DOCKER true
ENV PLAYWRIGHT_BROWSERS_PATH="/ms-playwright"
ENV PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD="true"

# Do not use root to run the app
USER pwuser

# Copy install from previous stage
WORKDIR /app/renderscript
COPY --from=tmp --chown=pwuser:pwuser /app/tmp /app/renderscript

CMD [ "node", "dist/index.js" ]
