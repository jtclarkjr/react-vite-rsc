FROM node:24-bookworm-slim AS base

WORKDIR /app

ENV PATH=/root/.local/share/vite-plus/bin:$PATH

RUN apt-get update \
  && apt-get install -y --no-install-recommends curl ca-certificates unzip \
  && rm -rf /var/lib/apt/lists/*

RUN curl -fsSL https://bun.sh/install | bash \
  && ln -s /root/.bun/bin/bun /usr/local/bin/bun

SHELL ["/bin/bash", "-c"]

RUN curl -fsSL https://vite.plus | VP_VERSION=1.3.0 bash \
  && vp --version

COPY scripts/docker-sandbox.sh /usr/local/bin/docker-sandbox
COPY scripts/docker-dev-proxy.mjs /usr/local/bin/docker-dev-proxy.mjs

FROM base AS build

COPY package.json bun.lock bunfig.toml ./
COPY patches ./patches

RUN vp install --frozen-lockfile --ignore-scripts

COPY . .
COPY void.config.example.ts ./void.config.ts

RUN vp exec void prepare && vp build

FROM build AS preview

ENV PORT=3000

EXPOSE 3000

CMD ["/bin/bash", "-c", "vp exec void db migrate && exec vp preview --host 0.0.0.0 --port 3000 --strictPort"]
