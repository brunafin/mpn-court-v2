# Build stage
FROM node:24-alpine AS build

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

# Vite embute VITE_* no bundle no build — runtime env no container não basta.
ARG VITE_WHATSAPP_URL_BASE
ARG VITE_API_URL_BASE
ARG VITE_ENVIRONMENT
ARG VITE_PUBLIC_SITE_URL
ARG VITE_GOOGLE_CLIENT_ID
ARG VITE_WHATSAPP_CONTRACT_URL
ARG VITE_WHATSAPP_RECEIPT_URL
ARG VITE_MANUAL_PIX_KEY
ARG VITE_MANUAL_PIX_BENEFICIARY
ARG VITE_MERCADO_PAGO_PIX_UI_ENABLED

ENV VITE_WHATSAPP_URL_BASE=$VITE_WHATSAPP_URL_BASE
ENV VITE_API_URL_BASE=$VITE_API_URL_BASE
ENV VITE_ENVIRONMENT=$VITE_ENVIRONMENT
ENV VITE_PUBLIC_SITE_URL=$VITE_PUBLIC_SITE_URL
ENV VITE_GOOGLE_CLIENT_ID=$VITE_GOOGLE_CLIENT_ID
ENV VITE_WHATSAPP_CONTRACT_URL=$VITE_WHATSAPP_CONTRACT_URL
ENV VITE_WHATSAPP_RECEIPT_URL=$VITE_WHATSAPP_RECEIPT_URL
ENV VITE_MANUAL_PIX_KEY=$VITE_MANUAL_PIX_KEY
ENV VITE_MANUAL_PIX_BENEFICIARY=$VITE_MANUAL_PIX_BENEFICIARY
ENV VITE_MERCADO_PAGO_PIX_UI_ENABLED=$VITE_MERCADO_PAGO_PIX_UI_ENABLED

COPY . .
RUN npm run build

# Serve stage
FROM node:24-alpine

WORKDIR /app

# serve 14.2.6 ainda puxa compression 1.8.1, que vaza memória se a resposta fecha cedo.
RUN npm install -g serve@14.2.6 \
  && npm install compression@1.8.2 --prefix "$(npm root -g)/serve"

# Copia os arquivos construídos
COPY --from=build /app/dist ./dist

# Define a porta usada pela Railway
ENV PORT=3000
EXPOSE 3000

# -l $PORT escuta só em "::" e o log mostra localhost. O proxy da Railway
# chega por IPv4 e devolve 502. 0.0.0.0 aceita essa conexão.
CMD ["sh", "-c", "exec serve -s dist -l \"tcp://0.0.0.0:${PORT}\""]
