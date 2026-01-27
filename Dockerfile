FROM node:18-alpine

WORKDIR /app

COPY package.json .
# Install dependencies
RUN npm i

COPY . .

# Copy app

EXPOSE 3000

CMD ["node", "server.js"]
