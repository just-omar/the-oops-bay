# --- Frontend ---
FROM node:20-alpine AS frontend-builder
WORKDIR /app/frontend
# Кэшируем пакеты Node
COPY frontend/package*.json ./
RUN npm install
COPY frontend/ .
RUN npm run build

# --- Backend ---
FROM golang:1.25-alpine AS backend-builder
WORKDIR /app

# ВАЖНО: Используем быстрый прокси для скачивания (решает проблему долгого go mod download)
ENV GOPROXY=https://goproxy.io,direct

# Кэшируем Go модули
COPY go.mod go.sum ./
RUN go mod download

COPY . .

# Исправляем go.sum
RUN go mod tidy

# ВАЖНО: CGO_ENABLED=0 (решает проблему долгой компиляции GCC)
RUN CGO_ENABLED=0 GOOS=linux go build -ldflags="-s -w" -o the-oops-bay .

# --- Final ---
FROM alpine:latest
WORKDIR /root/
RUN apk add --no-cache ca-certificates

COPY --from=backend-builder /app/the-oops-bay .
COPY --from=frontend-builder /app/frontend/dist ./frontend/dist

VOLUME ["/root/data"]
EXPOSE 3000
CMD ["./the-oops-bay"]