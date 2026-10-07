import { writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

const base = process.env.LUMIX_CHECK_URL || "http://localhost:3000/";
const debug = process.env.LUMIX_CDP_URL || "http://localhost:9229";
const screenshotDir = process.env.LUMIX_SCREENSHOT_DIR || tmpdir();
const tabs = await (await fetch(`${debug}/json`)).json();
const tab = tabs.find((item) => item.type === "page" && item.webSocketDebuggerUrl);
if (!tab) throw new Error("No Chrome debugging tab is available");

const socket = new WebSocket(tab.webSocketDebuggerUrl);
await new Promise((resolve, reject) => {
  socket.addEventListener("open", resolve, { once: true });
  socket.addEventListener("error", reject, { once: true });
});

let id = 0;
const waiting = new Map();
socket.addEventListener("message", (event) => {
  const message = JSON.parse(event.data);
  if (!message.id || !waiting.has(message.id)) return;
  const { resolve, reject } = waiting.get(message.id);
  waiting.delete(message.id);
  if (message.error) reject(new Error(message.error.message));
  else resolve(message.result);
});
function call(method, params = {}) {
  const next = ++id;
  return new Promise((resolve, reject) => {
    waiting.set(next, { resolve, reject });
    socket.send(JSON.stringify({ id: next, method, params }));
  });
}
async function evaluate(expression) {
  const result = await call("Runtime.evaluate", { expression, awaitPromise: true, returnByValue: true });
  if (result.exceptionDetails) throw new Error(result.exceptionDetails.text);
  return result.result.value;
}

await call("Page.enable");
await call("Runtime.enable");
await call("Emulation.setEmulatedMedia", {
  features: [{ name: "prefers-reduced-motion", value: process.env.LUMIX_REDUCED_MOTION === "1" ? "reduce" : "no-preference" }],
});
await call("Page.addScriptToEvaluateOnNewDocument", {
  source: "window.__layoutShifts=[];window.__heroFrames=[];window.__errors=[];window.addEventListener('error',event=>window.__errors.push(event.message));new PerformanceObserver(list=>{for(const e of list.getEntries()){if(!e.hadRecentInput)window.__layoutShifts.push(e.value)}}).observe({type:'layout-shift',buffered:true});function sampleHero(){const e=document.querySelector('.hero');if(e){const r=e.getBoundingClientRect();const h=e.querySelector('h1')?.getBoundingClientRect();window.__heroFrames.push({t:Math.round(performance.now()),left:r.left,center:r.left+r.width/2,headingCenter:h? h.left+h.width/2:null,viewport:document.documentElement.clientWidth,align:getComputedStyle(e).textAlign})}if(performance.now()<2600)requestAnimationFrame(sampleHero)}requestAnimationFrame(sampleHero);",
});

for (const size of [
  { name: "desktop", width: 1440, height: 900, mobile: false },
  { name: "tablet", width: 768, height: 1024, mobile: true },
  { name: "mobile", width: 390, height: 844, mobile: true },
  { name: "compact", width: 320, height: 700, mobile: true },
].filter(item => !process.env.LUMIX_SIZE || item.name === process.env.LUMIX_SIZE)) {
  await call("Emulation.setDeviceMetricsOverride", { width: size.width, height: size.height, deviceScaleFactor: 1, mobile: size.mobile });
  await call("Page.navigate", { url: base });
  await new Promise((resolve) => setTimeout(resolve, 2000));
  await evaluate("document.fonts.ready.then(()=>true)");
  const metrics = await evaluate(`(() => ({
    innerWidth, documentWidth: document.documentElement.scrollWidth,
    bodyWidth: document.body.scrollWidth, height: document.documentElement.scrollHeight,
    widthProbe: { rootClient: document.documentElement.clientWidth, bodyClient: document.body.clientWidth, wideElements: [...document.querySelectorAll('body *')].filter(el => el.scrollWidth > el.clientWidth + 1).slice(0,8).map(el => ({ name: el.className?.baseVal || el.className || el.tagName, scroll: el.scrollWidth, client: el.clientWidth })) },
    layoutShiftScore: (window.__layoutShifts || []).reduce((sum, value) => sum + value, 0),
    heroFrames: { first: window.__heroFrames?.[0], last: window.__heroFrames?.at(-1), minLeft: Math.min(...window.__heroFrames.map(frame => frame.left)), maxLeft: Math.max(...window.__heroFrames.map(frame => frame.left)) },
    heroHeading: document.querySelector('h1')?.textContent,
    intro: (() => { const el = document.querySelector('.stories-intro'); const r = el.getBoundingClientRect(); return { center: r.left + r.width / 2, align: getComputedStyle(el).textAlign, descriptionWidth: el.querySelector('p').getBoundingClientRect().width }; })(),
    ctaHrefs: [...document.querySelectorAll('.demo-button')].map(el => el.getAttribute('href')),
    productHeadings: [...document.querySelectorAll('.product-story h3')].map(el => el.textContent.trim()),
    productVisuals: document.querySelectorAll('.story-visual svg').length,
    platformBenefits: (() => {
      const section = document.querySelector('.platform-section');
      const grid = section?.querySelector('.platform-benefits');
      return section && grid ? {
        heading: section.querySelector('h2').textContent,
        columns: getComputedStyle(grid).gridTemplateColumns,
        points: [...grid.querySelectorAll('h3')].map(el => el.textContent),
        icons: grid.querySelectorAll('.point-icon svg').length,
        illustrations: grid.querySelectorAll('.feature-visual').length,
        cardColumns: getComputedStyle(grid).gridTemplateColumns,
        cardBorderTransition: getComputedStyle(grid.querySelector('li')).transition,
        afterProducts: section.previousElementSibling?.classList.contains('stories'),
        beforeDemo: section.nextElementSibling?.classList.contains('closing-demo')
      } : null;
    })(),
    optionsPeerCopy: document.querySelector('#options-title')?.closest('.product-story')?.textContent.includes('peer-to-peer'),
    visualNames: [...document.querySelectorAll('.story-visual svg')].map(el => el.getAttribute('aria-label')),
    tokenIcons: [...document.querySelectorAll('.visual-spot image')].map(el => el.getAttribute('href')),
    captions: document.querySelectorAll('.story-visual figcaption').length,
    titleAttributes: document.querySelectorAll('main [title], footer [title]').length,
    svgTitles: document.querySelectorAll('main svg title').length,
    mockChartPresent: Boolean(document.querySelector('.option-visual, .payoff-chart')),
    closingCtaPresent: Boolean(document.querySelector('.closing-demo .demo-button')),
    reducedMotion: matchMedia('(prefers-reduced-motion: reduce)').matches,
    animatedLandingElements: [...document.querySelectorAll('main *, footer *')].filter(el => getComputedStyle(el).animationName !== 'none').slice(0,8).map(el => el.className?.baseVal || el.className || el.tagName),
    transitioningLandingElements: [...document.querySelectorAll('main *, footer *')].filter(el => getComputedStyle(el).transitionDuration.split(',').some(value => parseFloat(value) > 0)).slice(0,8).map(el => el.className?.baseVal || el.className || el.tagName),
    cardTransition: { property: getComputedStyle(document.querySelector('.story-visual')).transitionProperty, duration: getComputedStyle(document.querySelector('.story-visual')).transitionDuration, timing: getComputedStyle(document.querySelector('.story-visual')).transitionTimingFunction },
    scrollBehavior: getComputedStyle(document.documentElement).scrollBehavior,
    logoLoaded: document.querySelector('.hero-logo')?.complete && document.querySelector('.hero-logo')?.naturalWidth > 0,
    pageLanguage: document.documentElement.lang,
    unnamedButtons: [...document.querySelectorAll('button')].filter(el => !(el.getAttribute('aria-label') || el.textContent.trim())).length,
    imagesWithoutAlt: document.querySelectorAll('img:not([alt])').length,
    errors: window.__errors,
    overflowing: [...document.querySelectorAll('body *')].filter(el => { const r=el.getBoundingClientRect(); return r.width > 0 && (r.right > ${size.width} + 1 || r.left < -1); }).slice(0,8).map(el => el.className?.baseVal || el.className || el.tagName)
  }))()`);
  if (!process.env.LUMIX_SKIP_SCREENSHOT) {
    const screenshot = await call("Page.captureScreenshot", { format: "png", captureBeyondViewport: true, fromSurface: true });
    await writeFile(join(screenshotDir, `lumix-${size.name}.png`), Buffer.from(screenshot.data, "base64"));
    if (size.name === "desktop" || size.name === "mobile") {
      for (const product of ["options", "perpetuals", "spot", "pools"]) {
        const rect = await evaluate(`(() => { const r = document.querySelector('.visual-${product}').getBoundingClientRect(); return { x: r.left + scrollX, y: r.top + scrollY, width: r.width, height: r.height, scale: 2 }; })()`);
        const detail = await call("Page.captureScreenshot", { format: "png", captureBeyondViewport: true, fromSurface: true, clip: rect });
        await writeFile(join(screenshotDir, `lumix-${size.name}-${product}.png`), Buffer.from(detail.data, "base64"));
      }
      const platformRect = await evaluate("(() => { const r = document.querySelector('.platform-section').getBoundingClientRect(); return { x: r.left + scrollX, y: r.top + scrollY, width: r.width, height: r.height, scale: 1 }; })()");
      const platformScreenshot = await call("Page.captureScreenshot", { format: "png", captureBeyondViewport: true, fromSurface: true, clip: platformRect });
      await writeFile(join(screenshotDir, `lumix-${size.name}-platform.png`), Buffer.from(platformScreenshot.data, "base64"));
    }
  }
  console.log(JSON.stringify({ size: size.name, ...metrics }));

  if (size.name === "desktop" || size.name === "mobile") {
    const hover = await evaluate(`(async () => {
      const card = document.querySelector('.story-visual');
      card.scrollIntoView();
      await new Promise(resolve => requestAnimationFrame(resolve));
      const before = getComputedStyle(card).borderTopColor;
      const rect = card.getBoundingClientRect();
      return { before, x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
    })()`);
    await call("Input.dispatchMouseEvent", { type: "mouseMoved", x: hover.x, y: hover.y });
    const entering = await evaluate("getComputedStyle(document.querySelector('.story-visual')).borderTopColor");
    await new Promise(resolve => setTimeout(resolve, 100));
    const enteringMid = await evaluate("getComputedStyle(document.querySelector('.story-visual')).borderTopColor");
    await new Promise(resolve => setTimeout(resolve, 150));
    const hovered = await evaluate("getComputedStyle(document.querySelector('.story-visual')).borderTopColor");
    await call("Input.dispatchMouseEvent", { type: "mouseMoved", x: 1, y: 1 });
    const leaving = await evaluate("getComputedStyle(document.querySelector('.story-visual')).borderTopColor");
    await new Promise(resolve => setTimeout(resolve, 100));
    const leavingMid = await evaluate("getComputedStyle(document.querySelector('.story-visual')).borderTopColor");
    await new Promise(resolve => setTimeout(resolve, 150));
    const left = await evaluate("getComputedStyle(document.querySelector('.story-visual')).borderTopColor");
    console.log(JSON.stringify({ size: size.name, cardBorder: { before: hover.before, entering, enteringMid, hovered, leaving, leavingMid, left } }));
  }

  if (size.name === "desktop") {
    const feature = await evaluate(`(() => {
      const card = document.querySelector('.platform-benefits li');
      card.scrollIntoView({ block: 'center' });
      const rect = card.getBoundingClientRect();
      return { before: getComputedStyle(card).borderTopColor, x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
    })()`);
    await call("Input.dispatchMouseEvent", { type: "mouseMoved", x: feature.x, y: feature.y });
    await new Promise(resolve => setTimeout(resolve, 230));
    const hovered = await evaluate("getComputedStyle(document.querySelector('.platform-benefits li')).borderTopColor");
    await call("Input.dispatchMouseEvent", { type: "mouseMoved", x: 1, y: 1 });
    await new Promise(resolve => setTimeout(resolve, 230));
    const left = await evaluate("getComputedStyle(document.querySelector('.platform-benefits li')).borderTopColor");
    console.log(JSON.stringify({ featureBorder: { before: feature.before, hovered, left } }));
  }

  if (size.name === "mobile") {
    await call("Browser.grantPermissions", { origin: new URL(base).origin, permissions: ["clipboardReadWrite", "clipboardSanitizedWrite"] });
    await call("Page.bringToFront");
    console.log(JSON.stringify({ clipboardAvailable: await evaluate("Boolean(navigator.clipboard?.writeText)"), hasFocus: await evaluate("document.hasFocus()") }));
    await evaluate("document.querySelector('.copy-button').click(); true");
    await new Promise((resolve) => setTimeout(resolve, 350));
    console.log(JSON.stringify({
      copyStatus: await evaluate("document.querySelector('.copy-status').textContent.trim()"),
      clipboardMatches: await evaluate("navigator.clipboard.readText().then(value => value === 'info@lumixmarket.com').catch(() => false)"),
    }));
  }
}

socket.close();
