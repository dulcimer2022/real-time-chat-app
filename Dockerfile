# Build stage
FROM node:20-alpine AS build

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Build frontend
RUN npm run build

# Production stage
FROM node:20-alpine

WORKDIR /app

# Copy built assets from build stage
COPY --from=build /app/dist ./dist
COPY --from=build /app/models ./models
COPY --from=build /app/server.js ./
COPY --from=build /app/channels.js ./
COPY --from=build /app/db.js ./
COPY --from=build /app/emoji.js ./
COPY --from=build /app/messages.js ./
COPY --from=build /app/sessions.js ./
COPY --from=build /app/users.js ./
COPY --from=build /app/package*.json ./

# Install only production dependencies
RUN npm ci --only=production

# Expose the port
EXPOSE 3000

# Start the server
CMD ["npm", "start"]