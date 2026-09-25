import Image from "next/image";
import logo from "../../design-system/assets/lumix-logo-type-white.png";
import { OptionsVisual, PerpetualsVisual, PointIcon, PoolsVisual, SpotVisual } from "./ProductVisuals";
import { FeatureVisual } from "./FeatureVisuals";
import { footerLinks } from "./links";
import ScrollReveals from "./ScrollReveals";
import HeroVisual from "./HeroVisual";

function DemoButton() {
  return <a className="trade-button trade-button--primary trade-button--lg demo-button" href="mailto:info@lumixmarket.com">Contact us</a>;
}

function SocialIcon({ name }: { name: "github" | "x" | "discord" }) {
  if (name === "github") return <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" aria-hidden="true"><path d="M12 .5C5.73.5.5 5.73.5 12a11.5 11.5 0 0 0 7.86 10.92c.58.1.79-.25.79-.56v-2c-3.2.7-3.88-1.37-3.88-1.37-.52-1.33-1.28-1.68-1.28-1.68-1.05-.72.08-.7.08-.7 1.16.08 1.77 1.19 1.77 1.19 1.03 1.77 2.7 1.26 3.36.96.1-.75.4-1.26.73-1.55-2.56-.29-5.25-1.28-5.25-5.7 0-1.26.45-2.29 1.19-3.1-.12-.29-.52-1.46.11-3.05 0 0 .97-.31 3.18 1.18a11 11 0 0 1 5.8 0c2.2-1.49 3.17-1.18 3.17-1.18.63 1.59.23 2.76.11 3.05.74.81 1.19 1.84 1.19 3.1 0 4.43-2.7 5.4-5.27 5.69.41.36.78 1.06.78 2.14v3.17c0 .31.21.67.8.56A11.5 11.5 0 0 0 23.5 12C23.5 5.73 18.27.5 12 .5Z" /></svg>;
  if (name === "x") return <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" aria-hidden="true"><path d="M18.24 2h3.31l-7.23 8.26L22.86 22h-6.66l-5.22-6.82L4.99 22H1.68l7.73-8.83L1.14 2h6.83l4.72 6.24L18.24 2Zm-1.16 18h1.83L7.01 3.9H5.05L17.08 20Z" /></svg>;
  return <svg viewBox="0 0 24 24" width="19" height="19" fill="currentColor" aria-hidden="true"><path d="M20.32 4.37A19.8 19.8 0 0 0 15.4 2.9a13.7 13.7 0 0 0-.63 1.28 18.3 18.3 0 0 0-5.49 0A12.6 12.6 0 0 0 8.65 2.9a19.7 19.7 0 0 0-4.93 1.47C.58 9.04-.27 13.58.15 18.06a19.9 19.9 0 0 0 6.04 3.05c.49-.66.92-1.36 1.29-2.1a12.9 12.9 0 0 1-2.03-.97c.17-.12.34-.25.5-.38a14.2 14.2 0 0 0 12.12 0c.16.14.33.26.5.38-.65.38-1.33.71-2.04.98.37.73.8 1.43 1.29 2.09a19.8 19.8 0 0 0 6.05-3.05c.5-5.19-.85-9.69-3.64-13.69ZM8.02 15.33c-1.18 0-2.15-1.09-2.15-2.42 0-1.34.95-2.43 2.15-2.43 1.2 0 2.17 1.1 2.15 2.43 0 1.33-.95 2.42-2.15 2.42Zm7.96 0c-1.18 0-2.15-1.09-2.15-2.42 0-1.34.95-2.43 2.15-2.43 1.2 0 2.17 1.1 2.15 2.43 0 1.33-.94 2.42-2.15 2.42Z" /></svg>;
}

function FooterLink({ href, children, label, className = "footer-link" }: { href: string; children: React.ReactNode; label: string; className?: string }) {
  return href
    ? <a className={className} href={href} aria-label={label} target={href.startsWith("http") ? "_blank" : undefined} rel={href.startsWith("http") ? "noopener noreferrer" : undefined}>{children}</a>
    : <button className={className} type="button" aria-label={`${label} (destination coming soon)`}>{children}</button>;
}

