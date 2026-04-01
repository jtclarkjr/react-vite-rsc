FROM node:24-bookworm-slim AS base

WORKDIR /app

ENV PNPM_HOME=/pnpm
ENV PATH=/root/.vite-plus/bin:$PNPM_HOME:$PATH
ENV COREPACK_ENABLE_DOWNLOAD_PROMPT=0

RUN apt-get update \
  && apt-get install -y --no-install-recommends curl ca-certificates \
  && rm -rf /var/lib/apt/lists/*

RUN corepack enable

SHELL ["/bin/bash", "-c"]

RUN curl -fsSL https://vite.plus | bash \
  && vp --version

FROM base AS deps

COPY package.json pnpm-lock.yaml ./

RUN vp install --prod --frozen-lockfile --ignore-scripts

FROM base AS build

COPY package.json pnpm-lock.yaml ./

RUN vp install --frozen-lockfile --ignore-scripts

COPY . .

RUN vp build

FROM build AS preview

ENV PORT=3000

EXPOSE 3000

CMD ["vp", "preview", "--host", "0.0.0.0", "--port", "3000", "--strictPort"]

FROM node:24-bookworm-slim AS runtime

ENV NODE_ENV=production
ENV PORT=3000

WORKDIR /app

COPY --from=build /app/.output ./.output

EXPOSE 3000

CMD ["node", ".output/server/index.mjs"]
