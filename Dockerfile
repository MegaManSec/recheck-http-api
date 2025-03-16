FROM node:22-alpine

WORKDIR /app

COPY package*.json yarn.lock ./

RUN yarn bootstrap

COPY . .

EXPOSE 3001

CMD ["yarn", "start"]
