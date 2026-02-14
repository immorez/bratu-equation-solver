FROM node:22-alpine

WORKDIR /app

# Enable Corepack so we can use Yarn without a global install
RUN corepack enable

# Install dependencies
COPY package.json ./
COPY prisma ./prisma
RUN yarn install --frozen-lockfile || yarn install

# Copy source and config
COPY tsconfig.json ./
COPY src ./src

# Build the TypeScript project
RUN yarn build

ENV NODE_ENV=production
ENV PORT=3001

EXPOSE 3001

# Run DB schema sync on startup (dev-friendly) then start server
CMD ["sh", "-c", "yarn db:push && yarn start"]

