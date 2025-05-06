# Build stage
FROM node:18-alpine as build

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm install

COPY . .
RUN npm run build

# Serve stage
FROM node:18-alpine

WORKDIR /app

# Instala o 'serve' globalmente
RUN npm install -g serve

# Copia os arquivos construídos
COPY --from=build /app/dist ./dist

# Define a porta usada pela Railway
ENV PORT=3000
EXPOSE 3000

# Inicia o servidor com 'serve'
CMD ["serve", "-s", "dist", "-l", "3000"]
