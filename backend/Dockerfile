FROM node:20-alpine

WORKDIR /app

# Install dependencies first (layer cached unless package.json changes)
COPY package.json package-lock.json* ./
RUN npm ci --only=production

# Copy source
COPY server.js ./
COPY routes/ ./routes/
COPY services/ ./services/
COPY data/ ./data/

# Non-root user for security
RUN addgroup -S appgroup && adduser -S appuser -G appgroup
USER appuser

EXPOSE 5000

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -qO- http://localhost:5000/api/health || exit 1

CMD ["node", "server.js"]
