FROM node:20-slim AS web-build
WORKDIR /app/web
COPY web/package*.json ./
RUN npm ci
COPY web/ ./
ENV VITE_USE_MOCK=false
RUN npm run build

FROM node:20-slim AS api-build
WORKDIR /app/api
COPY api/package*.json ./
RUN npm ci
COPY api/tsconfig.json ./
COPY api/src ./src
RUN npm run build && npm prune --omit=dev

FROM node:20-slim AS runtime
ENV NODE_ENV=production
ENV PORT=8080
ENV WEB_DIST=/app/web/dist
WORKDIR /app
COPY --from=api-build --chown=node:node /app/api/package*.json ./api/
COPY --from=api-build --chown=node:node /app/api/node_modules ./api/node_modules
COPY --from=api-build --chown=node:node /app/api/dist ./api/dist
COPY --from=web-build --chown=node:node /app/web/dist ./web/dist
USER node
EXPOSE 8080
CMD ["node", "api/dist/server.js"]
