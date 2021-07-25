FROM node:lts-alpine

RUN npm config -g set unsafe-perm=true \
    && npm config -g set user=0
WORKDIR /app

ADD package.json /app/package.json
ADD package-lock.json /app/package-lock.json
ADD tsconfig.json /app/tsconfig.json
ADD lib/ /app/lib/
ADD index.ts /app/index.ts
RUN npm ci

CMD npx ts-node index.ts
