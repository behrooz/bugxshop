FROM golang:1.21-alpine AS builder

WORKDIR /app

# Configure Go settings
ENV GO111MODULE=on
ENV CGO_ENABLED=0

# Copy go mod files first for better layer caching
COPY go.mod go.sum* ./

# Try downloading with proxy first, fallback to direct if needed
RUN go mod download || \
    (GOPROXY=direct go mod download) || \
    (GOPROXY=https://goproxy.io,direct go mod download)

# Copy source code
COPY . .

# Build the application
RUN go build -o main .

FROM alpine:latest

RUN apk --no-cache add ca-certificates

WORKDIR /root/

COPY --from=builder /app/main .

EXPOSE 8080

CMD ["./main"]
