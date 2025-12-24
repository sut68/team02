# ============================================
# Stage 1: Build Dependencies
# ============================================
FROM node:20-alpine AS dependencies

WORKDIR /app

COPY package.json package-lock.json* pnpm-lock.yaml* yarn.lock* ./

RUN \
  if [ -f package-lock.json ]; then npm ci; \
  elif [ -f yarn.lock ]; then yarn install --frozen-lockfile; \
  elif [ -f pnpm-lock.yaml ]; then npm install -g pnpm && pnpm install --frozen-lockfile; \
  else npm install; \
  fi

# ============================================
# Stage 2: Prisma Client Generation
# ============================================
FROM dependencies AS prisma-gen

WORKDIR /app

COPY . .

RUN npx prisma generate

# ============================================
# Stage 3: Build Application
# ============================================
FROM dependencies AS builder

WORKDIR /app

ENV SKIP_ENV_VALIDATION=true
ENV DATABASE_URL="postgresql://dummy:dummy@localhost:5432/dummy"

COPY . .
COPY --from=prisma-gen /app/node_modules/.prisma ./node_modules/.prisma

RUN npm run build

# ============================================
# Stage 4: Production Runtime
# ============================================
FROM node:20-alpine AS production

WORKDIR /app

ENV NODE_ENV=production

COPY package.json package-lock.json* pnpm-lock.yaml* yarn.lock* ./

RUN \
  if [ -f package-lock.json ]; then npm ci --only=production; \
  elif [ -f yarn.lock ]; then yarn install --frozen-lockfile --production; \
  elif [ -f pnpm-lock.yaml ]; then npm install -g pnpm && pnpm install --frozen-lockfile --prod; \
  else npm install --production; \
  fi

COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/prisma ./prisma
COPY --from=prisma-gen /app/node_modules/.prisma ./node_modules/.prisma

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000', (r) => {if (r.statusCode !== 200) throw new Error(r.statusCode)})"

CMD ["npm", "run", "start"]