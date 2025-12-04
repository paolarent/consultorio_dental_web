# Etapa 1: Build del proyecto Angular
FROM node:22-alpine AS build
WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build -- --configuration production --output-path dist/frontend

# Etapa 2: Servir con Nginx
FROM nginx:alpine
COPY --from=build /app/dist/frontend /usr/share/nginx/html

# Copia el nginx.conf template
COPY nginx.conf /etc/nginx/conf.d/default.conf.template

# Instala bash para usar envsubst
RUN apk add --no-cache bash

# Reemplaza $PORT y arranca Nginx
CMD sh -c "envsubst '\$PORT' < /etc/nginx/conf.d/default.conf.template > /etc/nginx/conf.d/default.conf && nginx -g 'daemon off;'"
