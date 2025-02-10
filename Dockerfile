FROM node:20

# Set environment variables
ENV PORT=3000
ENV SECRET_KEY=e5f7b5e2a4c8a7d9f8e3d6aaf1b5c5d8

WORKDIR /

COPY package*.json ./

RUN npm install

COPY . .

EXPOSE $PORT

CMD ["node", "server.js"]
