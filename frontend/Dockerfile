# Etapa 1: Build del proyecto Angular
FROM node:22-alpine as build
WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build -- --configuration production

# Etapa 2: Servir con Nginx
FROM nginx:alpine

# Copia los archivos generados a Nginx
COPY --from=build /app/dist/frontend/browser /usr/share/nginx/html

# Copia la config de Nginx desde la raíz del proyecto
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
