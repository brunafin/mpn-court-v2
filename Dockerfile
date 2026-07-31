# Build stage
FROM node:23-alpine as build

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm install

# Definindo as variáveis de ambiente para o build (Vite irá usá-las durante o build)
ARG VITE_WHATSAPP_URL_BASE
ARG VITE_API_URL_BASE
ARG VITE_ENVIRONMENT

# Passando as variáveis para o ambiente
ENV VITE_WHATSAPP_URL_BASE=$VITE_WHATSAPP_URL_BASE
ENV VITE_API_URL_BASE=$VITE_API_URL_BASE
ENV VITE_ENVIRONMENT=$VITE_ENVIRONMENT

COPY . .
RUN npm run build

# Serve stage
FROM node:23-alpine

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
