"use client";

import { useEffect, useRef } from "react";

type Rgb = [number, number, number];

type PortEdge = "top" | "right" | "bottom" | "left";

type Arm = {
  card: HTMLElement;
  length: number;
  entry: number;
  port: { edge: PortEdge; at: number } | null;
  x: Float32Array;
  y: Float32Array;
  nx: Float32Array;
  ny: Float32Array;
  speed: Float32Array;
  alpha: Float32Array;
  glow: Float32Array;
  spread: Float32Array;
  boost: number;
  boostTarget: number;
  spawnDebt: number;
  lastPacket: number;
  stagger: number;
};

type Mote = { arm: number; d: number; lane: number; pace: number; alpha: number; glow: number; tail: number; packet: boolean };
type Dust = { radius: number; angle: number; spin: number; alpha: number; phase: number };
type Packet = { arm: number; d: number; arrived: boolean };

// Geometry is authored against the 560 × 500 hero artboard and scaled to the rendered width.
const ARTBOARD_WIDTH = 560;
const CORE_RADIUS = 96;
const ENTRY_RADIUS = CORE_RADIUS + 16;
const ABSORB_RADIUS = CORE_RADIUS - 5;
const ARM_SWEEP = (75 * Math.PI) / 180;
const RING_SWEEP = (160 * Math.PI) / 180;
const CRUISE_SPEED = 64;
const PACKET_PACE = 1.9;
const PACKET_SIZE = 18;
const SPAWN_RATE = 34;
const MAX_MOTES = 1600;
const IGNITE_DELAY = 0.45;
const ALPHA_LEVELS = 8;
const COLOR_LEVELS = 4;
const STAGGER: Record<string, number> = { options: 0, spot: 1, pools: 2, perpetuals: 3 };
const PULSE_MS = 1000;
const CHARGE_MS = 1200;

const clamp01 = (value: number) => Math.min(1, Math.max(0, value));
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const smoothstep = (edge0: number, edge1: number, value: number) => {
  const t = clamp01((value - edge0) / (edge1 - edge0));
  return t * t * (3 - 2 * t);
};

function readColor(style: CSSStyleDeclaration, name: string, fallback: Rgb): Rgb {
  const hex = style.getPropertyValue(name).trim().replace("#", "");
  if (!/^[0-9a-f]{6}$/i.test(hex)) return fallback;
  return [parseInt(hex.slice(0, 2), 16), parseInt(hex.slice(2, 4), 16), parseInt(hex.slice(4, 6), 16)];
}

const mix = (a: Rgb, b: Rgb, t: number): Rgb => [
  Math.round(lerp(a[0], b[0], t)),
  Math.round(lerp(a[1], b[1], t)),
  Math.round(lerp(a[2], b[2], t)),
];

const rgb = ([r, g, b]: Rgb, alpha = 1) => `rgba(${r}, ${g}, ${b}, ${alpha})`;

const RAIL_LAYERS = [
  { width: 2.6, alpha: 0.032, bright: false },
  { width: 1.2, alpha: 0.055, bright: false },
  { width: 0, alpha: 0.11, bright: true },
];

function strokeRail(g: CanvasRenderingContext2D, arm: Arm, intensity: number, dim: string, bright: string) {
  const chunk = 10;
  g.lineCap = "butt";
  for (const layer of RAIL_LAYERS) {
    g.strokeStyle = layer.bright ? bright : dim;
    for (let start = 0; start < arm.length - 1; start += chunk) {
      const end = Math.min(arm.length - 1, start + chunk);
      const mid = (start + end) >> 1;
      const alpha = arm.alpha[mid] * (0.3 + 0.7 * arm.glow[mid]) * layer.alpha * intensity;
      if (alpha < 0.002) continue;
      g.globalAlpha = Math.min(1, alpha);
      g.lineWidth = layer.width ? arm.spread[mid] * 2 * layer.width : 1;
      g.beginPath();
      g.moveTo(arm.x[start], arm.y[start]);
      for (let k = start + 1; k <= end; k++) g.lineTo(arm.x[k], arm.y[k]);
      g.stroke();
    }
  }
  g.lineCap = "round";
}

