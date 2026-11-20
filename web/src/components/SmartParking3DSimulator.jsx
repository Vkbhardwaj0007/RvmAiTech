import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import {
  Camera, QrCode, UserCheck, Car, Clock, CreditCard,
  CheckCircle2, Play, RotateCcw, Sparkles, ShieldCheck, Smartphone,
  Eye, Bike, Navigation, Layers, ArrowRight,
} from 'lucide-react';

/**
 * 3D Smart Parking Twin with AI Camera Vision Markings
 * Features:
 * 1. AI Vision Camera Marking:
 *    - Overhead AI CCTV cameras monitoring all slots with dynamic 3D Bounding Boxes
 *    - Green Bounding Box = VACANT / EMPTY (with ID tag)
 *    - Red Bounding Box = OCCUPIED / VEHICLE DETECTED (with ID tag)
 * 2. Separate Zones for Car & Bike (4-Wheeler & 2-Wheeler):
 *    - Zone A: Wide Car Parking Bays (CAR-01, CAR-02, CAR-03) with canopy & sensors
 *    - Zone B: Dedicated Bike Parking Bays (BIKE-01, BIKE-02, BIKE-03) with motorcycle lane
 * 3. Complete 6-Step 3D Animated Entry & Exit Workflow:
 *    - Step 1: Vehicle approaches Entry Gate -> ANPR camera scans plate & classifies vehicle
 *    - Step 2: Customer Screen generates QR -> Fill Name & Mobile form -> Registered
 *    - Step 3: Entry Boom Barrier lifts -> Vehicle follows glowing green road arrows into assigned slot -> Camera AI marks slot RED -> Live billing timer starts
 *    - Step 4: Vehicle leaves slot (Camera AI flips slot back to GREEN) -> Drives to Exit Gate -> Exit ANPR camera scans plate
 *    - Step 5: Exit Kiosk calculates duration & fee -> Displays automated UPI payment QR
 *    - Step 6: Payment verified -> Exit Boom Barrier lifts -> Vehicle departs smoothly!
 */

const STAGES = [
  {
    id: 0,
    short: '1. ANPR Entry Scan',
    title: 'Step 1: Vehicle Arrives at Entry Gate & ANPR Camera Scans Plate',
    desc: 'Vehicle approaches Entry Gate. High-speed ANPR camera scans the license plate and AI classifies vehicle (Car vs Bike).',
  },
  {
    id: 1,
    short: '2. QR Registration',
    title: 'Step 2: Customer Kiosk Displays QR → Fill Name & Phone Form',
    desc: 'Customer Kiosk screen displays a unique registration QR code. Customer scans QR, confirms details, and Entry Gate opens.',
  },
  {
    id: 2,
    short: '3. Park & AI Mark RED',
    title: 'Step 3: Barrier Opens → Vehicle Parks in Assigned Zone (Camera Marks Slot RED)',
    desc: 'Vehicle follows glowing green guidance arrows into its designated slot. Overhead Camera Vision AI detects arrival and instantly marks the slot RED (Occupied)!',
  },
  {
    id: 3,
    short: '4. Exit & AI Mark GREEN',
    title: 'Step 4: Vehicle Departs Slot (Camera Marks Slot GREEN) → Reaches Exit Gate',
    desc: 'Vehicle drives out of the bay. Camera Vision AI immediately updates the slot to GREEN (Vacant). Vehicle reaches the Exit Gate.',
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
    desc: 'Instant payment confirmation triggers Exit Boom Barrier to lift, and the vehicle exits the facility smoothly.',
  },
];

