FROM node:24-bookworm-slim AS base

WORKDIR /app

ENV PATH=/root/.vite-plus/bin:$PATH

RUN apt-get update \
  && apt-get install -y --no-install-recommends curl ca-certificates unzip \
  && rm -rf /var/lib/apt/lists/*

RUN curl -fsSL https://bun.sh/install | bash \
  && ln -s /root/.bun/bin/bun /usr/local/bin/bun

SHELL ["/bin/bash", "-c"]

RUN curl -fsSL https://vite.plus | bash \
  && vp --version

FROM base AS deps

COPY package.json bun.lock bunfig.toml ./

RUN vp install --prod --frozen-lockfile --ignore-scripts

FROM base AS build

COPY package.json bun.lock bunfig.toml ./

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
