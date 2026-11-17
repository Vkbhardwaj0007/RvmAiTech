import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import {
  Camera, QrCode, UserCheck, Car, Clock, CreditCard,
  CheckCircle2, Play, RotateCcw, Sparkles, ShieldCheck, Smartphone,
} from 'lucide-react';

/**
 * Full 3D Smart Parking System — Interactive 3D WebGL Model + Live Kiosk Simulator
 *
 * Implements the exact 6-step workflow requested by the user:
 *  1. Entry Gate Arrival & ANPR Camera Number Plate Scan
 *  2. Customer Screen Generates QR -> Scan QR & Fill Form (Name + Phone Number) -> Registered -> Entry Gate Opens
 *  3. Car Parks in Bay -> Live Parking Timer Runs
 *  4. Car Drives to Exit Gate -> Exit ANPR Camera Scans Plate & Calculates Duration Charge
 *  5. Exit Customer Screen Shows Payment QR -> Customer Scans & Pays Charge
 *  6. Exit Gate Opens & Car Departs
 */

const STAGES = [
  {
    id: 0,
    short: '1. Entry ANPR Scan',
    title: 'Step 1: Car Arrives at Entry Gate & Camera Scans Number Plate',
    desc: 'Vehicle approaches Entry Gate. High-speed ANPR camera scans the front license plate automatically.',
  },
  {
    id: 1,
    short: '2. QR & Form Register',
    title: 'Step 2: Customer Screen Shows QR → Fill Name & Phone Form',
    desc: 'Customer Kiosk screen generates a unique QR code. Customer scans QR, enters Name & Phone Number to register, and Entry Gate opens.',
  },
  {
    id: 2,
    short: '3. Parked & Timer',
    title: 'Step 3: Entry Gate Opens & Car Parks in Slot (Live Timer)',
    desc: 'Entry boom barrier opens, car parks in Bay A-02, overhead sensor turns Red (Occupied), and billing timer starts.',
  },
  {
    id: 3,
    short: '4. Exit Camera Scan',
    title: 'Step 4: Car Reaches Exit Gate & Camera Scans Plate',
    desc: 'When leaving, car reaches Exit Gate. Exit ANPR camera scans plate and fetches entry time & registered customer profile.',
  },
  {
    id: 4,
    short: '5. Exit QR Payment',
    title: 'Step 5: Exit Screen Calculates Time Charge & Displays Payment QR',
    desc: 'Exit screen displays total parked duration and calculated charge with a UPI Payment QR code.',
  },
  {
    id: 5,
    short: '6. Gate Opens & Exit',
    title: 'Step 6: Payment Verified → Exit Gate Opens & Car Departs',
    desc: 'Instant QR payment confirmation triggers the Exit Boom Barrier to open and the vehicle exits smoothly.',
  },
];

// Simple deterministic SVG QR code generator for Kiosk display
function KioskQrSvg({ seed = 'RVMAITECH', accent = '#0d2649' }) {
  const cells = [];
  let hash = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    hash ^= seed.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  const isFinder = (r, c) =>
    (r < 4 && c < 4) || (r < 4 && c > 8) || (r > 8 && c < 4);

  for (let r = 0; r < 13; r++) {
    for (let c = 0; c < 13; c++) {
      if (isFinder(r, c)) continue;
      const bit = ((hash >>> ((r * 13 + c) % 24)) ^ (r * 7 + c * 11)) & 1;
      if (bit) {
        cells.push(<rect key={`${r}-${c}`} x={c * 6 + 6} y={r * 6 + 6} width="5" height="5" rx="1" fill={accent} />);
      }
    }
  }
  return (
    <svg viewBox="0 0 90 90" width="118" height="118" style={{ background: '#ffffff', borderRadius: 12, padding: 6, boxShadow: '0 4px 14px rgba(0,0,0,0.25)' }}>
      {/* 3 Finder Patterns */}
      <rect x="6" y="6" width="22" height="22" rx="3" fill="none" stroke={accent} strokeWidth="3.5" />
      <rect x="12" y="12" width="10" height="10" rx="1.5" fill="#f47b20" />
      <rect x="62" y="6" width="22" height="22" rx="3" fill="none" stroke={accent} strokeWidth="3.5" />
      <rect x="68" y="12" width="10" height="10" rx="1.5" fill="#f47b20" />
      <rect x="6" y="62" width="22" height="22" rx="3" fill="none" stroke={accent} strokeWidth="3.5" />
      <rect x="12" y="68" width="10" height="10" rx="1.5" fill="#f47b20" />
      {cells}
    </svg>
  );
}

