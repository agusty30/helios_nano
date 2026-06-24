# helios_nano — autonomous x402 nanopayment agent
#
# Single image that runs either the paywall server (default) or the agent CLI.
# Node 22 (LTS) has global fetch; tsx runs the TypeScript directly.
FROM node:22-slim

WORKDIR /app

# Install deps first for layer caching. tsx + typescript are runtime deps.
COPY package.json package-lock.json ./
RUN npm ci --omit=dev

# App source
COPY . .

# Wallet key + audit ledger live in a mounted volume, not the image.
ENV NODE_ENV=production \
    PORT=3000 \
    AGENT_KEY_PATH=/data/.agent-key \
    AGENT_LEDGER_PATH=/data/ledger.jsonl

RUN mkdir -p /data && chown -R node:node /data
USER node

EXPOSE 3000

# Default: run the paywall server. Override for the agent CLI, e.g.:
#   docker run helios_nano npm run agent -- doctor
CMD ["npm", "start"]
