FROM node:lts-alpine

RUN npm config -g set unsafe-perm=true \
    && npm config -g set user=0
WORKDIR /app

ADD package.json /app/package.json
ADD package-lock.json /app/package-lock.json
RUN npm ci

ADD lib/client /app/lib
ADD index.ts /app/index.ts

CMD npx ts-node index.ts
