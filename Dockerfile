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
WORKDIR /app
COPY --from=api-build --chown=node:node /app/api/package*.json ./api/
COPY --from=api-build --chown=node:node /app/api/node_modules ./api/node_modules
COPY --from=api-build --chown=node:node /app/api/dist ./api/dist
USER node
EXPOSE 8080
CMD ["node", "api/dist/server.js"]
