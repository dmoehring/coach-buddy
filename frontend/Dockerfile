# Builds the Angular app from source and serves it via nginx, which also
# reverse-proxies /api to the backend container so the browser only ever
# talks to a single origin (no CORS needed in production).

FROM node:22-alpine AS build

WORKDIR /workspace

COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN npm run build

FROM nginx:alpine

COPY --from=build /workspace/dist/frontend/browser/ /usr/share/nginx/html/
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
