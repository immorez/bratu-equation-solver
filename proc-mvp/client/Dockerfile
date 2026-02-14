FROM node:22-alpine

WORKDIR /app

# Enable Corepack so we can use Yarn without a global install
RUN corepack enable

# Install dependencies
COPY package.json ./
RUN yarn install --frozen-lockfile || yarn install

# Copy the rest of the client app
COPY . .

ENV HOST=0.0.0.0
ENV PORT=5173

EXPOSE 5173

# Run Vite dev server (suitable for local/dev Docker usage)
CMD ["yarn", "dev", "--host", "0.0.0.0", "--port", "5173"]

