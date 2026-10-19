// Run against a local production server and a Chrome instance with remote debugging enabled.
const base = process.env.LUMIX_CHECK_URL || "http://localhost:3000/";
const debug = process.env.LUMIX_CDP_URL || "http://localhost:9229";
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
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
async function navigate() {
  await call("Page.navigate", { url: base });
  await wait(900);
}

await call("Page.enable");
await call("Runtime.enable");
await call("Emulation.setDeviceMetricsOverride", { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false });
await call("Emulation.setTouchEmulationEnabled", { enabled: false });
await call("Emulation.setEmulatedMedia", { features: [{ name: "prefers-reduced-motion", value: "no-preference" }] });
await navigate();

const desktop = await evaluate(`(() => ({
  lenis: document.documentElement.classList.contains('lenis'),
  rootIsDocument: document.scrollingElement === document.documentElement,
  scrollbarWidth: getComputedStyle(document.documentElement).scrollbarWidth,
  rootOverflow: getComputedStyle(document.documentElement).overflowY,
  bodyOverflow: getComputedStyle(document.body).overflowY,
  footer: [...document.querySelectorAll('.socials > *, .footer-legal-links > *')].map(el => ({
    label: el.getAttribute('aria-label') || el.textContent.trim(),
    tag: el.tagName.toLowerCase(),
    href: el.getAttribute('href'),
    cursor: getComputedStyle(el).cursor,
    width: Math.round(el.getBoundingClientRect().width),
    height: Math.round(el.getBoundingClientRect().height)
  }))
}))()`);
if (!desktop.lenis || !desktop.rootIsDocument || desktop.scrollbarWidth !== "none") throw new Error("Desktop scroll setup is incorrect");
if (desktop.footer.length !== 7 || desktop.footer.some((item) => item.cursor !== "pointer" || item.width < 36 || item.height < 36)) throw new Error("Footer hit areas are incorrect");
if (desktop.footer.slice(0, 5).some((item) => item.tag !== "button" || item.href !== null)) throw new Error("Unassigned footer destinations are not buttons");
if (desktop.footer[5].tag !== "a" || desktop.footer[5].href !== "#how-it-works") throw new Error("Docs link is incorrect");
if (desktop.footer[6].tag !== "a" || desktop.footer[6].href !== "mailto:info@lumixmarket.com") throw new Error("Contact email link is incorrect");

await call("Input.dispatchMouseEvent", { type: "mouseWheel", x: 720, y: 450, deltaX: 0, deltaY: 540 });
await wait(60);
const wheelEarly = await evaluate("scrollY");
await wait(160);
const wheelMid = await evaluate("scrollY");
await wait(420);
const wheelEnd = await evaluate("scrollY");
if (!(wheelEarly > 0 && wheelEarly < wheelMid && wheelMid <= wheelEnd && wheelEnd > 450)) throw new Error("Desktop wheel easing did not settle correctly");

await call("Input.dispatchKeyEvent", { type: "keyDown", key: "PageDown", code: "PageDown", windowsVirtualKeyCode: 34 });
await call("Input.dispatchKeyEvent", { type: "keyUp", key: "PageDown", code: "PageDown", windowsVirtualKeyCode: 34 });
await wait(400);
const keyboardScroll = await evaluate("scrollY");
if (keyboardScroll <= wheelEnd) throw new Error("Keyboard scrolling did not work");

await evaluate("document.querySelector('.footer-legal-links a').click(); true");
await wait(800);
const anchor = await evaluate("({ hash: location.hash, y: scrollY, targetY: Math.round(document.querySelector('#how-it-works').getBoundingClientRect().top) })");
if (anchor.hash !== "#how-it-works" || Math.abs(anchor.targetY) > 8) throw new Error("Docs anchor did not reach its section");

const focus = await evaluate(`(() => {
  const controls = [...document.querySelectorAll('.socials > *, .footer-legal-links > *')];
  return controls.map(el => {
    el.focus();
    return { tag: el.tagName.toLowerCase(), active: document.activeElement === el, visible: el.matches(':focus-visible'), outline: getComputedStyle(el).outlineStyle };
  });
})()`);
if (focus.some((item) => !item.active || !item.visible || item.outline === "none")) throw new Error("Footer keyboard focus is missing");

