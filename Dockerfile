FROM node:22-alpine

WORKDIR /app

COPY index.html style.css server.js package.json ./
COPY js ./js
COPY assets ./assets

EXPOSE 8765

CMD ["node", "server.js"]
