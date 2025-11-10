FROM node:20-alpine

WORKDIR /app

# Install dependencies
COPY package.json package-lock.json* pnpm-lock.yaml* yarn.lock* ./
RUN \
  if [ -f package-lock.json ]; then npm ci; \
  elif [ -f yarn.lock ]; then yarn install --frozen-lockfile; \
  elif [ -f pnpm-lock.yaml ]; then npm install -g pnpm && pnpm install; \
  else npm install; \
  fi

# Copy source
COPY . .

# For production, uncomment these:
# RUN npm run build

EXPOSE 3000

# Dev:
CMD ["npm", "run", "dev"]
# Prod (if you build above):
# CMD ["npm", "run", "start"]

