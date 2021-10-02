# Base image
FROM node:14.18.0-slim AS base

# Install git
# Others are dependencies of our gyp dependencies
RUN apt-get update && \
  apt-get install -y --no-install-recommends \
  g++ \
  git \
  make \
  python

# Create tmp directory
RUN mkdir -p /tmp/renderscript
COPY . /tmp/renderscript
WORKDIR /tmp/renderscript

# Commit uncommitted files
# Useful if you want to deploy from a branch without needing to commit
RUN \
  if [ -n "$(git status --porcelain)" ]; then \
  git config --global user.email "docker@renderscript.algolia.com" && \
  git config --global user.name "Renderscript Dockerfile" && \
  git add -A . && \
  git commit -a -m "dockerfile-temp-commit"; \
  fi

# Use git to only get what's not gitignored in /app/renderscript
# Also useful to get the git repo with low depth
RUN mkdir -p /app
RUN git clone --depth=2 file:///tmp/renderscript /app/renderscript
WORKDIR /app/renderscript
RUN \
  if [ "`git log -1 --pretty=%B`" = "dockerfile-temp-commit" ]; then \
  git reset 'HEAD^'; \
  fi

# Install dev deps and build UI
# Then install only the prod dependencies
RUN \
  yarn install --production=false && \
  yarn build && \
  yarn install --production=true && \
  yarn cache clean

RUN yarn docker:install

# Resulting image
# New, minimal image
# This image must have the minimum amount of layers
FROM node:14.18.0-slim

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
  ttf-freefont \
  xvfb \
  && apt-get remove -y chromium \
  && apt-get clean \
  && rm -rf /var/lib/apt/lists/* \
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
