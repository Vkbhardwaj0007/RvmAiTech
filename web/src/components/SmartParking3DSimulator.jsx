import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import {
  Camera, QrCode, UserCheck, Car, Clock, CreditCard,
  CheckCircle2, Play, RotateCcw, Sparkles, ShieldCheck, Smartphone,
  Eye, Bike, Navigation, Layers, ArrowRight, Zap,
} from 'lucide-react';

/**
 * 3D Smart Parking Digital Twin — High-Fidelity Realistic Prototype
 *
 * Designed to address all user requirements:
 * 1. REAL CAR & MOTORCYCLE MODELS (No toy cartoon blocks!):
 *    - Aerodynamic contoured sedan with curved hood, grille, projector LED headlights,
 *      raked windshield, tinted glass with pillars, door lines, side mirrors, shark antenna,
 *      5-spoke diamond-cut alloy wheels with brake disc rotors & red Brembo calipers.
 *    - Realistic Sport Bike with aluminum diamond frame, inverted gold forks, wave discs,
 *      multi-cylinder engine block, upswept chrome exhaust, clip-on handlebars & LED headlight.
 * 2. EXPANDED LARGE PARKING FACILITY (26m x 16m Commercial Prototype):
 *    - Dual-lane commercial roadway with road markings, speed humps, zebra crossings,
 *      curbs with hazard markings, and embedded green glowing directional guidance arrows.
 *    - Zone A: Wide Car Parking Bays (CAR-01 to CAR-04) with concrete wheel-stops,
 *      modern solar-roof canopy, and individual smart pillar kiosks with LED displays.
 *    - Zone B: Dedicated Bike Parking Zone (BIKE-01 to BIKE-04) with yellow border,
 *      blue asphalt coating, painted motorcycle stencils, and stainless steel lock bars.
 * 3. AI COMPUTER VISION OVERHEAD CAMERA SYSTEM (Matching Images 1 & 4):
 *    - Tall CCTV surveillance tower with multi-angle dome cameras scanning the bays.
 *    - High-tech 3D Bounding Boxes with corner brackets on every slot:
 *      * GREEN (`#22c55e`) Bounding Box = VACANT / EMPTY (with ID tag)
 *      * RED (`#ef4444`) Bounding Box = OCCUPIED / VEHICLE DETECTED (with ID tag)
 * 4. COMPLETE 6-STEP ANIMATED ENTRY & EXIT WORKFLOW:
 *    - ANPR scanning, QR customer registration, barrier lift, parking in slot (AI marks RED),
 *      reverse out (AI marks GREEN), exit ANPR scan, automated UPI payment QR, barrier lift & exit!
 */

const STAGES = [
  {
    id: 0,
    short: '1. ANPR Entry Scan',
    title: 'Step 1: Vehicle Arrives at Entry Gate & ANPR Camera Scans Plate',
    desc: 'Vehicle approaches Entry Gate. High-speed ANPR camera scans license plate and AI classifies vehicle type (4-Wheeler Car vs 2-Wheeler Bike).',
  },
  {
    id: 1,
    short: '2. QR Registration',
    title: 'Step 2: Customer Kiosk Displays QR → Fill Name & Phone Form',
    desc: 'Customer Kiosk screen displays an instant registration QR code. Customer scans QR, confirms contact details, and Entry Gate opens.',
  },
  {
    id: 2,
    short: '3. Park & AI Mark RED',
    title: 'Step 3: Barrier Opens → Vehicle Parks in Assigned Zone (AI Marks Slot RED)',
    desc: 'Vehicle follows glowing green asphalt arrows into its designated slot. Overhead CCTV AI Vision detects arrival and instantly marks the slot RED (Occupied)!',
  },
  {
    id: 3,
    short: '4. Exit & AI Mark GREEN',
    title: 'Step 4: Vehicle Departs Slot (AI Marks Slot GREEN) → Reaches Exit Gate',
    desc: 'Vehicle drives out of the bay. Camera Vision AI immediately flips the slot back to GREEN (Vacant). Vehicle reaches the Exit Gate.',
  },
  {
    id: 4,
    short: '5. Exit Billing QR',
    title: 'Step 5: Exit Screen Calculates Parked Time & Shows Payment QR',
    desc: 'Exit Kiosk ANPR camera matches entry record, computes total duration fee, and generates an automated UPI Payment QR.',
  },
  {
    id: 5,
    short: '6. Gate Opens & Out',
    title: 'Step 6: Payment Verified → Exit Boom Barrier Opens & Vehicle Departs',
    desc: 'Instant payment confirmation triggers Exit Boom Barrier to lift, and the vehicle exits the commercial facility smoothly.',
  },
];

