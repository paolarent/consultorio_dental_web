# Etapa 1: Build del proyecto Angular
FROM node:22-alpine AS build
WORKDIR /app

# Instala dependencias
COPY package*.json ./
RUN npm ci

# Copia el resto del código y hace el build
COPY . .
RUN npm run build -- --configuration production --output-path dist/frontend

# Etapa 2: Servir con Nginx
FROM nginx:alpine

# Copia la build generada
COPY --from=build /app/dist/frontend /usr/share/nginx/html

# Configuración para Angular SPA
RUN rm /etc/nginx/conf.d/default.conf
COPY nginx.conf /etc/nginx/conf.d/

EXPOSE 3000
CMD ["nginx", "-g", "daemon off;"]

