import nextVitals from "eslint-config-next/core-web-vitals";
import nextTypescript from "eslint-config-next/typescript";

const config = [
  ...nextVitals,
  ...nextTypescript,
  { ignores: [".next/**", ".next16/**", "node_modules/**", "design-system/**", "Landing-a.html", "reference-unpacked.html", "next-env.d.ts"] },
];

export default config;
