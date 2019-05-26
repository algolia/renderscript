# Base image
FROM node:10-alpine AS base

# Install dependencies
RUN  --update git bash

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

# Resulting image
# New, minimal image
# This image must have the minimum amount of layers
FROM node:10-alpine

ENV NODE_ENV production
ENV IN_DOCKER true

WORKDIR /app/renderscript

COPY --from=base /app/renderscript /app/renderscript

# Git is used for version getting (last commit hash)
# Bash is just to be able to log inside the image and have a decent shell
# Curl can always be useful
# The rest is Chromium and its dependencies
RUN \
  mkdir -p /app/renderscript && \
  echo @edge http://nl.alpinelinux.org/alpine/edge/community >> /etc/apk/repositories && \
  echo @edge http://nl.alpinelinux.org/alpine/edge/main >> /etc/apk/repositories && \
  apk add --no-cache \
    git@edge \
    bash@edge \
    curl@edge \
    chromium@edge \
    nss@edge \
    freetype@edge \
    harfbuzz@edge \
    ttf-freefont@edge

CMD [ "yarn", "start"]
