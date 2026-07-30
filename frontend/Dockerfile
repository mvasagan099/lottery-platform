# -- Build stage --------------------------------------------------------------
FROM node:20-alpine AS build
WORKDIR /app

# Accept VITE_ env vars at build time
ARG VITE_API_URL
ARG VITE_WS_URL
ENV VITE_API_URL=$VITE_API_URL
ENV VITE_WS_URL=$VITE_WS_URL

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

# -- Production stage (nginx) --------------------------------------------------
FROM nginx:alpine AS production

# Copy built assets
COPY --from=build /app/dist /usr/share/nginx/html

# Use our hardened nginx config
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 ^
  CMD wget -q -O- http://localhost:80/ || exit 1

CMD ["nginx", "-g", "daemon off;"]
