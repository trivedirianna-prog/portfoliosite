import "./StyleGuide.css";

/*
  Internal design-system reference page — NOT part of the real site. It
  exists only so the palette, type treatments, and material families can
  be sanity-checked in isolation before any real desktop object is built
  on top of them. Served at /styleguide.html, its own Vite entry, so it
  never ships as part of the app's UI or navigation.
*/

interface Swatch {
  var: string;
  name: string;
}

const paletteGroups: { title: string; swatches: Swatch[] }[] = [
  {
    title: "Plum / aubergine",
    swatches: [
      { var: "--color-plum-950", name: "plum-950" },
      { var: "--color-plum-900", name: "plum-900" },
      { var: "--color-plum-800", name: "plum-800" },
      { var: "--color-plum-700", name: "plum-700" },
      { var: "--color-plum-600", name: "plum-600" },
      { var: "--color-plum-500", name: "plum-500" },
    ],
  },
  {
    title: "Magenta",
    swatches: [
      { var: "--color-magenta-600", name: "magenta-600" },
      { var: "--color-magenta-500", name: "magenta-500" },
      { var: "--color-magenta-400", name: "magenta-400" },
      { var: "--color-magenta-300", name: "magenta-300" },
    ],
  },
  {
    title: "Icy blue",
    swatches: [
      { var: "--color-ice-500", name: "ice-500" },
      { var: "--color-ice-400", name: "ice-400" },
      { var: "--color-ice-300", name: "ice-300" },
    ],
  },
  {
    title: "Pearl / chrome / ink",
    swatches: [
      { var: "--color-pearl", name: "pearl" },
      { var: "--color-pearl-dim", name: "pearl-dim" },
      { var: "--color-chrome-100", name: "chrome-100" },
      { var: "--color-chrome-300", name: "chrome-300" },
      { var: "--color-ink", name: "ink" },
    ],
  },
];

// Client-only page (no SSR), so the DOM — and the tokens applied to it —
// is always available by render time; no effect needed to read it.
function getComputedColor(cssVar: string) {
  return getComputedStyle(document.documentElement)
    .getPropertyValue(cssVar)
    .trim();
}

function SwatchCell({ swatch }: { swatch: Swatch }) {
  const hex = getComputedColor(swatch.var);
  return (
    <div className="swatch">
      <div
        className="swatch__chip"
        style={{ background: `var(${swatch.var})` }}
      />
      <div className="swatch__name label-mono">{swatch.name}</div>
      <div className="swatch__hex label-mono">{hex}</div>
    </div>
  );
}

export function StyleGuide() {
  return (
    <div className="styleguide">
      <header className="styleguide__header">
        <div className="styleguide__kicker label-mono">
          Internal reference — not part of the final site
        </div>
        <h1 className="type-display">Design System</h1>
        <p className="type-body">
          Palette, typography, and material foundations per design-spec.md
          §10–12. Sanity-check the direction here before any real desktop
          object is built on top of it.
        </p>
      </header>

      <section className="styleguide__section">
        <h2 className="type-subheading">Palette</h2>
        <p className="type-body-italic">
          Plum/aubergine + magenta, with an icy-blue undertone — moody,
          nighttime-leaning, coherent with the dusk → night → dawn wallpaper
          progression.
        </p>
        {paletteGroups.map((group) => (
          <div key={group.title} className="palette-group">
            <div className="palette-group__title label-mono">
              {group.title}
            </div>
            <div className="palette-group__row">
              {group.swatches.map((s) => (
                <SwatchCell key={s.var} swatch={s} />
              ))}
            </div>
          </div>
        ))}
      </section>

      <section className="styleguide__section">
        <h2 className="type-subheading">Typography</h2>
        <p className="type-body-italic">
          Editorial serif (Fraunces) carries titles and body text. Monospace
          (Space Mono) appears only in small, system-feeling doses — never
          as body copy.
        </p>

        <div className="type-sample">
          <div className="type-sample__label label-mono">.type-display</div>
          <div className="type-display">Rianna Trivedi</div>
        </div>

        <div className="type-sample">
          <div className="type-sample__label label-mono">.type-heading</div>
          <div className="type-heading">Projects</div>
        </div>

        <div className="type-sample">
          <div className="type-sample__label label-mono">.type-subheading</div>
          <div className="type-subheading">Education</div>
        </div>

        <div className="type-sample">
          <div className="type-sample__label label-mono">.type-body</div>
          <p className="type-body">
            Hi, I&rsquo;m Rianna — a second-year Computer Engineering student
            at D.J. Sanghvi College of Engineering.
          </p>
        </div>

        <div className="type-sample">
          <div className="type-sample__label label-mono">.type-body-italic</div>
          <p className="type-body-italic">
            The wordmark is a light source, not a lit object.
          </p>
        </div>

        <div className="type-sample">
          <div className="type-sample__label label-mono">
            .label-mono — window title / caption / status use
          </div>
          <div className="mono-demo-row">
            <span className="label-mono">projects.window</span>
            <span className="label-mono">About</span>
            <span className="label-mono--bold">status: online</span>
            <span className="label-mono">04:12:09</span>
          </div>
        </div>
      </section>

      <section className="styleguide__section">
        <h2 className="type-subheading">Materials</h2>
        <p className="type-body-italic">
          Two families, never mixed on one object: glossy (machine identity)
          and paper (personal identity). Hover each card — calm by default,
          responsive when touched, per §12.
        </p>

        <div className="material-row">
          <div className="material-demo material-glossy">
            <div className="material-demo__label label-mono">
              .material-glossy
            </div>
            <div className="material-demo__title type-subheading">
              Chrome / plastic
            </div>
          </div>

          <div className="material-demo material-glossy material-glossy--translucent">
            <div className="material-demo__label label-mono">
              .material-glossy--translucent
            </div>
            <div className="material-demo__title type-subheading">
              Glass
            </div>
          </div>

          <div className="material-demo material-paper">
            <div className="material-demo__label label-mono">
              .material-paper
            </div>
            <div className="material-demo__title type-subheading">
              Paper / ephemera
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
