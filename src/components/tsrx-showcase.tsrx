type ShowcaseFeature = {
  id: string
  title: string
  description: string
  snippet: string
  accent: 'violet' | 'indigo' | 'teal'
}

component FeatureCard({
  title,
  description,
  snippet,
  accent
}: {
  title: string
  description: string
  snippet: string
  accent: ShowcaseFeature['accent']
}) {
  <article class={`feature-card ${accent}`}>
    <div class="card-header">
      <span class="accent-dot" />
      <h3>{title}</h3>
    </div>
    <p class="card-copy">{description}</p>
    <code class="card-code">{snippet}</code>
  </article>

  <style>
    .feature-card {
      display: grid;
      gap: 1rem;
      padding: 1.25rem;
      border-radius: 1.5rem;
      border: 1px solid rgba(137, 92, 255, 0.18);
      background: rgba(255, 255, 255, 0.84);
      box-shadow: 0 24px 70px rgba(55, 32, 120, 0.08);
      min-height: 100%;
    }

    .card-header {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }

    .accent-dot {
      width: 0.85rem;
      height: 0.85rem;
      border-radius: 999px;
      background: currentColor;
      flex: 0 0 auto;
    }

    h3 {
      margin: 0;
      font-size: 1.05rem;
      line-height: 1.2;
      letter-spacing: -0.02em;
      color: #19143d;
    }

    .card-copy {
      margin: 0;
      color: rgba(25, 20, 61, 0.72);
      line-height: 1.65;
    }

    .card-code {
      display: block;
      padding: 0.9rem 1rem;
      border-radius: 1rem;
      background: rgba(21, 16, 51, 0.94);
      color: #f7f3ff;
      font-size: 0.86rem;
      line-height: 1.55;
      white-space: pre-wrap;
      overflow-wrap: anywhere;
    }

    .violet {
      color: #6f00ff;
    }

    .indigo {
      color: #4652ff;
    }

    .teal {
      color: #007a88;
    }
  </style>
}

