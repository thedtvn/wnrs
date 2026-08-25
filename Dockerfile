# ---- build stage: compile client + server ----
FROM node:22-alpine AS build
WORKDIR /app

COPY package-lock.json* package.json ./
RUN npm ci

COPY . .
# VITE_DISCORD_CLIENT_ID must be present at build time (baked into the bundle).
ARG VITE_DISCORD_CLIENT_ID=""
ENV VITE_DISCORD_CLIENT_ID=$VITE_DISCORD_CLIENT_ID
RUN npm run build

RUN npm prune --omit=dev

# ---- runtime stage ----
FROM node:22-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production
ENV IS_DOCKER=1

COPY --from=build /app/package.json ./package.json
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY --from=build /app/dist-server ./dist-server

EXPOSE 3000
USER node
CMD ["node", "dist-server/server/index.js"]
