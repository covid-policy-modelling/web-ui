FROM node:14-alpine AS dev

WORKDIR /app
COPY script script
COPY package*.json ./
RUN npm ci

CMD npm install && npx db-migrate up && npm run dev

FROM dev AS release
# If start-up speed is important, this can be used instead of release.
# It does not allow for any files to be over-ridden via mounts however.

# At build-time, the code checks these exist, but the values are replaced at run-time
ARG BLOB_STORAGE_ACCOUNT=notused
ARG BLOB_STORAGE_CONTAINER=notused
ARG BLOB_STORAGE_KEY=notused
ARG CONTROL_REPO_EVENT_TYPE=notused
ARG CONTROL_REPO_NWO=notused
ARG GITHUB_API_TOKEN=notused
ARG GITHUB_CLIENT_ID=notused
ARG OAUTH_SECRET=notused
ARG RUNNER_CALLBACK_URL=notused
ARG RUNNER_SHARED_SECRET=notused
ARG SESSION_SECRET=notused

WORKDIR /app
COPY ./ ./
RUN npm run build

CMD DB_CA=$(cat lib/BaltimoreCyberTrustRoot.crt.pem) npx db-migrate up --env prod && npm run start

LABEL org.opencontainers.image.source=https://github.com/covid-policy-modelling/web-ui

FROM release AS test

WORKDIR /app
RUN npm test

# Use release as the default
FROM release
