import { useEffect, useRef } from 'react';
import {
  Scene,
  PerspectiveCamera,
  WebGLRenderer,
  BufferGeometry,
  BufferAttribute,
  Points,
  PointsMaterial,
  LineSegments,
  LineBasicMaterial,
  AdditiveBlending,
  Color,
  Group,
  MathUtils,
} from 'three';

/**
 * Hero background: a slowly drifting network of nodes with lines drawn between
 * the ones that come close together — a "machine vision / neural net" read that
 * suits an automation company without being a literal robot.
 *
 * It sits ON TOP of the existing hero video, so it is deliberately restrained:
 * additive blending at low opacity, so it reads as light rather than as a
 * second competing image.
 *
 * This module is imported lazily (see Home.jsx), so three.js lands in its own
 * chunk and never delays first paint.
 *
 * It switches itself off, permanently, when any of these are true:
 *   - prefers-reduced-motion
 *   - no fine pointer (phones and tablets — this is a desktop flourish, and
 *     mobile is where a WebGL canvas costs the most battery)
 *   - navigator.connection.saveData
 *   - the device reports few CPU cores
 *   - WebGL is unavailable or the context is lost
 *
 * And it pauses (stops rendering entirely) whenever the hero scrolls out of
 * view or the tab is hidden.
 */

/* --------------------------------------------------------------- tuning */

const NODES_DESKTOP = 90;
const NODES_SMALL = 55;
const LINK_DISTANCE = 2.4; // world units; nodes closer than this get a line
const MAX_LINKS = 420; // hard cap on line segments drawn per frame
const DRIFT = 0.018; // node speed
const FIELD = { x: 16, y: 9, z: 6 }; // the box nodes move inside

// Pulled from styles.css (--blue, --orange, a lighter tint for depth).
const PALETTE = [new Color('#4f8fe8'), new Color('#1e5bbf'), new Color('#9fc4f5')];
const ACCENT = new Color('#f47b20');
const ACCENT_EVERY = 9; // roughly one node in nine is orange

/* ------------------------------------------------------------ capability */

function prefersReducedMotion() {
  return !!window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches;
}

function hasFinePointer() {
  return !!window.matchMedia?.('(hover: hover) and (pointer: fine)')?.matches;
}

function isLowPowered() {
  if (navigator.connection?.saveData) return true;
  const cores = navigator.hardwareConcurrency;
  return typeof cores === 'number' && cores > 0 && cores <= 4;
}

function webglAvailable() {
  try {
    const canvas = document.createElement('canvas');
    return !!(canvas.getContext('webgl2') || canvas.getContext('webgl'));
  } catch {
    return false;
  }
}

/* ------------------------------------------------------------- component */

