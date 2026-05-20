FROM node:22-alpine AS builder

WORKDIR /app

COPY package*.json ./

RUN npm install --ignore-scripts

COPY . .

RUN npm run build

# Serve the static output with nginx
FROM nginx:alpine

COPY --from=builder /app/dist /usr/share/nginx/html

COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 4321