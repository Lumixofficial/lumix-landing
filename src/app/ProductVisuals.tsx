import { ArrowLeftRight, ArrowUpDown, ChartNoAxesCombined, CodeXml, Coins, Droplets, Expand, Eye, GitBranch, ListChecks, Network, Route, Shield, SlidersHorizontal, UserRoundX } from "lucide-react";

const pointIcons = {
  branch: GitBranch,
  terms: SlidersHorizontal,
  potential: ChartNoAxesCombined,
  directions: ArrowUpDown,
  expand: Expand,
  review: Eye,
  manage: ListChecks,
  route: Route,
  earn: Coins,
  flow: Network,
  liquidity: Droplets,
  trustless: ArrowLeftRight,
  contract: Shield,
  privacy: UserRoundX,
  source: CodeXml,
};

type PointIconName = keyof typeof pointIcons;

export function PointIcon({ name }: { name: PointIconName }) {
  const Icon = pointIcons[name];

  return (
    <span className="point-icon" aria-hidden="true">
      <Icon size={21} strokeWidth={1.7} />
    </span>
  );
}

type RoutePoint = [number, number];

const roundedRoute = (points: RoutePoint[], radius = 9) =>
  points
    .map(([x, y], index) => {
      if (index === 0) return `M${x} ${y}`;
      if (index === points.length - 1) return `L${x} ${y}`;
      const [px, py] = points[index - 1];
      const [nx, ny] = points[index + 1];
      const before = Math.hypot(x - px, y - py);
      const after = Math.hypot(nx - x, ny - y);
      const r = Math.min(radius, before / 2, after / 2);
      const round = (value: number) => Number(value.toFixed(2));
      return `L${round(x + ((px - x) / before) * r)} ${round(y + ((py - y) / before) * r)}Q${x} ${y} ${round(x + ((nx - x) / after) * r)} ${round(y + ((ny - y) / after) * r)}`;
    })
    .join("");

const SPOT_LANES: RoutePoint[][] = [
  [[99, 140], [142, 92], [278, 92], [321, 140]],
  [[99, 140], [321, 140]],
  [[99, 140], [142, 188], [278, 188], [321, 140]],
  [[210, 92], [210, 140]],
  [[210, 140], [278, 188]],
];
const SPOT_SELECTED: RoutePoint[] = [[99, 140], [142, 92], [210, 92], [210, 140], [278, 188], [321, 140]];
const SPOT_HOPS: RoutePoint[] = [[142, 92], [210, 92], [210, 140], [278, 188]];
const SPOT_IDLE_HOPS: RoutePoint[] = [[278, 92], [142, 188]];

export function SpotVisual() {
  const selected = roundedRoute(SPOT_SELECTED);

  return (
    <figure className="story-visual visual-spot">
      <svg viewBox="0 0 420 280" role="img" aria-label="The selected blue route passes four nodes across three lanes from XLM to USDC">
        {SPOT_LANES.map((lane, index) => <path key={index} className="spot-lane" d={roundedRoute(lane)} />)}
        {SPOT_IDLE_HOPS.map(([cx, cy]) => <circle key={`${cx}-${cy}`} className="spot-hop spot-hop--idle" cx={cx} cy={cy} r="3.6" />)}
        <path className="spot-route-casing" d={selected} />
        <path className="spot-route" d={selected} />
        {SPOT_HOPS.map(([cx, cy]) => <circle key={`${cx}-${cy}`} className="spot-hop" cx={cx} cy={cy} r="5" />)}
        <circle className="visual-node" cx="60" cy="140" r="39" />
        <circle className="visual-node" cx="360" cy="140" r="39" />
        <image href="/tokens/xlm.png" x="32" y="112" width="56" height="56" aria-label="XLM token" />
        <image href="/tokens/usdc.png" x="332" y="112" width="56" height="56" aria-label="USDC token" />
        <text className="visual-small" x="60" y="226" textAnchor="middle">XLM</text>
        <text className="visual-small" x="360" y="226" textAnchor="middle">USDC</text>
      </svg>
    </figure>
  );
}

