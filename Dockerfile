FROM node:14-alpine

WORKDIR /app
COPY script script
COPY package*.json ./
RUN npm ci

CMD ["npm", "run", "dev"]
