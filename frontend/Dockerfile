# frontend/Dockerfile
FROM node:20-alpine AS build
WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

FROM nginx:alpine
# Nginx config that proxies /api to backend
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Vite build output is usually /dist
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80