// Helper to generate deterministic SVG QR code
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
    carProgress: 0,
    entryGateAngle: 0,
    exitGateAngle: 0,
    camera: null,
    targetCamPos: new THREE.Vector3(0, 8.5, 13.5),
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
      ref.targetCamPos.set(0, 15.0, 3.2);
      ref.targetLookAt.set(0, 0, 0);
    } else if (preset === 'entry') {
      // Entry ANPR Scanner View
      ref.targetCamPos.set(-6.8, 3.2, 5.5);
      ref.targetLookAt.set(-5.5, 0.9, 1.8);
    } else if (preset === 'bays') {
      // Car & Bike Parking Bays View
      ref.targetCamPos.set(0.5, 5.5, 4.5);
      ref.targetLookAt.set(0.5, 0.4, -1.8);
    } else if (preset === 'exit') {
      // Exit Kiosk & Payment View
      ref.targetCamPos.set(5.2, 3.2, 5.5);
      ref.targetLookAt.set(5.5, 0.9, 1.8);
    } else {
      // Default Perspective View
      ref.targetCamPos.set(0, 8.5, 13.5);
      ref.targetLookAt.set(0, 0.4, 0);
    }
  };

  // Pricing based on vehicle type
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
    const h = host.clientHeight || 460;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setSize(w, h, false);
    renderer.shadowMap.enabled = true;
    host.innerHTML = '';
    host.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x060e1a);

    const camera = new THREE.PerspectiveCamera(40, w / h, 0.1, 140);
    camera.position.set(0, 8.5, 13.5);
    camera.lookAt(0, 0.4, 0);
    stateRef.current.camera = camera;

    // Lights
    scene.add(new THREE.AmbientLight(0xdbeafe, 1.4));
    const dirLight = new THREE.DirectionalLight(0xffffff, 2.2);
    dirLight.position.set(10, 16, 12);
    dirLight.castShadow = true;
    scene.add(dirLight);

    const entryScanLight = new THREE.PointLight(0x38bdf8, 0, 7);
    entryScanLight.position.set(-5.5, 1.6, 2.2);
    scene.add(entryScanLight);

    const exitScanLight = new THREE.PointLight(0xf47b20, 0, 7);
    exitScanLight.position.set(5.5, 1.6, 2.2);
    scene.add(exitScanLight);

    const world = new THREE.Group();
    scene.add(world);

    // Materials
    const matAsphalt = new THREE.MeshStandardMaterial({ color: 0x0f1c2e, roughness: 0.8, metalness: 0.15 });
    const matCurb = new THREE.MeshStandardMaterial({ color: 0x162c4a, roughness: 0.5, metalness: 0.3 });
    const matWhiteLine = new THREE.MeshBasicMaterial({ color: 0xffffff });
    const matYellowLine = new THREE.MeshBasicMaterial({ color: 0xfacc15 });
    const matCyanLine = new THREE.MeshBasicMaterial({ color: 0x38bdf8 });
    const matPillar = new THREE.MeshStandardMaterial({ color: 0x1e3a5f, metalness: 0.7, roughness: 0.25 });
    const matOrange = new THREE.MeshStandardMaterial({ color: 0xf47b20, emissive: 0xf47b20, emissiveIntensity: 0.25, metalness: 0.4, roughness: 0.3 });
    const matWhite = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.3 });
    const matKioskScreen = new THREE.MeshBasicMaterial({ color: 0x38bdf8 });
    const matExitScreen = new THREE.MeshBasicMaterial({ color: 0x22c55e });
    const matScanBeam = new THREE.MeshBasicMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.0, side: THREE.DoubleSide });
    const matExitBeam = new THREE.MeshBasicMaterial({ color: 0xf47b20, transparent: true, opacity: 0.0, side: THREE.DoubleSide });
    const matArrowGreen = new THREE.MeshBasicMaterial({ color: 0x22c55e, transparent: true, opacity: 0.85 });

    // 1. Ground Platform & Roadway
    const ground = new THREE.Mesh(new THREE.BoxGeometry(19.2, 0.4, 11.2), matCurb);
    ground.position.y = -0.22;
    world.add(ground);

    // Main Driving Asphalt Lane (Roadway at z = 2.0)
    const road = new THREE.Mesh(new THREE.BoxGeometry(18.4, 0.06, 3.8), matAsphalt);
    road.position.set(0, 0.01, 2.0);
    world.add(road);

    // Parking Bays Floor at z = -2.0
    const bayFloor = new THREE.Mesh(new THREE.BoxGeometry(18.4, 0.06, 4.4), matAsphalt);
    bayFloor.position.set(0, 0.01, -2.0);
    world.add(bayFloor);

    // Yellow Dashed Center Line on Road
    for (let x = -8.0; x <= 8.0; x += 1.6) {
      const dash = new THREE.Mesh(new THREE.BoxGeometry(0.75, 0.02, 0.1), matYellowLine);
      dash.position.set(x, 0.05, 2.0);
      world.add(dash);
    }

    // Glowing Green Directional Guidance Arrows on Asphalt Road (from Image 2)
    const arrows = [];
    [-4.5, -2.2, 0, 2.2, 4.2].forEach((ax) => {
      const arrowGroup = new THREE.Group();
      arrowGroup.position.set(ax, 0.06, 2.6);

      // Chevron shape: 2 angled boxes
      const leftWing = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.02, 0.08), matArrowGreen);
      leftWing.position.set(-0.14, 0, -0.12);
      leftWing.rotation.y = Math.PI / 4;
      arrowGroup.add(leftWing);

      const rightWing = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.02, 0.08), matArrowGreen);
      rightWing.position.set(0.14, 0, -0.12);
      rightWing.rotation.y = -Math.PI / 4;
      arrowGroup.add(rightWing);

      world.add(arrowGroup);
      arrows.push(arrowGroup);
    });

    // ----------------------------------------------------
    // 2. AI COMPUTER VISION OVERHEAD CCTV CAMERA MAST (Images 1 & 4)
    // Marks parking slots with Green (Vacant) & Red (Occupied) Bounding Boxes
    // ----------------------------------------------------
    const cctvMast = new THREE.Group();
    cctvMast.position.set(-0.5, 0, -4.5);
    world.add(cctvMast);

    const mastPole = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.1, 4.4, 16), matPillar);
    mastPole.position.y = 2.2;
    cctvMast.add(mastPole);

    const mastArm = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.08, 0.08), matPillar);
    mastArm.position.set(0, 4.3, 0.6);
    cctvMast.add(mastArm);

    // 2 AI Vision CCTV Cameras angled down at parking bays
    [-0.9, 0.9].forEach((cx) => {
      const camHousing = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.18, 0.36), matWhite);
      camHousing.position.set(cx, 4.25, 0.65);
      camHousing.rotation.x = 0.55;
      camHousing.rotation.y = cx > 0 ? -0.2 : 0.2;
      cctvMast.add(camHousing);

      // Blinking Blue/Green AI Status LED
      const led = new THREE.Mesh(new THREE.SphereGeometry(0.04, 8, 8), new THREE.MeshBasicMaterial({ color: 0x38bdf8 }));
      led.position.set(cx, 4.35, 0.85);
      cctvMast.add(led);
    });

    // Pyramidal AI Vision Scanning Beam / Laser Grid
    const scanGridGeo = new THREE.ConeGeometry(4.8, 4.2, 4, 1, true);
    const scanGridMat = new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: 0.08,
      wireframe: true,
      side: THREE.DoubleSide,
    });
    const cctvCone = new THREE.Mesh(scanGridGeo, scanGridMat);
    cctvCone.position.set(0, 2.1, 2.2);
    cctvCone.rotation.x = Math.PI / 2.8;
    cctvMast.add(cctvCone);

    // ----------------------------------------------------
    // HELPER: CREATE 3D AI DETECTION BOUNDING BOXES (Images 1 & 4)
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

      // Ground Bounding Box Rectangle
      const hw = width / 2;
      const hd = depth / 2;
      const thick = 0.04;

      // 4 Sides of Ground Box
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

      // 4 Vertical L-Shape Corner Brackets (High-Tech Computer Vision AI Bounding Box)
      const bracketHeight = 0.35;
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
      const sensorOrb = new THREE.Mesh(new THREE.SphereGeometry(0.12, 14, 14), sensorMat);
      sensorOrb.position.set(0, 2.3, 0);
      boxGroup.add(sensorOrb);

      // Dynamic Canvas Texture for Slot ID & Status Tag
      const tagCanvas = document.createElement('canvas');
      tagCanvas.width = 256;
      tagCanvas.height = 96;
      const tagCtx = tagCanvas.getContext('2d');

      const renderTag = (occupied) => {
        tagCtx.clearRect(0, 0, 256, 96);
        tagCtx.fillStyle = occupied ? 'rgba(239, 68, 68, 0.85)' : 'rgba(34, 197, 94, 0.85)';
        tagCtx.roundRect(10, 10, 236, 76, 12);
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
        new THREE.PlaneGeometry(1.1, 0.42),
        new THREE.MeshBasicMaterial({ map: tagTexture, transparent: true, side: THREE.DoubleSide })
      );
      tagMesh.position.set(0, 1.35, -hd + 0.1);
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
    // 3. ZONE A: CAR PARKING BAYS (4-WHEELERS)
    // ----------------------------------------------------
    // Canopy over car bays
    const carRoof = new THREE.Mesh(
      new THREE.BoxGeometry(8.2, 0.15, 3.8),
      new THREE.MeshStandardMaterial({ color: 0x0f294d, metalness: 0.75, roughness: 0.25 })
    );
    carRoof.position.set(-1.8, 2.5, -2.0);
    world.add(carRoof);

    // Car Zone Signboard
    const carSign = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.45, 0.08), matPillar);
    carSign.position.set(-1.8, 2.8, -0.1);
    world.add(carSign);

    // Car Slots Bounding Boxes
    const slotCar1 = createAIBoundingBox(-4.2, -2.0, 2.3, 3.4, 'CAR-01', true); // Parked Silver Car
    const slotCar2 = createAIBoundingBox(-1.8, -2.0, 2.3, 3.4, 'CAR-02', false); // Target Slot for incoming Car!
    const slotCar3 = createAIBoundingBox(0.6, -2.0, 2.3, 3.4, 'CAR-03', true); // Parked Dark SUV

    // Static Parked Vehicles in Car Bays (to show active parking lot)
    const parkedSilverCar = new THREE.Mesh(
      new THREE.BoxGeometry(1.8, 0.55, 0.95),
      new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.85, roughness: 0.2 })
    );
    parkedSilverCar.position.set(-4.2, 0.35, -2.0);
    parkedSilverCar.rotation.y = Math.PI / 2;
    world.add(parkedSilverCar);

    const parkedSuv = new THREE.Mesh(
      new THREE.BoxGeometry(1.9, 0.7, 1.05),
      new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.9, roughness: 0.15 })
    );
    parkedSuv.position.set(0.6, 0.42, -2.0);
    parkedSuv.rotation.y = Math.PI / 2;
    world.add(parkedSuv);

    // ----------------------------------------------------
    // 4. ZONE B: BIKE PARKING BAYS (2-WHEELERS / BAICK ALAG)
    // ----------------------------------------------------
    // Yellow Divider Line separating Car & Bike zones
    const zoneDivider = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.04, 4.4), matYellowLine);
    zoneDivider.position.set(2.0, 0.05, -2.0);
    world.add(zoneDivider);

    // Bike Canopy
    const bikeRoof = new THREE.Mesh(
      new THREE.BoxGeometry(4.8, 0.12, 2.8),
      new THREE.MeshStandardMaterial({ color: 0x0c4a6e, metalness: 0.7, roughness: 0.3 })
    );
    bikeRoof.position.set(4.8, 2.2, -2.0);
    world.add(bikeRoof);

    // Bike Slots Bounding Boxes (Narrower for 2-wheelers)
    const slotBike1 = createAIBoundingBox(3.0, -2.0, 1.2, 2.4, 'BIKE-01', true); // Parked Red Motorcycle
    const slotBike2 = createAIBoundingBox(4.5, -2.0, 1.2, 2.4, 'BIKE-02', false); // Target Slot for incoming Bike!
    const slotBike3 = createAIBoundingBox(6.0, -2.0, 1.2, 2.4, 'BIKE-03', true); // Parked Blue Scooter

    // Helper to build a simple parked motorcycle mesh
    const buildMiniMotorcycle = (colorHex) => {
      const bg = new THREE.Group();
      const bikeBody = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.35, 0.28), new THREE.MeshStandardMaterial({ color: colorHex, metalness: 0.8 }));
      bikeBody.position.y = 0.35;
      bg.add(bikeBody);

      [-0.45, 0.45].forEach((wx) => {
        const wheel = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 0.1, 16), matPillar);
        wheel.rotation.x = Math.PI / 2;
        wheel.position.set(wx, 0.2, 0);
        bg.add(wheel);
      });
      bg.rotation.y = Math.PI / 2;
      return bg;
    };

    const parkedBike1 = buildMiniMotorcycle(0xdc2626); // Red Bike in BIKE-01
    parkedBike1.position.set(3.0, 0, -2.0);
    world.add(parkedBike1);

    const parkedBike3 = buildMiniMotorcycle(0x0284c7); // Blue Scooter in BIKE-03
    parkedBike3.position.set(6.0, 0, -2.0);
    world.add(parkedBike3);

    // ----------------------------------------------------
    // 5. ENTRY & EXIT GATE COMPLEXES (ANPR Camera + Screen + Boom Barrier)
    // ----------------------------------------------------
    const buildGateComplex = (xPos, isExit) => {
      const group = new THREE.Group();
      group.position.set(xPos, 0, 0.2);

      // Boom Barrier Post & Pivot
      const post = new THREE.Mesh(new THREE.BoxGeometry(0.42, 1.35, 0.42), matOrange);
      post.position.set(0, 0.68, 0);
      group.add(post);

      const pivot = new THREE.Group();
      pivot.position.set(0, 1.15, 0);
      group.add(pivot);

      const arm = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.12, 3.2), matWhite);
      arm.position.set(0, 0, 1.6);
      pivot.add(arm);

      // Red/Orange reflective stripes on barrier arm
      for (let s = 0.4; s < 3.0; s += 0.6) {
        const stripe = new THREE.Mesh(new THREE.BoxGeometry(0.13, 0.13, 0.28), matOrange);
        stripe.position.set(0, 0, s);
        pivot.add(stripe);
      }

      // ANPR Camera Post & Camera Housing
      const camPole = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.09, 2.3, 14), matPillar);
      camPole.position.set(-1.05, 1.15, -0.2);
      group.add(camPole);

      const camBox = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.26, 0.28), matWhite);
      camBox.position.set(-1.05, 2.3, 0);
      camBox.rotation.y = isExit ? -0.38 : -0.48;
      camBox.rotation.x = 0.38;
      group.add(camBox);

      // Scan Laser Cone from ANPR Camera
      const coneGeo = new THREE.ConeGeometry(0.95, 2.6, 16, 1, true);
      const beam = new THREE.Mesh(coneGeo, isExit ? matExitBeam : matScanBeam);
      beam.position.set(-1.45, 1.25, 1.1);
      beam.rotation.z = -0.65;
      beam.rotation.x = 0.55;
      group.add(beam);

      // Customer Screen Display Kiosk
      const kioskBody = new THREE.Mesh(new THREE.BoxGeometry(0.5, 1.55, 0.4), matPillar);
      kioskBody.position.set(-0.55, 0.78, -0.2);
      group.add(kioskBody);

      const screen = new THREE.Mesh(
        new THREE.BoxGeometry(0.4, 0.58, 0.04),
        isExit ? matExitScreen : matKioskScreen
      );
      screen.position.set(-0.55, 1.12, 0.02);
      group.add(screen);

      world.add(group);
      return { pivot, screen };
    };

    const entryGate = buildGateComplex(-6.2, false);
    const exitGate = buildGateComplex(6.4, true);

    // ----------------------------------------------------
    // 6. 3D ACTIVE VEHICLES: CAR & MOTORCYCLE
    // ----------------------------------------------------
    // A. 3D SEDAN CAR
    const car = new THREE.Group();
    const carBodyMat = new THREE.MeshStandardMaterial({ color: 0x2563eb, metalness: 0.85, roughness: 0.2 });
    const carCabinMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, metalness: 0.9, roughness: 0.1 });
    const wheelMat = new THREE.MeshStandardMaterial({ color: 0x111827, roughness: 0.6 });
    const plateMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
    const headLightMat = new THREE.MeshBasicMaterial({ color: 0xfef08a });

    const chassis = new THREE.Mesh(new THREE.BoxGeometry(2.0, 0.44, 1.05), carBodyMat);
    chassis.position.y = 0.36;
    car.add(chassis);

    const cabin = new THREE.Mesh(new THREE.BoxGeometry(1.15, 0.38, 0.9), carCabinMat);
    cabin.position.set(-0.1, 0.72, 0);
    car.add(cabin);

    // Number plates (Front & Rear)
    const frontPlate = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.14, 0.45), plateMat);
    frontPlate.position.set(1.02, 0.28, 0);
    car.add(frontPlate);

    const rearPlate = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.14, 0.45), plateMat);
    rearPlate.position.set(-1.02, 0.28, 0);
    car.add(rearPlate);

    // Headlights
    [-0.35, 0.35].forEach((zOff) => {
      const hl = new THREE.Mesh(new THREE.SphereGeometry(0.08, 10, 10), headLightMat);
      hl.position.set(1.0, 0.4, zOff);
      car.add(hl);
    });

    // 4 Wheels
    [
      [-0.62, -0.52],
      [0.62, -0.52],
      [-0.62, 0.52],
      [0.62, 0.52],
    ].forEach(([wx, wz]) => {
      const wheel = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.22, 0.16, 16), wheelMat);
      wheel.rotation.x = Math.PI / 2;
      wheel.position.set(wx, 0.22, wz);
      car.add(wheel);
    });

    car.position.set(-8.0, 0.04, 2.0);
    world.add(car);

    // B. 3D MOTORCYCLE / BIKE (BAICK ALAG)
    const bike = new THREE.Group();
    const bikePaintMat = new THREE.MeshStandardMaterial({ color: 0x16a34a, metalness: 0.85, roughness: 0.25 }); // Neon Green Kawasaki Style

    const bikeFrame = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.38, 0.26), bikePaintMat);
    bikeFrame.position.y = 0.45;
    bike.add(bikeFrame);

    const bikeTank = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.25, 0.34), bikePaintMat);
    bikeTank.position.set(0.1, 0.7, 0);
    bike.add(bikeTank);

    const bikeSeat = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.14, 0.28), carCabinMat);
    bikeSeat.position.set(-0.35, 0.65, 0);
    bike.add(bikeSeat);

    // Handlebars
    const handleBar = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.08, 0.75), matPillar);
    handleBar.position.set(0.42, 0.82, 0);
    bike.add(handleBar);

    // Bike Wheels
    [-0.55, 0.55].forEach((wx) => {
      const bWheel = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.28, 0.12, 16), wheelMat);
      bWheel.rotation.x = Math.PI / 2;
      bWheel.position.set(wx, 0.28, 0);
      bike.add(bWheel);
    });

    // Bike Number Plate (Rear)
    const bikePlate = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.12, 0.28), plateMat);
    bikePlate.position.set(-0.72, 0.42, 0);
    bike.add(bikePlate);

    bike.position.set(-8.0, 0.04, 2.0);
    world.add(bike);

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
      orbitY += (cx - prevX) * 0.008;
      orbitX = Math.max(-0.25, Math.min(0.55, orbitX + (cy - prevY) * 0.006));
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

      // Active vehicle mesh selection
      const activeVehicle = isCar ? car : bike;
      car.visible = isCar;
      bike.visible = !isCar;

      // Target slot coordinates based on vehicle type
      const targetSlotX = isCar ? -1.8 : 4.5;
      const targetSlotZ = -2.0;

      // Target vehicle positions & barrier angles per stage
      let targetX = -7.4;
      let targetZ = 2.0;
      let targetRotY = 0;
      let targetEntryGate = 0;
      let targetExitGate = 0;

      if (st === 0) {
        // Stage 0: Vehicle arrives at Entry Gate -> ANPR camera scans plate
        targetX = -7.2;
        targetZ = 2.0;
        targetRotY = 0;
        targetEntryGate = 0;
        matScanBeam.opacity = 0.28 + Math.sin(t * 8) * 0.14;
        matExitBeam.opacity = 0;
        entryScanLight.intensity = 3.8;
        exitScanLight.intensity = 0;
      } else if (st === 1) {
        // Stage 1: Customer fills QR form -> Barrier opens slightly
        targetX = -7.0;
        targetZ = 2.0;
        targetRotY = 0;
        targetEntryGate = 0.35;
        matScanBeam.opacity = 0.12;
        matExitBeam.opacity = 0;
        entryScanLight.intensity = 2.0;
        exitScanLight.intensity = 0;
      } else if (st === 2) {
        // Stage 2: Barrier fully open -> Vehicle drives into assigned slot (CAR-02 or BIKE-02)
        targetX = targetSlotX;
        targetZ = targetSlotZ;
        targetRotY = Math.PI / 2;
        targetEntryGate = 1.45;
        matScanBeam.opacity = 0;
        matExitBeam.opacity = 0;
        entryScanLight.intensity = 0;
        exitScanLight.intensity = 0;
      } else if (st === 3) {
        // Stage 3: Vehicle pulls out of slot -> Reaches Exit Gate
        targetX = 4.2;
        targetZ = 2.0;
        targetRotY = 0;
        targetExitGate = 0;
        matScanBeam.opacity = 0;
        matExitBeam.opacity = 0.3 + Math.sin(t * 8) * 0.15;
        entryScanLight.intensity = 0;
        exitScanLight.intensity = 3.8;
      } else if (st === 4) {
        // Stage 4: Exit Kiosk displays fee & QR
        targetX = 4.5;
        targetZ = 2.0;
        targetRotY = 0;
        targetExitGate = 0;
        matScanBeam.opacity = 0;
        matExitBeam.opacity = 0.15;
        entryScanLight.intensity = 0;
        exitScanLight.intensity = 2.5;
      } else if (st === 5) {
        // Stage 5: Payment Done -> Exit barrier lifts -> Vehicle drives OUT!
        targetX = 8.8;
        targetZ = 2.0;
        targetRotY = 0;
        targetExitGate = 1.45;
        matScanBeam.opacity = 0;
        matExitBeam.opacity = 0;
        entryScanLight.intensity = 0;
        exitScanLight.intensity = 0;
      }

      // Smooth vehicle animation
      activeVehicle.position.x += (targetX - activeVehicle.position.x) * 0.055;
      activeVehicle.position.z += (targetZ - activeVehicle.position.z) * 0.055;
      activeVehicle.rotation.y += (targetRotY - activeVehicle.rotation.y) * 0.07;

      // Barrier angles
      entryGate.pivot.rotation.x += (-targetEntryGate - entryGate.pivot.rotation.x) * 0.09;
      exitGate.pivot.rotation.x += (-targetExitGate - exitGate.pivot.rotation.x) * 0.09;

      // AI Camera Vision Markings Update (Camera se mark kar ke RED / GREEN):
      // When parked in stage 2, slot is marked RED (Occupied). In all other stages, marked GREEN (Vacant)!
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
        camera.position.lerp(ref.targetCamPos, 0.06);
        camera.lookAt(ref.targetLookAt);
      }

      world.rotation.y = orbitY + Math.sin(t * 0.25) * 0.04;
      world.rotation.x = orbitX;

      renderer.render(scene, camera);
      raf = requestAnimationFrame(animate);
    };
    raf = requestAnimationFrame(animate);

    const onResize = () => {
      if (!host) return;
      const nw = host.clientWidth || 720;
      const nh = host.clientHeight || 460;
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
            <Car size={16} /> 🚗 Car (4-Wheeler Bay)
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
            <Bike size={16} /> 🏍️ Bike (2-Wheeler Bay)
          </button>
        </div>

        {/* Camera Views: AI CCTV Top-Down vs 3D Perspective */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ fontSize: '0.82rem', color: '#94a3b8', fontWeight: 700 }}>3D VIEW:</span>
          {[
            { id: 'all', label: 'Perspective', icon: <Eye size={13} /> },
            { id: 'cctv', label: '🎥 AI Camera View (Top-Down)', icon: <Layers size={13} /> },
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
                {vehicleType === 'car' ? '🚗 CAR PARKING' : '🏍️ BIKE PARKING'} · AI CAMERA VISION MARKING (GREEN: VACANT | RED: OCCUPIED)
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
          <div ref={mountRef} className="sp3d-canvas-host" />

          {/* Bottom Stage Caption Bar */}
          <div className="sp3d-stage-caption">
            <div>
              <div style={{ fontSize: 12, color: '#38bdf8', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                Live 3D Simulation Status ({vehicleType === 'car' ? 'Car Slot: CAR-02' : 'Bike Slot: BIKE-02'})
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
                    {vehicleType === 'car' ? '🚗 Car Detected' : '🏍️ Bike Detected'}
                  </div>
                </div>
              </div>

              <div className="sp3d-plate-display">
                <span className="ind-flag">IND</span>
                <b>{plate}</b>
              </div>

              <p style={{ color: '#cbd5e1', fontSize: 14, lineHeight: 1.6, margin: '12px 0 18px' }}>
                {vehicleType === 'car' ? 'गाड़ी (Car)' : 'बाइक (Motorcycle)'} एंट्री गेट पर पहुँच चुकी है। ANPR कैमरा ने नंबर प्लेट (<b>{plate}</b>) और व्हीकल टाइप AI से डिटेक्ट कर लिया है। अब कस्टमर स्क्रीन पर रजिस्ट्रेशन QR जनरेट करें:
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
                🎥 <strong>Overhead Camera AI Vision:</strong> Slot {vehicleType === 'car' ? 'CAR-02' : 'BIKE-02'} ko <b>GREEN (Vacant)</b> se <b>RED (Occupied)</b> mark kar diya hai!
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