export default function HeroScene3D() {
  const hostRef = useRef(null);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return undefined;

    if (prefersReducedMotion() || !hasFinePointer() || isLowPowered() || !webglAvailable()) {
      return undefined;
    }

    /* ---------------- renderer ---------------- */

    let renderer;
    try {
      renderer = new WebGLRenderer({ alpha: true, antialias: true, powerPreference: 'low-power' });
    } catch {
      return undefined; // WebGL claimed to exist but would not start
    }

    // Capping DPR matters: on a 3x phone-class display an uncapped canvas is
    // nine times the fragment work for a background effect nobody is studying.
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75));
    renderer.setClearColor(0x000000, 0);

    const canvas = renderer.domElement;
    canvas.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;display:block';
    canvas.setAttribute('aria-hidden', 'true');
    host.appendChild(canvas);

    const scene = new Scene();
    const camera = new PerspectiveCamera(60, 1, 0.1, 100);
    camera.position.set(0, 0, 13);

    const group = new Group();
    scene.add(group);

    /* ---------------- nodes ---------------- */

    const count = host.clientWidth < 900 ? NODES_SMALL : NODES_DESKTOP;

    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const velocities = new Float32Array(count * 3);

    for (let i = 0; i < count; i += 1) {
      const i3 = i * 3;
      positions[i3] = MathUtils.randFloatSpread(FIELD.x);
      positions[i3 + 1] = MathUtils.randFloatSpread(FIELD.y);
      positions[i3 + 2] = MathUtils.randFloatSpread(FIELD.z);

      velocities[i3] = MathUtils.randFloatSpread(DRIFT);
      velocities[i3 + 1] = MathUtils.randFloatSpread(DRIFT);
      velocities[i3 + 2] = MathUtils.randFloatSpread(DRIFT * 0.5);

      const c = i % ACCENT_EVERY === 0 ? ACCENT : PALETTE[i % PALETTE.length];
      colors[i3] = c.r;
      colors[i3 + 1] = c.g;
      colors[i3 + 2] = c.b;
    }

    const nodeGeo = new BufferGeometry();
    nodeGeo.setAttribute('position', new BufferAttribute(positions, 3));
    nodeGeo.setAttribute('color', new BufferAttribute(colors, 3));

    const nodeMat = new PointsMaterial({
      size: 0.13,
      vertexColors: true,
      transparent: true,
      opacity: 0.85,
      depthWrite: false,
      blending: AdditiveBlending,
      sizeAttenuation: true,
    });

    group.add(new Points(nodeGeo, nodeMat));

    /* ---------------- links ---------------- */

    // Pre-allocated to MAX_LINKS; each frame we fill the front of the buffer
    // and tell three.js to draw only that many vertices. No per-frame
    // allocation, no geometry rebuild.
    const linkPositions = new Float32Array(MAX_LINKS * 6);
    const linkGeo = new BufferGeometry();
    const linkAttr = new BufferAttribute(linkPositions, 3);
    linkAttr.setUsage(35048); // DynamicDrawUsage
    linkGeo.setAttribute('position', linkAttr);

    const linkMat = new LineBasicMaterial({
      color: 0x6ea8ee,
      transparent: true,
      opacity: 0.17,
      depthWrite: false,
      blending: AdditiveBlending,
    });

    group.add(new LineSegments(linkGeo, linkMat));

    const LINK_SQ = LINK_DISTANCE * LINK_DISTANCE;

    function rebuildLinks() {
      let n = 0;
      for (let i = 0; i < count && n < MAX_LINKS; i += 1) {
        const i3 = i * 3;
        for (let j = i + 1; j < count && n < MAX_LINKS; j += 1) {
          const j3 = j * 3;
          const dx = positions[i3] - positions[j3];
          const dy = positions[i3 + 1] - positions[j3 + 1];
          const dz = positions[i3 + 2] - positions[j3 + 2];
          const d2 = dx * dx + dy * dy + dz * dz;
          if (d2 > LINK_SQ) continue;

          const o = n * 6;
          linkPositions[o] = positions[i3];
          linkPositions[o + 1] = positions[i3 + 1];
          linkPositions[o + 2] = positions[i3 + 2];
          linkPositions[o + 3] = positions[j3];
          linkPositions[o + 4] = positions[j3 + 1];
          linkPositions[o + 5] = positions[j3 + 2];
          n += 1;
        }
      }
      linkGeo.setDrawRange(0, n * 2);
      linkAttr.needsUpdate = true;
    }

    /* ---------------- pointer parallax ---------------- */

    const pointer = { x: 0, y: 0 };
    const target = { x: 0, y: 0 };

    function onPointerMove(e) {
      const r = host.getBoundingClientRect();
      if (!r.height) return;
      target.x = ((e.clientX - r.left) / r.width - 0.5) * 2;
      target.y = ((e.clientY - r.top) / r.height - 0.5) * 2;
    }
    window.addEventListener('pointermove', onPointerMove, { passive: true });

    /* ---------------- sizing ---------------- */

    function resize() {
      const w = host.clientWidth || 1;
      const h = host.clientHeight || 1;
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    }
    resize();

    const ro = new ResizeObserver(resize);
    ro.observe(host);

    /* ---------------- run loop ---------------- */

    let frame = 0;
    let running = false;
    let visible = true;
    let onScreen = true;
    let last = performance.now();
    let linkTimer = 0;

    function tick(now) {
      frame = requestAnimationFrame(tick);

      // Seconds since the last frame, clamped so a backgrounded tab does not
      // teleport every node when it resumes.
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;

      for (let i = 0; i < count; i += 1) {
        const i3 = i * 3;
        positions[i3] += velocities[i3] * dt * 60;
        positions[i3 + 1] += velocities[i3 + 1] * dt * 60;
        positions[i3 + 2] += velocities[i3 + 2] * dt * 60;

        // Wrap at the edges of the field so the density stays even.
        if (positions[i3] > FIELD.x / 2) positions[i3] = -FIELD.x / 2;
        else if (positions[i3] < -FIELD.x / 2) positions[i3] = FIELD.x / 2;
        if (positions[i3 + 1] > FIELD.y / 2) positions[i3 + 1] = -FIELD.y / 2;
        else if (positions[i3 + 1] < -FIELD.y / 2) positions[i3 + 1] = FIELD.y / 2;
        if (positions[i3 + 2] > FIELD.z / 2) positions[i3 + 2] = -FIELD.z / 2;
        else if (positions[i3 + 2] < -FIELD.z / 2) positions[i3 + 2] = FIELD.z / 2;
      }
      nodeGeo.attributes.position.needsUpdate = true;

      // The O(n²) neighbour search is the expensive part, so it runs at ~20Hz
      // rather than every frame. The lines are faint and slow-moving; nobody
      // can tell, and it roughly thirds the CPU cost.
      linkTimer += dt;
      if (linkTimer > 0.05) {
        linkTimer = 0;
        rebuildLinks();
      }

      // Ease towards the pointer instead of snapping to it.
      pointer.x += (target.x - pointer.x) * 0.035;
      pointer.y += (target.y - pointer.y) * 0.035;

      group.rotation.y = pointer.x * 0.18 + now * 0.000035;
      group.rotation.x = -pointer.y * 0.12;

      renderer.render(scene, camera);
    }

    function start() {
      if (running || !visible || !onScreen) return;
      running = true;
      last = performance.now();
      frame = requestAnimationFrame(tick);
    }

    function stop() {
      if (!running) return;
      running = false;
      cancelAnimationFrame(frame);
    }

    // Do not burn a GPU on a hero nobody is looking at.
    const io = new IntersectionObserver(
      ([entry]) => {
        onScreen = entry.isIntersecting;
        if (onScreen) start();
        else stop();
      },
      { threshold: 0.01 }
    );
    io.observe(host);

    function onVisibility() {
      visible = document.visibilityState === 'visible';
      if (visible) start();
      else stop();
    }
    document.addEventListener('visibilitychange', onVisibility);

    // A lost context (GPU reset, driver sleep) must not leave a dead canvas
    // spinning an animation loop forever.
    function onContextLost(e) {
      e.preventDefault();
      stop();
    }
    canvas.addEventListener('webglcontextlost', onContextLost);
    canvas.addEventListener('webglcontextrestored', start);

    host.classList.add('is-on');
    start();

    /* ---------------- teardown ---------------- */

    return () => {
      stop();
      io.disconnect();
      ro.disconnect();
      document.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener('pointermove', onPointerMove);
      canvas.removeEventListener('webglcontextlost', onContextLost);
      canvas.removeEventListener('webglcontextrestored', start);

      nodeGeo.dispose();
      nodeMat.dispose();
      linkGeo.dispose();
      linkMat.dispose();
      renderer.dispose();
      // Frees the GPU context immediately rather than waiting for GC — a SPA
      // can mount and unmount this many times in one session.
      renderer.forceContextLoss?.();
      canvas.remove();
      host.classList.remove('is-on');
    };
  }, []);

  return <div className="hero-scene3d" ref={hostRef} aria-hidden="true" />;
}
