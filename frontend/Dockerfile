# Etapa 1: Compilar Angular 20+
FROM node:22-alpine AS build
WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build -- --configuration production --output-path dist/frontend

# Etapa 2: Servir con Express
FROM node:22-alpine
WORKDIR /app

COPY package*.json ./
RUN npm ci

# Copiamos TODA la carpeta dist correctamente
COPY --from=build /app/dist ./dist

COPY server.js .

EXPOSE 3000

CMD ["node", "server.js"]