export default function SmartParking3DSimulator() {
  const mountRef = useRef(null);
  const stateRef = useRef({
    stage: 0,
    carProgress: 0,
    entryGateAngle: 0,
    exitGateAngle: 0,
  });

  const [stage, setStage] = useState(0);
  const [autoPlay, setAutoPlay] = useState(false);
  const [plate, setPlate] = useState('HR-38-AB-7052');
  const [custName, setCustName] = useState('Vivek Bhardwaj');
  const [custPhone, setCustPhone] = useState('7052050656');
  const [parkedMinutes, setParkedMinutes] = useState(45);
  const [paid, setPaid] = useState(false);

  // Sync React stage into Three.js animation ref
  useEffect(() => {
    stateRef.current.stage = stage;
    if (stage < 5) setPaid(false);
    if (stage === 5) setPaid(true);
  }, [stage]);

  // Increment simulated parked timer during stage 2
  useEffect(() => {
    if (stage !== 2) return undefined;
    const iv = setInterval(() => {
      setParkedMinutes((m) => (m < 180 ? m + 5 : 45));
    }, 1200);
    return () => clearInterval(iv);
  }, [stage]);

  // Optional auto-walkthrough mode
  useEffect(() => {
    if (!autoPlay) return undefined;
    const iv = setInterval(() => {
      setStage((s) => (s + 1) % 6);
    }, 4200);
    return () => clearInterval(iv);
  }, [autoPlay]);

  const calculatedCharge = Math.max(20, Math.round((parkedMinutes / 30) * 20));

  // Build Three.js 3D Smart Parking Facility Scene
  useEffect(() => {
    const host = mountRef.current;
    if (!host) return undefined;

    let renderer;
    try {
      renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: 'high-performance' });
    } catch {
      return undefined;
    }

    const w = host.clientWidth || 720;
    const h = host.clientHeight || 430;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setSize(w, h, false);
    renderer.shadowMap.enabled = true;
    host.innerHTML = '';
    host.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(40, w / h, 0.1, 120);
    camera.position.set(0, 7.2, 13.8);
    camera.lookAt(0, 0.4, 0);

    // Lights
    scene.add(new THREE.AmbientLight(0xdbeafe, 1.35));
    const dirLight = new THREE.DirectionalLight(0xffffff, 2.1);
    dirLight.position.set(8, 14, 10);
    scene.add(dirLight);

    const entryScanLight = new THREE.PointLight(0x38bdf8, 0, 6);
    entryScanLight.position.set(-4.6, 1.5, 1.8);
    scene.add(entryScanLight);

    const exitScanLight = new THREE.PointLight(0xf47b20, 0, 6);
    exitScanLight.position.set(4.2, 1.5, 1.8);
    scene.add(exitScanLight);

    const world = new THREE.Group();
    scene.add(world);

    // Materials
    const matAsphalt = new THREE.MeshStandardMaterial({ color: 0x0b192e, roughness: 0.75, metalness: 0.2 });
    const matCurb = new THREE.MeshStandardMaterial({ color: 0x16325c, roughness: 0.5, metalness: 0.35 });
    const matLine = new THREE.MeshBasicMaterial({ color: 0x38bdf8 });
    const matYellowLine = new THREE.MeshBasicMaterial({ color: 0xfacc15 });
    const matPillar = new THREE.MeshStandardMaterial({ color: 0x1e3a5f, metalness: 0.65, roughness: 0.3 });
    const matOrange = new THREE.MeshStandardMaterial({ color: 0xf47b20, emissive: 0xf47b20, emissiveIntensity: 0.25, metalness: 0.4, roughness: 0.3 });
    const matWhite = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.3 });
    const matKioskScreen = new THREE.MeshBasicMaterial({ color: 0x38bdf8 });
    const matExitScreen = new THREE.MeshBasicMaterial({ color: 0x22c55e });
    const matScanBeam = new THREE.MeshBasicMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.0, side: THREE.DoubleSide });
    const matExitBeam = new THREE.MeshBasicMaterial({ color: 0xf47b20, transparent: true, opacity: 0.0, side: THREE.DoubleSide });

    // 1. Ground Platform & Road
    const ground = new THREE.Mesh(new THREE.BoxGeometry(15.5, 0.35, 8.2), matCurb);
    ground.position.y = -0.2;
    world.add(ground);

    const road = new THREE.Mesh(new THREE.BoxGeometry(14.8, 0.06, 3.2), matAsphalt);
    road.position.set(0, 0.01, 1.5);
    world.add(road);

    const bayFloor = new THREE.Mesh(new THREE.BoxGeometry(8.6, 0.06, 3.4), matAsphalt);
    bayFloor.position.set(0, 0.01, -1.7);
    world.add(bayFloor);

    // Road dashed center stripes
    for (let x = -6.2; x <= 6.2; x += 1.4) {
      const dash = new THREE.Mesh(new THREE.BoxGeometry(0.65, 0.02, 0.08), matYellowLine);
      dash.position.set(x, 0.05, 1.5);
      world.add(dash);
    }

    // 2. Parking Bays (3 Slots in Rear) + Overhead Roof & Slot Sensors
    const bayStatusLights = [];
    for (let i = -1; i <= 1; i++) {
      const bx = i * 2.5;
      const lineL = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.03, 2.6), matLine);
      lineL.position.set(bx - 1.1, 0.05, -1.7);
      world.add(lineL);
      const lineR = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.03, 2.6), matLine);
      lineR.position.set(bx + 1.1, 0.05, -1.7);
      world.add(lineR);

      // Sensor indicator orb above each slot
      const sensorMat = new THREE.MeshBasicMaterial({ color: 0x22c55e });
      const sensorOrb = new THREE.Mesh(new THREE.SphereGeometry(0.14, 16, 16), sensorMat);
      sensorOrb.position.set(bx, 2.15, -1.7);
      world.add(sensorOrb);
      bayStatusLights.push({ mesh: sensorOrb, mat: sensorMat, isTarget: i === 0 });
    }

    // Canopy Roof over Parking Bays
    const roof = new THREE.Mesh(
      new THREE.BoxGeometry(7.8, 0.14, 2.9),
      new THREE.MeshStandardMaterial({ color: 0x0f294d, metalness: 0.7, roughness: 0.25 })
    );
    roof.position.set(0, 2.3, -1.7);
    world.add(roof);

    [-3.6, 3.6].forEach((px) => {
      const post = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 2.3, 12), matPillar);
      post.position.set(px, 1.15, -2.8);
      world.add(post);
    });

    // Helper to build Gate Assembly (Camera Pillar + Customer QR Kiosk + Boom Barrier)
    const buildGateComplex = (xPos, isExit) => {
      const group = new THREE.Group();
      group.position.set(xPos, 0, 0);

      // A. Boom Barrier Post & Rotating Arm
      const post = new THREE.Mesh(new THREE.BoxGeometry(0.38, 1.25, 0.38), matOrange);
      post.position.set(0, 0.62, 0.05);
      group.add(post);

      const pivot = new THREE.Group();
      pivot.position.set(0, 1.1, 0.05);
      group.add(pivot);

      const arm = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.12, 2.75), matWhite);
      arm.position.set(0, 0, 1.38);
      pivot.add(arm);

      // Red/Orange stripes on barrier arm
      for (let s = 0.35; s < 2.6; s += 0.55) {
        const stripe = new THREE.Mesh(new THREE.BoxGeometry(0.13, 0.13, 0.24), matOrange);
        stripe.position.set(0, 0, s);
        pivot.add(stripe);
      }

      // B. ANPR Camera Pole & Camera Housing
      const camPole = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.09, 2.1, 14), matPillar);
      camPole.position.set(-0.95, 1.05, -0.1);
      group.add(camPole);

      const camBox = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.24, 0.26), matWhite);
      camBox.position.set(-0.95, 2.1, 0.05);
      camBox.rotation.y = isExit ? -0.35 : -0.45;
      camBox.rotation.x = 0.35;
      group.add(camBox);

      // Laser scan cone from ANPR camera towards car plate
      const coneGeo = new THREE.ConeGeometry(0.85, 2.4, 16, 1, true);
      const beam = new THREE.Mesh(coneGeo, isExit ? matExitBeam : matScanBeam);
      beam.position.set(-1.35, 1.15, 0.9);
      beam.rotation.z = -0.65;
      beam.rotation.x = 0.55;
      group.add(beam);

      // C. Customer Display Kiosk (QR Screen + Form/Payment Terminal)
      const kioskBody = new THREE.Mesh(new THREE.BoxGeometry(0.46, 1.45, 0.36), matPillar);
      kioskBody.position.set(-0.52, 0.72, -0.15);
      group.add(kioskBody);

      const screen = new THREE.Mesh(
        new THREE.BoxGeometry(0.36, 0.52, 0.04),
        isExit ? matExitScreen : matKioskScreen
      );
      screen.position.set(-0.52, 1.05, 0.04);
      group.add(screen);

      world.add(group);
      return { pivot, screen };
    };

    const entryGate = buildGateComplex(-3.7, false);
    const exitGate = buildGateComplex(3.9, true);

    // 3. 3D Vehicle (Car with Body, Cabin, Wheels, Headlights & Number Plates)
    const car = new THREE.Group();
    const carBodyMat = new THREE.MeshStandardMaterial({ color: 0x2563eb, metalness: 0.7, roughness: 0.22 });
    const carCabinMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, metalness: 0.85, roughness: 0.12 });
    const wheelMat = new THREE.MeshStandardMaterial({ color: 0x111827, roughness: 0.6 });
    const plateMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
    const headLightMat = new THREE.MeshBasicMaterial({ color: 0xfef08a });

    const chassis = new THREE.Mesh(new THREE.BoxGeometry(1.9, 0.42, 0.98), carBodyMat);
    chassis.position.y = 0.34;
    car.add(chassis);

    const cabin = new THREE.Mesh(new THREE.BoxGeometry(1.05, 0.36, 0.84), carCabinMat);
    cabin.position.set(-0.08, 0.68, 0);
    car.add(cabin);

    // Front & Rear Number Plates
    const frontPlate = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.14, 0.42), plateMat);
    frontPlate.position.set(0.96, 0.26, 0);
    car.add(frontPlate);

    const rearPlate = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.14, 0.42), plateMat);
    rearPlate.position.set(-0.96, 0.26, 0);
    car.add(rearPlate);

    // Headlights
    [-0.32, 0.32].forEach((zOff) => {
      const hl = new THREE.Mesh(new THREE.SphereGeometry(0.07, 10, 10), headLightMat);
      hl.position.set(0.95, 0.38, zOff);
      car.add(hl);
    });

    // 4 Wheels
    [
      [-0.58, -0.48],
      [0.58, -0.48],
      [-0.58, 0.48],
      [0.58, 0.48],
    ].forEach(([wx, wz]) => {
      const wheel = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 0.14, 16), wheelMat);
      wheel.rotation.x = Math.PI / 2;
      wheel.position.set(wx, 0.2, wz);
      car.add(wheel);
    });

    car.position.set(-5.3, 0.04, 1.5);
    world.add(car);

    // Drag-to-rotate 360° camera orbit
    let isDragging = false;
    let prevX = 0;
    let prevY = 0;
    let orbitY = 0;
    let orbitX = 0.05;

    const onDown = (cx, cy) => {
      isDragging = true;
      prevX = cx;
      prevY = cy;
    };
    const onMove = (cx, cy) => {
      if (!isDragging) return;
      orbitY += (cx - prevX) * 0.008;
      orbitX = Math.max(-0.25, Math.min(0.45, orbitX + (cy - prevY) * 0.006));
      prevX = cx;
      prevY = cy;
    };
    const onUp = () => {
      isDragging = false;
    };

    const hDown = (e) => onDown(e.clientX, e.clientY);
    const hMove = (e) => onMove(e.clientX, e.clientY);
    const hTouchStart = (e) => e.touches.length === 1 && onDown(e.touches[0].clientX, e.touches[0].clientY);
    const hTouchMove = (e) => e.touches.length === 1 && onMove(e.touches[0].clientX, e.touches[0].clientY);

    host.addEventListener('mousedown', hDown);
    window.addEventListener('mousemove', hMove, { passive: true });
    window.addEventListener('mouseup', onUp);
    host.addEventListener('touchstart', hTouchStart, { passive: true });
    window.addEventListener('touchmove', hTouchMove, { passive: true });
    window.addEventListener('touchend', onUp);

    let raf = 0;
    const start = performance.now();

    const animate = (now) => {
      const t = (now - start) * 0.001;
      const st = stateRef.current.stage;

      // Target car position & rotation + barrier angles per stage
      let targetX = -5.1;
      let targetZ = 1.5;
      let targetRotY = 0;
      let targetEntryGate = 0;
      let targetExitGate = 0;

      if (st === 0) {
        // Stage 1: Car waiting at Entry Gate while ANPR Camera scans plate
        targetX = -5.0;
        targetZ = 1.5;
        targetRotY = 0;
        targetEntryGate = 0;
        matScanBeam.opacity = 0.26 + Math.sin(t * 7) * 0.14;
        matExitBeam.opacity = 0;
        entryScanLight.intensity = 3.5;
        exitScanLight.intensity = 0;
      } else if (st === 1) {
        // Stage 2: Customer Kiosk screen shows QR & form; barrier opens upon registration
        targetX = -4.8;
        targetZ = 1.5;
        targetRotY = 0;
        targetEntryGate = 0.35;
        matScanBeam.opacity = 0.12;
        matExitBeam.opacity = 0;
        entryScanLight.intensity = 2.0;
        exitScanLight.intensity = 0;
      } else if (st === 2) {
        // Stage 3: Entry Barrier Open -> Car parked in central Bay A-02
        targetX = 0;
        targetZ = -1.55;
        targetRotY = Math.PI / 2;
        targetEntryGate = 1.38;
        matScanBeam.opacity = 0;
        matExitBeam.opacity = 0;
        entryScanLight.intensity = 0;
        exitScanLight.intensity = 0;
      } else if (st === 3) {
        // Stage 4: Car at Exit Gate -> Exit ANPR Camera scans plate
        targetX = 2.55;
        targetZ = 1.5;
        targetRotY = 0;
        targetExitGate = 0;
        matScanBeam.opacity = 0;
        matExitBeam.opacity = 0.28 + Math.sin(t * 7) * 0.14;
        entryScanLight.intensity = 0;
        exitScanLight.intensity = 3.5;
      } else if (st === 4) {
        // Stage 5: Exit Kiosk displays calculated bill + Payment QR
        targetX = 2.75;
        targetZ = 1.5;
        targetRotY = 0;
        targetExitGate = 0;
        matScanBeam.opacity = 0;
        matExitBeam.opacity = 0.12;
        entryScanLight.intensity = 0;
        exitScanLight.intensity = 2.2;
      } else if (st === 5) {
        // Stage 6: Payment Done -> Exit Gate Opens -> Car drives out!
        targetX = 6.2;
        targetZ = 1.5;
        targetRotY = 0;
        targetExitGate = 1.42;
        matScanBeam.opacity = 0;
        matExitBeam.opacity = 0;
        entryScanLight.intensity = 0;
        exitScanLight.intensity = 0;
      }

      // Smooth interpolation
      car.position.x += (targetX - car.position.x) * 0.06;
      car.position.z += (targetZ - car.position.z) * 0.06;
      car.rotation.y += (targetRotY - car.rotation.y) * 0.07;

      entryGate.pivot.rotation.x += (-targetEntryGate - entryGate.pivot.rotation.x) * 0.09;
      exitGate.pivot.rotation.x += (-targetExitGate - exitGate.pivot.rotation.x) * 0.09;

      // Update Bay A-02 sensor orb color (Red when occupied in stage 2, Green otherwise)
      bayStatusLights.forEach((b) => {
        if (b.isTarget) {
          b.mat.color.setHex(st === 2 ? 0xef4444 : 0x22c55e);
        }
      });

      world.rotation.y = orbitY + Math.sin(t * 0.35) * 0.06;
      world.rotation.x = orbitX;

      renderer.render(scene, camera);
      raf = requestAnimationFrame(animate);
    };
    raf = requestAnimationFrame(animate);

    const onResize = () => {
      if (!host) return;
      const nw = host.clientWidth || 720;
      const nh = host.clientHeight || 430;
      camera.aspect = nw / nh;
      camera.updateProjectionMatrix();
      renderer.setSize(nw, nh, false);
    };
    window.addEventListener('resize', onResize, { passive: true });

    return () => {
      cancelAnimationFrame(raf);
      host.removeEventListener('mousedown', hDown);
      window.removeEventListener('mousemove', hMove);
      window.removeEventListener('mouseup', onUp);
      host.removeEventListener('touchstart', hTouchStart);
      window.removeEventListener('touchmove', hTouchMove);
      window.removeEventListener('touchend', onUp);
      window.removeEventListener('resize', onResize);
      renderer.dispose();
    };
  }, []);

  return (
    <div className="sp3d-wrapper">
      {/* Top 6-Stage Interactive Stepper */}
      <div className="sp3d-stepper">
        {STAGES.map((s) => (
          <button
            key={s.id}
            type="button"
            onClick={() => {
              setAutoPlay(false);
              setStage(s.id);
            }}
            className={`sp3d-step-btn ${stage === s.id ? 'active' : ''} ${stage > s.id ? 'done' : ''}`}
          >
            <span className="sp3d-step-num">{s.id + 1}</span>
            <span>{s.short}</span>
          </button>
        ))}
      </div>

      {/* Main 3D Viewport + Live Customer Kiosk Screen Grid */}
      <div className="sp3d-main-grid">
        {/* LEFT: Interactive 3D WebGL Smart Parking Facility */}
        <div className="sp3d-stage-box">
          <div className="sp3d-hud-top">
            <div className="sp3d-live-pill">
              <span className="pulse-dot-3d" />
              <span>3D SMART PARKING DIGITAL TWIN · DRAG 360°</span>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                type="button"
                onClick={() => setAutoPlay((a) => !a)}
                className="sp3d-ctrl-btn"
              >
                <Play size={13} /> {autoPlay ? 'Pause Auto-Demo' : 'Auto-Play 3D Flow'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setAutoPlay(false);
                  setStage(0);
                }}
                className="sp3d-ctrl-btn"
                title="Reset Simulation"
              >
                <RotateCcw size={13} /> Reset
              </button>
            </div>
          </div>

          {/* Three.js Canvas Mount */}
          <div ref={mountRef} className="sp3d-canvas-host" />

          {/* Bottom Stage Caption Bar */}
          <div className="sp3d-stage-caption">
            <div>
              <div style={{ fontSize: 12, color: '#38bdf8', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                Live 3D Simulation Status
              </div>
              <div style={{ fontSize: 16, fontWeight: 800, color: '#ffffff', marginTop: 2 }}>
                {STAGES[stage].title}
              </div>
              <div style={{ fontSize: 13.5, color: '#cbd5e1', marginTop: 2 }}>
                {STAGES[stage].desc}
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT: Interactive Customer Kiosk Screen (QR + Form + Exit Payment) */}
        <div className="sp3d-kiosk-card">
          <div className="sp3d-kiosk-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Smartphone size={18} color="#38bdf8" />
              <span>SMART PARKING CUSTOMER SCREEN (KIOSK)</span>
            </div>
            <span className="sp3d-plate-badge">{plate}</span>
          </div>

          {/* STAGE 0: ENTRY GATE ANPR CAMERA SCAN */}
          {stage === 0 && (
            <div className="sp3d-kiosk-body">
              <div className="sp3d-cam-box">
                <Camera size={28} color="#38bdf8" />
                <div>
                  <div style={{ fontSize: 12, color: '#7dd3fc', fontWeight: 700 }}>ENTRY GATE ANPR CAMERA</div>
                  <div style={{ fontSize: 18, fontWeight: 800, color: '#ffffff' }}>Scanning Vehicle Plate…</div>
                </div>
              </div>

              <div className="sp3d-plate-display">
                <span className="ind-flag">IND</span>
                <b>{plate}</b>
              </div>

              <p style={{ color: '#cbd5e1', fontSize: 14, lineHeight: 1.6, margin: '12px 0 18px' }}>
                गाड़ी एंट्री गेट पर पहुँच चुकी है। कैमरा ने नंबर प्लेट (<b>{plate}</b>) स्कैन कर लिया है। अब कस्टमर स्क्रीन पर रजिस्ट्रेशन QR जनरेट करें:
              </p>

              <button
                type="button"
                onClick={() => setStage(1)}
                className="btn btn-primary btn-3d-orange"
                style={{ width: '100%', justifyContent: 'center' }}
              >
                <QrCode size={18} /> Generate Entry QR on Customer Screen →
              </button>
            </div>
          )}

          {/* STAGE 1: ENTRY KIOSK QR + CUSTOMER REGISTRATION FORM */}
          {stage === 1 && (
            <div className="sp3d-kiosk-body">
              <div style={{ display: 'flex', gap: 14, alignItems: 'center', marginBottom: 14 }}>
                <KioskQrSvg seed={`ENTRY-${plate}`} accent="#0d2649" />
                <div>
                  <div style={{ fontSize: 12, fontWeight: 800, color: '#ff9d52', textTransform: 'uppercase' }}>
                    Step 2 · Scan QR to Register
                  </div>
                  <div style={{ fontSize: 16, fontWeight: 800, color: '#ffffff', margin: '4px 0' }}>
                    Customer Registration Form
                  </div>
                  <div style={{ fontSize: 12.5, color: '#cbd5e1', lineHeight: 1.45 }}>
                    कस्टमर स्क्रीन पर दिख रहे QR को स्कैन करके अपना <b>नाम</b> और <b>फोन नंबर</b> भरें:
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 14 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 12, color: '#93c5fd', fontWeight: 700, marginBottom: 4 }}>
                    Scanned Vehicle Number (ANPR)
                  </label>
                  <input
                    value={plate}
                    onChange={(e) => setPlate(e.target.value.toUpperCase())}
                    className="input-3d"
                    style={{ padding: '9px 12px', fontSize: 14, fontWeight: 800 }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 12, color: '#93c5fd', fontWeight: 700, marginBottom: 4 }}>
                    Customer Full Name *
                  </label>
                  <input
                    value={custName}
                    onChange={(e) => setCustName(e.target.value)}
                    placeholder="Enter Customer Name"
                    className="input-3d"
                    style={{ padding: '9px 12px', fontSize: 14 }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 12, color: '#93c5fd', fontWeight: 700, marginBottom: 4 }}>
                    Mobile / WhatsApp Number *
                  </label>
                  <input
                    value={custPhone}
                    onChange={(e) => setCustPhone(e.target.value)}
                    placeholder="Enter 10-digit Mobile Number"
                    className="input-3d"
                    style={{ padding: '9px 12px', fontSize: 14 }}
                  />
                </div>
              </div>

              <button
                type="button"
                onClick={() => setStage(2)}
                className="btn btn-3d-whatsapp"
                style={{ width: '100%', justifyContent: 'center' }}
              >
                <UserCheck size={18} /> Submit Form · Register &amp; Open Entry Gate →
              </button>
            </div>
          )}

          {/* STAGE 2: VEHICLE REGISTERED & PARKED IN BAY + LIVE TIMER */}
          {stage === 2 && (
            <div className="sp3d-kiosk-body">
              <div style={{ background: 'rgba(34, 197, 94, 0.16)', border: '1px solid rgba(74, 222, 128, 0.45)', borderRadius: 12, padding: '12px 14px', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 10 }}>
                <CheckCircle2 size={22} color="#4ade80" />
                <div>
                  <div style={{ fontSize: 14, fontWeight: 800, color: '#ffffff' }}>Registered &amp; Entry Gate Opened!</div>
                  <div style={{ fontSize: 12.5, color: '#bbf7d0' }}>{custName} ({custPhone}) · Slot Bay A-02</div>
                </div>
              </div>

              <div className="sp3d-timer-box">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <span style={{ fontSize: 12.5, color: '#93c5fd', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Clock size={15} /> LIVE PARKED DURATION
                  </span>
                  <span style={{ fontSize: 12, color: '#facc15', fontWeight: 700 }}>Rate: ₹20 / 30 mins</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                  <b style={{ fontSize: 28, color: '#ffffff', fontFamily: 'var(--display)' }}>
                    {Math.floor(parkedMinutes / 60)}h {parkedMinutes % 60}m
                  </b>
                  <span style={{ fontSize: 22, fontWeight: 800, color: '#4ade80' }}>₹{calculatedCharge}</span>
                </div>
              </div>

              <p style={{ color: '#cbd5e1', fontSize: 13.5, lineHeight: 1.55, margin: '12px 0 16px' }}>
                गाड़ी पार्किंग स्लॉट <b>Bay A-02</b> में पार्क है। जब कस्टमर बाहर (OUT) निकलेगा, तो नीचे क्लिक करें:
              </p>

              <button
                type="button"
                onClick={() => setStage(3)}
                className="btn btn-3d-cyan"
                style={{ width: '100%', justifyContent: 'center' }}
              >
                <Car size={18} /> Drive Car to Exit (OUT) Gate →
              </button>
            </div>
          )}

          {/* STAGE 3: EXIT GATE ANPR CAMERA SCAN */}
          {stage === 3 && (
            <div className="sp3d-kiosk-body">
              <div className="sp3d-cam-box" style={{ borderColor: 'rgba(244, 123, 32, 0.55)' }}>
                <Camera size={28} color="#f47b20" />
                <div>
                  <div style={{ fontSize: 12, color: '#ff9d52', fontWeight: 700 }}>EXIT (OUT) GATE ANPR CAMERA</div>
                  <div style={{ fontSize: 18, fontWeight: 800, color: '#ffffff' }}>Vehicle Detected at Exit!</div>
                </div>
              </div>

              <div style={{ background: 'rgba(15, 38, 74, 0.85)', borderRadius: 12, padding: '12px 14px', border: '1px solid rgba(56, 189, 248, 0.3)', margin: '12px 0' }}>
                <div style={{ fontSize: 13, color: '#93c5fd', marginBottom: 4 }}>Matched Registered Record:</div>
                <div style={{ fontSize: 15, fontWeight: 800, color: '#ffffff' }}>{plate} · {custName}</div>
                <div style={{ fontSize: 13, color: '#cbd5e1' }}>Phone: +91 {custPhone} · Parked: {parkedMinutes} mins</div>
              </div>

              <button
                type="button"
                onClick={() => setStage(4)}
                className="btn btn-primary btn-3d-orange"
                style={{ width: '100%', justifyContent: 'center', marginTop: 8 }}
              >
                <QrCode size={18} /> Calculate Time Charge &amp; Show Payment QR →
              </button>
            </div>
          )}

          {/* STAGE 4: EXIT SCREEN PAYMENT QR DISPLAY */}
          {stage === 4 && (
            <div className="sp3d-kiosk-body">
              <div style={{ display: 'flex', gap: 14, alignItems: 'center', marginBottom: 14 }}>
                <KioskQrSvg seed={`PAY-${plate}-${calculatedCharge}`} accent="#107e44" />
                <div>
                  <div style={{ fontSize: 12, fontWeight: 800, color: '#4ade80', textTransform: 'uppercase' }}>
                    Exit Payment QR Code
                  </div>
                  <div style={{ fontSize: 26, fontWeight: 800, color: '#ffffff', lineHeight: 1.1, margin: '4px 0' }}>
                    Pay ₹{calculatedCharge}.00
                  </div>
                  <div style={{ fontSize: 12.5, color: '#cbd5e1' }}>
                    Duration: <b>{Math.floor(parkedMinutes / 60)}h {parkedMinutes % 60}m</b>
                    <br />
                    Customer: <b>{custName}</b>
                  </div>
                </div>
              </div>

              <p style={{ color: '#cbd5e1', fontSize: 13.5, lineHeight: 1.55, margin: '0 0 14px' }}>
                जितने समय तक गाड़ी पार्क रही (<b>{parkedMinutes} mins</b>), उसके हिसाब से <b>₹{calculatedCharge}</b> का QR जनरेट हो गया है। पेमेंट करते ही गेट खुल जाएगा:
              </p>

              <button
                type="button"
                onClick={() => setStage(5)}
                className="btn btn-3d-whatsapp"
                style={{ width: '100%', justifyContent: 'center' }}
              >
                <CreditCard size={18} /> Scan QR &amp; Pay ₹{calculatedCharge} → Open Exit Gate
              </button>
            </div>
          )}

          {/* STAGE 5: PAYMENT COMPLETED & EXIT GATE OPENED */}
          {stage === 5 && (
            <div className="sp3d-kiosk-body">
              <div style={{ textAlign: 'center', padding: '14px 10px' }}>
                <div style={{ width: 54, height: 54, borderRadius: '50%', background: 'rgba(34, 197, 94, 0.2)', border: '2px solid #4ade80', display: 'grid', placeItems: 'center', margin: '0 auto 12px', color: '#4ade80' }}>
                  <CheckCircle2 size={30} />
                </div>
                <div style={{ fontSize: 20, fontWeight: 800, color: '#ffffff', marginBottom: 6 }}>
                  ₹{calculatedCharge} Paid · Exit Gate Opened!
                </div>
                <p style={{ fontSize: 14, color: '#cbd5e1', lineHeight: 1.6, margin: '0 0 18px' }}>
                  QR पेमेंट सफल होते ही <b>Exit Boom Barrier</b> खुल गया है और गाड़ी बाहर निकल गई है। कस्टमर के WhatsApp (<b>{custPhone}</b>) पर डिजिटल रसीद भेज दी गई है।
                </p>

                <button
                  type="button"
                  onClick={() => setStage(0)}
                  className="btn btn-3d-cyan"
                  style={{ width: '100%', justifyContent: 'center' }}
                >
                  <RotateCcw size={17} /> Simulate Next Vehicle Entry
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

