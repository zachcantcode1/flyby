# Build stage
FROM node:20-alpine AS builder
WORKDIR /app

# Copy package files
COPY package*.json ./
RUN npm ci

# Copy source code
COPY . .

# Build arguments for environment variables (baked into the build)
ARG VITE_OPENSKY_CLIENT_ID
ARG VITE_OPENSKY_CLIENT_SECRET
ARG VITE_FR24_API_KEY
ARG VITE_NTFY_URL
ARG VITE_NTFY_TOPIC
ARG VITE_HOME_LAT
ARG VITE_HOME_LON
ARG VITE_NOTIFICATION_RADIUS_KM

# Build the app
RUN npm run build

# Production stage
FROM nginx:alpine

# Copy built assets from builder
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