async function pressDemo(selector) {
  const position = await evaluate(`(() => {
    const el = document.querySelector('${selector}');
    el.scrollIntoView({ block: 'center' });
    const r = el.getBoundingClientRect();
    return { x: r.left + r.width / 2, y: r.top + r.height / 2, before: getComputedStyle(el).transform, href: el.getAttribute('href'), target: el.getAttribute('target'), rel: el.getAttribute('rel'), label: el.textContent.trim() };
  })()`);
  await wait(180);
  const actual = await evaluate(`(() => { const r = document.querySelector('${selector}').getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; })()`);
  await call("Input.dispatchMouseEvent", { type: "mouseMoved", x: actual.x, y: actual.y });
  await call("Input.dispatchMouseEvent", { type: "mousePressed", x: actual.x, y: actual.y, button: "left", buttons: 1, clickCount: 1 });
  await wait(130);
  const pressed = await evaluate(`getComputedStyle(document.querySelector('${selector}')).transform`);
  await call("Input.dispatchMouseEvent", { type: "mouseMoved", x: 2, y: 2, buttons: 1 });
  await call("Input.dispatchMouseEvent", { type: "mouseReleased", x: 2, y: 2, button: "left", buttons: 0, clickCount: 1 });
  await wait(130);
  const released = await evaluate(`getComputedStyle(document.querySelector('${selector}')).transform`);
  if (position.href !== "https://app.lumixmarket.com" || position.target !== "_blank" || position.rel !== "noopener noreferrer" || position.label !== "Launch app" || pressed !== "matrix(1, 0, 0, 1, 0, 4)" || released !== "none") throw new Error(`${selector} press effect is incorrect`);
  return { pressed, released };
}
const heroPress = await pressDemo(".hero .demo-button");
const closingPress = await pressDemo(".closing-demo .demo-button");
console.log(JSON.stringify({ desktop, wheel: { early: wheelEarly, mid: wheelMid, end: wheelEnd }, keyboardScroll, anchor, focus, heroPress, closingPress }));

await call("Emulation.setEmulatedMedia", { features: [{ name: "prefers-reduced-motion", value: "reduce" }] });
await navigate();
const reduced = await evaluate("({ lenis: document.documentElement.classList.contains('lenis'), buttonTransition: getComputedStyle(document.querySelector('.demo-button')).transitionDuration, scrollHeight: document.documentElement.scrollHeight })");
if (reduced.lenis || reduced.buttonTransition !== "0s") throw new Error("Reduced-motion fallback is incorrect");
await call("Input.dispatchMouseEvent", { type: "mouseWheel", x: 720, y: 450, deltaX: 0, deltaY: 540 });
await wait(160);
reduced.y = await evaluate("scrollY");
if (reduced.y <= 0) throw new Error("Reduced-motion wheel scrolling failed");
console.log(JSON.stringify({ reduced }));

await call("Emulation.setDeviceMetricsOverride", { width: 390, height: 844, deviceScaleFactor: 1, mobile: true });
await call("Emulation.setTouchEmulationEnabled", { enabled: true, maxTouchPoints: 2 });
await call("Emulation.setEmulatedMedia", { features: [{ name: "prefers-reduced-motion", value: "no-preference" }] });
await navigate();
const mobile = await evaluate("({ lenis: document.documentElement.classList.contains('lenis'), touchAction: getComputedStyle(document.body).touchAction, scrollHeight: document.documentElement.scrollHeight, viewport: innerHeight })");
if (mobile.lenis || mobile.touchAction !== "auto" || mobile.scrollHeight <= mobile.viewport) throw new Error("Mobile native scrolling setup is incorrect");
await call("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [{ x: 195, y: 700 }] });
for (const y of [650, 590, 510, 420, 330]) {
  await call("Input.dispatchTouchEvent", { type: "touchMove", touchPoints: [{ x: 195, y }] });
  await wait(35);
}
await call("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
await wait(350);
mobile.y = await evaluate("scrollY");
if (mobile.y <= 0) throw new Error("Mobile touch scrolling failed");
console.log(JSON.stringify({ mobile }));

await call("Emulation.setScriptExecutionDisabled", { value: true });
await navigate();
const noJavaScript = await evaluate("({ height: document.documentElement.scrollHeight, viewport: innerHeight, ctas: document.querySelectorAll('.demo-button').length })");
if (noJavaScript.height <= noJavaScript.viewport || noJavaScript.ctas !== 2) throw new Error("No-JavaScript page fallback failed");
console.log(JSON.stringify({ noJavaScript }));
await call("Emulation.setScriptExecutionDisabled", { value: false });
socket.close();
