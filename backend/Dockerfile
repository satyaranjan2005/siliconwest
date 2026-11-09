FROM node:20-slim

# Install OpenSSL for Prisma and curl for container health check
RUN apt-get update -y && apt-get install -y openssl ca-certificates curl && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy dependency specifications and Prisma schema
COPY package*.json ./
COPY prisma ./prisma/

# Install dependencies (including Prisma CLI)
RUN npm install

# Generate Prisma Client for Debian/Linux
RUN npx prisma generate

# Copy the rest of the backend source code
COPY . .

# Set production environment variables
ENV NODE_ENV=production
ENV PORT=5000

# Expose backend API port
EXPOSE 5000

# Synchronize database schema with PostgreSQL on boot, then start the Express server
CMD ["sh", "-c", "npx prisma db push --skip-generate && node index.js"]

