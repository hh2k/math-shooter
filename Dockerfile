FROM node:26.13.0-alpine

# Latest Alpine security fixes; remove npm (unused at runtime, and its
# bundled packages show up in CVE scans)
RUN apk upgrade --no-cache \
    && rm -rf /usr/local/lib/node_modules/npm /usr/local/bin/npm /usr/local/bin/npx

WORKDIR /app

COPY index.html style.css server.js package.json ./
COPY js ./js

EXPOSE 80

CMD ["node", "server.js"]