function buildArm(card: HTMLElement, cx: number, cy: number, unit: number): Arm {
  const px = card.offsetLeft + card.offsetWidth / 2;
  const py = card.offsetTop + card.offsetHeight / 2;
  const r0 = Math.hypot(px - cx, py - cy);
  const a0 = Math.atan2(py - cy, px - cx);
  const rEntry = ENTRY_RADIUS * unit;
  const rAbsorb = ABSORB_RADIUS * unit;

  const steps = 720;
  const denseX = new Float32Array(steps + 1);
  const denseY = new Float32Array(steps + 1);
  const denseU = new Float32Array(steps + 1);
  for (let i = 0; i <= steps; i++) {
    const u = (i / steps) * 2;
    let radius: number;
    let angle: number;
    if (u <= 1) {
      radius = r0 + (rEntry - r0) * (1 - (1 - u) ** 2);
      angle = a0 - ARM_SWEEP * u;
    } else {
      const q = u - 1;
      radius = rEntry - (rEntry - rAbsorb) * q ** 1.6;
      angle = a0 - ARM_SWEEP - RING_SWEEP * q;
    }
    denseX[i] = cx + radius * Math.cos(angle);
    denseY[i] = cy + radius * Math.sin(angle);
    denseU[i] = u;
  }

  const cumulative = new Float32Array(steps + 1);
  for (let i = 1; i <= steps; i++) {
    cumulative[i] = cumulative[i - 1] + Math.hypot(denseX[i] - denseX[i - 1], denseY[i] - denseY[i - 1]);
  }

  const length = Math.max(4, Math.floor(cumulative[steps]));
  const x = new Float32Array(length);
  const y = new Float32Array(length);
  const u = new Float32Array(length);
  let segment = 0;
  let entry = length - 1;
  for (let k = 0; k < length; k++) {
    while (segment < steps - 1 && cumulative[segment + 1] < k) segment++;
    const span = cumulative[segment + 1] - cumulative[segment] || 1;
    const f = clamp01((k - cumulative[segment]) / span);
    x[k] = lerp(denseX[segment], denseX[segment + 1], f);
    y[k] = lerp(denseY[segment], denseY[segment + 1], f);
    u[k] = lerp(denseU[segment], denseU[segment + 1], f);
    if (u[k] >= 1 && entry === length - 1) entry = k;
  }

  const left = card.offsetLeft;
  const top = card.offsetTop;
  const right = left + card.offsetWidth;
  const bottom = top + card.offsetHeight;
  let exit = 0;
  while (exit < entry && x[exit] > left && x[exit] < right && y[exit] > top && y[exit] < bottom) exit++;
  let port: Arm["port"] = null;
  if (exit > 0 && exit < entry) {
    const edge: PortEdge = y[exit] >= bottom ? "bottom" : y[exit] <= top ? "top" : x[exit] <= left ? "left" : "right";
    port = { edge, at: edge === "top" || edge === "bottom" ? x[exit] - left : y[exit] - top };
  }

  const nx = new Float32Array(length);
  const ny = new Float32Array(length);
  const speed = new Float32Array(length);
  const alpha = new Float32Array(length);
  const glow = new Float32Array(length);
  const spread = new Float32Array(length);
  for (let k = 0; k < length; k++) {
    const prev = Math.max(0, k - 1);
    const next = Math.min(length - 1, k + 1);
    const tx = x[next] - x[prev];
    const ty = y[next] - y[prev];
    const tl = Math.hypot(tx, ty) || 1;
    nx[k] = -ty / tl;
    ny[k] = tx / tl;

    const radius = Math.hypot(x[k] - cx, y[k] - cy) || 1;
    speed[k] = Math.min(2.2, (r0 / radius) ** 0.8);

    if (u[k] <= 1) {
      const s = u[k];
      alpha[k] = port ? smoothstep(exit - 14 * unit, exit + 10 * unit, k) : smoothstep(0.04, 0.24, s);
      glow[k] = 0.18 + 0.82 * smoothstep(0.3, 1, s);
      spread[k] = lerp(12, 4, smoothstep(0, 1, s)) * unit;
    } else {
      const q = u[k] - 1;
      alpha[k] = 1 - smoothstep(0.25, 1, q);
      glow[k] = 1 - 0.45 * q;
      spread[k] = lerp(4, 1.5, q) * unit;
    }
  }

  return {
    card, length, entry, port, x, y, nx, ny, speed, alpha, glow, spread,
    boost: 0, boostTarget: 0, spawnDebt: 0, lastPacket: -Infinity,
    stagger: STAGGER[card.dataset.flow ?? ""] ?? 0,
  };
}