export function OptionsVisual() {
  return (
    <figure className="story-visual visual-options">
      <svg viewBox="0 0 420 280" role="img" aria-label="Two peers consider an options contract above a small preview of different possible outcomes">
        <path className="visual-line visual-line--muted" d="M111 99h37m124 0h37" />
        <circle className="visual-node" cx="76" cy="99" r="35" />
        <circle className="visual-node" cx="344" cy="99" r="35" />
        <circle className="options-person" cx="76" cy="89" r="8" />
        <circle className="options-person" cx="344" cy="89" r="8" />
        <path className="options-person" d="M58 117c3-10 9-15 18-15s15 5 18 15m232 0c3-10 9-15 18-15s15 5 18 15" />
        <text className="visual-small" x="76" y="157" textAnchor="middle">PEER</text>
        <text className="visual-small" x="344" y="157" textAnchor="middle">PEER</text>
        <rect className="visual-node visual-node--accent" x="146" y="40" width="126" height="108" rx="16" />
        <path className="visual-line visual-line--accent" d="M196 62h20l8 8v13h-28V62Zm20 0v8h8m-22 6h15" />
        <text className="visual-token" x="209" y="112" textAnchor="middle">OPTIONS</text>
        <text className="visual-small" x="209" y="131" textAnchor="middle">CONTRACT</text>
        <rect className="visual-sheet" x="111" y="173" width="198" height="91" rx="12" />
        <text className="visual-label" x="127" y="191">POTENTIAL</text>
        <path className="preview-area preview-area--loss" d="M132 224v20l78-20Z" />
        <path className="preview-area preview-area--profit" d="M210 224l78-20v20Z" />
        <path className="preview-baseline" d="M127 224h168" />
        <path className="preview-path preview-path--loss" d="M132 244L210 224" />
        <path className="preview-path preview-path--profit" d="M210 224L288 204" />
        <circle className="preview-break-even" cx="210" cy="224" r="3.4" />
        <text className="preview-label preview-label--profit" x="282" y="190" textAnchor="end">PROFIT</text>
        <text className="preview-label preview-label--loss" x="132" y="255">LOSS</text>
        <text className="preview-zero" x="298" y="227">0</text>
      </svg>
    </figure>
  );
}

export function PerpetualsVisual() {
  const candles = [
    { open: 100, high: 105, low: 98, close: 103 },
    { open: 103, high: 112, low: 101, close: 110 },
    { open: 110, high: 114, low: 105, close: 108 },
    { open: 108, high: 119, low: 107, close: 118 },
    { open: 118, high: 124, low: 114, close: 122 },
    { open: 122, high: 129, low: 116, close: 121 },
    { open: 121, high: 123, low: 112, close: 116 },
    { open: 116, high: 118, low: 102, close: 106 },
    { open: 106, high: 112, low: 99, close: 108 },
    { open: 108, high: 116, low: 107, close: 115 },
    { open: 115, high: 124, low: 113, close: 122 },
    { open: 122, high: 130, low: 119, close: 121 },
    { open: 121, high: 128, low: 119, close: 127 },
    { open: 127, high: 135, low: 125, close: 134 },
  ];
  const y = (value: number) => 255 - (value - 95) * 5.7;

  return (
    <figure className="story-visual visual-perpetuals">
      <svg viewBox="0 0 420 280" role="img" aria-label="Fourteen varied red and green candlesticks rise, pull back, and recover">
        {candles.map(({ open, high, low, close }, index) => {
          const x = 32 + index * 27.4;
          const top = Math.min(y(open), y(close));
          return (
          <g className={close > open ? "perp-candle perp-candle--up" : "perp-candle perp-candle--down"} key={index}>
            <path d={`M${x} ${y(high)}V${y(low)}`} />
            <rect x={x - 8} y={top} width="16" height={Math.abs(y(open) - y(close))} />
          </g>
          );
        })}
      </svg>
    </figure>
  );
}

const POOL_COINS = [
  { x: 116, y: 112, radius: 29, angle: -8, href: "/tokens/xlm.png", name: "XLM", rim: "#cfd4dd", side: "#8c94a3" },
  { x: 290, y: 106, radius: 31, angle: 7, href: "/tokens/usdc.png", name: "USDC", rim: "#3f7ae0", side: "#0a3f92" },
  { x: 208, y: 180, radius: 29, angle: -3, href: "/tokens/usdt0.svg", name: "USDT0", rim: "#19a07c", side: "#005a43" },
];
const COIN_THICKNESS = 9;
const COIN_TILT = 0.8;

