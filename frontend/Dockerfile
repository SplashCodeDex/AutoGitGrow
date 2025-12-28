# Stage 1: Build the React application
FROM node:18-alpine as build

WORKDIR /app

# Copy package.json and package-lock.json first for better caching
COPY package*.json ./
RUN npm ci

# Copy the rest of the application code
COPY . .
RUN npm run build

# Stage 2: Serve the application with Nginx (Harden with non-root)
FROM nginxinc/nginx-unprivileged:alpine

# Copy the build output from the previous stage
COPY --from=build /app/dist /usr/share/nginx/html

# Copy custom Nginx configuration
COPY --chown=nginx:nginx frontend/nginx.conf /etc/nginx/conf.d/default.conf

# Expose port 8080 (unprivileged nginx uses 8080 by default)
EXPOSE 8080

CMD ["nginx", "-g", "daemon off;"]
