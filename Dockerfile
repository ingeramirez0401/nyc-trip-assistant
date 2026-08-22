# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Solo variables públicas en build-time: se inlinean en el bundle JS que
# llega al navegador (VITE_SUPABASE_ANON_KEY es pública por diseño).
# La API key de OpenAI NUNCA pasa por aquí — vive solo en el servidor,
# como variable de entorno en runtime (ver stage de producción abajo).
ARG VITE_SUPABASE_URL
ARG VITE_SUPABASE_ANON_KEY

ENV VITE_SUPABASE_URL=$VITE_SUPABASE_URL
ENV VITE_SUPABASE_ANON_KEY=$VITE_SUPABASE_ANON_KEY

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Build the application (Vite inyectará las variables de entorno aquí)
RUN npm run build

# Production stage: un solo proceso Node sirve el build estático (dist/)
# y el backend (server/) que hace de proxy autenticado hacia OpenAI.
FROM node:20-alpine AS runner

WORKDIR /app
ENV NODE_ENV=production

COPY package*.json ./
RUN npm ci --omit=dev

COPY --from=builder /app/dist ./dist
COPY server ./server

# OPENAI_API_KEY, VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY se pasan
# como variables de entorno en runtime (docker-compose / Portainer),
# nunca como build-arg.
EXPOSE 80
ENV PORT=80

CMD ["node", "server/index.js"]
