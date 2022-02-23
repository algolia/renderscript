# Base image
FROM node:16.13.1 AS base

# Install git
# Others are dependencies of our gyp dependencies
RUN apt-get update && \
  apt-get install -y --no-install-recommends \
  g++ \
  git \
  make \
  python

# Setup the app WORKDIR
WORKDIR /app/tmp

# Copy and install dependencies separately from the app's code
# To leverage Docker's cache when no dependency has change
COPY package.json yarn.lock .yarnrc.yml ./
COPY .yarn .yarn
RUN ls -lah /app/tmp

# Install dev dependencies
RUN true \
  # Use local version instead of letting yarn auto upgrade itself
  && yarn set version $(ls -d $PWD/.yarn/releases/*) \
  && yarn install

# This step will invalidates cache
COPY . /app/tmp
RUN ls -lah /app/tmp

ARG VERSION
ENV VERSION ${VERSION:-dev}

# Builds the UI, install chrome and remove dev dependencies
RUN true \
  && yarn build \
  && yarn install-chromium \
  && yarn workspaces focus --all --production \
  && rm -rf .yarn/

# Resulting image
# New, minimal image
# This image must have the minimum amount of layers
FROM node:16.13.1-slim

# Autolink repository https://docs.github.com/en/packages/learn-github-packages/connecting-a-repository-to-a-package
LABEL org.opencontainers.image.source=https://github.com/algolia/renderscript
LABEL org.opencontainers.image.revision=$VERSION

ENV NODE_ENV production
ENV IN_DOCKER true

# Install:
# - Chromium (so that we get its dependencies)
# - Extra needed dependencies
# - A few fonts
# Then remove Chromium to use puppeteer's bundled Chromium
# Also install xfvb to run Chromium in Headful mode (necessary for extensions)
RUN true \
  && apt-get update \
  && apt-get install -y --no-install-recommends \
  curl \
  chromium \
  libatk-bridge2.0-0 \
  libgtk-3-0 \
  fonts-ipafont-gothic \
  fonts-wqy-zenhei \
  fonts-thai-tlwg \
  fonts-kacst \
  fonts-freefont-ttf \
  xvfb \
  && apt-get remove -y chromium \
  && apt-get clean \
  && rm -rf /var/lib/apt/lists/* \
  && true

WORKDIR /app/renderscript

COPY --from=base /app/tmp /app/renderscript

RUN true \
  && groupadd -r pptruser && useradd -r -g pptruser -G audio,video pptruser \
  && mkdir -p /home/pptruser/ \
  && chown -R pptruser:pptruser /home/pptruser \
  && chown -R pptruser:pptruser /app/renderscript \
  && true

USER pptruser

CMD [ "npm", "start" ]
