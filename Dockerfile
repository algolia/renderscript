# Base image
FROM node:16.13.1-bullseye-slim AS base

ENV NODE_ENV production
ENV IN_DOCKER true

WORKDIR /app/renderscript

COPY package.json yarn.lock ./

RUN true \
  && yarn install --production=false

# This step will invalidates cache
COPY . /app/renderscript

RUN true \
  && yarn build \
  && yarn install --production=true \
  && yarn cache clean \
  && true

RUN yarn docker:install

# Base image
FROM node:16.13.1-bullseye-slim

ENV NODE_ENV production

# Install:
# - Chromium (so that we get its dependencies)
# - Extra needed dependencies
# - A few fonts
# cf: https://github.com/puppeteer/puppeteer/blob/main/docs/troubleshooting.md#running-puppeteer-in-docker
RUN true \
  && apt-get update \
  && apt-get install -y wget gnupg ca-certificates --no-install-recommends \
  && wget -O- https://dl.google.com/linux/linux_signing_key.pub | gpg --dearmor > /etc/apt/trusted.gpg.d/google.gpg \
  && sh -c 'echo "deb [arch=amd64] http://dl.google.com/linux/chrome/deb/ stable main" >> /etc/apt/sources.list.d/google.list' \
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
  libxss1 \
  xvfb \
  && apt-get clean \
  && rm -rf /var/lib/apt/lists/* \
  && rm -rf /src/*.deb \
  && true

WORKDIR /app/renderscript

COPY --from=base /app/renderscript /app/renderscript

RUN true \
  && groupadd -r pptruser && useradd -r -g pptruser -G audio,video pptruser \
  && mkdir -p /home/pptruser/ \
  && chown -R pptruser:pptruser /home/pptruser \
  && chown -R pptruser:pptruser /app/renderscript \
  && true

USER pptruser

CMD [ "npm", "start" ]
