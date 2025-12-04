# Etapa 1: Compilar Angular
FROM node:22-alpine AS build
WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build -- --configuration production --output-path dist/frontend

# Etapa 2: Servir con Node + Express
FROM node:22-alpine
WORKDIR /app

COPY package*.json ./
RUN npm ci

# Copiamos SOLO lo generado
COPY --from=build /app/dist/frontend ./dist
COPY server.js .

EXPOSE 3000

CMD ["node", "server.js"]

