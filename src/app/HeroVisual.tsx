import type { ReactNode } from "react";
import lumixMark from "../../design-system/assets/lumix-logo-icon-white.png";
import HeroFlow from "./HeroFlow";

const GLYPH_STROKE = 1.6;

// One 24px grid for all four marks; each shape is drawn out to roughly 3px from the edge so they read at equal weight.
function GlyphSvg({ children }: { children: ReactNode }) {
  return (
    <svg className="hero-glyph" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={GLYPH_STROKE} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {children}
    </svg>
  );
}

function OptionsGlyph() {
  return (
    <GlyphSvg>
      <path d="M6 22a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h8a2.4 2.4 0 0 1 1.704.706l3.588 3.588A2.4 2.4 0 0 1 20 8v12a2 2 0 0 1-2 2z" />
      <path d="M14 2v5a1 1 0 0 0 1 1h5" />
      <path d="M8 13h6" />
      <path d="M8 17h4" />
    </GlyphSvg>
  );
}

function PerpetualsGlyph() {
  return (
    <GlyphSvg>
      <path d="M12 12C10 9 8 7 6.5 7a5 5 0 0 0 0 10c1.5 0 3.5-2 5.5-5Zm0 0c2 3 4 5 5.5 5a5 5 0 0 0 0-10C16 7 14 9 12 12Z" />
    </GlyphSvg>
  );
}

function SpotGlyph() {
  return (
    <GlyphSvg>
      <path d="M3 8h18M17 4l4 4-4 4" />
      <path d="M21 16H3M7 12l-4 4 4 4" />
    </GlyphSvg>
  );
}

function EarnGlyph() {
  return (
    <GlyphSvg>
      <ellipse cx="12" cy="6" rx="8.5" ry="3" />
      <path d="M3.5 6v4c0 1.66 3.8 3 8.5 3s8.5-1.34 8.5-3V6" />
      <path d="M3.5 10v4c0 1.66 3.8 3 8.5 3s8.5-1.34 8.5-3v-4" />
      <path d="M3.5 14v4c0 1.66 3.8 3 8.5 3s8.5-1.34 8.5-3v-4" />
    </GlyphSvg>
  );
}

const products = [
  { id: "options", label: "Options", Glyph: OptionsGlyph },
  { id: "perpetuals", label: "Perpetuals", Glyph: PerpetualsGlyph },
  { id: "spot", label: "Spot", Glyph: SpotGlyph },
  { id: "pools", label: "Earn", Glyph: EarnGlyph },
];

export default function HeroVisual() {
  return (
    <div className="hero-visual">
      <svg className="hero-layer hero-field" viewBox="0 0 560 500" aria-hidden="true">
        <defs>
          <radialGradient id="hero-field">
            <stop offset="0" stopColor="#17275c" stopOpacity="0.55" />
            <stop offset="0.5" stopColor="#111a39" stopOpacity="0.22" />
            <stop offset="1" stopColor="#0a0a0b" stopOpacity="0" />
          </radialGradient>
        </defs>
        <circle cx="280" cy="250" r="240" fill="url(#hero-field)" />
      </svg>
      <HeroFlow />
      <svg className="hero-layer hero-core-layer" viewBox="0 0 560 500" aria-hidden="true">
        <defs>
          <radialGradient id="hero-core-rim" cx="280" cy="250" r="96" gradientUnits="userSpaceOnUse">
            <stop className="hero-core-stop hero-core-stop--rim-in" offset="0.8" />
            <stop className="hero-core-stop hero-core-stop--rim-out" offset="1" />
          </radialGradient>
          <radialGradient id="hero-core-well" cx="280" cy="232" r="92" gradientUnits="userSpaceOnUse">
            <stop className="hero-core-stop hero-core-stop--well-in" offset="0" />
            <stop className="hero-core-stop hero-core-stop--well-out" offset="1" />
          </radialGradient>
          <radialGradient id="hero-core-charge" cx="280" cy="250" r="74" gradientUnits="userSpaceOnUse">
            <stop className="hero-core-stop hero-core-stop--charge" offset="0" />
            <stop className="hero-core-stop hero-core-stop--clear" offset="1" />
          </radialGradient>
          <linearGradient id="hero-core-sweep" x1="0" y1="0" x2="1" y2="0.35">
            <stop className="hero-core-stop hero-core-stop--sweep-hot" offset="0" />
            <stop className="hero-core-stop hero-core-stop--sweep-mid" offset="0.5" />
            <stop className="hero-core-stop hero-core-stop--sweep-cold" offset="1" />
          </linearGradient>
          <linearGradient id="hero-core-sheen" x1="0" y1="0" x2="0" y2="1">
            <stop className="hero-core-stop hero-core-stop--sheen" offset="0" />
            <stop className="hero-core-stop hero-core-stop--clear" offset="0.42" />
          </linearGradient>
        </defs>
        <circle className="hero-core-rim" cx="280" cy="250" r="96" />
        <g className="hero-core-sweep">
          <circle className="hero-core-ticks" cx="280" cy="250" r="87" pathLength={96} />
        </g>
        <circle className="hero-core-well" cx="280" cy="250" r="78" />
        <circle className="hero-core-charge" cx="280" cy="250" r="74" />
        <circle className="hero-core-sheen" cx="280" cy="250" r="76.5" />
        <image href={lumixMark.src} x="242" y="199" width="76" height="102" preserveAspectRatio="xMidYMid meet" />
      </svg>
      {products.map(({ id, label, Glyph }) => (
        <a className={`hero-product hero-product--${id}`} href={`#${id}`} key={id} data-flow={id}>
          <span className="hero-product-label">{label}</span>
          <Glyph />
          <span className="hero-product-port" aria-hidden="true" />
        </a>
      ))}
    </div>
  );
}
