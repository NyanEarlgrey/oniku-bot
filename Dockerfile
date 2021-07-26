FROM node:lts as build

RUN npm config -g set unsafe-perm=true \
    && npm config -g set user=0
WORKDIR /app

ADD package.json /app/package.json
ADD package-lock.json /app/package-lock.json
ADD tsconfig.json /app/tsconfig.json
ADD @types/ /app/@types/
ADD lib/ /app/lib/
ADD index.ts /app/index.ts
RUN npm ci
RUN npx tsc

#

FROM node:lts-alpine as prod

WORKDIR /app
COPY --from=build /app/node_modules/ /app/node_modules/
COPY --from=build /app/index.js /app
COPY --from=build /app/lib/ /app/lib/

CMD node index.js