export default function HeroFlow() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const root = canvas?.parentElement;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !root || !ctx) return;

    const cards = [...root.querySelectorAll<HTMLElement>("[data-flow]")];
    const core = root.querySelector<SVGSVGElement>(".hero-core-layer");
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const style = getComputedStyle(root);
    const accent = readColor(style, "--trade-accent", [46, 92, 255]);
    const accentText = readColor(style, "--trade-accent-text", [143, 166, 255]);
    const palette = [accent, mix(accent, accentText, 0.5), accentText, mix(accentText, [255, 255, 255], 0.55)].map((color) => rgb(color));
    const hot = mix(accentText, [255, 255, 255], 0.55);
    const lineWidths = [1, 1.2, 1.45, 1.9];

    let width = 0;
    let height = 0;
    let cx = 0;
    let cy = 0;
    let unit = 1;
    let dpr = 1;
    let arms: Arm[] = [];
    let glowSprite: HTMLCanvasElement | null = null;
    let railSprite: HTMLCanvasElement | null = null;
    let glowRadius = 0;

    const motes: Mote[] = [];
    const packets: Packet[] = [];
    const ripples: number[] = [];
    let dust: Dust[] = [];
    let clock = 0;
    let flash = 0;
    let nextPacketAt = IGNITE_DELAY + 1.9;
    let packetBag: number[] = [];

    const capacity = MAX_MOTES + 600;
    const segX0 = new Float32Array(capacity);
    const segY0 = new Float32Array(capacity);
    const segX1 = new Float32Array(capacity);
    const segY1 = new Float32Array(capacity);
    const segKey = new Uint8Array(capacity);
    const order = new Uint16Array(capacity);
    const keyCount = new Uint16Array(COLOR_LEVELS * ALPHA_LEVELS);
    const keyStart = new Uint16Array(COLOR_LEVELS * ALPHA_LEVELS);
    const keyCursor = new Uint16Array(COLOR_LEVELS * ALPHA_LEVELS);

    const pulseTimers = new Map<Element, { className: string; timer: number }>();

    function seedDust() {
      const count = Math.max(90, Math.round(230 * unit * unit));
      dust = Array.from({ length: count }, () => {
        const radius = 118 + 150 * Math.random() ** 1.35;
        return {
          radius,
          angle: Math.random() * Math.PI * 2,
          spin: -0.3 * (130 / radius) ** 1.5,
          alpha: 0.05 + 0.32 * Math.random() ** 2,
          phase: Math.random() * Math.PI * 2,
        };
      });
    }

    function buildGlow() {
      glowRadius = 210 * unit;
      const size = Math.ceil(glowRadius * 2 * dpr);
      const sprite = document.createElement("canvas");
      sprite.width = size;
      sprite.height = size;
      const g = sprite.getContext("2d");
      if (!g) return;
      const half = size / 2;
      const gradient = g.createRadialGradient(half, half, 0, half, half, half);
      const inner = (CORE_RADIUS * unit) / glowRadius;
      gradient.addColorStop(0, rgb(accent, 0));
      gradient.addColorStop(inner * 0.92, rgb(accent, 0));
      gradient.addColorStop(inner + 0.06, rgb(accent, 0.2));
      gradient.addColorStop(0.72, rgb(accent, 0.045));
      gradient.addColorStop(1, rgb(accent, 0));
      g.fillStyle = gradient;
      g.fillRect(0, 0, size, size);
      glowSprite = sprite;
    }

    function buildRails() {
      const sprite = document.createElement("canvas");
      sprite.width = Math.round(width * dpr);
      sprite.height = Math.round(height * dpr);
      const g = sprite.getContext("2d");
      if (!g) return;
      g.scale(dpr, dpr);
      g.globalCompositeOperation = "lighter";
      for (const arm of arms) strokeRail(g, arm, 1, palette[0], palette[2]);
      railSprite = sprite;
    }

    function layout() {
      const nextWidth = root!.clientWidth;
      const nextHeight = root!.clientHeight;
      if (!nextWidth || !nextHeight) return false;
      const previousLengths = arms.map((arm) => arm.length);
      width = nextWidth;
      height = nextHeight;
      cx = width / 2;
      cy = height / 2;
      unit = width / ARTBOARD_WIDTH;
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas!.width = Math.round(width * dpr);
      canvas!.height = Math.round(height * dpr);
      const previousArms = arms;
      arms = cards.map((card, index) => {
        const arm = buildArm(card, cx, cy, unit);
        const previous = previousArms[index];
        if (previous) {
          arm.boost = previous.boost;
          arm.boostTarget = previous.boostTarget;
          arm.lastPacket = previous.lastPacket;
        }
        return arm;
      });
      for (const arm of arms) {
        if (arm.port) {
          arm.card.dataset.port = arm.port.edge;
          arm.card.style.setProperty("--port-at", `${arm.port.at.toFixed(1)}px`);
        } else {
          delete arm.card.dataset.port;
          arm.card.style.removeProperty("--port-at");
        }
      }
      for (const mote of motes) {
        const before = previousLengths[mote.arm];
        if (before) mote.d *= arms[mote.arm].length / before;
      }
      for (const packet of packets) {
        const before = previousLengths[packet.arm];
        if (before) packet.d *= arms[packet.arm].length / before;
      }
      if (!dust.length || Math.abs(dust.length - Math.round(230 * unit * unit)) > 40) seedDust();
      buildGlow();
      buildRails();
      return true;
    }

    function retrigger(element: Element, className: string, duration: number) {
      const existing = pulseTimers.get(element);
      if (existing) window.clearTimeout(existing.timer);
      element.classList.remove(className);
      // Reading layout flushes the removal so the CSS animations restart from their first frame.
      void element.getBoundingClientRect();
      element.classList.add(className);
      pulseTimers.set(element, {
        className,
        timer: window.setTimeout(() => {
          element.classList.remove(className);
          pulseTimers.delete(element);
        }, duration),
      });
    }

    function firePacket(index: number) {
      const arm = arms[index];
      if (!arm) return;
      arm.lastPacket = clock;
      packets.push({ arm: index, d: 0, arrived: false });
      for (let i = 0; i < PACKET_SIZE && motes.length < MAX_MOTES + 400; i++) {
        motes.push({
          arm: index,
          d: -Math.random() * 18 * unit,
          lane: (Math.random() - 0.5) * 0.45,
          pace: PACKET_PACE,
          alpha: 0.75 + Math.random() * 0.25,
          glow: 1,
          tail: 0.6 + Math.random() * 0.8,
          packet: true,
        });
      }
      retrigger(arm.card, "hero-product--pulse", PULSE_MS);
    }

    function nextScheduledArm() {
      if (!packetBag.length) {
        packetBag = arms.map((_, index) => index);
        for (let i = packetBag.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [packetBag[i], packetBag[j]] = [packetBag[j], packetBag[i]];
        }
      }
      return packetBag.pop() ?? 0;
    }

    function step(dt: number, animated: boolean) {
      clock += dt;
      const since = clock - IGNITE_DELAY;
      const tempo = animated ? 1 + 1.6 * (1 - smoothstep(0, 2.8, since)) : 1;

      for (let index = 0; index < arms.length; index++) {
        const arm = arms[index];
        arm.boost += (arm.boostTarget - arm.boost) * (1 - Math.exp(-dt * 6));
        const ignite = animated ? smoothstep(0, 1.1, since - arm.stagger * 0.14) : 1;
        arm.spawnDebt += SPAWN_RATE * Math.max(0.55, unit) * ignite * (1 + 1.6 * arm.boost) * tempo * dt;
        while (arm.spawnDebt >= 1 && motes.length < MAX_MOTES) {
          arm.spawnDebt -= 1;
          motes.push({
            arm: index,
            d: Math.random() * 3,
            lane: (Math.random() + Math.random() + Math.random() - 1.5) / 1.5,
            pace: 0.82 + Math.random() * 0.36,
            alpha: 0.22 + 0.72 * Math.random() ** 1.2,
            glow: 0.5 + Math.random() * 0.5,
            tail: 0.25 + 1.25 * Math.random() ** 1.6,
            packet: false,
          });
        }
        if (arm.spawnDebt > 1) arm.spawnDebt = 1;
      }

      const cruise = CRUISE_SPEED * unit * tempo;
      for (let i = motes.length - 1; i >= 0; i--) {
        const mote = motes[i];
        const arm = arms[mote.arm];
        const sample = arm.speed[Math.min(arm.length - 1, Math.max(0, mote.d | 0))];
        const pace = mote.packet ? PACKET_PACE : mote.pace * (1 + 0.5 * arm.boost);
        mote.d += cruise * sample * pace * dt;
        if (mote.d >= arm.length - 1) {
          motes[i] = motes[motes.length - 1];
          motes.pop();
        }
      }

      for (let i = packets.length - 1; i >= 0; i--) {
        const packet = packets[i];
        const arm = arms[packet.arm];
        packet.d += cruise * arm.speed[Math.min(arm.length - 1, packet.d | 0)] * PACKET_PACE * dt;
        if (!packet.arrived && packet.d >= arm.entry) {
          packet.arrived = true;
          flash = 1;
          ripples.push(0);
          if (core && animated) retrigger(core, "hero-core-layer--charge", CHARGE_MS);
        }
        if (packet.d >= arm.length - 1) packets.splice(i, 1);
      }

      for (let i = ripples.length - 1; i >= 0; i--) {
        ripples[i] += dt / 1.9;
        if (ripples[i] >= 1) ripples.splice(i, 1);
      }
      flash = Math.max(0, flash - dt / 0.9);

      for (const grain of dust) grain.angle += grain.spin * dt * tempo;

      if (animated && clock >= nextPacketAt) {
        firePacket(nextScheduledArm());
        nextPacketAt = clock + 2.4 + Math.random() * 1.3;
      }
    }

    function draw(animated: boolean) {
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx!.clearRect(0, 0, width, height);
      ctx!.globalCompositeOperation = "lighter";
      ctx!.lineCap = "round";

      const since = clock - IGNITE_DELAY;
      const ignite = animated ? smoothstep(-0.2, 1.6, since) : 1;
      const boost = arms.reduce((max, arm) => Math.max(max, arm.boost), 0);

      if (glowSprite) {
        ctx!.globalAlpha = ignite * Math.min(1, 0.8 + 0.45 * flash + 0.2 * boost);
        ctx!.drawImage(glowSprite, cx - glowRadius, cy - glowRadius, glowRadius * 2, glowRadius * 2);
      }
      if (railSprite) {
        ctx!.globalAlpha = ignite;
        ctx!.drawImage(railSprite, 0, 0, width, height);
      }
      for (const arm of arms) {
        if (arm.boost > 0.02) strokeRail(ctx!, arm, arm.boost * 1.3, palette[0], palette[2]);
      }

      let count = 0;
      const edgeFade = 28 * unit;
      for (const grain of dust) {
        if (count >= capacity) break;
        const radius = (grain.radius + Math.sin(grain.angle * 3 + clock * 0.4 + grain.phase) * 2) * unit;
        const x = cx + radius * Math.cos(grain.angle);
        const y = cy + radius * Math.sin(grain.angle);
        const edge = Math.min(x, width - x, y, height - y);
        const alpha = grain.alpha * ignite * smoothstep(0, edgeFade, edge) * (1 - smoothstep(205, 268, grain.radius));
        if (alpha < 0.02) continue;
        const tail = grain.angle - grain.spin * 0.09;
        segX0[count] = x;
        segY0[count] = y;
        segX1[count] = cx + radius * Math.cos(tail);
        segY1[count] = cy + radius * Math.sin(tail);
        segKey[count] = (alpha > 0.2 ? 1 : 0) * ALPHA_LEVELS + Math.min(ALPHA_LEVELS - 1, Math.floor(alpha * ALPHA_LEVELS));
        count++;
      }

      for (const mote of motes) {
        if (count >= capacity || mote.d < 0) continue;
        const arm = arms[mote.arm];
        const head = Math.min(arm.length - 2, mote.d);
        const i = head | 0;
        const alpha = mote.alpha * arm.alpha[i] * Math.min(1, ignite + (mote.packet ? 1 : 0)) * (1 + 0.6 * arm.boost);
        if (alpha < 0.03) continue;
        const velocity = CRUISE_SPEED * unit * arm.speed[i] * (mote.packet ? PACKET_PACE : mote.pace);
        const trail = Math.max(1.2 * unit, Math.min(10 * unit, velocity * 0.045) * mote.tail) * (mote.packet ? 2 : 1);
        const tailIndex = Math.max(0, (head - trail) | 0);
        const offset = mote.lane * arm.spread[i];
        const tailOffset = mote.lane * arm.spread[tailIndex];
        const f = head - i;
        segX0[count] = lerp(arm.x[i], arm.x[i + 1], f) + arm.nx[i] * offset;
        segY0[count] = lerp(arm.y[i], arm.y[i + 1], f) + arm.ny[i] * offset;
        segX1[count] = arm.x[tailIndex] + arm.nx[tailIndex] * tailOffset;
        segY1[count] = arm.y[tailIndex] + arm.ny[tailIndex] * tailOffset;
        const heat = mote.packet ? 1 : clamp01(arm.glow[i] * mote.glow + 0.35 * arm.boost);
        const color = mote.packet ? COLOR_LEVELS - 1 : Math.min(COLOR_LEVELS - 2, Math.floor(heat * (COLOR_LEVELS - 1)));
        segKey[count] = color * ALPHA_LEVELS + Math.min(ALPHA_LEVELS - 1, Math.floor(clamp01(alpha) * ALPHA_LEVELS));
        count++;
      }

      keyCount.fill(0);
      for (let i = 0; i < count; i++) keyCount[segKey[i]]++;
      let running = 0;
      for (let key = 0; key < keyCount.length; key++) {
        keyStart[key] = running;
        running += keyCount[key];
      }
      keyCursor.set(keyStart);
      for (let i = 0; i < count; i++) order[keyCursor[segKey[i]]++] = i;

      const lineScale = Math.min(1.1, Math.max(0.8, unit));
      for (let key = 0; key < keyCount.length; key++) {
        const total = keyCount[key];
        if (!total) continue;
        const color = Math.floor(key / ALPHA_LEVELS);
        const level = key % ALPHA_LEVELS;
        ctx!.globalAlpha = (level + 1) / ALPHA_LEVELS;
        ctx!.strokeStyle = palette[color];
        ctx!.lineWidth = lineWidths[color] * lineScale;
        ctx!.beginPath();
        const start = keyStart[key];
        for (let n = start; n < start + total; n++) {
          const i = order[n];
          ctx!.moveTo(segX0[i], segY0[i]);
          ctx!.lineTo(segX1[i], segY1[i]);
        }
        ctx!.stroke();
      }

      const core = CORE_RADIUS * unit;
      if (flash > 0) {
        ctx!.strokeStyle = rgb(hot);
        ctx!.globalAlpha = 0.35 * flash;
        ctx!.lineWidth = 4 * unit;
        ctx!.beginPath();
        ctx!.arc(cx, cy, core + 2.5 * unit, 0, Math.PI * 2);
        ctx!.stroke();
        ctx!.globalAlpha = 0.85 * flash ** 1.5;
        ctx!.lineWidth = 1.5;
        ctx!.beginPath();
        ctx!.arc(cx, cy, core + 1.5 * unit, 0, Math.PI * 2);
        ctx!.stroke();
      }

      const reach = Math.min(cx, cy) * 0.98;
      ctx!.strokeStyle = palette[2];
      ctx!.lineWidth = 1;
      for (const age of ripples) {
        const radius = core + (reach - core) * (1 - (1 - age) ** 3);
        ctx!.globalAlpha = 0.42 * (1 - age) ** 1.6;
        ctx!.beginPath();
        ctx!.arc(cx, cy, radius, 0, Math.PI * 2);
        ctx!.stroke();
      }

      ctx!.globalAlpha = 1;
      ctx!.globalCompositeOperation = "source-over";
    }

    function renderStill() {
      motes.length = 0;
      packets.length = 0;
      ripples.length = 0;
      flash = 0;
      clock = 0;
      for (let t = 0; t < 7; t += 1 / 30) step(1 / 30, false);
      draw(false);
    }

    let frame = 0;
    let last = 0;
    let visible = false;
    let running = false;

    const tick = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000 || 0);
      last = now;
      step(dt, true);
      draw(true);
      frame = requestAnimationFrame(tick);
    };

    const sync = () => {
      const shouldRun = visible && !document.hidden && !reducedMotion.matches;
      if (shouldRun === running) return;
      running = shouldRun;
      root.classList.toggle("hero-visual--live", running);
      if (running) {
        last = performance.now();
        frame = requestAnimationFrame(tick);
      } else {
        cancelAnimationFrame(frame);
      }
    };

    const onMotionChange = () => {
      if (reducedMotion.matches) {
        sync();
        renderStill();
      } else {
        motes.length = 0;
        clock = IGNITE_DELAY + 3;
        nextPacketAt = clock + 1;
        sync();
      }
    };

    const resizeObserver = new ResizeObserver(() => {
      if (!layout()) return;
      if (reducedMotion.matches) renderStill();
      else if (!running) draw(true);
    });
    resizeObserver.observe(root);
    for (const card of cards) resizeObserver.observe(card);

    const intersectionObserver = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      sync();
    }, { threshold: 0 });
    intersectionObserver.observe(root);

    const engage = (index: number, active: boolean) => {
      const arm = arms[index];
      if (!arm) return;
      arm.boostTarget = active ? 1 : 0;
      if (active && running && clock - arm.lastPacket > 0.7) firePacket(index);
    };
    const listeners = cards.map((card, index) => {
      const on = () => engage(index, true);
      const off = () => {
        if (card.matches(":hover, :focus-visible")) return;
        engage(index, false);
      };
      card.addEventListener("pointerenter", on);
      card.addEventListener("pointerleave", off);
      card.addEventListener("focus", on);
      card.addEventListener("blur", off);
      return { card, on, off };
    });

    document.addEventListener("visibilitychange", sync);
    reducedMotion.addEventListener("change", onMotionChange);

    return () => {
      cancelAnimationFrame(frame);
      resizeObserver.disconnect();
      intersectionObserver.disconnect();
      document.removeEventListener("visibilitychange", sync);
      reducedMotion.removeEventListener("change", onMotionChange);
      for (const { card, on, off } of listeners) {
        card.removeEventListener("pointerenter", on);
        card.removeEventListener("pointerleave", off);
        card.removeEventListener("focus", on);
        card.removeEventListener("blur", off);
      }
      for (const [element, { className, timer }] of pulseTimers) {
        window.clearTimeout(timer);
        element.classList.remove(className);
      }
      root.classList.remove("hero-visual--live");
      for (const card of cards) {
        delete card.dataset.port;
        card.style.removeProperty("--port-at");
      }
    };
  }, []);

  return <canvas ref={canvasRef} className="hero-flow" aria-hidden="true" />;
}
