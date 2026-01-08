FROM node:18-alpine

WORKDIR /app

# Install dependencies
RUN npm install express http-proxy @mockoon/commons-server

# Copy app
COPY server.js .

# Data folder (mounted at runtime)
RUN mkdir /data

EXPOSE 3000

CMD ["node", "server.js"]
