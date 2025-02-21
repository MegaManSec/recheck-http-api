FROM node:22-alpine

WORKDIR /app

COPY package*.json yarn.lock ./

RUN yarn bootstrap

COPY . .

EXPOSE 3000

CMD ["yarn", "start"]
