# Use Node.js 20 Alpine as base image
FROM node:20-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
# Using 'npm ci' for more reliable builds in production-like environments
RUN npm ci --only=production

# Copy the rest of the application code
COPY . .

# Expose the port the app runs on
# Railway will automatically detect this or use the PORT env variable
EXPOSE 3000

# Command to run the application
CMD ["node", "src/server.js"]
