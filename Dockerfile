# Koristimo stabilan i lagan Node.js Alpine image
FROM node:20-alpine

# Instalacija OpenSSL paketa potrebnog za Prisma engine na Alpine Linuxu
RUN apk add --no-cache openssl libc6-compat

WORKDIR /app

# Kopiranje zavisnosti
COPY package*.json ./
COPY prisma ./prisma/

# Instalacija produkcijskih paketa i generisanje Prisma klijenta
RUN npm ci --only=production
RUN npx prisma generate

# Kopiranje ostatka koda
COPY . .

# Kreiranje foldera za upload i postavljanje prava
RUN mkdir -p public/uploads

# Coolify i Docker port
EXPOSE 3000

ENV NODE_ENV=production

# Pokretanje Prisma migracija i startovanje aplikacije
CMD ["sh", "-c", "npx prisma migrate deploy && node src/app.js"]