export function PoolsVisual() {
  return (
    <figure className="story-visual visual-pools">
      <svg viewBox="0 0 420 280" role="img" aria-label="XLM, USDC, and USDT0 coins float in a blue pool">
        <defs>
          <linearGradient id="pool-water-fill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#3765ff" />
            <stop offset=".55" stopColor="#2447d4" />
            <stop offset="1" stopColor="#172f8c" />
          </linearGradient>
          <linearGradient id="pool-wall-shade" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#06103a" stopOpacity=".6" />
            <stop offset="1" stopColor="#06103a" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="pool-rim-fill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#27272c" />
            <stop offset="1" stopColor="#1a1a1d" />
          </linearGradient>
          <linearGradient id="pool-coin-side-shade" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0" stopColor="#000000" stopOpacity=".4" />
            <stop offset=".45" stopColor="#000000" stopOpacity="0" />
            <stop offset="1" stopColor="#000000" stopOpacity=".5" />
          </linearGradient>
          <clipPath id="pool-water-clip"><rect x="44" y="52" width="332" height="180" rx="31" /></clipPath>
          {POOL_COINS.map(({ radius, name }) => (
            <clipPath id={`pool-coin-clip-${name}`} key={name}>
              <ellipse rx={radius} ry={radius * COIN_TILT} />
              <rect x={-radius} width={radius * 2} height={COIN_THICKNESS} />
              <ellipse cy={COIN_THICKNESS} rx={radius} ry={radius * COIN_TILT} />
            </clipPath>
          ))}
        </defs>
        <g transform="rotate(-4 210 142)">
          <rect className="pool-rim" x="34" y="42" width="352" height="200" rx="40" />
          <g clipPath="url(#pool-water-clip)">
            <rect x="44" y="52" width="332" height="180" fill="url(#pool-water-fill)" />
            <path className="pool-band pool-band--far" d="M44 104C98 86 150 118 210 102S318 84 376 100V52H44Z" />
            <path className="pool-band pool-band--near" d="M44 190C100 174 152 202 214 188S320 172 376 186V232H44Z" />
            <rect x="44" y="52" width="332" height="30" fill="url(#pool-wall-shade)" />
            <path className="pool-caustic" d="M64 150c16-6 30-6 44-2M246 152c18-7 34-7 50-2M104 212c16-5 30-5 44-1M292 212c12-4 24-4 36 0M170 76c14-5 28-5 40-1" />
            {POOL_COINS.map(({ x, y, radius, angle, href, name, rim, side }) => {
              const face = radius * COIN_TILT;
              const waterline = COIN_THICKNESS * 0.45;
              const front = `M${-radius} ${waterline}A${radius} ${face} 0 0 0 ${radius} ${waterline}`;
              return (
                <g key={name} transform={`translate(${x} ${y}) rotate(${angle})`}>
                  <ellipse className="pool-coin-shadow" cx="5" cy={COIN_THICKNESS + 12} rx={radius + 3} ry={face * 0.62} />
                  <ellipse className="pool-ripple pool-ripple--outer" cy={waterline} rx={radius + 18} ry={(radius + 18) * COIN_TILT} />
                  <ellipse className="pool-ripple" cy={waterline} rx={radius + 8} ry={(radius + 8) * COIN_TILT} />
                  <ellipse cy={COIN_THICKNESS} rx={radius} ry={face} fill={side} />
                  <rect x={-radius} width={radius * 2} height={COIN_THICKNESS} fill={side} />
                  <g clipPath={`url(#pool-coin-clip-${name})`}>
                    <rect x={-radius} y={-face} width={radius * 2} height={face * 2 + COIN_THICKNESS} fill="url(#pool-coin-side-shade)" />
                  </g>
                  <g transform={`scale(1 ${COIN_TILT})`}>
                    <circle r={radius} fill={rim} />
                    <image href={href} x={-radius * 0.86} y={-radius * 0.86} width={radius * 1.72} height={radius * 1.72} aria-hidden="true" />
                    <circle className="pool-coin-bevel" r={radius - 1.2} vectorEffect="non-scaling-stroke" />
                    <path className="pool-coin-glint" d={`M${-radius * 0.72} ${-radius * 0.42}A${radius * 0.84} ${radius * 0.84} 0 0 1 ${-radius * 0.1} ${-radius * 0.83}`} vectorEffect="non-scaling-stroke" />
                  </g>
                  <path className="pool-submerged" clipPath={`url(#pool-coin-clip-${name})`} d={`${front}V${COIN_THICKNESS + face + 2}H${-radius}Z`} />
                  <path className="pool-waterline" d={front} />
                </g>
              );
            })}
          </g>
          <rect className="pool-water-outline" x="44" y="52" width="332" height="180" rx="31" />
        </g>
      </svg>
    </figure>
  );
}