export default component TsrxShowcase() {
  const features: ShowcaseFeature[] = [
    {
      id: 'components',
      title: 'Component keyword',
      description:
        'Author a React component in a .tsrx file with template, logic, and local styling in one module.',
      snippet: "export default component TsrxShowcase() { ... }",
      accent: 'violet'
    },
    {
      id: 'control-flow',
      title: 'Statement-based control flow',
      description:
        'Use native if blocks and for...of loops directly in the template instead of mapping through JSX expressions.',
      snippet: 'for (const feature of features; key feature.id) { ... }',
      accent: 'indigo'
    },
    {
      id: 'scoped-styles',
      title: 'Scoped styles by default',
      description:
        'Each TSRX component can ship its own style block, and the compiler scopes selectors to that component.',
      snippet: '<style> .feature-card { ... } </style>',
      accent: 'teal'
    }
  ]
  const docsHref = 'https://tsrx.dev/features'
  const docsLabel = 'Explore TSRX features'
  const scopedStylesEnabled = true

  <section class="tsrx-shell">
    <div class="hero-panel">
      <div class="hero-copy">
        <p class="eyebrow">{'TSRX extension'}</p>
        <h2>{'TSRX is now wired into this Vite+ React RSC starter.'}</h2>
        <p class="lede">
          {'This panel is authored in '}
          <code class="inline-code">{'.tsrx'}</code>
          {' and imported directly into the home route through '}
          <code class="inline-code">{'@tsrx/vite-plugin-react'}</code>
          {'.'}
        </p>
        <p class="meta">
          {`${features.length} feature callouts, one local SVG logo, and zero changes to the route-module naming convention.`}
        </p>
      </div>

      <div class="hero-mark">
        <div class="logo-frame">
          <img src="/tsrx-mark.svg" alt="TSRX logo" class="logo" />
        </div>
        if (scopedStylesEnabled) {
          <p class="status-chip">{'Scoped styles are generated per component.'}</p>
        }
      </div>
    </div>

    <div class="feature-grid">
      for (const feature of features; key feature.id) {
        const { title, description, snippet, accent } = feature
        <FeatureCard {title} {description} {snippet} {accent} />
      }
    </div>

    <div class="footer-row">
      <p class="footer-copy">
        {'Routes stay on '}
        <code class="inline-code">{'src/routes/**/page.tsx'}</code>
        {', but those route files can now import '}
        <code class="inline-code">{'.tsrx'}</code>
        {' React components directly.'}
      </p>
      <a href={docsHref} class="docs-link">{docsLabel}</a>
    </div>

    <style>
      .tsrx-shell {
        display: grid;
        gap: 1.5rem;
        padding: clamp(1.5rem, 3vw, 2.25rem);
        border-radius: 2rem;
        border: 1px solid rgba(137, 92, 255, 0.18);
        background:
          radial-gradient(circle at top left, rgba(141, 90, 255, 0.22), transparent 34%),
          radial-gradient(circle at top right, rgba(70, 82, 255, 0.18), transparent 26%),
          linear-gradient(180deg, rgba(255, 255, 255, 0.96), rgba(246, 243, 255, 0.96));
        box-shadow: 0 30px 90px rgba(50, 31, 111, 0.1);
        overflow: clip;
      }

      .hero-panel {
        display: grid;
        grid-template-columns: minmax(0, 1.8fr) minmax(14rem, 0.9fr);
        gap: 1.5rem;
        align-items: center;
      }

      .hero-copy {
        display: grid;
        gap: 0.9rem;
      }

      .eyebrow {
        margin: 0;
        font-size: 0.78rem;
        font-weight: 700;
        letter-spacing: 0.22em;
        text-transform: uppercase;
        color: #6f00ff;
      }

      h2 {
        margin: 0;
        max-width: 14ch;
        font-size: clamp(2rem, 4.8vw, 3.4rem);
        line-height: 0.96;
        letter-spacing: -0.05em;
        color: #171137;
      }

      .lede,
      .meta,
      .footer-copy {
        margin: 0;
        color: rgba(23, 17, 55, 0.75);
        line-height: 1.75;
      }

      .hero-mark {
        display: grid;
        justify-items: end;
        gap: 1rem;
      }

      .logo-frame {
        display: grid;
        place-items: center;
        width: min(100%, 16rem);
        aspect-ratio: 1;
        padding: 1.1rem;
        border-radius: 2rem;
        background: linear-gradient(145deg, rgba(255, 255, 255, 0.98), rgba(240, 234, 255, 0.92));
        box-shadow:
          inset 0 1px 0 rgba(255, 255, 255, 0.8),
          0 24px 60px rgba(72, 43, 155, 0.14);
      }

      .logo {
        display: block;
        width: min(100%, 12rem);
        height: auto;
      }

      .status-chip {
        margin: 0;
        padding: 0.65rem 0.95rem;
        border-radius: 999px;
        background: rgba(255, 255, 255, 0.8);
        border: 1px solid rgba(137, 92, 255, 0.18);
        color: #35246f;
        font-size: 0.88rem;
        font-weight: 600;
      }

      .feature-grid {
        display: grid;
        grid-template-columns: repeat(3, minmax(0, 1fr));
        gap: 1rem;
      }

      .footer-row {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 1rem;
        flex-wrap: wrap;
      }

      .inline-code {
        display: inline-block;
        padding: 0.1rem 0.4rem;
        margin: 0 0.12rem;
        border-radius: 0.55rem;
        background: rgba(81, 41, 198, 0.09);
        color: #35246f;
        font-size: 0.95em;
      }

      .docs-link {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        padding: 0.85rem 1.2rem;
        border-radius: 999px;
        background: #19143d;
        color: white;
        font-weight: 600;
        text-decoration: none;
        white-space: nowrap;
      }

      .docs-link:hover {
        background: #6f00ff;
      }

      @media (max-width: 980px) {
        .hero-panel {
          grid-template-columns: 1fr;
        }

        .hero-mark {
          justify-items: start;
        }

        .feature-grid {
          grid-template-columns: 1fr;
        }
      }
    </style>
  </section>
}