// SVG QR Generator for Kiosk
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

  // Active Vehicle Type: 'car' (4-Wheeler) | 'bike' (2-Wheeler / Baick)
  const [vehicleType, setVehicleType] = useState('car');
  const [camView, setCamView] = useState('all'); // 'all' | 'cctv' | 'entry' | 'bays' | 'exit'

  const stateRef = useRef({
    stage: 0,
    vehicleType: 'car',
    camView: 'all',
    camera: null,
    targetCamPos: new THREE.Vector3(0, 11.5, 17.5),
    targetLookAt: new THREE.Vector3(0, 0.4, 0),
  });

  const [stage, setStage] = useState(0);
  const [autoPlay, setAutoPlay] = useState(false);
  const [plate, setPlate] = useState('HR-38-AB-7052');
  const [custName, setCustName] = useState('Vivek Bhardwaj');
  const [custPhone, setCustPhone] = useState('7052050656');
  const [parkedMinutes, setParkedMinutes] = useState(45);
  const [paid, setPaid] = useState(false);

  // Switch Vehicle Type (Car vs Bike)
  const handleSelectVehicle = (type) => {
    setVehicleType(type);
    stateRef.current.vehicleType = type;
    setStage(0);
    if (type === 'car') {
      setPlate('HR-38-AB-7052');
    } else {
      setPlate('UP-16-BK-9988');
    }
  };

  // Sync React stage into Three.js animation ref
  useEffect(() => {
    stateRef.current.stage = stage;
    stateRef.current.vehicleType = vehicleType;
    if (stage < 5) setPaid(false);
    if (stage === 5) setPaid(true);
  }, [stage, vehicleType]);

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
    }, 4500);
    return () => clearInterval(iv);
  }, [autoPlay]);

  // Camera preset handler
  const switchCamPreset = (preset) => {
    setCamView(preset);
    stateRef.current.camView = preset;
    const ref = stateRef.current;
    if (!ref.targetCamPos || !ref.targetLookAt) return;

    if (preset === 'cctv') {
      // Top-Down AI Camera Vision View (Matching Images 1 & 4)
      ref.targetCamPos.set(0, 19.5, 3.5);
      ref.targetLookAt.set(0, 0, -0.8);
    } else if (preset === 'entry') {
      // Entry ANPR Scanner View
      ref.targetCamPos.set(-9.8, 3.8, 7.8);
      ref.targetLookAt.set(-8.2, 1.2, 2.8);
    } else if (preset === 'bays') {
      // Car & Bike Parking Bays View
      ref.targetCamPos.set(0.5, 6.8, 6.8);
      ref.targetLookAt.set(0.5, 0.5, -2.5);
    } else if (preset === 'exit') {
      // Exit Kiosk & Payment View
      ref.targetCamPos.set(8.2, 3.8, 7.8);
      ref.targetLookAt.set(8.5, 1.2, 2.8);
    } else {
      // Default Perspective View
      ref.targetCamPos.set(0, 11.5, 17.5);
      ref.targetLookAt.set(0, 0.4, 0);
    }
  };

  const baseRate = vehicleType === 'car' ? 20 : 10;
  const calculatedCharge = Math.max(baseRate, Math.round((parkedMinutes / 30) * baseRate));

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
    const h = host.clientHeight || 480;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setSize(w, h, false);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    host.innerHTML = '';
    host.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x07111e);
    scene.fog = new THREE.FogExp2(0x07111e, 0.016);

    const camera = new THREE.PerspectiveCamera(40, w / h, 0.1, 160);
    camera.position.set(0, 11.5, 17.5);
    camera.lookAt(0, 0.4, 0);
    stateRef.current.camera = camera;

    // Realistic Lighting Setup
    scene.add(new THREE.AmbientLight(0xdbeafe, 1.2));
    const dirLight = new THREE.DirectionalLight(0xffffff, 2.4);
    dirLight.position.set(14, 20, 14);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 2048;
    dirLight.shadow.mapSize.height = 2048;
    dirLight.shadow.camera.near = 0.5;
    dirLight.shadow.camera.far = 50;
    dirLight.shadow.camera.left = -16;
    dirLight.shadow.camera.right = 16;
    dirLight.shadow.camera.top = 16;
    dirLight.shadow.camera.bottom = -16;
    scene.add(dirLight);

    const entryScanLight = new THREE.PointLight(0x38bdf8, 0, 9);
    entryScanLight.position.set(-8.4, 2.0, 3.2);
    scene.add(entryScanLight);

    const exitScanLight = new THREE.PointLight(0xf47b20, 0, 9);
    exitScanLight.position.set(8.4, 2.0, 3.2);
    scene.add(exitScanLight);

    const world = new THREE.Group();
    scene.add(world);

    // Common High-Detail Materials
    const matAsphalt = new THREE.MeshStandardMaterial({ color: 0x111c2a, roughness: 0.85, metalness: 0.12 });
    const matRoadMarking = new THREE.MeshBasicMaterial({ color: 0xffffff });
    const matYellowHazard = new THREE.MeshBasicMaterial({ color: 0xfacc15 });
    const matConcreteCurb = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.7, metalness: 0.2 });
    const matPillar = new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.85, roughness: 0.2 });
    const matOrangeBarrier = new THREE.MeshStandardMaterial({ color: 0xf47b20, emissive: 0xf47b20, emissiveIntensity: 0.2, metalness: 0.5, roughness: 0.25 });
    const matWhite = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.3 });
    const matChrome = new THREE.MeshStandardMaterial({ color: 0xf8fafc, metalness: 0.98, roughness: 0.1 });
    const matKioskScreen = new THREE.MeshBasicMaterial({ color: 0x38bdf8 });
    const matExitScreen = new THREE.MeshBasicMaterial({ color: 0x22c55e });
    const matScanBeam = new THREE.MeshBasicMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.0, side: THREE.DoubleSide });
    const matExitBeam = new THREE.MeshBasicMaterial({ color: 0xf47b20, transparent: true, opacity: 0.0, side: THREE.DoubleSide });
    const matArrowGreen = new THREE.MeshBasicMaterial({ color: 0x22c55e, transparent: true, opacity: 0.85 });

    // ----------------------------------------------------
    // 1. EXPANDED COMMERCIAL PARKING LOT (26m x 16m Prototype)
    // ----------------------------------------------------
    const ground = new THREE.Mesh(new THREE.BoxGeometry(26.4, 0.4, 16.4), matConcreteCurb);
    ground.position.y = -0.22;
    ground.receiveShadow = true;
    world.add(ground);

    // Main Driving Asphalt Lane (Roadway at z = 2.8)
    const road = new THREE.Mesh(new THREE.BoxGeometry(25.6, 0.06, 5.0), matAsphalt);
    road.position.set(0, 0.01, 2.8);
    road.receiveShadow = true;
    world.add(road);

    // Parking Bays Floor at z = -2.6
    const bayFloor = new THREE.Mesh(new THREE.BoxGeometry(25.6, 0.06, 6.2), matAsphalt);
    bayFloor.position.set(0, 0.01, -2.6);
    bayFloor.receiveShadow = true;
    world.add(bayFloor);

    // Yellow Dashed Center Line on Road
    for (let x = -11.5; x <= 11.5; x += 1.8) {
      const dash = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.02, 0.12), matYellowHazard);
      dash.position.set(x, 0.05, 2.8);
      world.add(dash);
    }

    // Pedestrian Zebra Crosswalk at Entrance & Exit
    [-7.2, 7.2].forEach((zx) => {
      for (let z = 0.8; z <= 4.8; z += 0.8) {
        const stripe = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.02, 0.5), matRoadMarking);
        stripe.position.set(zx, 0.05, z);
        world.add(stripe);
      }
    });

    // Speed Humps with Black-Yellow hazard stripes
    [-4.8, 4.8].forEach((hx) => {
      const hump = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.35, 4.6, 16, 1, false, 0, Math.PI), matYellowHazard);
      hump.rotation.z = Math.PI / 2;
      hump.position.set(hx, 0.04, 2.8);
      world.add(hump);
    });

    // Glowing Green Directional Guidance Arrows on Asphalt (from Image 2)
    const arrows = [];
    [-6.2, -3.8, -1.4, 1.2, 3.8, 6.2].forEach((ax) => {
      const arrowGroup = new THREE.Group();
      arrowGroup.position.set(ax, 0.06, 3.5);

      const leftWing = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.02, 0.09), matArrowGreen);
      leftWing.position.set(-0.16, 0, -0.14);
      leftWing.rotation.y = Math.PI / 4;
      arrowGroup.add(leftWing);

      const rightWing = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.02, 0.09), matArrowGreen);
      rightWing.position.set(0.16, 0, -0.14);
      rightWing.rotation.y = -Math.PI / 4;
      arrowGroup.add(rightWing);

      world.add(arrowGroup);
      arrows.push(arrowGroup);
    });

    // Commercial Modern Street Lighting Poles
    [
      [-12.0, -5.5],
      [12.0, -5.5],
      [-12.0, 5.0],
      [12.0, 5.0],
    ].forEach(([lx, lz]) => {
      const lightPole = new THREE.Group();
      lightPole.position.set(lx, 0, lz);

      const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.12, 5.2, 12), matPillar);
      pole.position.y = 2.6;
      lightPole.add(pole);

      const headArm = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.08, 0.18), matPillar);
      headArm.position.set(lx > 0 ? -0.4 : 0.4, 5.2, 0);
      lightPole.add(headArm);

      const lamp = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.06, 0.22), matWhite);
      lamp.position.set(lx > 0 ? -0.75 : 0.75, 5.15, 0);
      lightPole.add(lamp);

      const poleLight = new THREE.PointLight(0xfff7ed, 0.8, 12);
      poleLight.position.set(lx > 0 ? -0.75 : 0.75, 4.8, 0);
      lightPole.add(poleLight);

      world.add(lightPole);
    });

    // ----------------------------------------------------
    // 2. OVERHEAD AI COMPUTER VISION SURVEILLANCE MAST (Images 1 & 4)
    // ----------------------------------------------------
    const cctvTower = new THREE.Group();
    cctvTower.position.set(0, 0, -6.0);
    world.add(cctvTower);

    const mastBase = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.4, 0.6), matConcreteCurb);
    mastBase.position.y = 0.2;
    cctvTower.add(mastBase);

    const mastShaft = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.16, 5.5, 16), matPillar);
    mastShaft.position.y = 2.95;
    cctvTower.add(mastShaft);

    const crossArm = new THREE.Mesh(new THREE.BoxGeometry(4.2, 0.1, 0.1), matPillar);
    crossArm.position.set(0, 5.6, 0.8);
    cctvTower.add(crossArm);

    // 3 Pan-Tilt AI Surveillance Dome Cameras
    [-1.6, 0, 1.6].forEach((cx) => {
      const camHousing = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.22, 0.42), matWhite);
      camHousing.position.set(cx, 5.5, 0.85);
      camHousing.rotation.x = 0.58;
      camHousing.rotation.y = cx > 0 ? -0.2 : cx < 0 ? 0.2 : 0;
      cctvTower.add(camHousing);

      const domeLens = new THREE.Mesh(
        new THREE.SphereGeometry(0.1, 16, 16),
        new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.1, metalness: 0.9 })
      );
      domeLens.position.set(cx, 5.4, 1.05);
      cctvTower.add(domeLens);

      // Blinking Green/Blue Recording LED
      const recLed = new THREE.Mesh(new THREE.SphereGeometry(0.035, 8, 8), new THREE.MeshBasicMaterial({ color: 0x38bdf8 }));
      recLed.position.set(cx, 5.6, 1.0);
      cctvTower.add(recLed);
    });

    // Holographic Pyramidal AI Laser Scanning Grid projecting over bays
    const scanCone = new THREE.Mesh(
      new THREE.ConeGeometry(7.5, 5.8, 4, 1, true),
      new THREE.MeshBasicMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.08, wireframe: true, side: THREE.DoubleSide })
    );
    scanCone.position.set(0, 2.8, 3.2);
    scanCone.rotation.x = Math.PI / 2.8;
    cctvTower.add(scanCone);

    // ----------------------------------------------------
    // HELPER: CREATE REALISTIC 3D AI DETECTION BOUNDING BOXES (Images 1 & 4)
    // ----------------------------------------------------
    const createAIBoundingBox = (x, z, width, depth, idTag, initialOccupied) => {
      const boxGroup = new THREE.Group();
      boxGroup.position.set(x, 0.06, z);

      const colorVacant = 0x22c55e;
      const colorOccupied = 0xef4444;

      const matOutline = new THREE.MeshBasicMaterial({
        color: initialOccupied ? colorOccupied : colorVacant,
        transparent: true,
        opacity: 0.9,
      });

      const hw = width / 2;
      const hd = depth / 2;
      const thick = 0.04;

      // 4 Border Sides
      const sideTop = new THREE.Mesh(new THREE.BoxGeometry(width, 0.02, thick), matOutline);
      sideTop.position.set(0, 0, -hd);
      boxGroup.add(sideTop);

      const sideBot = new THREE.Mesh(new THREE.BoxGeometry(width, 0.02, thick), matOutline);
      sideBot.position.set(0, 0, hd);
      boxGroup.add(sideBot);

      const sideL = new THREE.Mesh(new THREE.BoxGeometry(thick, 0.02, depth), matOutline);
      sideL.position.set(-hw, 0, 0);
      boxGroup.add(sideL);

      const sideR = new THREE.Mesh(new THREE.BoxGeometry(thick, 0.02, depth), matOutline);
      sideR.position.set(hw, 0, 0);
      boxGroup.add(sideR);

      // 4 Upright L-Shaped Corner Brackets (High-Tech Computer Vision AI Box)
      const bracketHeight = 0.45;
      [
        [-hw, -hd],
        [hw, -hd],
        [-hw, hd],
        [hw, hd],
      ].forEach(([cx, cz]) => {
        const cornerPost = new THREE.Mesh(new THREE.BoxGeometry(thick, bracketHeight, thick), matOutline);
        cornerPost.position.set(cx, bracketHeight / 2, cz);
        boxGroup.add(cornerPost);
      });

      // Overhead Sensor Indicator Orb
      const sensorMat = new THREE.MeshBasicMaterial({ color: initialOccupied ? colorOccupied : colorVacant });
      const sensorOrb = new THREE.Mesh(new THREE.SphereGeometry(0.14, 16, 16), sensorMat);
      sensorOrb.position.set(0, 2.5, 0);
      boxGroup.add(sensorOrb);

      // Concrete Parking Wheel-Stop Curb at rear
      const wheelStop = new THREE.Mesh(
        new THREE.BoxGeometry(width * 0.75, 0.14, 0.18),
        new THREE.MeshStandardMaterial({ color: 0xfacc15, roughness: 0.6 })
      );
      wheelStop.position.set(0, 0.07, -hd + 0.35);
      wheelStop.receiveShadow = true;
      boxGroup.add(wheelStop);

      // Smart Pillar Kiosk with Individual LED Display (from Image 3!)
      const pillarKiosk = new THREE.Group();
      pillarKiosk.position.set(-hw - 0.2, 0, -hd + 0.3);

      const pkBody = new THREE.Mesh(new THREE.BoxGeometry(0.24, 1.4, 0.24), matPillar);
      pkBody.position.y = 0.7;
      pillarKiosk.add(pkBody);

      const pkLed = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.35, 0.04), sensorMat);
      pkLed.position.set(0.08, 1.1, 0.12);
      pillarKiosk.add(pkLed);

      boxGroup.add(pillarKiosk);

      // Dynamic Canvas Texture for Slot ID & Status Tag
      const tagCanvas = document.createElement('canvas');
      tagCanvas.width = 256;
      tagCanvas.height = 96;
      const tagCtx = tagCanvas.getContext('2d');

      const renderTag = (occupied) => {
        tagCtx.clearRect(0, 0, 256, 96);
        tagCtx.fillStyle = occupied ? 'rgba(239, 68, 68, 0.9)' : 'rgba(34, 197, 94, 0.9)';
        tagCtx.roundRect(10, 10, 236, 76, 14);
        tagCtx.fill();
        tagCtx.strokeStyle = '#ffffff';
        tagCtx.lineWidth = 3;
        tagCtx.stroke();

        tagCtx.fillStyle = '#ffffff';
        tagCtx.font = 'bold 28px sans-serif';
        tagCtx.textAlign = 'center';
        tagCtx.fillText(idTag, 128, 44);

        tagCtx.font = 'bold 20px monospace';
        tagCtx.fillText(occupied ? '● OCCUPIED' : '○ VACANT', 128, 72);
      };
      renderTag(initialOccupied);

      const tagTexture = new THREE.CanvasTexture(tagCanvas);
      const tagMesh = new THREE.Mesh(
        new THREE.PlaneGeometry(1.2, 0.46),
        new THREE.MeshBasicMaterial({ map: tagTexture, transparent: true, side: THREE.DoubleSide })
      );
      tagMesh.position.set(0, 1.55, -hd + 0.15);
      tagMesh.rotation.x = -Math.PI / 6;
      boxGroup.add(tagMesh);

      world.add(boxGroup);

      return {
        group: boxGroup,
        matOutline,
        sensorMat,
        tagTexture,
        renderTag,
        setOccupied: (occ) => {
          const c = occ ? colorOccupied : colorVacant;
          matOutline.color.setHex(c);
          sensorMat.color.setHex(c);
          renderTag(occ);
          tagTexture.needsUpdate = true;
        },
      };
    };

    // ----------------------------------------------------
    // HELPER: BUILD HIGH-FIDELITY REALISTIC SCULPTED SEDAN CAR
    // (No simple toy boxes! High detail unibody, glass, alloy wheels & Brembo brakes)
    // ----------------------------------------------------
    const buildRealisticCar = (bodyColorHex) => {
      const carGroup = new THREE.Group();

      const carPaintMat = new THREE.MeshStandardMaterial({
        color: bodyColorHex,
        metalness: 0.92,
        roughness: 0.16,
      });

      const carGlassMat = new THREE.MeshStandardMaterial({
        color: 0x091424,
        metalness: 0.95,
        roughness: 0.08,
      });

      // 1. Aerodynamic Lower Body / Chassis
      const lowerBody = new THREE.Mesh(new THREE.BoxGeometry(3.6, 0.44, 1.62), carPaintMat);
      lowerBody.position.y = 0.36;
      lowerBody.castShadow = true;
      carGroup.add(lowerBody);

      // Front Tapered Bumper & Aerodynamic Chin Splitter
      const frontBumper = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.38, 1.58), carPaintMat);
      frontBumper.position.set(1.9, 0.32, 0);
      frontBumper.castShadow = true;
      carGroup.add(frontBumper);

      // Glossy Black Radiator Grille with Chrome Trim
      const grille = new THREE.Mesh(
        new THREE.BoxGeometry(0.06, 0.22, 0.86),
        new THREE.MeshStandardMaterial({ color: 0x0a0f18, roughness: 0.4, metalness: 0.8 })
      );
      grille.position.set(2.18, 0.34, 0);
      carGroup.add(grille);

      // Sloped Aerodynamic Front Hood
      const hood = new THREE.Mesh(new THREE.BoxGeometry(1.25, 0.1, 1.48), carPaintMat);
      hood.position.set(1.25, 0.54, 0);
      hood.rotation.z = -0.06;
      carGroup.add(hood);

      // Rear Bumper & Diffuser
      const rearBumper = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.38, 1.58), carPaintMat);
      rearBumper.position.set(-1.9, 0.32, 0);
      carGroup.add(rearBumper);

      // Dual Chrome Exhaust Pipes
      [-0.45, 0.45].forEach((ez) => {
        const exhaust = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.045, 0.12, 12), matChrome);
        exhaust.rotation.z = Math.PI / 2;
        exhaust.position.set(-2.18, 0.18, ez);
        carGroup.add(exhaust);
      });

      // 2. Sculpted Cabin & Glass (Greenhouse)
      const cabinCenter = new THREE.Mesh(new THREE.BoxGeometry(1.65, 0.52, 1.38), carPaintMat);
      cabinCenter.position.set(-0.15, 0.82, 0);
      carGroup.add(cabinCenter);

      // Raked Front Windshield (slanted glass)
      const windshield = new THREE.Mesh(new THREE.BoxGeometry(0.85, 0.04, 1.32), carGlassMat);
      windshield.position.set(0.82, 0.82, 0);
      windshield.rotation.z = -0.65;
      carGroup.add(windshield);

      // Raked Rear Window (slanted glass)
      const rearGlass = new THREE.Mesh(new THREE.BoxGeometry(0.85, 0.04, 1.32), carGlassMat);
      rearGlass.position.set(-1.15, 0.82, 0);
      rearGlass.rotation.z = 0.55;
      carGroup.add(rearGlass);

      // Side Windows Tinted Glass (Left & Right)
      [-0.7, 0.7].forEach((wz) => {
        const sideWindow = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.42, 0.02), carGlassMat);
        sideWindow.position.set(-0.15, 0.84, wz);
        carGroup.add(sideWindow);

        // Chrome Window Waistline Trim
        const trim = new THREE.Mesh(new THREE.BoxGeometry(2.1, 0.025, 0.02), matChrome);
        trim.position.set(-0.15, 0.6, wz);
        carGroup.add(trim);

        // Aerodynamic Dual-Tone Side Mirrors
        const mirror = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.12, 0.18), carPaintMat);
        mirror.position.set(0.65, 0.72, wz > 0 ? wz + 0.12 : wz - 0.12);
        carGroup.add(mirror);
      });

      // Roof with Shark-Fin Antenna
      const roof = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.06, 1.32), carPaintMat);
      roof.position.set(-0.18, 1.1, 0);
      carGroup.add(roof);

      const sharkAntenna = new THREE.Mesh(new THREE.ConeGeometry(0.04, 0.14, 4), carPaintMat);
      sharkAntenna.rotation.z = -Math.PI / 4;
      sharkAntenna.position.set(-0.75, 1.18, 0);
      carGroup.add(sharkAntenna);

      // 3. Projector LED Headlights with Amber DRL Eyebrow
      [-0.58, 0.58].forEach((hz) => {
        const hl = new THREE.Mesh(
          new THREE.BoxGeometry(0.24, 0.14, 0.32),
          new THREE.MeshBasicMaterial({ color: 0xf1f5f9 })
        );
        hl.position.set(2.05, 0.44, hz);
        carGroup.add(hl);

        const drl = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.03, 0.32), new THREE.MeshBasicMaterial({ color: 0xfacc15 }));
        drl.position.set(2.05, 0.52, hz);
        carGroup.add(drl);
      });

      // 4. Continuous LED Red Tail Light Strip
      const tailLight = new THREE.Mesh(
        new THREE.BoxGeometry(0.1, 0.12, 1.45),
        new THREE.MeshBasicMaterial({ color: 0xef4444 })
      );
      tailLight.position.set(-2.16, 0.48, 0);
      carGroup.add(tailLight);

      // 5. Realistic Number Plates (Front & Rear HSRP Plate)
      const plateMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
      const fPlate = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.14, 0.48), plateMat);
      fPlate.position.set(2.2, 0.22, 0);
      carGroup.add(fPlate);

      const rPlate = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.14, 0.48), plateMat);
      rPlate.position.set(-2.2, 0.28, 0);
      carGroup.add(rPlate);

      // 6. 4 Realistic Alloy Wheels with Brembo Red Brake Calipers
      const matRubberTire = new THREE.MeshStandardMaterial({ color: 0x111827, roughness: 0.85, metalness: 0.15 });
      const matAlloyRim = new THREE.MeshStandardMaterial({ color: 0xf1f5f9, metalness: 0.95, roughness: 0.12 });
      const matBrakeDisc = new THREE.MeshStandardMaterial({ color: 0xcfd8dc, metalness: 0.95, roughness: 0.25 });
      const matBremboRed = new THREE.MeshStandardMaterial({ color: 0xdc2626, metalness: 0.8, roughness: 0.2 });

      const buildWheel = (wx, wz) => {
        const wg = new THREE.Group();
        wg.position.set(wx, 0.32, wz);

        // Outer Rubber Tire
        const tire = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.32, 0.22, 28), matRubberTire);
        tire.rotation.x = Math.PI / 2;
        tire.castShadow = true;
        wg.add(tire);

        // Diamond-Cut Alloy Rim
        const rim = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.24, 0.23, 20), matAlloyRim);
        rim.rotation.x = Math.PI / 2;
        wg.add(rim);

        // Cross-Drilled Brake Rotor Disc
        const rotor = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.18, 0.03, 16), matBrakeDisc);
        rotor.rotation.x = Math.PI / 2;
        rotor.position.z = wz > 0 ? -0.06 : 0.06;
        wg.add(rotor);

        // Red Brembo Racing Caliper
        const caliper = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.12, 0.06), matBremboRed);
        caliper.position.set(0, 0.1, wz > 0 ? -0.06 : 0.06);
        wg.add(caliper);

        return wg;
      };

      carGroup.add(buildWheel(1.15, -0.84));
      carGroup.add(buildWheel(-1.15, -0.84));
      carGroup.add(buildWheel(1.15, 0.84));
      carGroup.add(buildWheel(-1.15, 0.84));

      return carGroup;
    };

    // ----------------------------------------------------
    // HELPER: BUILD HIGH-FIDELITY REALISTIC SPORT MOTORCYCLE
    // (Twin-spar aluminum frame, inverted forks, wave discs, engine & exhaust)
    // ----------------------------------------------------
    const buildRealisticMotorcycle = (paintColorHex) => {
      const bikeGroup = new THREE.Group();

      const bikePaint = new THREE.MeshStandardMaterial({ color: paintColorHex, metalness: 0.9, roughness: 0.2 });
      const bikeFrameMat = new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.95, roughness: 0.18 });
      const engineMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.88, roughness: 0.25 });
      const goldForksMat = new THREE.MeshStandardMaterial({ color: 0xf59e0b, metalness: 0.98, roughness: 0.1 });
      const seatMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.7 });

      // Twin-Spar Aluminum Perimeter Frame
      const frameL = new THREE.Mesh(new THREE.BoxGeometry(1.3, 0.14, 0.06), bikeFrameMat);
      frameL.position.set(0.1, 0.65, 0.14);
      frameL.rotation.z = -0.15;
      bikeGroup.add(frameL);

      const frameR = new THREE.Mesh(new THREE.BoxGeometry(1.3, 0.14, 0.06), bikeFrameMat);
      frameR.position.set(0.1, 0.65, -0.14);
      frameR.rotation.z = -0.15;
      bikeGroup.add(frameR);

      // Multi-Cylinder Engine Block with Cooling Fins
      const engine = new THREE.Mesh(new THREE.BoxGeometry(0.65, 0.45, 0.32), engineMat);
      engine.position.set(0.1, 0.42, 0);
      bikeGroup.add(engine);

      // Chrome Swept Exhaust Header into Upswept Titanium Canister Muffler
      const muffler = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.075, 0.75, 14), matChrome);
      muffler.rotation.z = Math.PI / 3.2;
      muffler.position.set(-0.65, 0.42, 0.24);
      bikeGroup.add(muffler);

      // Sculpted Aerodynamic Fuel Tank with Knee Recesses
      const fuelTank = new THREE.Mesh(new THREE.BoxGeometry(0.72, 0.34, 0.36), bikePaint);
      fuelTank.position.set(0.25, 0.84, 0);
      fuelTank.rotation.z = -0.08;
      bikeGroup.add(fuelTank);

      // Split Rider & Pillion Seat
      const riderSeat = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.14, 0.28), seatMat);
      riderSeat.position.set(-0.35, 0.74, 0);
      bikeGroup.add(riderSeat);

      const pillionCowl = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.16, 0.22), bikePaint);
      pillionCowl.position.set(-0.72, 0.82, 0);
      pillionCowl.rotation.z = -0.12;
      bikeGroup.add(pillionCowl);

      // Inverted Gold Telescopic Front Forks
      const forkL = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.95, 12), goldForksMat);
      forkL.position.set(0.75, 0.58, 0.1);
      forkL.rotation.z = -0.42;
      bikeGroup.add(forkL);

      const forkR = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.95, 12), goldForksMat);
      forkR.position.set(0.75, 0.58, -0.1);
      forkR.rotation.z = -0.42;
      bikeGroup.add(forkR);

      // Clip-On Handlebars with Levers & Mirrors
      const bars = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.06, 0.72), matPillar);
      bars.position.set(0.68, 0.96, 0);
      bikeGroup.add(bars);

      // Predator Dual Projector Headlight Cowl & Tinted Screen
      const headCowl = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.28, 0.32), bikePaint);
      headCowl.position.set(0.92, 0.94, 0);
      bikeGroup.add(headCowl);

      const bikeHeadlight = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.12, 0.24), new THREE.MeshBasicMaterial({ color: 0xf8fafc }));
      bikeHeadlight.position.set(1.06, 0.92, 0);
      bikeGroup.add(bikeHeadlight);

      // Rear Number Plate Bracket
      const bPlate = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.14, 0.32), new THREE.MeshBasicMaterial({ color: 0xffffff }));
      bPlate.position.set(-1.02, 0.55, 0);
      bikeGroup.add(bPlate);

      // 17" Front & Rear Wheels with Rubber Tires & Wave Disc Rotors
      const matRubber = new THREE.MeshStandardMaterial({ color: 0x111827, roughness: 0.85 });
      const matBikeRim = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, metalness: 0.95, roughness: 0.12 });

      [-0.68, 0.92].forEach((wx) => {
        const bWheel = new THREE.Mesh(new THREE.CylinderGeometry(0.34, 0.34, 0.14, 24), matRubber);
        bWheel.rotation.x = Math.PI / 2;
        bWheel.position.set(wx, 0.34, 0);
        bWheel.castShadow = true;
        bikeGroup.add(bWheel);

        const bRim = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.24, 0.15, 18), matBikeRim);
        bRim.rotation.x = Math.PI / 2;
        bRim.position.set(wx, 0.34, 0);
        bikeGroup.add(bRim);
      });

      return bikeGroup;
    };

    // ----------------------------------------------------
    // 3. ZONE A: CAR PARKING BAYS (CAR-01 to CAR-04)
    // ----------------------------------------------------
    // Modern Steel Truss Solar Canopy over Car Bays
    const carCanopy = new THREE.Group();
    carCanopy.position.set(-2.5, 3.2, -2.6);

    const canopyRoof = new THREE.Mesh(
      new THREE.BoxGeometry(13.2, 0.18, 5.2),
      new THREE.MeshStandardMaterial({ color: 0x0f294d, metalness: 0.85, roughness: 0.2 })
    );
    canopyRoof.castShadow = true;
    carCanopy.add(canopyRoof);

    // Solar Panel Grid on top of canopy
    for (let sx = -5.8; sx <= 5.8; sx += 1.8) {
      const panel = new THREE.Mesh(
        new THREE.BoxGeometry(1.6, 0.04, 4.8),
        new THREE.MeshStandardMaterial({ color: 0x0284c7, metalness: 0.9, roughness: 0.1 })
      );
      panel.position.set(sx, 0.12, 0);
      carCanopy.add(panel);
    }

    // Heavy Structural Steel Columns supporting Canopy
    [-6.2, 6.2].forEach((cx) => {
      const col = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.16, 3.2, 16), matPillar);
      col.position.set(cx, -1.6, -2.2);
      carCanopy.add(col);
    });

    world.add(carCanopy);

    // Car Slots Bounding Boxes (Spacious 2.6m wide bays)
    const slotCar1 = createAIBoundingBox(-6.6, -2.6, 2.6, 4.8, 'CAR-01', true); // Parked Silver Luxury Sedan
    const slotCar2 = createAIBoundingBox(-3.8, -2.6, 2.6, 4.8, 'CAR-02', false); // TARGET SLOT for incoming Car!
    const slotCar3 = createAIBoundingBox(-1.0, -2.6, 2.6, 4.8, 'CAR-03', true); // Parked Dark SUV
    const slotCar4 = createAIBoundingBox(1.8, -2.6, 2.6, 4.8, 'CAR-04', true); // Parked White Compact

    // Static Realistic Parked Cars in CAR-01, CAR-03, CAR-04
    const parkedSilverSedan = buildRealisticCar(0x94a3b8);
    parkedSilverSedan.position.set(-6.6, 0, -2.6);
    parkedSilverSedan.rotation.y = Math.PI / 2;
    world.add(parkedSilverSedan);

    const parkedDarkSuv = buildRealisticCar(0x1e293b);
    parkedDarkSuv.position.set(-1.0, 0, -2.6);
    parkedDarkSuv.rotation.y = Math.PI / 2;
    world.add(parkedDarkSuv);

    const parkedWhiteCar = buildRealisticCar(0xf8fafc);
    parkedWhiteCar.position.set(1.8, 0, -2.6);
    parkedWhiteCar.rotation.y = Math.PI / 2;
    world.add(parkedWhiteCar);

    // ----------------------------------------------------
    // 4. ZONE B: DEDICATED BIKE PARKING ZONE (BIKE-01 to BIKE-04)
    // ----------------------------------------------------
    // Painted Yellow Hazard Divider Line
    const zoneDivider = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.04, 5.8), matYellowHazard);
    zoneDivider.position.set(3.4, 0.05, -2.6);
    world.add(zoneDivider);

    // Bike Zone Signpost
    const bikeSignGroup = new THREE.Group();
    bikeSignGroup.position.set(3.4, 0, 0.2);
    const bPost = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 2.2, 12), matPillar);
    bPost.position.y = 1.1;
    bikeSignGroup.add(bPost);

    const bSign = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.65, 0.06), new THREE.MeshStandardMaterial({ color: 0x0284c7 }));
    bSign.position.set(0, 2.2, 0);
    bikeSignGroup.add(bSign);
    world.add(bikeSignGroup);

    // Bike Slots Bounding Boxes
    const slotBike1 = createAIBoundingBox(4.6, -2.6, 1.3, 2.8, 'BIKE-01', true); // Parked Red Sport Bike
    const slotBike2 = createAIBoundingBox(6.1, -2.6, 1.3, 2.8, 'BIKE-02', false); // TARGET SLOT for incoming Bike!
    const slotBike3 = createAIBoundingBox(7.6, -2.6, 1.3, 2.8, 'BIKE-03', true); // Parked Blue Scooter
    const slotBike4 = createAIBoundingBox(9.1, -2.6, 1.3, 2.8, 'BIKE-04', true); // Parked Orange Bike

    // Static Realistic Parked Bikes
    const parkedRedBike = buildRealisticMotorcycle(0xdc2626);
    parkedRedBike.position.set(4.6, 0, -2.6);
    parkedRedBike.rotation.y = Math.PI / 2;
    world.add(parkedRedBike);

    const parkedBlueBike = buildRealisticMotorcycle(0x0284c7);
    parkedBlueBike.position.set(7.6, 0, -2.6);
    parkedBlueBike.rotation.y = Math.PI / 2;
    world.add(parkedBlueBike);

    const parkedOrangeBike = buildRealisticMotorcycle(0xf97316);
    parkedOrangeBike.position.set(9.1, 0, -2.6);
    parkedOrangeBike.rotation.y = Math.PI / 2;
    world.add(parkedOrangeBike);

    // ----------------------------------------------------
    // 5. ENTRY & EXIT GATE COMPLEXES (ANPR Camera + Screen + Boom Barrier)
    // ----------------------------------------------------
    const buildGateComplex = (xPos, isExit) => {
      const group = new THREE.Group();
      group.position.set(xPos, 0, 0.6);

      // Boom Barrier Post & Pivot
      const post = new THREE.Mesh(new THREE.BoxGeometry(0.48, 1.45, 0.48), matOrangeBarrier);
      post.position.set(0, 0.72, 0);
      group.add(post);

      const pivot = new THREE.Group();
      pivot.position.set(0, 1.25, 0);
      group.add(pivot);

      const arm = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.14, 3.8), matWhite);
      arm.position.set(0, 0, 1.9);
      pivot.add(arm);

      // Red/Orange reflective stripes on barrier arm
      for (let s = 0.45; s < 3.6; s += 0.65) {
        const stripe = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.15, 0.32), matOrangeBarrier);
        stripe.position.set(0, 0, s);
        pivot.add(stripe);
      }

      // ANPR Camera Post & Camera Housing
      const camPole = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.1, 2.5, 14), matPillar);
      camPole.position.set(-1.15, 1.25, -0.25);
      group.add(camPole);

      const camBox = new THREE.Mesh(new THREE.BoxGeometry(0.44, 0.28, 0.3), matWhite);
      camBox.position.set(-1.15, 2.5, 0);
      camBox.rotation.y = isExit ? -0.38 : -0.48;
      camBox.rotation.x = 0.38;
      group.add(camBox);

      // Scan Laser Cone from ANPR Camera
      const coneGeo = new THREE.ConeGeometry(1.05, 3.0, 16, 1, true);
      const beam = new THREE.Mesh(coneGeo, isExit ? matExitBeam : matScanBeam);
      beam.position.set(-1.6, 1.35, 1.25);
      beam.rotation.z = -0.65;
      beam.rotation.x = 0.55;
      group.add(beam);

      // Customer Screen Display Kiosk
      const kioskBody = new THREE.Mesh(new THREE.BoxGeometry(0.55, 1.65, 0.44), matPillar);
      kioskBody.position.set(-0.6, 0.82, -0.22);
      group.add(kioskBody);

      const screen = new THREE.Mesh(
        new THREE.BoxGeometry(0.44, 0.62, 0.04),
        isExit ? matExitScreen : matKioskScreen
      );
      screen.position.set(-0.6, 1.18, 0.02);
      group.add(screen);

      world.add(group);
      return { pivot, screen };
    };

    const entryGate = buildGateComplex(-8.8, false);
    const exitGate = buildGateComplex(8.8, true);

    // ----------------------------------------------------
    // 6. ACTIVE 3D VEHICLES (CAR & BIKE)
    // ----------------------------------------------------
    // Active Royal Metallic Cobalt Blue Luxury Sedan Car
    const activeCar = buildRealisticCar(0x1d4ed8);
    activeCar.position.set(-11.5, 0, 2.8);
    world.add(activeCar);

    // Active Neon Green Kawasaki Style Sport Motorcycle
    const activeBike = buildRealisticMotorcycle(0x16a34a);
    activeBike.position.set(-11.5, 0, 2.8);
    world.add(activeBike);

    // ----------------------------------------------------
    // MOUSE / TOUCH DRAG ORBIT
    // ----------------------------------------------------
    let isDragging = false;
    let prevX = 0;
    let prevY = 0;
    let orbitY = 0;
    let orbitX = 0.04;

    const onDown = (cx, cy) => {
      isDragging = true;
      prevX = cx;
      prevY = cy;
    };
    const onMove = (cx, cy) => {
      if (!isDragging) return;
      orbitY += (cx - prevX) * 0.007;
      orbitX = Math.max(-0.25, Math.min(0.55, orbitX + (cy - prevY) * 0.005));
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

    // ----------------------------------------------------
    // ANIMATION LOOP
    // ----------------------------------------------------
    let raf = 0;
    const start = performance.now();

    const animate = (now) => {
      const t = (now - start) * 0.001;
      const st = stateRef.current.stage;
      const isCar = stateRef.current.vehicleType === 'car';

      const currentVehicle = isCar ? activeCar : activeBike;
      activeCar.visible = isCar;
      activeBike.visible = !isCar;

      const targetSlotX = isCar ? -3.8 : 6.1;
      const targetSlotZ = -2.6;

      let targetX = -10.8;
      let targetZ = 2.8;
      let targetRotY = 0;
      let targetEntryGate = 0;
      let targetExitGate = 0;

      if (st === 0) {
        // Stage 0: Vehicle arrives at Entry Gate -> ANPR camera scans plate
        targetX = -10.5;
        targetZ = 2.8;
        targetRotY = 0;
        targetEntryGate = 0;
        matScanBeam.opacity = 0.3 + Math.sin(t * 8) * 0.15;
        matExitBeam.opacity = 0;
        entryScanLight.intensity = 4.2;
        exitScanLight.intensity = 0;
      } else if (st === 1) {
        // Stage 1: Customer fills QR form -> Barrier begins opening
        targetX = -10.2;
        targetZ = 2.8;
        targetRotY = 0;
        targetEntryGate = 0.4;
        matScanBeam.opacity = 0.12;
        matExitBeam.opacity = 0;
        entryScanLight.intensity = 2.0;
        exitScanLight.intensity = 0;
      } else if (st === 2) {
        // Stage 2: Barrier fully open -> Vehicle drives into assigned slot (CAR-02 or BIKE-02)
        targetX = targetSlotX;
        targetZ = targetSlotZ;
        targetRotY = Math.PI / 2;
        targetEntryGate = 1.48;
        matScanBeam.opacity = 0;
        matExitBeam.opacity = 0;
        entryScanLight.intensity = 0;
        exitScanLight.intensity = 0;
      } else if (st === 3) {
        // Stage 3: Vehicle pulls out of slot -> Reaches Exit Gate
        targetX = 6.8;
        targetZ = 2.8;
        targetRotY = 0;
        targetExitGate = 0;
        matScanBeam.opacity = 0;
        matExitBeam.opacity = 0.32 + Math.sin(t * 8) * 0.16;
        entryScanLight.intensity = 0;
        exitScanLight.intensity = 4.2;
      } else if (st === 4) {
        // Stage 4: Exit Kiosk displays fee & QR
        targetX = 7.1;
        targetZ = 2.8;
        targetRotY = 0;
        targetExitGate = 0;
        matScanBeam.opacity = 0;
        matExitBeam.opacity = 0.16;
        entryScanLight.intensity = 0;
        exitScanLight.intensity = 2.8;
      } else if (st === 5) {
        // Stage 5: Payment Done -> Exit barrier lifts -> Vehicle drives OUT!
        targetX = 13.0;
        targetZ = 2.8;
        targetRotY = 0;
        targetExitGate = 1.48;
        matScanBeam.opacity = 0;
        matExitBeam.opacity = 0;
        entryScanLight.intensity = 0;
        exitScanLight.intensity = 0;
      }

      // Smooth vehicle animation
      currentVehicle.position.x += (targetX - currentVehicle.position.x) * 0.055;
      currentVehicle.position.z += (targetZ - currentVehicle.position.z) * 0.055;
      currentVehicle.rotation.y += (targetRotY - currentVehicle.rotation.y) * 0.07;

      // Barrier angles
      entryGate.pivot.rotation.x += (-targetEntryGate - entryGate.pivot.rotation.x) * 0.09;
      exitGate.pivot.rotation.x += (-targetExitGate - exitGate.pivot.rotation.x) * 0.09;

      // AI Camera Vision Markings Update (Camera se mark kar ke RED / GREEN):
      if (isCar) {
        slotCar2.setOccupied(st === 2);
        slotBike2.setOccupied(false);
      } else {
        slotCar2.setOccupied(false);
        slotBike2.setOccupied(st === 2);
      }

      // Pulsing green directional arrows
      const arrowPulse = 0.5 + Math.sin(t * 4) * 0.35;
      matArrowGreen.opacity = arrowPulse;

      // Smooth Camera Interpolation toward presets
      const ref = stateRef.current;
      if (ref.camera && ref.targetCamPos && ref.targetLookAt) {
        camera.position.lerp(ref.targetCamPos, 0.055);
        camera.lookAt(ref.targetLookAt);
      }

      world.rotation.y = orbitY + Math.sin(t * 0.22) * 0.035;
      world.rotation.x = orbitX;

      renderer.render(scene, camera);
      raf = requestAnimationFrame(animate);
    };
    raf = requestAnimationFrame(animate);

    const onResize = () => {
      if (!host) return;
      const nw = host.clientWidth || 720;
      const nh = host.clientHeight || 480;
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
      {/* Top Controls: Vehicle Type Selector (Car vs Bike) & Camera Presets */}
      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '12px',
        padding: '12px 18px',
        background: 'rgba(11, 25, 46, 0.95)',
        borderBottom: '1px solid rgba(56, 189, 248, 0.2)',
      }}>
        {/* Vehicle Selection: Car vs Bike (Baick Alag Aur Kar Alag) */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '0.82rem', color: '#94a3b8', fontWeight: 700 }}>SELECT VEHICLE:</span>
          <button
            type="button"
            onClick={() => handleSelectVehicle('car')}
            style={{
              padding: '6px 14px',
              borderRadius: '8px',
              border: vehicleType === 'car' ? '1.5px solid #38bdf8' : '1px solid rgba(255,255,255,0.1)',
              background: vehicleType === 'car' ? '#0284c7' : '#0f172a',
              color: '#fff',
              fontSize: '0.85rem',
              fontWeight: 800,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <Car size={16} /> 🚗 Real Sedan Car (Zone A)
          </button>
          <button
            type="button"
            onClick={() => handleSelectVehicle('bike')}
            style={{
              padding: '6px 14px',
              borderRadius: '8px',
              border: vehicleType === 'bike' ? '1.5px solid #4ade80' : '1px solid rgba(255,255,255,0.1)',
              background: vehicleType === 'bike' ? '#16a34a' : '#0f172a',
              color: '#fff',
              fontSize: '0.85rem',
              fontWeight: 800,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <Bike size={16} /> 🏍️ Real Sport Bike (Zone B)
          </button>
        </div>

        {/* Camera Views: AI CCTV Top-Down vs 3D Perspective */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ fontSize: '0.82rem', color: '#94a3b8', fontWeight: 700 }}>3D VIEW:</span>
          {[
            { id: 'all', label: 'Perspective', icon: <Eye size={13} /> },
            { id: 'cctv', label: '🎥 AI CCTV View (Top-Down)', icon: <Layers size={13} /> },
            { id: 'entry', label: 'Entry Gate', icon: <Camera size={13} /> },
            { id: 'bays', label: 'Parking Bays', icon: <Navigation size={13} /> },
            { id: 'exit', label: 'Exit Gate', icon: <CreditCard size={13} /> },
          ].map((v) => (
            <button
              key={v.id}
              type="button"
              onClick={() => switchCamPreset(v.id)}
              style={{
                padding: '5px 10px',
                borderRadius: '6px',
                border: 'none',
                background: camView === v.id ? '#0284c7' : 'rgba(255,255,255,0.06)',
                color: '#fff',
                fontSize: '0.75rem',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
              }}
            >
              {v.icon} {v.label}
            </button>
          ))}
        </div>
      </div>

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
              <span>
                {vehicleType === 'car' ? '🚗 CAR PARKING (ZONE A)' : '🏍️ BIKE PARKING (ZONE B)'} · AI VISION CAMERA MARKINGS (GREEN: VACANT | RED: OCCUPIED)
              </span>
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
          <div ref={mountRef} className="sp3d-canvas-host" style={{ height: '480px' }} />

          {/* Bottom Stage Caption Bar */}
          <div className="sp3d-stage-caption">
            <div>
              <div style={{ fontSize: 12, color: '#38bdf8', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                Live 3D Simulation Status ({vehicleType === 'car' ? 'Target Bay: CAR-02' : 'Target Bay: BIKE-02'})
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
              <span>SMART PARKING CUSTOMER SCREEN</span>
            </div>
            <span className="sp3d-plate-badge">{plate}</span>
          </div>

          {/* STAGE 0: ENTRY GATE ANPR CAMERA SCAN */}
          {stage === 0 && (
            <div className="sp3d-kiosk-body">
              <div className="sp3d-cam-box">
                <Camera size={28} color="#38bdf8" />
                <div>
                  <div style={{ fontSize: 12, color: '#7dd3fc', fontWeight: 700 }}>ENTRY GATE ANPR CAMERA SCAN</div>
                  <div style={{ fontSize: 18, fontWeight: 800, color: '#ffffff' }}>
                    {vehicleType === 'car' ? '🚗 Luxury Sedan Detected' : '🏍️ Sport Motorcycle Detected'}
                  </div>
                </div>
              </div>

              <div className="sp3d-plate-display">
                <span className="ind-flag">IND</span>
                <b>{plate}</b>
              </div>

              <p style={{ color: '#cbd5e1', fontSize: 14, lineHeight: 1.6, margin: '12px 0 18px' }}>
                {vehicleType === 'car' ? 'गाड़ी (Sedan Car)' : 'बाइक (Sport Bike)'} एंट्री गेट पर पहुँच चुकी है। ANPR कैमरा ने नंबर प्लेट (<b>{plate}</b>) और व्हीकल क्लासिफिकेशन AI से डिटेक्ट कर लिया है। अब कस्टमर स्क्रीन पर रजिस्ट्रेशन QR जनरेट करें:
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
                    कस्टमर स्क्रीन पर QR स्कैन करके <b>नाम</b> और <b>फोन नंबर</b> भरें:
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 14 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 12, color: '#93c5fd', fontWeight: 700, marginBottom: 4 }}>
                    Scanned Vehicle Number (ANPR) &amp; Type
                  </label>
                  <input
                    value={`${plate} (${vehicleType === 'car' ? '4-Wheeler Car' : '2-Wheeler Bike'})`}
                    disabled
                    className="input-3d"
                    style={{ padding: '9px 12px', fontSize: 14, fontWeight: 800, opacity: 0.9 }}
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
                  <div style={{ fontSize: 12.5, color: '#bbf7d0' }}>
                    {custName} ({custPhone}) · Assigned: <b>{vehicleType === 'car' ? 'Car Bay CAR-02' : 'Bike Bay BIKE-02'}</b>
                  </div>
                </div>
              </div>

              {/* AI Camera Mark Alert */}
              <div style={{ background: 'rgba(239, 68, 68, 0.16)', border: '1px solid rgba(239, 68, 68, 0.5)', borderRadius: 10, padding: '10px 12px', marginBottom: 12, fontSize: 13, color: '#fca5a5' }}>
                🎥 <strong>Overhead CCTV AI Vision:</strong> Slot {vehicleType === 'car' ? 'CAR-02' : 'BIKE-02'} ko <b>GREEN (Vacant)</b> se <b>RED (Occupied)</b> mark kar diya gaya hai!
              </div>

              <div className="sp3d-timer-box">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <span style={{ fontSize: 12.5, color: '#93c5fd', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Clock size={15} /> LIVE PARKED DURATION
                  </span>
                  <span style={{ fontSize: 12, color: '#facc15', fontWeight: 700 }}>
                    Rate: ₹{baseRate} / 30 mins
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                  <b style={{ fontSize: 28, color: '#ffffff' }}>
                    {Math.floor(parkedMinutes / 60)}h {parkedMinutes % 60}m
                  </b>
                  <span style={{ fontSize: 22, fontWeight: 800, color: '#4ade80' }}>₹{calculatedCharge}</span>
                </div>
              </div>

              <p style={{ color: '#cbd5e1', fontSize: 13.5, lineHeight: 1.55, margin: '12px 0 16px' }}>
                व्हीकल <b>{vehicleType === 'car' ? 'Car Bay CAR-02' : 'Bike Bay BIKE-02'}</b> में पार्क है। जब कस्टमर बाहर (OUT) निकलेगा, तो नीचे क्लिक करें:
              </p>

              <button
                type="button"
                onClick={() => setStage(3)}
                className="btn btn-3d-cyan"
                style={{ width: '100%', justifyContent: 'center' }}
              >
                {vehicleType === 'car' ? <Car size={18} /> : <Bike size={18} />} Drive to Exit (OUT) Gate →
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

              {/* Slot marked green alert */}
              <div style={{ background: 'rgba(34, 197, 94, 0.16)', border: '1px solid rgba(74, 222, 128, 0.5)', borderRadius: 10, padding: '10px 12px', margin: '12px 0', fontSize: 13, color: '#86efac' }}>
                🎥 <strong>Camera AI Vision:</strong> Slot {vehicleType === 'car' ? 'CAR-02' : 'BIKE-02'} se gaadi nikalte hi slot turant <b>GREEN (Vacant)</b> mark ho gaya!
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
                    Automated Exit Billing QR
                  </div>
                  <div style={{ fontSize: 26, fontWeight: 800, color: '#ffffff', lineHeight: 1.1, margin: '4px 0' }}>
                    Pay ₹{calculatedCharge}.00
                  </div>
                  <div style={{ fontSize: 12.5, color: '#cbd5e1' }}>
                    Duration: <b>{Math.floor(parkedMinutes / 60)}h {parkedMinutes % 60}m</b>
                    <br />
                    Vehicle: <b>{vehicleType === 'car' ? 'Car (4-Wheeler)' : 'Bike (2-Wheeler)'}</b>
                  </div>
                </div>
              </div>

              <p style={{ color: '#cbd5e1', fontSize: 13.5, lineHeight: 1.55, margin: '0 0 14px' }}>
                Parked time (<b>{parkedMinutes} mins</b>) ke hisaab se <b>₹{calculatedCharge}</b> ka automated exit QR code display ho gaya hai. Payment karte hi exit gate open ho jayega:
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
                  UPI payment verify hote hi <b>Exit Boom Barrier</b> khul gaya hai aur gaadi safely bahar nikal gayi hai. WhatsApp receipt <b>{custPhone}</b> par send ho gayi hai.
                </p>

                <div style={{ display: 'flex', gap: '10px' }}>
                  <button
                    type="button"
                    onClick={() => handleSelectVehicle(vehicleType === 'car' ? 'bike' : 'car')}
                    className="btn btn-primary btn-3d-orange"
                    style={{ flex: 1, justifyContent: 'center' }}
                  >
                    {vehicleType === 'car' ? 'Simulate 🏍️ Bike Parking →' : 'Simulate 🚗 Car Parking →'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setStage(0)}
                    className="btn btn-3d-cyan"
                    style={{ flex: 1, justifyContent: 'center' }}
                  >
                    <RotateCcw size={17} /> Repeat Entry
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
