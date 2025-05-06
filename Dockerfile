# Build stage
FROM node:18-alpine as build

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm install

# Definindo as variáveis de ambiente para o build (Vite irá usá-las durante o build)
ARG VITE_LOGO_URL
ARG VITE_LOGO_URL_HEADER
ARG VITE_WHATSAPP_URL_BASE
ARG VITE_API_URL_BASE

# Passando as variáveis para o ambiente
ENV VITE_LOGO_URL=$VITE_LOGO_URL
ENV VITE_LOGO_URL_HEADER=$VITE_LOGO_URL_HEADER
ENV VITE_WHATSAPP_URL_BASE=$VITE_WHATSAPP_URL_BASE
ENV VITE_API_URL_BASE=$VITE_API_URL_BASE

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
