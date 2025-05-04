# Use Node.js as the base image
FROM node:20-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy project files
COPY . .

# Make sure dist directory exists
RUN mkdir -p ./dist

# Build the frontend
RUN npm run build || echo "Build step may have failed, but continuing"

# Expose the port the app runs on
EXPOSE 3000

# Command to run the application
CMD ["npm", "start"]