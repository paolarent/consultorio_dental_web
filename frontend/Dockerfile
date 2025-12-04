# Etapa 1: Build del proyecto Angular
FROM node:22-alpine as build

WORKDIR /app

# Copia los archivos de package.json para instalar dependencias
COPY package*.json ./
RUN npm ci

# Copia todo el proyecto
COPY . .

# Genera los archivos de producción
RUN npm run build -- --configuration production

# Etapa 2: Servir con Nginx
FROM nginx:alpine

# Copia los archivos generados a Nginx
# Como tu dist/frontend/browser está en la raíz, se copia así:
COPY dist/frontend/browser /usr/share/nginx/html

# Opcional: agrega config de Nginx para Angular SPA
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Exponer puerto 80
EXPOSE 80

# Inicia Nginx
CMD ["nginx", "-g", "daemon off;"]