function Footer() {
  return (
    <footer className="site-footer">
      <div className="footer-inner">
        <div className="footer-top">
          <span className="stellar-credit"><svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m13 2-9 11h7l-1 9 10-12h-7l1-8Z" /></svg>Built on Stellar</span>
          <div className="socials">
            <FooterLink href={footerLinks.github} label="GitHub" className="social-link"><SocialIcon name="github" /></FooterLink>
            <FooterLink href={footerLinks.x} label="X" className="social-link"><SocialIcon name="x" /></FooterLink>
            <FooterLink href={footerLinks.discord} label="Discord" className="social-link"><SocialIcon name="discord" /></FooterLink>
          </div>
        </div>
        <div className="footer-middle">
          <div className="footer-legal-links">
            <FooterLink href={footerLinks.terms} label="Terms">Terms</FooterLink>
            <FooterLink href={footerLinks.privacy} label="Privacy">Privacy</FooterLink>
            <FooterLink href={footerLinks.docs} label="Docs / How it works">Docs / How it works</FooterLink>
          </div>
          <span className="copyright">© 2026 Lumix</span>
        </div>
        <p className="disclaimer">Trading digital assets and derivatives involves risk and may result in loss of funds. Nothing on Lumix is financial advice. Availability may be restricted by jurisdiction.</p>
      </div>
    </footer>
  );
}

