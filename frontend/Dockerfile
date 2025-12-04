# Etapa 1: Build del proyecto Angular
FROM node:22-alpine AS build
WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build -- --configuration production --output-path dist/frontend

# Etapa 2: Servir con Nginx
FROM nginx:alpine

# Copia la build generada
COPY --from=build /app/dist/frontend /usr/share/nginx/html

# Copia el nginx.conf template
COPY nginx.conf.template /etc/nginx/conf.d/default.conf.template

# Usa envsubst para reemplazar $PORT automáticamente
RUN apk add --no-cache bash
CMD ["sh", "-c", "envsubst '\$PORT' < /etc/nginx/conf.d/default.conf.template > /etc/nginx/conf.d/default.conf && nginx -g 'daemon off;'"]


