# build stage
FROM node:lts-alpine as build-stage

# Update to the latest npm
RUN npm install -g npm@latest
RUN node --version
RUN npm --version

# Pull in all dependencies
WORKDIR /app
COPY package*.json ./
RUN npm ci

# Copy in all the source and build
COPY . .
RUN npm run build

# Production stage
FROM nginx:stable-alpine as production-stage
COPY --from=build-stage /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/nginx.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]