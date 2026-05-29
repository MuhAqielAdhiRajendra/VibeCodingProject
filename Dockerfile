# TAHAP 1: Proses Build React (Seolah-olah mesin menjalankan npm run build)
FROM node:22-alpine AS builder
WORKDIR /app
# Copy file package.json dan install dependency
COPY package*.json ./
RUN npm install
# Copy seluruh kode sumbermu
COPY . .
# Jalankan build Vite
RUN npm run build

# TAHAP 2: Setup Server Nginx
FROM nginx:alpine
# Timpa konfigurasi bawaan Nginx dengan buatan kita
RUN rm /etc/nginx/conf.d/default.conf
COPY nginx.conf /etc/nginx/conf.d/default.conf
# Copy hasil build dari Tahap 1 (folder dist) ke dalam server Nginx
COPY --from=builder /app/dist /usr/share/nginx/html

# Buka port 8080 sesuai standar Google Cloud Run
EXPOSE 8080
CMD ["nginx", "-g", "daemon off;"]