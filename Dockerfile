FROM node:22-alpine
WORKDIR /app
COPY package.json server.js ./
COPY lib ./lib
COPY public ./public
ENV PORT=8888 HOST=0.0.0.0 NODE_ENV=production
EXPOSE 8888
USER node
HEALTHCHECK --interval=30s --timeout=3s CMD wget -qO- http://127.0.0.1:8888/healthz || exit 1
CMD ["node", "server.js"]
