FROM node:20-alpine

# better-sqlite3 nécessite python3 + make pour le build natif
RUN apk add --no-cache python3 make g++

WORKDIR /app

COPY package*.json ./
RUN npm ci --omit=dev

COPY . .

RUN mkdir -p /data /tmp/uploads

VOLUME ["/data"]

ENV NODE_ENV=production \
    PORT=3000 \
    DB_PATH=/data/artpapa.db

EXPOSE 3000

CMD ["node", "app.js"]
