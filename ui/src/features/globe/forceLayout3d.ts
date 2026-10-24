import type { GlobeEdge, GlobeNode } from '../../types';

export interface ForceNode3D {
  id: string;
  node: GlobeNode;
  x: number;
  y: number;
  z: number;
  vx: number;
  vy: number;
  vz: number;
  degree: number;
  isFocus: boolean;
  pinned: boolean;
}

export interface ForceLink3D {
  source: ForceNode3D;
  target: ForceNode3D;
  type: string;
  strength: number;
  distance: number;
}

/**
 * Deterministic pseudo-random generator so layouts are repeatable.
 */
function seededRandom(seed: number): () => number {
  let s = seed % 2147483647;
  if (s <= 0) s += 2147483646;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

export class ForceGraphSimulation3D {
  nodes: ForceNode3D[] = [];
  links: ForceLink3D[] = [];
  nodeMap: Map<string, ForceNode3D> = new Map();
  alpha: number = 1.0;
  alphaDecay: number = 0.025;
  alphaMin: number = 0.004;
  velocityDecay: number = 0.55;

  private commCenters: Map<number, { x: number; y: number; z: number }> = new Map();

  constructor(rawNodes: GlobeNode[], rawEdges: GlobeEdge[], mode: 'neighborhood' | 'full') {
    const rand = seededRandom(1337);

    // 1. Place community cluster centers in a 3D multi-lobe volumetric cloud (NOT on a sphere surface)
    const distinctComms = Array.from(new Set(rawNodes.map((n) => n.comm)));
    const spreadX = mode === 'full' ? 140 : 75;
    const spreadY = mode === 'full' ? 85 : 48;
    const spreadZ = mode === 'full' ? 130 : 70;

    distinctComms.forEach((cid, idx) => {
      // Halton-like 3D volumetric distribution across space
      const rx = ((idx * 0.6180339887) % 1) * 2 - 1;
      const ry = ((idx * 0.3819660112 + rand() * 0.3) % 1) * 2 - 1;
      const rz = ((idx * 0.7548776662 + rand() * 0.3) % 1) * 2 - 1;
      this.commCenters.set(cid, {
        x: rx * spreadX,
        y: ry * spreadY,
        z: rz * spreadZ,
      });
    });

    // 2. Compute degree in the active graph
    const degMap = new Map<string, number>();
    for (const e of rawEdges) {
      degMap.set(e.source, (degMap.get(e.source) || 0) + 1);
      degMap.set(e.target, (degMap.get(e.target) || 0) + 1);
    }

    // 3. Initialize nodes in 3D space around their community center
    for (let i = 0; i < rawNodes.length; i++) {
      const n = rawNodes[i];
      const deg = (degMap.get(n.id) || 0) * 2 + Math.min(15, (n.in_degree || 0) + (n.out_degree || 0));
      const isFocus = Boolean(n.is_focus) && mode === 'neighborhood';
      const center = this.commCenters.get(n.comm) || { x: 0, y: 0, z: 0 };

      let x = 0;
      let y = 0;
      let z = 0;

      if (isFocus) {
        x = 0;
        y = 0;
        z = 0;
      } else {
        const jitter = mode === 'full' ? 45 : 32;
        x = center.x + (rand() - 0.5) * 2 * jitter;
        y = center.y + (rand() - 0.5) * 2 * (jitter * 0.75);
        z = center.z + (rand() - 0.5) * 2 * jitter;
      }

      const fn: ForceNode3D = {
        id: n.id,
        node: n,
        x,
        y,
        z,
        vx: 0,
        vy: 0,
        vz: 0,
        degree: deg,
        isFocus,
        pinned: isFocus,
      };
      this.nodes.push(fn);
      this.nodeMap.set(n.id, fn);
    }

    // 4. Initialize spring links along real edges
    for (const e of rawEdges) {
      const src = this.nodeMap.get(e.source);
      const dst = this.nodeMap.get(e.target);
      if (!src || !dst || src === dst) continue;

      const rel = (e.type || 'CALLS').toUpperCase();
      const sameComm = src.node.comm === dst.node.comm;
      const baseDist =
        rel === 'DEFINES'
          ? 18
          : sameComm
          ? 28
          : 46;
      const strength =
        rel === 'DEFINES'
          ? 0.26
          : rel === 'CALLS'
          ? 0.2
          : 0.14;

      this.links.push({
        source: src,
        target: dst,
        type: rel,
        strength,
        distance: baseDist,
      });
    }
  }

  /**
   * Run one tick of 3D force-directed simulation (charge repulsion + link springs + weak center gravity).
   */
  tick(): boolean {
    if (this.alpha < this.alphaMin) {
      return false;
    }

    const nodes = this.nodes;
    const nLen = nodes.length;
    const alpha = this.alpha;

    // 1. 3D Charge Repulsion
    const repulsionStrength = (nLen > 250 ? -190 : -240) * alpha;
    const maxCutoffSq = nLen > 250 ? 18000 : 32000;

    for (let i = 0; i < nLen; i++) {
      const a = nodes[i];
      for (let j = i + 1; j < nLen; j++) {
        const b = nodes[j];
        const dx = b.x - a.x;
        const dy = b.y - a.y;
        const dz = b.z - a.z;
        let distSq = dx * dx + dy * dy + dz * dz;
        if (distSq > maxCutoffSq) continue;
        if (distSq < 9) distSq = 9;

        const dist = Math.sqrt(distSq);
        const force = repulsionStrength / distSq;
        const fx = (dx / dist) * force;
        const fy = (dy / dist) * force;
        const fz = (dz / dist) * force;

        if (!a.pinned) {
          a.vx -= fx;
          a.vy -= fy;
          a.vz -= fz;
        }
        if (!b.pinned) {
          b.vx += fx;
          b.vy += fy;
          b.vz += fz;
        }
      }
    }

    // 2. Link Spring Attraction
    for (let i = 0; i < this.links.length; i++) {
      const link = this.links[i];
      const src = link.source;
      const dst = link.target;
      const dx = dst.x - src.x;
      const dy = dst.y - src.y;
      const dz = dst.z - src.z;
      const dist = Math.sqrt(dx * dx + dy * dy + dz * dz) || 1;

      const displacement = (dist - link.distance) / dist;
      const k = link.strength * alpha;
      const fx = dx * displacement * k;
      const fy = dy * displacement * k;
      const fz = dz * displacement * k;

      // Bias lighter leaf nodes to move more toward heavier hub nodes
      const totalDeg = (src.degree || 1) + (dst.degree || 1);
      const srcRatio = (dst.degree || 1) / totalDeg;
      const dstRatio = (src.degree || 1) / totalDeg;

      if (!src.pinned) {
        src.vx += fx * srcRatio;
        src.vy += fy * srcRatio;
        src.vz += fz * srcRatio;
      }
      if (!dst.pinned) {
        dst.vx -= fx * dstRatio;
        dst.vy -= fy * dstRatio;
        dst.vz -= fz * dstRatio;
      }
    }

    // 3. Weak Center Gravity + Module Cluster Cohesion
    for (let i = 0; i < nLen; i++) {
      const fn = nodes[i];
      if (fn.pinned) {
        fn.x = 0;
        fn.y = 0;
        fn.z = 0;
        continue;
      }

      const commCenter = this.commCenters.get(fn.node.comm);
      if (commCenter) {
        const pull = 0.032 * alpha;
        fn.vx += (commCenter.x - fn.x) * pull;
        fn.vy += (commCenter.y - fn.y) * pull;
        fn.vz += (commCenter.z - fn.z) * pull;
      }

      // Weak center gravity so disconnected components don't drift to infinity
      const gravity = (0.018 + Math.min(0.035, fn.degree * 0.0012)) * alpha;
      fn.vx -= fn.x * gravity;
      fn.vy -= fn.y * gravity * 1.15;
      fn.vz -= fn.z * gravity;

      fn.vx *= this.velocityDecay;
      fn.vy *= this.velocityDecay;
      fn.vz *= this.velocityDecay;

      fn.x += fn.vx;
      fn.y += fn.vy;
      fn.z += fn.vz;
    }

    this.alpha += (0 - this.alpha) * this.alphaDecay;
    return true;
  }

  warmUp(steps = 75): void {
    for (let i = 0; i < steps; i++) {
      this.tick();
    }
  }

  reheat(newAlpha = 0.55): void {
    this.alpha = newAlpha;
  }
}