export default function Home() {
  return (
    <>
      <main className="bg-canvas text-primary">
        <section className="hero" aria-labelledby="hero-title">
          <Image className="hero-logo hero-rise hero-rise--logo" src={logo} alt="Lumix" priority sizes="238px" />
          <div className="hero-main">
            <div className="hero-copy">
              <h1 className="hero-rise hero-rise--headline" id="hero-title">Trade on Stellar with <span>Lumix.</span></h1>
              <p className="hero-detail hero-rise hero-rise--detail">Options, perpetuals, spot swaps, and Earn in one place. Trade your way or put your assets to work.</p>
              <div className="hero-action hero-rise hero-rise--action"><DemoButton /></div>
            </div>
            <HeroVisual />
          </div>
        </section>

        <div className="stories section-shell" id="how-it-works" tabIndex={-1}>
          <div className="stories-intro" data-reveal-group>
            <h2 data-reveal-item>Different moves. One <span>platform.</span></h2>
            <p data-reveal-item>Different ways to trade. More ways to put your assets to use.</p>
          </div>

          <section className="product-story" id="options" tabIndex={-1} aria-labelledby="options-title">
            <div className="story-copy" data-reveal-group>
              <h3 data-reveal-item id="options-title">Options: Your view. <span>Your terms.</span></h3>
              <p className="story-intro" data-reveal-item>Trade peer-to-peer options to pursue opportunities or hedge exposure.</p>
              <ul className="story-points">
                <li><PointIcon name="branch" /><div data-reveal-item><strong>Find your angle</strong><p>Find opportunities across calls, puts, strikes, and expiries.</p></div></li>
                <li><PointIcon name="terms" /><div data-reveal-item><strong>Trade on your terms</strong><p>Set a premium that works for you and another trader.</p></div></li>
                <li><PointIcon name="potential" /><div data-reveal-item><strong>Preview your potential</strong><p>See your potential profit before making your move.</p></div></li>
              </ul>
            </div>
            <OptionsVisual />
          </section>

          <section className="product-story product-story--reversed" id="perpetuals" tabIndex={-1} aria-labelledby="perpetuals-title">
            <div className="story-copy" data-reveal-group>
              <h3 data-reveal-item id="perpetuals-title">Perpetuals: <span>long or short.</span></h3>
              <p className="story-intro" data-reveal-item>Turn a market view into a leveraged long or short position.</p>
              <ul className="story-points">
                <li><PointIcon name="expand" /><div data-reveal-item><strong>Up to 20x leverage</strong><p>Give your market view more buying power.</p></div></li>
                <li><PointIcon name="directions" /><div data-reveal-item><strong>Find opportunity in either direction</strong><p>Go long or short, wherever you think the market is headed.</p></div></li>
                <li><PointIcon name="manage" /><div data-reveal-item><strong>Trading made easy</strong><p>Open and manage positions in one straightforward experience.</p></div></li>
              </ul>
            </div>
            <PerpetualsVisual />
          </section>

          <section className="product-story" id="spot" tabIndex={-1} aria-labelledby="spot-title">
            <div className="story-copy" data-reveal-group>
              <h3 data-reveal-item id="spot-title">Spot: swap what you <span>hold.</span></h3>
              <p className="story-intro" data-reveal-item>Exchange assets on Stellar with clear quotes before you trade.</p>
              <ul className="story-points">
                <li><PointIcon name="route" /><div data-reveal-item><strong>The best quote, found for you</strong><p>We compare available routes to find the best quote for your swap.</p></div></li>
                <li><PointIcon name="review" /><div data-reveal-item><strong>Your next move starts here</strong><p>Swap into the assets you want to hold.</p></div></li>
                <li><PointIcon name="terms" /><div data-reveal-item><strong>A wider world of tokens</strong><p>Swap across a broad selection of Soroban tokens and Stellar assets.</p></div></li>
              </ul>
            </div>
            <SpotVisual />
          </section>

          <section className="product-story product-story--reversed" id="pools" tabIndex={-1} aria-labelledby="pools-title">
            <div className="story-copy" data-reveal-group>
              <h3 data-reveal-item id="pools-title">Earn: put your assets <span>to work.</span></h3>
              <p className="story-intro" data-reveal-item>Deposit assets into pools that supply trading markets.</p>
              <ul className="story-points">
                <li><PointIcon name="earn" /><div data-reveal-item><strong>Choose where you contribute.</strong><p>Supply assets to the pool you want to participate in.</p></div></li>
                <li><PointIcon name="flow" /><div data-reveal-item><strong>Power the market, Earn rewards</strong><p>Your supplied assets help support perpetual trading in the pool.</p></div></li>
                <li><PointIcon name="liquidity" /><div data-reveal-item><strong>Earn from every trade</strong><p>Receive a share of fees from each perpetual position opened in the pool you supply.</p></div></li>
              </ul>
            </div>
            <PoolsVisual />
          </section>
        </div>
        <section className="platform-section section-shell" aria-labelledby="platform-title">
          <h2 data-reveal-group data-reveal-item id="platform-title">More clarity. <span>More control.</span></h2>
          <ul className="platform-benefits">
            <li>
              <PointIcon name="trustless" />
              <div className="platform-benefit-copy" data-reveal-group><h3 data-reveal-item>Completely trustless</h3><p data-reveal-item>Trade without relying on an intermediary.</p></div>
              <FeatureVisual name="trustless" />
            </li>
            <li>
              <PointIcon name="contract" />
              <div className="platform-benefit-copy" data-reveal-group><h3 data-reveal-item>Secured by Soroban</h3><p data-reveal-item>Powered by Stellar’s smart contract platform.</p></div>
              <FeatureVisual name="soroban" />
            </li>
            <li>
              <PointIcon name="privacy" />
              <div className="platform-benefit-copy" data-reveal-group><h3 data-reveal-item>No KYC</h3><p data-reveal-item>No identity checks. Just connect and trade.</p></div>
              <FeatureVisual name="privacy" />
            </li>
            <li>
              <PointIcon name="source" />
              <div className="platform-benefit-copy" data-reveal-group><h3 data-reveal-item>Open source</h3><p data-reveal-item>Open code. Transparent by design.</p></div>
              <FeatureVisual name="source" />
            </li>
          </ul>
        </section>
        <section className="closing-demo section-shell" aria-labelledby="closing-title">
          <div data-reveal-group>
            <h2 data-reveal-item id="closing-title">Explore Lumix <span>up close.</span></h2>
            <p data-reveal-item>See how you can trade and earn with Lumix in a private demo.</p>
          </div>
          <DemoButton />
        </section>
      </main>
      <Footer />
      <ScrollReveals />
    </>
  );
}
