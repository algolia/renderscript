ARG VERSION
ARG IMAGE_BASE=docker.io/algolia/renderscript-pw-chromium:${VERSION}

# ------------------
# New final image
FROM ${IMAGE_BASE} as base

ENV VERSION ${VERSION:-dev}
ENV NODE_ENV production
ENV IN_DOCKER true
ENV PLAYWRIGHT_BROWSERS_PATH="/ms-playwright"
ENV PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD="true"

# Setup the app WORKDIR
WORKDIR /app/tmp

# Copy and install dependencies separately from the app's code
# To leverage Docker's cache when no dependency has change
COPY package.json yarn.lock .yarnrc.yml ./
COPY .yarn .yarn

# Install dev dependencies
RUN true \
  # Use local version instead of letting yarn auto upgrade itself
  && yarn set version $(ls -d $PWD/.yarn/releases/*) \
  && yarn install

# This step will invalidates cache
COPY . /app/tmp

# Builds the UI, install chrome and remove dev dependencies
RUN true \
  && ls -lah /app/tmp \
  && yarn build \
  && yarn workspaces focus --all --production \
  && rm -rf .yarn/

# ------------------
# New final image
FROM ${IMAGE_BASE} as final

ARG VERSION
ENV VERSION ${VERSION:-dev}

# Autolink repository https://docs.github.com/en/packages/learn-github-packages/connecting-a-repository-to-a-package
LABEL org.opencontainers.image.source=https://github.com/algolia/renderscript
LABEL org.opencontainers.image.revision=$VERSION

ENV NODE_ENV production
ENV IN_DOCKER true
ENV PLAYWRIGHT_BROWSERS_PATH="/ms-playwright"
ENV PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD="true"

# Copy install from previous stage
WORKDIR /app/renderscript
COPY --from=base --chown=node:node /app/tmp /app/renderscript

# Do not use root to run the app
USER pwuser

CMD [ "node", "dist/index.js" ]
