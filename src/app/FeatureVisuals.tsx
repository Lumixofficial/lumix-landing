import Image from "next/image";
import lumixMark from "../../design-system/assets/lumix-logo-icon-white.png";

type FeatureName = "trustless" | "soroban" | "privacy" | "source";

export function FeatureVisual({ name }: { name: FeatureName }) {
  if (name === "trustless") return (
    <svg className="feature-visual" viewBox="0 0 360 152" role="img" aria-label="Two people trading directly with one another">
      {[80, 280].map((x) => (
        <g key={x} transform={`translate(${x} 76)`}>
          <circle className="feature-visual-node" r="42" />
          <g className="feature-visual-peer">
            <circle cy="-14" r="10" />
            <path d="M-22 22v-4C-22 8-13 2 0 2s22 6 22 16v4a4 4 0 0 1-4 4h-36a4 4 0 0 1-4-4Z" />
          </g>
        </g>
      ))}
      <path className="feature-visual-exchange" d="M146 64h68m-9-9 9 9-9 9" />
      <path className="feature-visual-exchange feature-visual-exchange--return" d="M214 88h-68m9-9-9 9 9 9" />
    </svg>
  );

  if (name === "soroban") return (
    <div className="feature-visual feature-visual--logos">
      <Image src={lumixMark} alt="Lumix logo" className="feature-logo feature-logo--lumix" />
      <span className="feature-logo-divider" aria-hidden="true" />
      <Image src="/tokens/stellar-mark-blue.png" alt="Stellar logo" width={512} height={433} className="feature-logo feature-logo--stellar" />
    </div>
  );

  if (name === "privacy") return (
    <svg className="feature-visual" viewBox="0 0 360 152" role="img" aria-label="An identity card crossed out with a prominent X">
      <rect className="feature-visual-node" x="54" y="23" width="252" height="106" rx="16" />
      <path className="feature-visual-link" d="M139 39v74" />
      <circle className="feature-visual-detail" cx="97" cy="65" r="11" />
      <path className="feature-visual-detail" d="M76 103c2-12 10-19 21-19s19 7 21 19" />
      <path className="feature-visual-link" d="M161 54h84m-84 21h68m-68 21h55" />
      <path className="feature-visual-cross-outline" d="M215 43l76 70m0-70-76 70" />
      <path className="feature-visual-cross" d="M215 43l76 70m0-70-76 70" />
    </svg>
  );

  return (
    <svg className="feature-visual feature-visual--source" viewBox="0 0 360 152" role="img" aria-label="The official open-source symbol over softly faded blue and gray code lines">
      <defs>
        <linearGradient id="source-code-fade">
          <stop offset="0" stopColor="white" stopOpacity="0" />
          <stop offset=".13" stopColor="white" stopOpacity=".78" />
          <stop offset=".5" stopColor="white" />
          <stop offset=".87" stopColor="white" stopOpacity=".78" />
          <stop offset="1" stopColor="white" stopOpacity="0" />
        </linearGradient>
        <mask id="source-lines-mask"><rect width="360" height="152" fill="url(#source-code-fade)" /></mask>
        <mask id="source-logo-edge" style={{ maskType: "alpha" }}><image href="/tokens/opensource.png" x="114" y="11" width="132" height="132" /></mask>
        <mask id="source-logo-face" style={{ maskType: "alpha" }}><image href="/tokens/opensource.png" x="117" y="14" width="126" height="126" /></mask>
        <linearGradient id="source-logo-shade" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#a8baff" />
          <stop offset=".62" stopColor="#8fa6ff" />
          <stop offset="1" stopColor="#6f89dc" />
        </linearGradient>
      </defs>
      <g mask="url(#source-lines-mask)">
        <path className="source-line source-line--gray" d="M25 18h80m15 0h45m34 0h58m15 0h62M42 34h47m12 0h76m24 0h39m17 0h65M25 50h68m18 0h31m75 0h64m14 0h36M52 66h42m13 0h59m55 0h34m15 0h69M164 78h32M25 82h63m17 0h45m83 0h65m13 0h31M43 98h55m14 0h44m68 0h67m13 0h32M25 114h61m16 0h33m72 0h76m13 0h44M50 130h42m15 0h74m39 0h38m16 0h64" />
        <path className="source-line source-line--blue" d="M120 18h45m107 0h62M101 34h76m80 0h65M111 50h31m153 0h36M107 66h59m104 0h69M105 82h45m161 0h31M112 98h44m148 0h32M102 114h33m161 0h44M107 130h74m93 0h64" />
      </g>
      <ellipse className="source-code-veil" cx="180" cy="76" rx="80" ry="70" />
      <rect x="110" y="7" width="140" height="140" fill="#3c58a2" mask="url(#source-logo-edge)" />
      <rect x="110" y="7" width="140" height="140" fill="url(#source-logo-shade)" mask="url(#source-logo-face)" />
    </svg>
  );
}
