// Run with a local production server and a Chrome remote-debugging tab.
import assert from "node:assert/strict";
import { writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

const base = process.env.LUMIX_CHECK_URL || "http://localhost:3002/";
const tabs = await (await fetch("http://localhost:9229/json")).json();
const socket = new WebSocket(tabs.find(tab => tab.type === "page").webSocketDebuggerUrl);
await new Promise(resolve => socket.addEventListener("open", resolve, { once: true }));
let id = 0;
const pending = new Map();
socket.addEventListener("message", event => {
  const message = JSON.parse(event.data);
  const request = pending.get(message.id);
  if (!request) return;
  pending.delete(message.id);
  if (message.error) request.reject(new Error(message.error.message));
  else request.resolve(message.result);
});
const call = (method, params = {}) => new Promise((resolve, reject) => {
  pending.set(++id, { resolve, reject });
  socket.send(JSON.stringify({ id, method, params }));
});
const evaluate = async expression => {
  const result = await call("Runtime.evaluate", { expression, returnByValue: true, awaitPromise: true });
  if (result.exceptionDetails) throw new Error(JSON.stringify(result.exceptionDetails));
  return result.result.value;
};
const wait = ms => new Promise(resolve => setTimeout(resolve, ms));
const screenshot = async name => {
  const result = await call("Page.captureScreenshot", { format: "png" });
  const path = join(tmpdir(), `lumix-controls-${name}.png`);
  await writeFile(path, Buffer.from(result.data, "base64"));
  console.log(path);
};
const metrics = async (width, height, mobile = false) => {
  await call("Emulation.setDeviceMetricsOverride", { width, height, deviceScaleFactor: 1, mobile });
  await call("Emulation.setTouchEmulationEnabled", { enabled: mobile });
};
const navigate = async () => {
  await call("Page.navigate", { url: base });
  await wait(1100);
};

await call("Page.enable");
await call("Runtime.enable");
await call("Page.addScriptToEvaluateOnNewDocument", { source: `
  window.__revealAudit = { errors: [], resets: [], fadesBack: [], inViewHides: [], shifts: [], transitions: 0 };
  addEventListener('error', e => window.__revealAudit.errors.push(e.message));
  new PerformanceObserver(list => list.getEntries().forEach(e => {
    if (!e.hadRecentInput) window.__revealAudit.shifts.push(e.value);
  })).observe({type: 'layout-shift', buffered: true});
  const terminal = new WeakSet();
  new MutationObserver(records => records.forEach(({target}) => {
    const state = target.dataset.revealState;
    if (state === 'pending') {
      if (terminal.has(target)) window.__revealAudit.resets.push(target.textContent.slice(0,40));
      const r = target.getBoundingClientRect();
      if (r.top < innerHeight && r.bottom > 0) window.__revealAudit.inViewHides.push(r.top);
    } else if (state) terminal.add(target);
  })).observe(document, {subtree: true, attributes: true, attributeFilter: ['data-reveal-state']});
  const last = new WeakMap();
  function frame() {
    document.querySelectorAll('[data-reveal-item]').forEach(el => {
      const group = el.closest('[data-reveal-group]');
      if (group.dataset.revealState !== 'revealed') return;
      const opacity = Number(getComputedStyle(el).opacity);
      const before = last.get(el);
      if (before !== undefined && opacity < before - 0.01) window.__revealAudit.fadesBack.push(el.textContent.slice(0,40));
      if (opacity > 0 && opacity < 1) window.__revealAudit.transitions++;
      last.set(el, opacity);
    });
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
` });
await metrics(1440, 900);
await navigate();
const hero = await evaluate(`({
  timing: [...document.querySelectorAll('.hero-rise')].map(el => ({duration:getComputedStyle(el).animationDuration,delay:getComputedStyle(el).animationDelay,ease:getComputedStyle(el).animationTimingFunction})),
  controls: [...document.querySelectorAll('.hero-product')].map(el => ({label:el.textContent,href:el.hash,align:getComputedStyle(el).textAlign,icon:el.querySelector('svg').getAttribute('class'),x:el.offsetLeft,y:el.offsetTop, labelOffset:el.querySelector('span').getBoundingClientRect().left-el.getBoundingClientRect().left, iconOffset:el.querySelector('svg').getBoundingClientRect().left-el.getBoundingClientRect().left}))
})`);
assert.deepEqual(hero.controls.map(x => x.label), ["Options", "Perpetuals", "Spot", "Pools"]);
assert(hero.controls.every(x => x.align === "left" && Math.abs(x.labelOffset - x.iconOffset) < 1));
assert(hero.controls[0].x < hero.controls[1].x && hero.controls[0].y === hero.controls[1].y && hero.controls[2].y > hero.controls[0].y);
assert.deepEqual(hero.timing.map(x => x.delay), ["0s", "0.11s", "0.22s", "0.33s"]);
assert(hero.timing.every(x => x.duration === "0.6s"));
await screenshot("desktop");
for (const product of ["options", "perpetuals", "spot", "pools"]) {
  await evaluate("window.scrollTo({top:0,behavior:'instant'})");
  await wait(150);
  const position = await evaluate(`(() => { const el=document.querySelector('.hero-product--${product}'); const r=el.getBoundingClientRect(); return {x:r.left+8,y:r.top+8,border:getComputedStyle(el).borderColor}; })()`);
  await call("Input.dispatchMouseEvent", { type: "mouseMoved", x:position.x, y:position.y });
  await wait(230);
  const hovered = await evaluate(`getComputedStyle(document.querySelector('.hero-product--${product}')).borderColor`);
  assert.notEqual(hovered, position.border);
  await call("Input.dispatchMouseEvent", { type:"mousePressed", x:position.x, y:position.y, button:"left", buttons:1, clickCount:1 });
  await wait(120);
  assert.equal(await evaluate(`getComputedStyle(document.querySelector('.hero-product--${product}')).transform`), "matrix(1, 0, 0, 1, 0, 2)");
  await call("Input.dispatchMouseEvent", { type:"mouseReleased", x:position.x, y:position.y, button:"left", buttons:0, clickCount:1 });
  await wait(1000);
  const landing = await evaluate(`({hash:location.hash,focus:document.activeElement.id,top:document.querySelector('#${product}-title').getBoundingClientRect().top,opacity:getComputedStyle(document.querySelector('#${product}-title')).opacity})`);
  assert.equal(landing.hash, `#${product}`);
  assert.equal(landing.focus, product);
  assert(landing.top > 20 && landing.top < 160);
  assert.equal(landing.opacity, "1");
  console.log({ product, landing, hovered });
}
// Fresh hard refresh, then slow/fast/reversed wheel input with frame monitoring.
await evaluate("history.replaceState(null,'','/');scrollTo({top:0,behavior:'instant'})");
await call("Page.reload", { ignoreCache: true });
await wait(1000);
for (const deltaY of [120,120,120,120,700,-320,1800,-900,2200,1800,-4000]) {
  await call("Input.dispatchMouseEvent", { type:"mouseWheel", x:700, y:450, deltaX:0, deltaY });
  await wait(140);
}
await wait(650);
await metrics(390,844,true);
await wait(300);
await metrics(1440,900);
await wait(300);
const audit = await evaluate("window.__revealAudit");
assert.deepEqual(audit.errors, []);
assert.deepEqual(audit.resets, []);
assert.deepEqual(audit.fadesBack, []);
assert.deepEqual(audit.inViewHides, []);
assert.equal(audit.shifts.reduce((a,b)=>a+b,0),0);
assert(audit.transitions > 0, "Expected real opacity transitions");
console.log({audit});
await evaluate("scrollTo({top:0,behavior:'instant'});document.querySelector('.copy-button').focus()");
await call("Input.dispatchKeyEvent", { type:"keyDown", key:"Tab", code:"Tab", windowsVirtualKeyCode:9 });
await call("Input.dispatchKeyEvent", { type:"keyUp", key:"Tab", code:"Tab", windowsVirtualKeyCode:9 });
assert.equal(await evaluate("document.activeElement.hash"),"#options");
assert(await evaluate("document.activeElement.matches(':focus-visible') && getComputedStyle(document.activeElement).outlineStyle !== 'none'"));
await call("Input.dispatchKeyEvent", { type:"keyDown", key:"Enter", code:"Enter", windowsVirtualKeyCode:13 });
await call("Input.dispatchKeyEvent", { type:"keyUp", key:"Enter", code:"Enter", windowsVirtualKeyCode:13 });
await wait(1000);
assert.equal(await evaluate("document.activeElement.id"),"options");
for (const width of [390,320]) {
  await metrics(width,844,true);
  await navigate();
  await evaluate("document.querySelector('.hero-visual').scrollIntoView({block:'center'})");
  await wait(200);
  assert(await evaluate("document.documentElement.scrollWidth === innerWidth"));
  assert(await evaluate("[...document.querySelectorAll('.hero-product')].every(el=>el.clientWidth>=44&&el.clientHeight>=44&&el.scrollWidth===el.clientWidth)"));
  await screenshot(`mobile-${width}`);
  await evaluate("document.querySelector('.hero-product--pools').click()");
  await wait(1000);
  assert.equal(await evaluate("document.activeElement.id"),"pools");
  assert.equal(await evaluate("getComputedStyle(document.querySelector('#pools-title')).opacity"),"1");
}
await call("Emulation.setEmulatedMedia", { features:[{name:"prefers-reduced-motion",value:"reduce"}] });
await navigate();
assert(await evaluate("[...document.querySelectorAll('[data-reveal-item]')].every(el=>getComputedStyle(el).opacity==='1'&&getComputedStyle(el).transform==='none'&&getComputedStyle(el).transitionDuration==='0s')"));
assert.equal(await evaluate("getComputedStyle(document.querySelector('.hero-rise')).animationName"),"none");
await evaluate("document.querySelector('.hero-product--spot').click()");
assert(Math.abs(await evaluate("document.querySelector('#spot').getBoundingClientRect().top")-24)<2);
await call("Emulation.setScriptExecutionDisabled", {value:true});
await navigate();
assert(await evaluate("[...document.querySelectorAll('[data-reveal-item]')].every(el=>getComputedStyle(el).opacity==='1')"));
await call("Emulation.setScriptExecutionDisabled", {value:false});
await call("Emulation.setEmulatedMedia", { features:[{name:"prefers-reduced-motion",value:"no-preference"}] });
console.log("PASS: hero controls, anchors, focus, refresh, scroll reversals, resize, reduced motion, no-JS visibility");
socket.close();
