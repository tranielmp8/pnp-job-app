# ---- build ----
FROM node:24-alpine AS build
WORKDIR /app

COPY package.json package-lock.json .npmrc ./
RUN npm ci

COPY . .
RUN npm run build && npm prune --omit=dev

# ---- runtime ----
FROM node:24-alpine
WORKDIR /app
# BODY_SIZE_LIMIT: adapter-node rejects bodies over 512K by default; resume uploads allow 5 MB.
ENV NODE_ENV=production \
    PORT=3000 \
    UPLOAD_DIR=/app/uploads \
    BODY_SIZE_LIMIT=6M

COPY --from=build /app/build ./build
COPY --from=build /app/node_modules ./node_modules
COPY package.json ./
# SQL migrations, applied on every start by scripts/migrate.js.
COPY drizzle ./drizzle
COPY scripts ./scripts

# Resumes live here; mount a Coolify persistent volume at /app/uploads.
RUN mkdir -p /app/uploads && chown -R node:node /app/uploads
USER node

EXPOSE 3000
# Bring the database schema up to date, then start the app.
# If migrations fail the app does not start, so Coolify shows the error.
CMD ["sh", "-c", "node scripts/migrate.js && exec node build"]
