FROM node:20-bookworm-slim AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

FROM node:20-bookworm-slim AS build
WORKDIR /app
ARG DATABASE_URL
ARG SKIP_BUILD=0
ENV DATABASE_URL=$DATABASE_URL
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npx prisma generate
RUN if [ "$SKIP_BUILD" != "1" ]; then npm run build; fi

FROM node:20-bookworm-slim AS runner
WORKDIR /app
ENV NODE_ENV=production
RUN groupadd -r nodejs && useradd -r -g nodejs nodejs
COPY --from=build /app/package.json /app/package-lock.json ./
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY --from=build /app/prisma ./prisma
USER nodejs
EXPOSE 3000
CMD ["node", "dist/src/main.js"]
