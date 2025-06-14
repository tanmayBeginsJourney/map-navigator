# Use Node.js 20 Alpine image
FROM node:20-alpine

# Set working directory
WORKDIR /app

# Copy package.json and install ALL dependencies (including devDependencies for build)
COPY package.json ./
RUN npm install

# Copy source code
COPY . .

# Build the application using standalone TypeScript config
RUN npx tsc --project tsconfig.railway.json

# Remove dev dependencies after build
RUN npm prune --production

# Expose port
EXPOSE 3001

# Set environment variables
ENV NODE_ENV=production
ENV PORT=3001

# Start the application
CMD ["npm", "start"] 