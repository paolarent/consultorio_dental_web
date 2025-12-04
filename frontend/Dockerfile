# Etapa 1: Build del proyecto Angular
FROM node:22-alpine as build
WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build -- --configuration production --output-path dist/frontend

# Etapa 2: Servir con Nginx
FROM nginx:alpine

# Copia los archivos generados a Nginx
COPY dist/frontend /usr/share/nginx/html

# Copia la config de Nginx desde dist/frontend (ya dentro del contexto)
COPY dist/frontend/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]

