FROM node:16-alpine AS BUILD_IMAGE

# couchbase sdk requirements
RUN apk update && apk add curl bash python3 make g++ && rm -rf /var/cache/apk/*

# install node-prune (https://github.com/tj/node-prune)
RUN curl -sfL https://install.goreleaser.com/github.com/tj/node-prune.sh | bash -s -- -b /usr/local/bin

WORKDIR /app

COPY package.json ./

# install dependencies
RUN npm install

COPY . .

# build application
RUN npm run build

# remove development dependencies
RUN npm prune --production

# run node prune
RUN /usr/local/bin/node-prune

FROM node:16-alpine

WORKDIR /app

# copy from build image
COPY --from=BUILD_IMAGE /app/package.json ./
COPY --from=BUILD_IMAGE /app/server ./server
COPY --from=BUILD_IMAGE /app/dist ./dist
COPY --from=BUILD_IMAGE /app/node_modules ./node_modules

env PORT=8080

EXPOSE $PORT

CMD [ "npm", "run", "start" ]