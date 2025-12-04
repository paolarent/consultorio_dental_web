# Etapa 1: Build del proyecto Angular
FROM node:22-alpine AS build
WORKDIR /app

# Copia los archivos de dependencias y los instala
COPY package*.json ./
RUN npm ci

# Copia el resto de archivos y construye la app
COPY . .
RUN npm run build -- --configuration production --output-path dist

# Etapa 2: Servir con Nginx
FROM nginx:alpine

# Copia los archivos generados al directorio de Nginx
COPY --from=build /app/dist/frontend /usr/share/nginx/html


# Copia configuración personalizada de Nginx si quieres (opcional)
# COPY nginx.conf /etc/nginx/conf.d/default.conf

# Exponer el puerto que Railway asignará
EXPOSE 3000

# Comando por defecto para iniciar Nginx
CMD ["nginx", "-g", "daemon off;"]

