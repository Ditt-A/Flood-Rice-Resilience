FROM node:22-alpine AS deps
WORKDIR /workspace/app
COPY app/package.json app/package-lock.json* ./
RUN npm ci

FROM node:22-alpine AS builder
WORKDIR /workspace/app
ENV NEXT_TELEMETRY_DISABLED=1
ENV PROJECT_ROOT=/workspace
COPY --from=deps /workspace/app/node_modules ./node_modules
COPY app ./
COPY ai/outputs /workspace/ai/outputs
RUN npm run build

FROM node:22-alpine AS runner
WORKDIR /workspace/app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PROJECT_ROOT=/workspace
ENV HOSTNAME=0.0.0.0
COPY --from=builder /workspace/app/.next/standalone ./
COPY --from=builder /workspace/app/.next/static ./.next/static
COPY --from=builder /workspace/app/public ./public
COPY --from=builder /workspace/ai/outputs /workspace/ai/outputs
EXPOSE 3000
CMD ["node", "server.js"]
