FROM node:18-alpine

WORKDIR /app

# Install build dependencies for native modules (grpc, bcrypt, fabric SDKs)
RUN apk update && apk add --no-cache python3 make g++ openssl openssl-dev || \
    apk add --no-cache python3 make g++ openssl openssl-dev --repository=https://dl-cdn.alpinelinux.org/alpine/edge/main

COPY package.json ./
RUN npm install --legacy-peer-deps

COPY . .

RUN npx prisma generate

EXPOSE 3002

CMD ["sh", "-c", "npx prisma generate && npx prisma migrate deploy && npm start"]
