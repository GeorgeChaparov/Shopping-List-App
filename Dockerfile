# Use official Node.js LTS (stable, supported)
FROM node:20-alpine

# Create app directory
WORKDIR /usr/src/app

# Copy dependency definitions first (build cache optimization)
COPY package*.json ./

# Install production dependencies only
RUN npm ci --omit=dev

# Copy the rest of the app
COPY . .

# App listens on this port
EXPOSE 3000

# Start the app
CMD ["node", "app.js"]