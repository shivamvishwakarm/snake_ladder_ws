# Stage 1: Build Stage
FROM node:22-alpine AS builder

# Set working directory
WORKDIR /usr/src/app

# Copy package files and install all dependencies (including devDeps)
COPY . .
RUN npm install
RUN npm install -g typescript
RUN npm run build

# Expose your WebSocket port (optional)
EXPOSE 80

# Start the server
CMD ["node", "dist/server.js"]