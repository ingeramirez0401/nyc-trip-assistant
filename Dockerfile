# Build stage
FROM node:18-alpine AS builder

WORKDIR /app

# Declarar build arguments para Supabase
ARG VITE_SUPABASE_URL
ARG VITE_SUPABASE_ANON_KEY
ARG VITE_SUPABASE_SERVICE_KEY
ARG VITE_SUPABASE_JWT_SECRET

# Convertir ARG a ENV para que estén disponibles durante el build
ENV VITE_SUPABASE_URL=$VITE_SUPABASE_URL
ENV VITE_SUPABASE_ANON_KEY=$VITE_SUPABASE_ANON_KEY
ENV VITE_SUPABASE_SERVICE_KEY=$VITE_SUPABASE_SERVICE_KEY
ENV VITE_SUPABASE_JWT_SECRET=$VITE_SUPABASE_JWT_SECRET

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Build the application (Vite inyectará las variables de entorno aquí)
RUN npm run build

# Production stage
FROM nginx:alpine

# Copy built assets from builder
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expose port 80
EXPOSE 80

# Start nginx
CMD ["nginx", "-g", "daemon off;"]
