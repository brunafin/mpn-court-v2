# Build stage
FROM node:23-alpine as build

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm install

# Vite embute VITE_* no bundle no build — runtime env no container não basta.
ARG VITE_WHATSAPP_URL_BASE
ARG VITE_API_URL_BASE
ARG VITE_ENVIRONMENT
ARG VITE_PUBLIC_SITE_URL
ARG VITE_GOOGLE_CLIENT_ID

ENV VITE_WHATSAPP_URL_BASE=$VITE_WHATSAPP_URL_BASE
ENV VITE_API_URL_BASE=$VITE_API_URL_BASE
ENV VITE_ENVIRONMENT=$VITE_ENVIRONMENT
ENV VITE_PUBLIC_SITE_URL=$VITE_PUBLIC_SITE_URL
ENV VITE_GOOGLE_CLIENT_ID=$VITE_GOOGLE_CLIENT_ID

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
