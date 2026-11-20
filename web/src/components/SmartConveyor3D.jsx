import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import {
  Play, Pause, RotateCcw, CheckCircle2, AlertTriangle,
  Camera, Cpu, Activity, ShieldCheck, Sparkles, ArrowRight,
  Octagon, DoorOpen, DoorClosed, Monitor, Scale, Gauge, Eye,
  Layers, Settings2, Box, Zap
} from 'lucide-react';
import { openAuditModal } from './AuditBookingModal';

/**
 * 3D Smart Conveyor Belt & Automated Machine Vision Inspection Line
 * Directly recreated from real industrial manufacturing plants & factory machinery.
 *
 * Real Industrial Machine Components:
 *  1. Polished Factory Epoxy Floor with OSHA 5S Safety Yellow Demarcations & Hazard Stripes
 *  2. Background Factory Infrastructure: Steel I-Beams, Yellow Wire-Mesh Machine Guard Fencing, Overhead High-Bay LED Lights
 *  3. Anodized Aluminum 8020 / Bosch Rexroth Extrusion Frame with T-Slots, Corner Gussets & Leveling Feet
 *  4. Continuous Closed-Loop PVC Belt:
 *     - Top carrying strand with textured diamond-grip rubber & tracking edge lines
 *     - Crowned steel drive drums (Drive & Tail pulleys) with half-cylinder curved belt wrap
 *     - Bottom return belt strand running underneath
 *     - Spinning underside return idler rollers
 *     - Brushed stainless steel slider bed plate
 *  5. Cast Iron 4-Bolt Flange Bearing Units (Pillow Blocks) with Grease Nipples
 *  6. SEW-Eurodrive AC Helical Bevel Gearmotor with Cooling Fins, Fan Cowl, Terminal Box & Conduits
 *  7. Yellow Wire-Mesh Cable Tray (Legrand Cablofil style) carrying power and sensor cables
 *  8. Side-Mounted Photoelectric Sensors on Stainless Clamp Rods with Coiled Blue & Orange Cables
 *  9. Dynamic In-Line Checkweigher (Load Cell Bed with ±15g tolerance and live micro-deflection)
 * 10. Overhead Cognex/Keyence AI Vision Camera Gantry with LED Ring Strobe & Downward Laser Scan Fan
 * 11. Articulated 24" Operator Vision Monitor Screen with Live Viewfinder Graphics
 * 12. High-Speed Pneumatic Reject Pusher with Air Tubing & Cushioned Paddle deflecting into Roller Chute & Red Bin
 * 13. Floor-Standing Rittal RAL 7035 Control Cabinet on Left Side with 100° Swing Door:
 *     - Siemens SIMATIC S7-1200 PLC (CPU 1214C + I/O Expansion Modules + Glowing Green RUN LED)
 *     - 24V DC Regulated SMPS Power Supply, 3-Phase MCBs, Safety Relay, Wiring Ducts & Terminal Strips
 *     - Large 15" Door HMI with Live Siemens WinCC Telemetry (CanvasTexture)
 * 14. Physical 3-Button Control Station: START (Green), STOP (Yellow), EMERGENCY STOP (Red Mushroom)
 * 15. Tricolor Tower Light Beacon (Green: Run, Yellow: Standby, Red Flashing: E-Stop / Defect)
 * 16. Corrugated Kraft Shipping Cartons with Fluting, Tape Seams, Barcodes, Fragile Icons & NG Reject Stamp
 * 17. Smooth OrbitControls with 4 Preset Camera Angle Buttons (Overview, Vision QC, Checkweigher, PLC Panel)
 */

const TARGET_WEIGHT = 500.0; // grams
const WEIGHT_TOLERANCE = 15.0; // ±15g

const DEFECT_TYPES = [
  'Underweight (Missing Product Content)',
  'Overweight (Overfilled Container)',
  'Surface Dent / Crushed Corner',
  'Barcode Scratched / Unreadable',
  'Tamper Seal Broken / Open',
];

export default function SmartConveyor3D({ onBookDemo }) {
  const mountRef = useRef(null);

  // Machine Operational State: 'RUNNING' | 'IDLE' | 'ESTOP'
  const [machineState, setMachineState] = useState('RUNNING');
  const [speedMultiplier, setSpeedMultiplier] = useState(1);
  const [forceNextType, setForceNextType] = useState(null); // null | 'ok' | 'ng-weight' | 'ng-vision'
  const [isDoorOpen, setIsDoorOpen] = useState(false); // PLC Cabinet Door Open/Close
  const [activeCamPreset, setActiveCamPreset] = useState('overview'); // 'overview' | 'vision' | 'scale' | 'panel'

  // Production Metrics
  const [metrics, setMetrics] = useState({
    total: 164,
    ok: 156,
    ng: 8,
    cycleTimeMs: 34,
    currentWeight: 501.2,
    weightStatus: 'OK (501.2g)',
    airPressureBar: 6.2,
  });

  // Current Live Scanned Item
  const [currentScan, setCurrentScan] = useState({
    id: 'LOT-9824',
    status: 'OK',
    confidence: 99.4,
    weight: 501.2,
    defect: null,
    scanTime: 'Just now',
    barcode: 'RVM-8849-PASS',
  });

  // Rolling Production Inspection Log
  const [inspectionLog, setInspectionLog] = useState([
    { id: 'LOT-9824', time: '12:44:18', weight: '501.2g', status: 'OK', defect: 'All Specs In Range', dest: 'Main Line (OK)' },
    { id: 'LOT-9823', time: '12:44:14', weight: '498.6g', status: 'OK', defect: 'All Specs In Range', dest: 'Main Line (OK)' },
    { id: 'LOT-9822', time: '12:44:09', weight: '438.0g', status: 'NG', defect: 'Underweight (-62g Defect)', dest: 'Reject Chute (NG)' },
    { id: 'LOT-9821', time: '12:44:05', weight: '502.8g', status: 'OK', defect: 'All Specs In Range', dest: 'Main Line (OK)' },
    { id: 'LOT-9820', time: '12:44:01', weight: '500.4g', status: 'OK', defect: 'All Specs In Range', dest: 'Main Line (OK)' },
  ]);

  // Three.js internal shared references
  const simRef = useRef({
    machineState: 'RUNNING',
    speed: 1,
    forceNext: null,
    isDoorOpen: false,
    doorAngle: 0,
    doorPivot: null,
    cabinetLight: null,
    boxes: [],
    rollers: [],
    endDrums: [],
    beltTopMat: null,
    beltWrapMat: null,
    beltBotMat: null,
    beltTexture: null,
    pusherArm: null,
    scalePlatform: null,
    stackGreenMat: null,
    stackYellowMat: null,
    stackRedMat: null,
    beaconLight: null,
    conveyorTowerGreenMat: null,
    conveyorTowerYellowMat: null,
    conveyorTowerRedMat: null,
    scanLaserPlane: null,
    scanSpotLight: null,
    sensorRayMat: null,
    hmiTexture: null,
    hmiCanvas: null,
    hmiCtx: null,
    monitorTexture: null,
    monitorCanvas: null,
    monitorCtx: null,
    okBoxTexture: null,
    ngBoxTexture: null,
    nextBoxId: 9825,
    lastSpawnTime: 0,
    ngBlinkTimer: 0,
    lastWeight: 501.2,
    controls: null,
    camera: null,
    camTarget: new THREE.Vector3(-0.8, 0.9, 0),
    targetCamPos: new THREE.Vector3(-0.6, 2.6, 5.2),
    targetLookAt: new THREE.Vector3(-0.8, 0.9, 0),
    raycaster: new THREE.Raycaster(),
    mouse: new THREE.Vector2(),
    clickableButtons: [],
  });

  // Sync React state to simRef
  useEffect(() => {
    simRef.current.machineState = machineState;
  }, [machineState]);

  useEffect(() => {
    simRef.current.speed = speedMultiplier;
  }, [speedMultiplier]);

  useEffect(() => {
    simRef.current.forceNext = forceNextType;
  }, [forceNextType]);

  useEffect(() => {
    simRef.current.isDoorOpen = isDoorOpen;
  }, [isDoorOpen]);

  // Camera preset handler
  const setCameraView = (viewKey) => {
    setActiveCamPreset(viewKey);
    const sim = simRef.current;
    if (!sim.camera || !sim.controls) return;

    if (viewKey === 'overview') {
      sim.targetCamPos.set(-0.6, 2.8, 5.4);
      sim.targetLookAt.set(-0.8, 0.9, 0);
    } else if (viewKey === 'vision') {
      sim.targetCamPos.set(-0.4, 2.3, 1.8);
      sim.targetLookAt.set(-0.4, 1.3, 0);
    } else if (viewKey === 'scale') {
      sim.targetCamPos.set(-1.8, 2.1, 1.9);
      sim.targetLookAt.set(-1.8, 1.1, 0);
    } else if (viewKey === 'panel') {
      sim.targetCamPos.set(-4.2, 1.8, 0.8);
      sim.targetLookAt.set(-4.2, 1.3, -1.35);
    }
  };

  // Main Three.js Scene Setup & Animation Loop
  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth || 800;
    const height = container.clientHeight || 560;

    // 1. Scene & Camera Setup (Bright Factory Workshop Ambiance)
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xdce5ef); // Crisp, clean industrial factory atmosphere
    scene.fog = new THREE.FogExp2(0xdce5ef, 0.024);

    const camera = new THREE.PerspectiveCamera(42, width / height, 0.1, 80);
    camera.position.set(-0.6, 2.8, 5.4);
    camera.lookAt(-0.8, 0.9, 0);
    simRef.current.camera = camera;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: 'high-performance' });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.25;
    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    // OrbitControls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.target.set(-0.8, 0.9, 0);
    controls.maxPolarAngle = Math.PI / 2 - 0.04; // Don't clip under the floor
    controls.minDistance = 1.8;
    controls.maxDistance = 12.0;
    simRef.current.controls = controls;

    // 2. Realistic Industrial High-Bay Factory Lighting
    const hemiLight = new THREE.HemisphereLight(0xffffff, 0x94a3b8, 1.25);
    scene.add(hemiLight);

    // Primary High-Bay Directional Sunlight / Floodlight with Soft Shadows
    const dirLight = new THREE.DirectionalLight(0xfffbeb, 1.7);
    dirLight.position.set(4.0, 11, 4.5);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 2048;
    dirLight.shadow.mapSize.height = 2048;
    dirLight.shadow.bias = -0.0004;
    dirLight.shadow.camera.near = 0.5;
    dirLight.shadow.camera.far = 25;
    dirLight.shadow.camera.left = -8;
    dirLight.shadow.camera.right = 8;
    dirLight.shadow.camera.top = 8;
    dirLight.shadow.camera.bottom = -8;
    scene.add(dirLight);

    // Secondary Cool Factory Daylight Ambient Fill
    const fillLight = new THREE.DirectionalLight(0xdbeafe, 0.85);
    fillLight.position.set(-5, 8, -4);
    scene.add(fillLight);

    // Front Machine Specular Key Light
    const keyPoint = new THREE.PointLight(0xffffff, 0.9, 14);
    keyPoint.position.set(-0.5, 4.0, 3.5);
    scene.add(keyPoint);

    // Tower Light Beacon Point Light (on top of Left Cabinet)
    const beaconLight = new THREE.PointLight(0x22c55e, 2.5, 7.0);
    beaconLight.position.set(-3.8, 2.7, -1.35);
    scene.add(beaconLight);
    simRef.current.beaconLight = beaconLight;

    // Cabinet Interior Light
    const cabinetLight = new THREE.PointLight(0xffffff, 0, 4.5);
    cabinetLight.position.set(-4.2, 1.3, -1.1);
    scene.add(cabinetLight);
    simRef.current.cabinetLight = cabinetLight;

    // ----------------------------------------------------
    // 3. REALISTIC POLISHED FACTORY EPOXY FLOOR & 5S SAFETY MARKINGS
    // ----------------------------------------------------
    // Polished light-grey industrial epoxy floor
    const floorGeo = new THREE.PlaneGeometry(36, 26);
    const floorMat = new THREE.MeshStandardMaterial({
      color: 0xc8d3de, // Polished factory concrete epoxy
      roughness: 0.32,
      metalness: 0.18,
    });
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    scene.add(floor);

    // Subtle floor tile grid joints (every 2.5m expansion joint)
    const floorJointGrid = new THREE.GridHelper(35, 14, 0x94a3b8, 0xb0bec5);
    floorJointGrid.position.y = 0.002;
    scene.add(floorJointGrid);

    // OSHA 5S Safety Demarcation Zone (Machine Safety Cell Perimeter)
    const yellowStripeMat = new THREE.MeshBasicMaterial({ color: 0xfacc15 });
    const safetyWalkwayGroup = new THREE.Group();
    scene.add(safetyWalkwayGroup);

    // Machine border yellow 5S line (100mm wide painted boundary)
    const makeFloorStripe = (x, z, w, d) => {
      const stripe = new THREE.Mesh(new THREE.PlaneGeometry(w, d), yellowStripeMat);
      stripe.rotation.x = -Math.PI / 2;
      stripe.position.set(x, 0.005, z);
      safetyWalkwayGroup.add(stripe);
    };

    // Outer safety perimeter rectangular box (10.4m x 3.6m around the whole cell)
    makeFloorStripe(0, -2.1, 10.6, 0.1); // Back boundary
    makeFloorStripe(0, 1.5, 10.6, 0.1);  // Front boundary
    makeFloorStripe(-5.3, -0.3, 0.1, 3.6); // Left boundary
    makeFloorStripe(5.3, -0.3, 0.1, 3.6);  // Right boundary

    // Diagonal yellow & black hazard stripes around the reject sorting station
    const hazardCanvas = document.createElement('canvas');
    hazardCanvas.width = 256;
    hazardCanvas.height = 256;
    const hCtx = hazardCanvas.getContext('2d');
    hCtx.fillStyle = '#facc15';
    hCtx.fillRect(0, 0, 256, 256);
    hCtx.fillStyle = '#1e293b';
    for (let i = -256; i < 512; i += 40) {
      hCtx.beginPath();
      hCtx.moveTo(i, 0);
      hCtx.lineTo(i + 40, 0);
      hCtx.lineTo(i - 40, 256);
      hCtx.lineTo(i - 80, 256);
      hCtx.fill();
    }
    const hazardTex = new THREE.CanvasTexture(hazardCanvas);
    hazardTex.wrapS = THREE.RepeatWrapping;
    hazardTex.wrapT = THREE.RepeatWrapping;
    hazardTex.repeat.set(4, 2);

    const hazardPad = new THREE.Mesh(
      new THREE.PlaneGeometry(1.6, 1.1),
      new THREE.MeshStandardMaterial({ map: hazardTex, roughness: 0.5 })
    );
    hazardPad.rotation.x = -Math.PI / 2;
    hazardPad.position.set(1.3, 0.006, 0.95);
    safetyWalkwayGroup.add(hazardPad);

    // ----------------------------------------------------
    // BACKGROUND FACTORY ARCHITECTURE (MATCHING IMAGE 1)
    // ----------------------------------------------------
    const factoryBgGroup = new THREE.Group();
    scene.add(factoryBgGroup);

    // Structural Factory Steel I-Beams / H-Columns (Industrial Safety Yellow & Steel Grey)
    const steelColumnMat = new THREE.MeshStandardMaterial({ color: 0x475569, metalness: 0.8, roughness: 0.35 });
    const yellowSteelMat = new THREE.MeshStandardMaterial({ color: 0xeab308, metalness: 0.5, roughness: 0.4 });

    const createIBeam = (xPos, zPos) => {
      const beamG = new THREE.Group();
      beamG.position.set(xPos, 0, zPos);

      // Web
      const web = new THREE.Mesh(new THREE.BoxGeometry(0.12, 6.0, 0.025), steelColumnMat);
      web.position.y = 3.0;
      beamG.add(web);
      // Flanges
      [-0.06, 0.06].forEach((fx) => {
        const flange = new THREE.Mesh(new THREE.BoxGeometry(0.02, 6.0, 0.35), steelColumnMat);
        flange.position.set(fx, 3.0, 0);
        beamG.add(flange);
      });
      // Base plate on floor
      const basePlate = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.04, 0.5), steelColumnMat);
      basePlate.position.y = 0.02;
      beamG.add(basePlate);

      // Yellow safety crash bollards at column base
      const bollard = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.7, 16), yellowSteelMat);
      bollard.position.set(0.25, 0.35, 0.25);
      beamG.add(bollard);

      return beamG;
    };

    factoryBgGroup.add(createIBeam(-6.5, -4.5));
    factoryBgGroup.add(createIBeam(0, -4.5));
    factoryBgGroup.add(createIBeam(6.5, -4.5));

    // Yellow Safety Wire-Mesh Perimeter Machine Guard Fence (Behind Conveyor - Image 1!)
    const fenceMat = new THREE.MeshStandardMaterial({
      color: 0xeab308, // Safety Yellow
      metalness: 0.4,
      roughness: 0.45,
    });
    const fenceWireMat = new THREE.MeshStandardMaterial({
      color: 0x1e293b,
      metalness: 0.7,
      roughness: 0.3,
      wireframe: true,
    });

    const createFenceSection = (xPos) => {
      const fG = new THREE.Group();
      fG.position.set(xPos, 0, -2.8);

      // Posts
      [-1.1, 1.1].forEach((px) => {
        const post = new THREE.Mesh(new THREE.BoxGeometry(0.06, 2.2, 0.06), fenceMat);
        post.position.set(px, 1.1, 0);
        fG.add(post);
        const foot = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.02, 0.16), fenceMat);
        foot.position.set(px, 0.01, 0);
        fG.add(foot);
      });
      // Frame rails
      [0.2, 1.1, 2.05].forEach((ry) => {
        const rail = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.04, 0.04), fenceMat);
        rail.position.set(0, ry, 0);
        fG.add(rail);
      });
      // Wire mesh panel
      const meshPanel = new THREE.Mesh(new THREE.PlaneGeometry(2.1, 1.8), fenceWireMat);
      meshPanel.position.set(0, 1.12, 0);
      fG.add(meshPanel);

      return fG;
    };

    [-4.6, -2.3, 0, 2.3, 4.6].forEach((fx) => {
      factoryBgGroup.add(createFenceSection(fx));
    });

    // Overhead High-Bay Warehouse LED Light Fixtures (Ceiling)
    const ledCaseMat = new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.8 });
    const ledLensMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
    [-3.5, 0, 3.5].forEach((hx) => {
      const bay = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.36, 0.12, 16), ledCaseMat);
      bay.position.set(hx, 5.2, 0);
      factoryBgGroup.add(bay);

      const lens = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.24, 0.02, 16), ledLensMat);
      lens.position.set(hx, 5.14, 0);
      factoryBgGroup.add(lens);

      // Drop conduit wire from roof
      const wire = new THREE.Mesh(new THREE.CylinderGeometry(0.006, 0.006, 1.8, 6), ledCaseMat);
      wire.position.set(hx, 6.1, 0);
      factoryBgGroup.add(wire);
    });

    // ----------------------------------------------------
    // HIGH-RES PROCEDURAL TEXTURES
    // ----------------------------------------------------

    // A. Real Industrial Conveyor Belt Texture (Continuous PVC with Diamond Grip Stipple & Edge Lines)
    const beltCanvas = document.createElement('canvas');
    beltCanvas.width = 512;
    beltCanvas.height = 512;
    const bCtx = beltCanvas.getContext('2d');

    // Base Charcoal/Anthracite Matte PVC
    bCtx.fillStyle = '#222933';
    bCtx.fillRect(0, 0, 512, 512);

    // Fine Diamond / Checker Grip Stipple
    bCtx.fillStyle = '#2d3748';
    for (let py = 0; py < 512; py += 8) {
      for (let px = 0; px < 512; px += 8) {
        if ((px + py) % 16 === 0) {
          bCtx.fillRect(px, py, 4, 4);
        }
      }
    }

    // Yellow Dashed Edge Tracking Stripe (Left & Right margins)
    bCtx.fillStyle = '#eab308';
    for (let y = 0; y < 512; y += 32) {
      bCtx.fillRect(20, y, 8, 18);
      bCtx.fillRect(512 - 28, y, 8, 18);
    }

    // Transverse Vulcanized Belt Joint Splice Line
    bCtx.strokeStyle = '#111827';
    bCtx.lineWidth = 3;
    bCtx.beginPath();
    bCtx.moveTo(0, 256);
    bCtx.lineTo(512, 256);
    bCtx.stroke();

    const beltTexture = new THREE.CanvasTexture(beltCanvas);
    beltTexture.wrapS = THREE.RepeatWrapping;
    beltTexture.wrapT = THREE.RepeatWrapping;
    beltTexture.repeat.set(10, 1);
    simRef.current.beltTexture = beltTexture;

    // B. Real Corrugated Cardboard Shipping Box Texture (Kraft with Tape & Shipping Labels)
    const makeBoxCanvas = (isNg) => {
      const bCanvas = document.createElement('canvas');
      bCanvas.width = 512;
      bCanvas.height = 512;
      const ctx = bCanvas.getContext('2d');

      // Kraft Cardboard Base
      ctx.fillStyle = isNg ? '#991b1b' : '#b67a48';
      ctx.fillRect(0, 0, 512, 512);

      // Cardboard flute fiber grain
      ctx.fillStyle = isNg ? '#7f1d1d' : '#a36735';
      for (let ly = 0; ly < 512; ly += 6) {
        ctx.fillRect(0, ly, 512, 2);
      }

      // Packaging Box Center Seam with Semi-Translucent Shipping Tape
      ctx.fillStyle = 'rgba(175, 115, 50, 0.78)';
      ctx.fillRect(190, 0, 132, 512);
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.25)';
      ctx.lineWidth = 2;
      ctx.strokeRect(190, 0, 132, 512);

      // White Shipping / Logistics Label
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(45, 55, 210, 150);
      ctx.strokeStyle = '#0f172a';
      ctx.lineWidth = 2;
      ctx.strokeRect(45, 55, 210, 150);

      // Barcode lines on label
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(60, 75, 180, 40);
      ctx.fillStyle = '#ffffff';
      for (let bx = 65; bx < 235; bx += Math.floor(Math.random() * 6 + 3)) {
        ctx.fillRect(bx, 75, 2, 40);
      }

      // 2D DataMatrix / QR Code square
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(60, 125, 30, 30);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(66, 131, 18, 18);
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(72, 137, 6, 6);

      // Tracking ID & Verification text
      ctx.fillStyle = '#0f172a';
      ctx.font = 'bold 13px monospace';
      ctx.fillText('RVM-EXP 500g', 100, 142);
      ctx.font = 'bold 11px sans-serif';
      ctx.fillStyle = isNg ? '#dc2626' : '#15803d';
      ctx.fillText(isNg ? 'DEFECT DETECTED' : 'PASS: VERIFIED', 100, 158);

      // Red Fragile Wineglass & Up Arrows
      ctx.fillStyle = '#dc2626';
      ctx.font = 'bold 24px sans-serif';
      ctx.fillText('↑↑ 🍷', 60, 192);

      // Defect stamp for NG boxes
      if (isNg) {
        ctx.save();
        ctx.translate(340, 340);
        ctx.rotate(-0.32);
        ctx.strokeStyle = '#f87171';
        ctx.lineWidth = 6;
        ctx.strokeRect(-95, -38, 190, 76);
        ctx.fillStyle = '#f87171';
        ctx.font = 'bold 30px sans-serif';
        ctx.fillText('REJECT', -60, 12);
        ctx.restore();
      }

      const tex = new THREE.CanvasTexture(bCanvas);
      tex.minFilter = THREE.LinearFilter;
      return tex;
    };

    const okBoxTexture = makeBoxCanvas(false);
    const ngBoxTexture = makeBoxCanvas(true);
    simRef.current.okBoxTexture = okBoxTexture;
    simRef.current.ngBoxTexture = ngBoxTexture;

    // ----------------------------------------------------
    // 4. AUTHENTIC INDUSTRIAL CONVEYOR ASSEMBLY
    // Matching Reference Image 1 & 2
    // ----------------------------------------------------
    const conveyorGroup = new THREE.Group();
    scene.add(conveyorGroup);

    // High-Grade Anodized Aluminum Extrusion Materials
    const aluExtrusionMat = new THREE.MeshStandardMaterial({
      color: 0xc4d1db, // Bright brushed anodized aluminum
      metalness: 0.92,
      roughness: 0.24,
    });
    const darkSlotMat = new THREE.MeshStandardMaterial({
      color: 0x1e293b,
      roughness: 0.75,
    });
    const bearingCastMat = new THREE.MeshStandardMaterial({
      color: 0x1d4ed8, // Industrial machine blue cast iron (SKF/FYH style)
      metalness: 0.68,
      roughness: 0.4,
    });
    const chromeMat = new THREE.MeshStandardMaterial({
      color: 0xf8fafc,
      metalness: 0.98,
      roughness: 0.1,
    });
    const yellowCableTrayMat = new THREE.MeshStandardMaterial({
      color: 0xeab308, // Safety Yellow Wire Basket Cable Tray
      metalness: 0.5,
      roughness: 0.35,
    });

    const railLength = 8.8;

    // Longitudinal 80x40 Bosch Rexroth Extrusion Rails with Dual T-Slots
    const createExtrusionRail = (zPos) => {
      const railG = new THREE.Group();
      railG.position.set(0, 0.95, zPos);

      // Main structural profile beam
      const mainProfile = new THREE.Mesh(new THREE.BoxGeometry(railLength, 0.16, 0.08), aluExtrusionMat);
      mainProfile.castShadow = true;
      mainProfile.receiveShadow = true;
      railG.add(mainProfile);

      // Dual T-Slot grooves (dark recessed longitudinal channels)
      [-0.035, 0.035].forEach((sy) => {
        const tSlot = new THREE.Mesh(new THREE.BoxGeometry(railLength, 0.018, 0.012), darkSlotMat);
        tSlot.position.set(0, sy, zPos > 0 ? 0.041 : -0.041);
        railG.add(tSlot);
      });

      // Black PVC end caps
      [-railLength / 2 - 0.005, railLength / 2 + 0.005].forEach((cx) => {
        const cap = new THREE.Mesh(new THREE.BoxGeometry(0.01, 0.162, 0.082), darkSlotMat);
        cap.position.x = cx;
        railG.add(cap);
      });

      return railG;
    };

    conveyorGroup.add(createExtrusionRail(0.46));
    conveyorGroup.add(createExtrusionRail(-0.46));

    // Support Legs with Gusset Brackets & Swivel Leveling Feet
    const legXPositions = [-3.8, -1.3, 1.3, 3.8];
    const legExtrusionGeo = new THREE.BoxGeometry(0.08, 0.95, 0.08);
    const gussetGeo = new THREE.BoxGeometry(0.08, 0.08, 0.08);
    const levelingFootGeo = new THREE.CylinderGeometry(0.085, 0.095, 0.04, 16);

    legXPositions.forEach((lx) => {
      [0.42, -0.42].forEach((lz) => {
        // Upright leg
        const leg = new THREE.Mesh(legExtrusionGeo, aluExtrusionMat);
        leg.position.set(lx, 0.475, lz);
        leg.castShadow = true;
        conveyorGroup.add(leg);

        // Corner gusset bracket
        const gusset = new THREE.Mesh(gussetGeo, darkSlotMat);
        gusset.position.set(lx, 0.91, lz);
        conveyorGroup.add(gusset);

        // Threaded leveling foot pad
        const foot = new THREE.Mesh(levelingFootGeo, darkSlotMat);
        foot.position.set(lx, 0.02, lz);
        conveyorGroup.add(foot);

        const threadStud = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.06, 8), chromeMat);
        threadStud.position.set(lx, 0.05, lz);
        conveyorGroup.add(threadStud);
      });

      // Horizontal Cross-Brace between front & back legs
      const crossBrace = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.06, 0.84), aluExtrusionMat);
      crossBrace.position.set(lx, 0.45, 0);
      conveyorGroup.add(crossBrace);
    });

    // Stainless Slider Bed Plate (under the top belt)
    const sliderBed = new THREE.Mesh(
      new THREE.BoxGeometry(8.3, 0.015, 0.84),
      new THREE.MeshStandardMaterial({ color: 0xd1d5db, metalness: 0.9, roughness: 0.2 })
    );
    sliderBed.position.set(0, 0.99, 0);
    conveyorGroup.add(sliderBed);

    // ----------------------------------------------------
    // CONTINUOUS CLOSED-LOOP BELT (TOP + WRAPS + BOTTOM)
    // ----------------------------------------------------
    const beltMat = new THREE.MeshStandardMaterial({
      map: beltTexture,
      roughness: 0.78,
      metalness: 0.08,
    });
    simRef.current.beltTopMat = beltMat;

    // Top carrying strand (moving forward)
    const mainBeltTop = new THREE.Mesh(new THREE.BoxGeometry(8.26, 0.015, 0.82), beltMat);
    mainBeltTop.position.set(0, 1.01, 0);
    mainBeltTop.receiveShadow = true;
    conveyorGroup.add(mainBeltTop);

    // Bottom return strand (underneath)
    const mainBeltBot = new THREE.Mesh(new THREE.BoxGeometry(8.26, 0.015, 0.82), beltMat);
    mainBeltBot.position.set(0, 0.89, 0);
    conveyorGroup.add(mainBeltBot);

    // Crowned End Pulley Drums & 4-Bolt Flange Bearings
    const drumGeo = new THREE.CylinderGeometry(0.075, 0.075, 0.86, 24);
    drumGeo.rotateX(Math.PI / 2);

    const bearingBlockGeo = new THREE.BoxGeometry(0.06, 0.15, 0.15);
    const bearingHubGeo = new THREE.CylinderGeometry(0.045, 0.045, 0.08, 16);
    bearingHubGeo.rotateX(Math.PI / 2);

    // Curved belt wrap around drums (Half-Cylinder Shells)
    const wrapGeoLeft = new THREE.CylinderGeometry(0.082, 0.082, 0.82, 24, 1, true, Math.PI / 2, Math.PI);
    wrapGeoLeft.rotateX(Math.PI / 2);
    const wrapBeltLeft = new THREE.Mesh(wrapGeoLeft, beltMat);
    wrapBeltLeft.position.set(-4.15, 0.95, 0);
    conveyorGroup.add(wrapBeltLeft);

    const wrapGeoRight = new THREE.CylinderGeometry(0.082, 0.082, 0.82, 24, 1, true, -Math.PI / 2, Math.PI);
    wrapGeoRight.rotateX(Math.PI / 2);
    const wrapBeltRight = new THREE.Mesh(wrapGeoRight, beltMat);
    wrapBeltRight.position.set(4.15, 0.95, 0);
    conveyorGroup.add(wrapBeltRight);

    const endDrums = [];
    [-4.15, 4.15].forEach((dx) => {
      // Crowned steel drive/tail pulley drum
      const drum = new THREE.Mesh(drumGeo, chromeMat);
      drum.position.set(dx, 0.95, 0);
      conveyorGroup.add(drum);
      endDrums.push(drum);

      // Flanged Bearing units on both sides of shaft
      [0.48, -0.48].forEach((bz) => {
        const bearingBlock = new THREE.Mesh(bearingBlockGeo, bearingCastMat);
        bearingBlock.position.set(dx, 0.95, bz);
        conveyorGroup.add(bearingBlock);

        const hub = new THREE.Mesh(bearingHubGeo, chromeMat);
        hub.position.set(dx, 0.95, bz);
        conveyorGroup.add(hub);

        // 4 hex bolts on flange
        [[-0.045, -0.045], [-0.045, 0.045], [0.045, -0.045], [0.045, 0.045]].forEach(([bx, by]) => {
          const bolt = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.02, 6), chromeMat);
          bolt.rotation.x = Math.PI / 2;
          bolt.position.set(dx + bx, 0.95 + by, bz > 0 ? bz + 0.04 : bz - 0.04);
          conveyorGroup.add(bolt);
        });
      });
    });
    simRef.current.endDrums = endDrums;

    // Underside Return Idler Rollers along conveyor
    const rollerCount = 20;
    const rollerGeo = new THREE.CylinderGeometry(0.034, 0.034, 0.84, 16);
    rollerGeo.rotateX(Math.PI / 2);
    const rollerMeshMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.9, roughness: 0.22 });
    const rollers = [];
    const stepX = 7.6 / (rollerCount - 1);
    for (let r = 0; r < rollerCount; r++) {
      const rx = -3.8 + r * stepX;
      const roller = new THREE.Mesh(rollerGeo, rollerMeshMat);
      roller.position.set(rx, 0.91, 0);
      conveyorGroup.add(roller);
      rollers.push(roller);
    }
    simRef.current.rollers = rollers;

    // ----------------------------------------------------
    // YELLOW WIRE-MESH CABLE BASKET TRAY (Legrand Cablofil - Image 1!)
    // ----------------------------------------------------
    const cableTrayGroup = new THREE.Group();
    cableTrayGroup.position.set(0, 0.72, 0.48);
    conveyorGroup.add(cableTrayGroup);

    // Longitudinal yellow side rods of cable tray
    [-0.08, 0, 0.08].forEach((cy) => {
      const rod = new THREE.Mesh(new THREE.CylinderGeometry(0.006, 0.006, 8.2, 8), yellowCableTrayMat);
      rod.rotation.z = Math.PI / 2;
      rod.position.set(0, cy, 0);
      cableTrayGroup.add(rod);
    });
    // Cross wire ribs along cable tray
    for (let tx = -4.0; tx <= 4.0; tx += 0.4) {
      const rib = new THREE.Mesh(new THREE.CylinderGeometry(0.005, 0.005, 0.18, 8), yellowCableTrayMat);
      rib.position.set(tx, 0, 0);
      cableTrayGroup.add(rib);
    }
    // Industrial black and blue power & control cables lying inside cable tray
    const blackCable = new THREE.Mesh(
      new THREE.CylinderGeometry(0.016, 0.016, 8.1, 8),
      new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.6 })
    );
    blackCable.rotation.z = Math.PI / 2;
    blackCable.position.set(0, 0.02, -0.02);
    cableTrayGroup.add(blackCable);

    const blueCable = new THREE.Mesh(
      new THREE.CylinderGeometry(0.012, 0.012, 8.1, 8),
      new THREE.MeshStandardMaterial({ color: 0x0284c7, roughness: 0.5 })
    );
    blueCable.rotation.z = Math.PI / 2;
    blueCable.position.set(0, 0.03, 0.02);
    cableTrayGroup.add(blueCable);

    // ----------------------------------------------------
    // ADJUSTABLE STAINLESS GUIDE RAILS WITH GREEN UHMW WEAR STRIPS
    // ----------------------------------------------------
    const guideBarGeo = new THREE.CylinderGeometry(0.012, 0.012, 8.4, 12);
    guideBarGeo.rotateZ(Math.PI / 2);
    const wearStripGeo = new THREE.BoxGeometry(8.4, 0.045, 0.015);
    const uhmwGreenMat = new THREE.MeshStandardMaterial({ color: 0x15803d, roughness: 0.35 });

    [0.43, -0.43].forEach((gz) => {
      const rod = new THREE.Mesh(guideBarGeo, chromeMat);
      rod.position.set(0, 1.12, gz);
      conveyorGroup.add(rod);

      const strip = new THREE.Mesh(wearStripGeo, uhmwGreenMat);
      strip.position.set(0, 1.12, gz > 0 ? gz - 0.015 : gz + 0.015);
      conveyorGroup.add(strip);

      // Standoff clamp brackets
      [-3.2, -1.0, 1.0, 3.2].forEach((bx) => {
        const standoff = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.16, 0.03), darkSlotMat);
        standoff.position.set(bx, 1.05, gz);
        conveyorGroup.add(standoff);
      });
    });

    // ----------------------------------------------------
    // SIDE INDUSTRIAL SENSORS & COILED CABLES (Directly matching Image 2!)
    // ----------------------------------------------------
    const sensorAssemblyGroup = new THREE.Group();
    sensorAssemblyGroup.position.set(-1.1, 0.95, 0.46);
    conveyorGroup.add(sensorAssemblyGroup);

    // Stainless vertical standoff rod with split collar clamp
    const rodPost = new THREE.Mesh(new THREE.CylinderGeometry(0.01, 0.01, 0.35, 12), chromeMat);
    rodPost.position.set(0, 0.17, 0.04);
    sensorAssemblyGroup.add(rodPost);

    const collar = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.03, 0.04), darkSlotMat);
    collar.position.set(0, 0.22, 0.04);
    sensorAssemblyGroup.add(collar);

    // Industrial Photoelectric Sensor Body (Black with Yellow Front Face & Green LED - Image 2!)
    const photoSensorBody = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.08, 0.04), darkSlotMat);
    photoSensorBody.position.set(0, 0.22, 0);
    sensorAssemblyGroup.add(photoSensorBody);

    const yellowFace = new THREE.Mesh(new THREE.BoxGeometry(0.038, 0.076, 0.005), new THREE.MeshStandardMaterial({ color: 0xfacc15 }));
    yellowFace.position.set(0, 0.22, -0.021);
    sensorAssemblyGroup.add(yellowFace);

    const sensorLed = new THREE.Mesh(new THREE.SphereGeometry(0.006, 8, 8), new THREE.MeshBasicMaterial({ color: 0x22c55e }));
    sensorLed.position.set(0, 0.25, 0.021);
    sensorAssemblyGroup.add(sensorLed);

    // Coiled Blue & Orange Signal Cables Looping Down to Cable Tray (Image 2!)
    const curveBlue = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0, 0.18, 0.03),
      new THREE.Vector3(0.05, 0.08, 0.08),
      new THREE.Vector3(-0.04, -0.05, 0.06),
      new THREE.Vector3(0.03, -0.15, 0.04),
      new THREE.Vector3(0, -0.23, 0.02),
    ]);
    const blueCoilMesh = new THREE.Mesh(
      new THREE.TubeGeometry(curveBlue, 24, 0.006, 8, false),
      new THREE.MeshStandardMaterial({ color: 0x0284c7, roughness: 0.4 })
    );
    sensorAssemblyGroup.add(blueCoilMesh);

    const curveOrange = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0.02, 0.18, 0.03),
      new THREE.Vector3(-0.04, 0.09, 0.07),
      new THREE.Vector3(0.04, -0.04, 0.05),
      new THREE.Vector3(-0.02, -0.14, 0.03),
      new THREE.Vector3(0.01, -0.23, 0.02),
    ]);
    const orangeCoilMesh = new THREE.Mesh(
      new THREE.TubeGeometry(curveOrange, 24, 0.006, 8, false),
      new THREE.MeshStandardMaterial({ color: 0xf97316, roughness: 0.4 })
    );
    sensorAssemblyGroup.add(orangeCoilMesh);

    // Laser ray across the belt
    const laserRayGeo = new THREE.CylinderGeometry(0.004, 0.004, 0.88, 6);
    laserRayGeo.rotateX(Math.PI / 2);
    const sensorRayMat = new THREE.MeshBasicMaterial({ color: 0xef4444, transparent: true, opacity: 0.85 });
    const sensor1Ray = new THREE.Mesh(laserRayGeo, sensorRayMat);
    sensor1Ray.position.set(0, 0.22, -0.46);
    sensorAssemblyGroup.add(sensor1Ray);
    simRef.current.sensorRayMat = sensorRayMat;

    // Conveyor Side-Mounted Signal Tower Light (Directly on Rail - Image 2!)
    const convTowerGroup = new THREE.Group();
    convTowerGroup.position.set(-2.6, 0.95, 0.48);
    conveyorGroup.add(convTowerGroup);

    const convTowerPole = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.45, 12), chromeMat);
    convTowerPole.position.y = 0.225;
    convTowerGroup.add(convTowerPole);

    const lensGeo = new THREE.CylinderGeometry(0.036, 0.036, 0.07, 16);
    const convRedMat = new THREE.MeshStandardMaterial({ color: 0x450a0a, emissive: 0x000000 });
    const convYellowMat = new THREE.MeshStandardMaterial({ color: 0x451a03, emissive: 0x000000 });
    const convGreenMat = new THREE.MeshStandardMaterial({ color: 0x22c55e, emissive: 0x22c55e, emissiveIntensity: 0.9 });

    const cRed = new THREE.Mesh(lensGeo, convRedMat);
    cRed.position.y = 0.45 + 0.14;
    convTowerGroup.add(cRed);

    const cYellow = new THREE.Mesh(lensGeo, convYellowMat);
    cYellow.position.y = 0.45 + 0.07;
    convTowerGroup.add(cYellow);

    const cGreen = new THREE.Mesh(lensGeo, convGreenMat);
    cGreen.position.y = 0.45;
    convTowerGroup.add(cGreen);

    simRef.current.conveyorTowerRedMat = convRedMat;
    simRef.current.conveyorTowerYellowMat = convYellowMat;
    simRef.current.conveyorTowerGreenMat = convGreenMat;

    // ----------------------------------------------------
    // SEW-EURODRIVE AC HELICAL GEARMOTOR & TRANSMISSION
    // ----------------------------------------------------
    const motorGroup = new THREE.Group();
    motorGroup.position.set(-4.2, 0.65, 0.65);
    conveyorGroup.add(motorGroup);

    // Cast Iron Helical Gearbox with Ribs
    const gearGeo = new THREE.BoxGeometry(0.3, 0.32, 0.28);
    const gearBox = new THREE.Mesh(gearGeo, bearingCastMat);
    gearBox.castShadow = true;
    motorGroup.add(gearBox);

    // Electric Motor Body (Industrial Cyan with cooling fins)
    const motorCylinder = new THREE.Mesh(
      new THREE.CylinderGeometry(0.14, 0.14, 0.36, 20),
      new THREE.MeshStandardMaterial({ color: 0x0284c7, metalness: 0.75, roughness: 0.35 })
    );
    motorCylinder.rotation.z = Math.PI / 2;
    motorCylinder.position.set(-0.32, 0, 0);
    motorGroup.add(motorCylinder);

    // Rear Fan Cowl Cover
    const fanCover = new THREE.Mesh(new THREE.CylinderGeometry(0.142, 0.142, 0.08, 20), darkSlotMat);
    fanCover.rotation.z = Math.PI / 2;
    fanCover.position.set(-0.52, 0, 0);
    motorGroup.add(fanCover);

    // Terminal Box on Top
    const termBox = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.12, 0.12), darkSlotMat);
    termBox.position.set(-0.28, 0.18, 0);
    motorGroup.add(termBox);

    // Flexible Black Conduit connecting Motor into Cable Tray
    const conduitGeo = new THREE.CylinderGeometry(0.02, 0.02, 0.55, 10);
    conduitGeo.rotateX(Math.PI / 3);
    const conduit = new THREE.Mesh(conduitGeo, darkSlotMat);
    conduit.position.set(-0.28, -0.12, -0.2);
    motorGroup.add(conduit);

    // ----------------------------------------------------
    // 5. DYNAMIC CHECKWEIGHER (IN-LINE WEIGHING SCALE PLATFORM)
    // Located at X = -1.8m
    // ----------------------------------------------------
    const scaleGroup = new THREE.Group();
    scaleGroup.position.set(-1.8, 0.98, 0);
    conveyorGroup.add(scaleGroup);

    // Stainless Steel Weighing Deck Plate (#4 Sanitary Brushed Stainless)
    const scaleBedGeo = new THREE.BoxGeometry(0.72, 0.035, 0.78);
    const scalePlatform = new THREE.Mesh(scaleBedGeo, chromeMat);
    scalePlatform.position.set(0, 0.02, 0);
    scaleGroup.add(scalePlatform);
    simRef.current.scalePlatform = scalePlatform;

    // 4 Corner Load Cell Strain Gauges
    const loadCellMat = new THREE.MeshStandardMaterial({ color: 0xfacc15, metalness: 0.9 });
    [[-0.3, -0.32], [0.3, -0.32], [-0.3, 0.32], [0.3, 0.32]].forEach(([cx, cz]) => {
      const lc = new THREE.Mesh(new THREE.CylinderGeometry(0.024, 0.024, 0.045, 12), loadCellMat);
      lc.position.set(cx, -0.02, cz);
      scaleGroup.add(lc);
    });

    // Checkweigher Digital Indicator Box on Side
    const weightTerminal = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.16, 0.08), darkSlotMat);
    weightTerminal.position.set(0, 0.22, 0.54);
    scaleGroup.add(weightTerminal);

    const weightScreen = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.08, 0.01), new THREE.MeshBasicMaterial({ color: 0x22c55e }));
    weightScreen.position.set(0, 0.22, 0.585);
    scaleGroup.add(weightScreen);

    // ----------------------------------------------------
    // 6. MACHINE VISION INSPECTION GANTRY & COGNEX CAMERA
    // Located at X = -0.4m
    // ----------------------------------------------------
    const visionGantry = new THREE.Group();
    visionGantry.position.set(-0.4, 0, 0);
    conveyorGroup.add(visionGantry);

    // Sturdy 40x40 Arch Gantry with Gusset Plates
    const archLegF = new THREE.Mesh(new THREE.BoxGeometry(0.08, 1.6, 0.08), aluExtrusionMat);
    archLegF.position.set(0, 1.6, 0.58);
    visionGantry.add(archLegF);

    const archLegB = new THREE.Mesh(new THREE.BoxGeometry(0.08, 1.6, 0.08), aluExtrusionMat);
    archLegB.position.set(0, 1.6, -0.58);
    visionGantry.add(archLegB);

    const archBridge = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.08, 1.24), aluExtrusionMat);
    archBridge.position.set(0, 2.38, 0);
    visionGantry.add(archBridge);

    // Cognex In-Sight Style Industrial Camera (Safety Orange)
    const cameraBody = new THREE.Mesh(
      new THREE.BoxGeometry(0.14, 0.18, 0.14),
      new THREE.MeshStandardMaterial({ color: 0xf97316, metalness: 0.5, roughness: 0.35 })
    );
    cameraBody.position.set(0, 2.18, 0);
    visionGantry.add(cameraBody);

    // C-Mount Telecentric Lens with Chrome Knurled Rings
    const lens = new THREE.Mesh(
      new THREE.CylinderGeometry(0.045, 0.05, 0.08, 16),
      new THREE.MeshStandardMaterial({ color: 0x0f172a, metalness: 0.9, roughness: 0.1 })
    );
    lens.position.set(0, 2.06, 0);
    visionGantry.add(lens);

    // High-Intensity Diffused LED Ring Illuminator
    const ringLightGeo = new THREE.TorusGeometry(0.065, 0.012, 12, 24);
    ringLightGeo.rotateX(Math.PI / 2);
    const ringLight = new THREE.Mesh(ringLightGeo, new THREE.MeshBasicMaterial({ color: 0xffffff }));
    ringLight.position.set(0, 2.05, 0);
    visionGantry.add(ringLight);

    // Laser Sheet Scanner Plane & Downward Spot Strobe
    const laserSheetGeo = new THREE.PlaneGeometry(0.02, 1.05);
    laserSheetGeo.rotateX(Math.PI / 2);
    const scanLaserPlane = new THREE.Mesh(
      laserSheetGeo,
      new THREE.MeshBasicMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.75, side: THREE.DoubleSide })
    );
    scanLaserPlane.position.set(0, 1.025, 0);
    visionGantry.add(scanLaserPlane);
    simRef.current.scanLaserPlane = scanLaserPlane;

    const scanSpotLight = new THREE.SpotLight(0x38bdf8, 4, 3, Math.PI / 5, 0.4);
    scanSpotLight.position.set(0, 2.05, 0);
    scanSpotLight.target = scanLaserPlane;
    visionGantry.add(scanSpotLight);
    simRef.current.scanSpotLight = scanSpotLight;

    // ----------------------------------------------------
    // 7. ARTICULATED 24" VISION OPERATOR MONITOR SCREEN
    // ----------------------------------------------------
    const monitorStation = new THREE.Group();
    monitorStation.position.set(-0.4, 0, 1.15);
    scene.add(monitorStation);

    const standPost = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.045, 1.45, 16), darkSlotMat);
    standPost.position.set(0, 0.725, 0);
    standPost.castShadow = true;
    monitorStation.add(standPost);

    const standBase = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.25, 0.04, 20), darkSlotMat);
    standBase.position.set(0, 0.02, 0);
    monitorStation.add(standBase);

    const armMesh = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.05, 0.35), aluExtrusionMat);
    armMesh.position.set(0, 1.45, -0.12);
    monitorStation.add(armMesh);

    const monitorHousing = new THREE.Mesh(new THREE.BoxGeometry(0.72, 0.46, 0.04), darkSlotMat);
    monitorHousing.position.set(0, 1.55, -0.3);
    monitorHousing.rotation.x = -0.15;
    monitorStation.add(monitorHousing);

    // Dynamic Canvas for Live Vision Monitor Feed
    const monitorCanvas = document.createElement('canvas');
    monitorCanvas.width = 512;
    monitorCanvas.height = 320;
    const monitorCtx = monitorCanvas.getContext('2d');
    const monitorTexture = new THREE.CanvasTexture(monitorCanvas);
    monitorTexture.minFilter = THREE.LinearFilter;
    simRef.current.monitorTexture = monitorTexture;
    simRef.current.monitorCanvas = monitorCanvas;
    simRef.current.monitorCtx = monitorCtx;

    const monitorScreen = new THREE.Mesh(new THREE.BoxGeometry(0.66, 0.4, 0.01), new THREE.MeshBasicMaterial({ map: monitorTexture }));
    monitorScreen.position.set(0, 1.55, -0.278);
    monitorScreen.rotation.x = -0.15;
    monitorStation.add(monitorScreen);

    // ----------------------------------------------------
    // 8. REAL INDUSTRIAL RITTAL PLC PANEL ON LEFT SIDE
    // Placed at x = -4.2m, z = -1.35m with ample walkway clearance behind the conveyor.
    // ----------------------------------------------------
    const cabinetGroup = new THREE.Group();
    cabinetGroup.position.set(-4.2, 0, -1.35);
    scene.add(cabinetGroup);

    const cabWidth = 1.18;
    const cabHeight = 1.85;
    const cabDepth = 0.46;

    const plinth = new THREE.Mesh(new THREE.BoxGeometry(cabWidth + 0.04, 0.12, cabDepth + 0.04), darkSlotMat);
    plinth.position.set(0, 0.06, 0);
    cabinetGroup.add(plinth);

    const rittalGrayMat = new THREE.MeshStandardMaterial({
      color: 0xc8d1d9, // RAL 7035 Light Grey
      metalness: 0.45,
      roughness: 0.38,
    });

    // Enclosure walls
    const backWall = new THREE.Mesh(new THREE.BoxGeometry(cabWidth, cabHeight, 0.03), rittalGrayMat);
    backWall.position.set(0, cabHeight / 2 + 0.12, -cabDepth / 2 + 0.015);
    cabinetGroup.add(backWall);

    const leftWall = new THREE.Mesh(new THREE.BoxGeometry(0.03, cabHeight, cabDepth), rittalGrayMat);
    leftWall.position.set(-cabWidth / 2 + 0.015, cabHeight / 2 + 0.12, 0);
    cabinetGroup.add(leftWall);

    const rightWall = new THREE.Mesh(new THREE.BoxGeometry(0.03, cabHeight, cabDepth), rittalGrayMat);
    rightWall.position.set(cabWidth / 2 - 0.015, cabHeight / 2 + 0.12, 0);
    cabinetGroup.add(rightWall);

    const louver = new THREE.Mesh(new THREE.BoxGeometry(0.01, 0.28, 0.22), new THREE.MeshStandardMaterial({ color: 0x475569 }));
    louver.position.set(cabWidth / 2 - 0.01, cabHeight / 2 + 0.35, 0);
    cabinetGroup.add(louver);

    const roof = new THREE.Mesh(new THREE.BoxGeometry(cabWidth, 0.04, cabDepth), rittalGrayMat);
    roof.position.set(0, cabHeight + 0.12, 0);
    cabinetGroup.add(roof);

    const bottomPlate = new THREE.Mesh(new THREE.BoxGeometry(cabWidth, 0.04, cabDepth), rittalGrayMat);
    bottomPlate.position.set(0, 0.14, 0);
    cabinetGroup.add(bottomPlate);

    // Panel Interior
    const interiorGroup = new THREE.Group();
    cabinetGroup.add(interiorGroup);

    const backplate = new THREE.Mesh(
      new THREE.BoxGeometry(cabWidth - 0.08, cabHeight - 0.15, 0.015),
      new THREE.MeshStandardMaterial({ color: 0xe2e8f0, metalness: 0.9, roughness: 0.28 })
    );
    backplate.position.set(0, cabHeight / 2 + 0.12, -cabDepth / 2 + 0.04);
    interiorGroup.add(backplate);

    // Slotted Wire Ducts (Grey Slotted Wireways)
    const ductMat = new THREE.MeshStandardMaterial({ color: 0x64748b, roughness: 0.6 });
    [-0.55, -0.15, 0.28, 0.68].forEach((dy) => {
      const duct = new THREE.Mesh(new THREE.BoxGeometry(cabWidth - 0.12, 0.07, 0.05), ductMat);
      duct.position.set(0, cabHeight / 2 + 0.12 + dy, -cabDepth / 2 + 0.07);
      interiorGroup.add(duct);
    });

    // Steel DIN Rails
    const dinRailMat = new THREE.MeshStandardMaterial({ color: 0xcfd8dc, metalness: 0.95, roughness: 0.15 });
    [-0.35, 0.07, 0.48].forEach((ry) => {
      const dinRail = new THREE.Mesh(new THREE.BoxGeometry(cabWidth - 0.18, 0.035, 0.01), dinRailMat);
      dinRail.position.set(0, cabHeight / 2 + 0.12 + ry, -cabDepth / 2 + 0.06);
      interiorGroup.add(dinRail);
    });

    // Row 1: MCBs & 24V DC SMPS Power Supply
    const mcbMat = new THREE.MeshStandardMaterial({ color: 0xf1f5f9, roughness: 0.4 });
    const mcb3 = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.1, 0.07), mcbMat);
    mcb3.position.set(-0.46, cabHeight / 2 + 0.12 + 0.48, -cabDepth / 2 + 0.1);
    interiorGroup.add(mcb3);

    for (let b = 0; b < 4; b++) {
      const mcb1 = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.09, 0.065), mcbMat);
      mcb1.position.set(-0.35 + b * 0.045, cabHeight / 2 + 0.12 + 0.48, -cabDepth / 2 + 0.1);
      interiorGroup.add(mcb1);
    }

    const smps = new THREE.Mesh(
      new THREE.BoxGeometry(0.18, 0.12, 0.08),
      new THREE.MeshStandardMaterial({ color: 0x475569, metalness: 0.85, roughness: 0.3 })
    );
    smps.position.set(-0.04, cabHeight / 2 + 0.12 + 0.48, -cabDepth / 2 + 0.11);
    interiorGroup.add(smps);

    const contactor = new THREE.Mesh(new THREE.BoxGeometry(0.11, 0.11, 0.08), darkSlotMat);
    contactor.position.set(0.15, cabHeight / 2 + 0.12 + 0.48, -cabDepth / 2 + 0.11);
    interiorGroup.add(contactor);

    // Row 2: Siemens S7-1200 PLC System (CPU 1214C + I/O Expansion Cards)
    const plcCpu = new THREE.Mesh(
      new THREE.BoxGeometry(0.18, 0.14, 0.085),
      new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.4 })
    );
    plcCpu.position.set(-0.42, cabHeight / 2 + 0.12 + 0.07, -cabDepth / 2 + 0.11);
    interiorGroup.add(plcCpu);

    const plcStripe = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.015, 0.005), new THREE.MeshBasicMaterial({ color: 0x0ea5e9 }));
    plcStripe.position.set(0, 0.045, 0.043);
    plcCpu.add(plcStripe);

    const runLed = new THREE.Mesh(new THREE.BoxGeometry(0.01, 0.01, 0.005), new THREE.MeshBasicMaterial({ color: 0x22c55e }));
    runLed.position.set(-0.06, 0.015, 0.043);
    plcCpu.add(runLed);

    const plcModuleMat = new THREE.MeshStandardMaterial({ color: 0x475569, roughness: 0.45 });
    for (let m = 0; m < 4; m++) {
      const ioMod = new THREE.Mesh(new THREE.BoxGeometry(0.065, 0.14, 0.085), plcModuleMat);
      ioMod.position.set(-0.29 + m * 0.068, cabHeight / 2 + 0.12 + 0.07, -cabDepth / 2 + 0.11);
      interiorGroup.add(ioMod);
    }

    const safetyRelay = new THREE.Mesh(
      new THREE.BoxGeometry(0.065, 0.11, 0.08),
      new THREE.MeshStandardMaterial({ color: 0xfacc15, roughness: 0.4 })
    );
    safetyRelay.position.set(0.08, cabHeight / 2 + 0.12 + 0.07, -cabDepth / 2 + 0.1);
    interiorGroup.add(safetyRelay);

    // Row 3: Terminal Strips
    const termStripMain = new THREE.Mesh(new THREE.BoxGeometry(0.85, 0.07, 0.05), new THREE.MeshStandardMaterial({ color: 0x94a3b8 }));
    termStripMain.position.set(-0.06, cabHeight / 2 + 0.12 - 0.35, -cabDepth / 2 + 0.09);
    interiorGroup.add(termStripMain);

    const earthTerm = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.07, 0.05), new THREE.MeshStandardMaterial({ color: 0x84cc16 }));
    earthTerm.position.set(0.44, cabHeight / 2 + 0.12 - 0.35, -cabDepth / 2 + 0.09);
    interiorGroup.add(earthTerm);

    // Hinged Front Door with Live 15" Siemens HMI
    const doorPivot = new THREE.Group();
    doorPivot.position.set(-cabWidth / 2, 0, cabDepth / 2);
    cabinetGroup.add(doorPivot);
    simRef.current.doorPivot = doorPivot;

    const doorGroup = new THREE.Group();
    doorGroup.position.set(cabWidth / 2, cabHeight / 2 + 0.12, 0);
    doorPivot.add(doorGroup);

    const doorPanel = new THREE.Mesh(new THREE.BoxGeometry(cabWidth, cabHeight, 0.025), rittalGrayMat);
    doorGroup.add(doorPanel);

    const hingeGeo = new THREE.CylinderGeometry(0.018, 0.018, 0.08, 14);
    const hingeTop = new THREE.Mesh(hingeGeo, darkSlotMat);
    hingeTop.position.set(-cabWidth / 2 + 0.02, 0.65, 0.015);
    doorGroup.add(hingeTop);

    const hingeBot = new THREE.Mesh(hingeGeo, darkSlotMat);
    hingeBot.position.set(-cabWidth / 2 + 0.02, -0.65, 0.015);
    doorGroup.add(hingeBot);

    const handle = new THREE.Mesh(new THREE.BoxGeometry(0.035, 0.22, 0.04), darkSlotMat);
    handle.position.set(cabWidth / 2 - 0.05, 0, 0.03);
    doorGroup.add(handle);

    // High Voltage Warning Decal
    const warningDecal = new THREE.Mesh(new THREE.PlaneGeometry(0.12, 0.12), new THREE.MeshBasicMaterial({ color: 0xfacc15, side: THREE.DoubleSide }));
    warningDecal.position.set(cabWidth / 2 - 0.16, 0.72, 0.016);
    doorGroup.add(warningDecal);

    // Large 15" HMI Frame
    const hmiFrame = new THREE.Mesh(new THREE.BoxGeometry(0.68, 0.48, 0.03), darkSlotMat);
    hmiFrame.position.set(0, 0.32, 0.022);
    doorGroup.add(hmiFrame);

    // Dynamic 2D Canvas for Siemens WinCC HMI
    const hmiCanvas = document.createElement('canvas');
    hmiCanvas.width = 1024;
    hmiCanvas.height = 680;
    const hmiCtx = hmiCanvas.getContext('2d');
    const hmiTexture = new THREE.CanvasTexture(hmiCanvas);
    hmiTexture.minFilter = THREE.LinearFilter;
    simRef.current.hmiTexture = hmiTexture;
    simRef.current.hmiCanvas = hmiCanvas;
    simRef.current.hmiCtx = hmiCtx;

    const hmiGlass = new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.42, 0.01), new THREE.MeshBasicMaterial({ map: hmiTexture }));
    hmiGlass.position.set(0, 0.32, 0.038);
    doorGroup.add(hmiGlass);

    // Physical Push-Buttons on Door
    const clickableButtons = [];
    const btnBaseGeo = new THREE.CylinderGeometry(0.04, 0.04, 0.02, 18);
    btnBaseGeo.rotateX(Math.PI / 2);
    const bezelMat = new THREE.MeshStandardMaterial({ color: 0x475569, metalness: 0.9, roughness: 0.2 });

    const startBase = new THREE.Mesh(btnBaseGeo, bezelMat);
    startBase.position.set(-0.25, -0.18, 0.02);
    doorGroup.add(startBase);

    const startBtnMesh = new THREE.Mesh(
      new THREE.CylinderGeometry(0.028, 0.028, 0.03, 18),
      new THREE.MeshStandardMaterial({ color: 0x22c55e, emissive: 0x15803d, emissiveIntensity: 0.4 })
    );
    startBtnMesh.rotation.x = Math.PI / 2;
    startBtnMesh.position.set(-0.25, -0.18, 0.036);
    startBtnMesh.userData = { action: 'START' };
    doorGroup.add(startBtnMesh);
    clickableButtons.push(startBtnMesh);

    const stopBase = new THREE.Mesh(btnBaseGeo, bezelMat);
    stopBase.position.set(0, -0.18, 0.02);
    doorGroup.add(stopBase);

    const stopBtnMesh = new THREE.Mesh(
      new THREE.CylinderGeometry(0.028, 0.028, 0.03, 18),
      new THREE.MeshStandardMaterial({ color: 0xef4444, emissive: 0x991b1b, emissiveIntensity: 0.3 })
    );
    stopBtnMesh.rotation.x = Math.PI / 2;
    stopBtnMesh.position.set(0, -0.18, 0.036);
    stopBtnMesh.userData = { action: 'STOP' };
    doorGroup.add(stopBtnMesh);
    clickableButtons.push(stopBtnMesh);

    const estopBase = new THREE.Mesh(new THREE.CylinderGeometry(0.052, 0.052, 0.025, 18), new THREE.MeshStandardMaterial({ color: 0xfacc15, roughness: 0.4 }));
    estopBase.rotation.x = Math.PI / 2;
    estopBase.position.set(0.25, -0.18, 0.02);
    doorGroup.add(estopBase);

    const estopBtnMesh = new THREE.Mesh(
      new THREE.CylinderGeometry(0.048, 0.035, 0.045, 20),
      new THREE.MeshStandardMaterial({ color: 0xdc2626, emissive: 0x7f1d1d, emissiveIntensity: 0.5 })
    );
    estopBtnMesh.rotation.x = Math.PI / 2;
    estopBtnMesh.position.set(0.25, -0.18, 0.048);
    estopBtnMesh.userData = { action: 'ESTOP' };
    doorGroup.add(estopBtnMesh);
    clickableButtons.push(estopBtnMesh);

    simRef.current.clickableButtons = clickableButtons;

    // Tower Light on Roof of PLC Enclosure
    const stackPole = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.55, 14), aluExtrusionMat);
    stackPole.position.set(0.4, cabHeight + 0.12 + 0.275, 0);
    cabinetGroup.add(stackPole);

    const stackLensGeo = new THREE.CylinderGeometry(0.048, 0.048, 0.09, 18);

    const stackRedMat = new THREE.MeshStandardMaterial({ color: 0x450a0a, emissive: 0x000000 });
    const stackRed = new THREE.Mesh(stackLensGeo, stackRedMat);
    stackRed.position.set(0.4, cabHeight + 0.12 + 0.55 + 0.18, 0);
    cabinetGroup.add(stackRed);
    simRef.current.stackRedMat = stackRedMat;

    const stackYellowMat = new THREE.MeshStandardMaterial({ color: 0x451a03, emissive: 0x000000 });
    const stackYellow = new THREE.Mesh(stackLensGeo, stackYellowMat);
    stackYellow.position.set(0.4, cabHeight + 0.12 + 0.55 + 0.09, 0);
    cabinetGroup.add(stackYellow);
    simRef.current.stackYellowMat = stackYellowMat;

    const stackGreenMat = new THREE.MeshStandardMaterial({ color: 0x22c55e, emissive: 0x22c55e, emissiveIntensity: 0.95 });
    const stackGreen = new THREE.Mesh(stackLensGeo, stackGreenMat);
    stackGreen.position.set(0.4, cabHeight + 0.12 + 0.55, 0);
    cabinetGroup.add(stackGreen);
    simRef.current.stackGreenMat = stackGreenMat;

    // ----------------------------------------------------
    // 9. HIGH-SPEED PNEUMATIC REJECT PUSHER (AT X = 1.3m)
    // ----------------------------------------------------
    const sortingStation = new THREE.Group();
    sortingStation.position.set(1.3, 0, 0);
    conveyorGroup.add(sortingStation);

    // Festo/SMC Style Aluminum Cylinder Body
    const cylinderBody = new THREE.Mesh(
      new THREE.CylinderGeometry(0.05, 0.05, 0.35, 16),
      new THREE.MeshStandardMaterial({ color: 0x64748b, metalness: 0.85, roughness: 0.2 })
    );
    cylinderBody.rotation.z = Math.PI / 2;
    cylinderBody.rotation.y = Math.PI / 2;
    cylinderBody.position.set(0, 1.15, -0.65);
    sortingStation.add(cylinderBody);

    // Blue & Orange Polyurethane Pneumatic Hoses
    const hoseMat = new THREE.MeshStandardMaterial({ color: 0x0284c7, roughness: 0.4 });
    const hose1 = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.4, 8), hoseMat);
    hose1.position.set(-0.06, 1.25, -0.68);
    sortingStation.add(hose1);

    const pusherArm = new THREE.Group();
    pusherArm.position.set(0, 1.15, -0.45);
    sortingStation.add(pusherArm);
    simRef.current.pusherArm = pusherArm;

    const pistonRod = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.35, 12), chromeMat);
    pistonRod.rotation.x = Math.PI / 2;
    pusherArm.add(pistonRod);

    // Cushioned Foam Diverter Paddle
    const paddle = new THREE.Mesh(
      new THREE.BoxGeometry(0.36, 0.12, 0.03),
      new THREE.MeshStandardMaterial({ color: 0xf47b20, roughness: 0.5 })
    );
    paddle.position.set(0, 0, 0.18);
    pusherArm.add(paddle);

    // NG Reject Slide & Heavy-Duty Red Tote Bin
    const ngBinGroup = new THREE.Group();
    ngBinGroup.position.set(1.3, 0, 1.05);
    conveyorGroup.add(ngBinGroup);

    // Inclined Stainless Roller Slide Chute
    const chute = new THREE.Mesh(new THREE.BoxGeometry(0.65, 0.02, 0.75), chromeMat);
    chute.rotation.x = 0.24;
    chute.position.set(0, 0.92, -0.25);
    ngBinGroup.add(chute);

    // Individual small chrome rollers on the reject chute
    for (let cRoll = -0.28; cRoll <= 0.28; cRoll += 0.09) {
      const cr = new THREE.Mesh(new THREE.CylinderGeometry(0.014, 0.014, 0.58, 10), chromeMat);
      cr.rotation.z = Math.PI / 2;
      cr.position.set(0, 0.93 - (cRoll + 0.28) * 0.22, -0.45 + (cRoll + 0.28) * 0.85);
      ngBinGroup.add(cr);
    }

    const bin = new THREE.Mesh(new THREE.BoxGeometry(0.75, 0.55, 0.65), new THREE.MeshStandardMaterial({ color: 0xb91c1c, roughness: 0.65 }));
    bin.position.set(0, 0.3, 0.28);
    bin.castShadow = true;
    ngBinGroup.add(bin);

    // Finished Goods OK Output Roller Runout Table
    const okTable = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.95, 0.8), new THREE.MeshStandardMaterial({ color: 0x15803d, roughness: 0.6 }));
    okTable.position.set(4.6, 0.475, 0);
    conveyorGroup.add(okTable);

    // ----------------------------------------------------
    // 10. REALISTIC CORRUGATED BOX SPAWNER
    // ----------------------------------------------------
    const boxGeo = new THREE.BoxGeometry(0.38, 0.28, 0.32);

    const createBox = (isNg, idNum, forcedWeight) => {
      let weight = TARGET_WEIGHT + (Math.random() * 8 - 4);
      let defectReason = null;

      if (isNg) {
        if (forcedWeight === 'under') {
          weight = 435.0 + Math.random() * 15;
          defectReason = `Underweight (${weight.toFixed(1)}g < 485g)`;
        } else if (forcedWeight === 'over') {
          weight = 575.0 + Math.random() * 20;
          defectReason = `Overweight (${weight.toFixed(1)}g > 515g)`;
        } else {
          defectReason = DEFECT_TYPES[Math.floor(Math.random() * DEFECT_TYPES.length)];
          if (defectReason.includes('Underweight')) weight = 438.0;
          if (defectReason.includes('Overweight')) weight = 572.0;
        }
      }

      const boxMat = new THREE.MeshStandardMaterial({
        map: isNg ? simRef.current.ngBoxTexture : simRef.current.okBoxTexture,
        roughness: 0.78,
        metalness: 0.05,
      });

      const boxMesh = new THREE.Mesh(boxGeo, boxMat);
      boxMesh.position.set(-4.1, 1.155, 0);
      boxMesh.castShadow = true;
      boxMesh.receiveShadow = true;
      conveyorGroup.add(boxMesh);

      return {
        mesh: boxMesh,
        id: `LOT-${idNum}`,
        isNg,
        weight: parseFloat(weight.toFixed(1)),
        inspected: false,
        weighed: false,
        rejected: false,
        defect: defectReason,
      };
    };

    const initialBoxes = [
      createBox(false, 9822),
      createBox(true, 9823, 'under'),
      createBox(false, 9824),
    ];
    initialBoxes[0].mesh.position.x = 2.4;
    initialBoxes[0].inspected = true;
    initialBoxes[1].mesh.position.x = 0.5;
    initialBoxes[1].inspected = true;
    initialBoxes[2].mesh.position.x = -1.5;
    simRef.current.boxes = initialBoxes;

    // Helper: Draw Siemens HMI Screen
    const drawHmiCanvas = (ctx, st, scan, wt) => {
      ctx.fillStyle = '#061325';
      ctx.fillRect(0, 0, 1024, 680);

      // Top Header
      ctx.fillStyle = '#0284c7';
      ctx.fillRect(0, 0, 1024, 64);
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 26px sans-serif';
      ctx.fillText('SIEMENS SIMATIC HMI — RVMAITECH SMART PACKAGING LINE', 28, 42);

      ctx.fillStyle = st === 'RUNNING' ? '#22c55e' : st === 'IDLE' ? '#facc15' : '#ef4444';
      ctx.font = 'bold 22px sans-serif';
      ctx.fillText(`STATUS: ${st}`, 800, 42);

      // 1. Checkweigher Card
      ctx.fillStyle = '#0b213f';
      ctx.fillRect(30, 90, 460, 240);
      ctx.strokeStyle = '#0284c7';
      ctx.lineWidth = 2;
      ctx.strokeRect(30, 90, 460, 240);

      ctx.fillStyle = '#94a3b8';
      ctx.font = 'bold 20px sans-serif';
      ctx.fillText('DYNAMIC CHECKWEIGHER (LOAD CELL)', 50, 126);

      ctx.fillStyle = wt >= 485 && wt <= 515 ? '#22c55e' : '#ef4444';
      ctx.font = 'bold 64px monospace';
      ctx.fillText(`${wt.toFixed(1)} g`, 50, 205);

      ctx.fillStyle = '#cbd5e1';
      ctx.font = '18px sans-serif';
      ctx.fillText(`Target: ${TARGET_WEIGHT}g  |  Tolerance: ±${WEIGHT_TOLERANCE}g`, 50, 250);
      ctx.fillStyle = wt >= 485 && wt <= 515 ? '#4ade80' : '#f87171';
      ctx.font = 'bold 20px sans-serif';
      ctx.fillText(wt >= 485 && wt <= 515 ? '✓ WEIGHT PASS (IN SPEC)' : '✕ WEIGHT OUT OF SPEC (NG REJECT)', 50, 295);

      // 2. Vision QC Card
      ctx.fillStyle = '#0b213f';
      ctx.fillRect(530, 90, 460, 240);
      ctx.strokeRect(530, 90, 460, 240);

      ctx.fillStyle = '#94a3b8';
      ctx.font = 'bold 20px sans-serif';
      ctx.fillText('AI VISION INSPECTION CAMERA', 550, 126);

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 36px monospace';
      ctx.fillText(scan.id, 550, 185);

      ctx.fillStyle = scan.status === 'OK' ? '#22c55e' : '#ef4444';
      ctx.font = 'bold 28px sans-serif';
      ctx.fillText(scan.status === 'OK' ? '✓ INSPECTION: PASS' : `✕ REJECT: ${scan.defect || 'DEFECT'}`, 550, 235);

      ctx.fillStyle = '#cbd5e1';
      ctx.font = '18px sans-serif';
      ctx.fillText(`Confidence: ${scan.confidence}%  |  Barcode: ${scan.barcode}`, 550, 290);

      // Bottom Row: Telemetry
      ctx.fillStyle = '#0f294d';
      ctx.fillRect(30, 360, 960, 280);
      ctx.strokeRect(30, 360, 960, 280);

      ctx.fillStyle = '#38bdf8';
      ctx.font = 'bold 22px sans-serif';
      ctx.fillText('LINE SPEED & PRODUCTION STATS', 50, 400);

      ctx.fillStyle = '#ffffff';
      ctx.font = '20px sans-serif';
      ctx.fillText('PLC: Siemens S7-1200 (PROFINET Active)', 50, 450);
      ctx.fillText('Conveyor Speed: 24.0 m/min  |  Pneumatics: 6.2 Bar OK', 50, 490);
      ctx.fillText('Photo-Eye Sensor: Aligned  |  Reject Diverter: Armed', 50, 530);

      // Buttons
      ctx.fillStyle = '#15803d';
      ctx.fillRect(50, 570, 180, 50);
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 20px sans-serif';
      ctx.fillText('▶ RUN AUTO', 80, 602);

      ctx.fillStyle = '#b45309';
      ctx.fillRect(260, 570, 180, 50);
      ctx.fillStyle = '#ffffff';
      ctx.fillText('⏸ STANDBY', 290, 602);

      ctx.fillStyle = '#b91c1c';
      ctx.fillRect(470, 570, 180, 50);
      ctx.fillStyle = '#ffffff';
      ctx.fillText('🛑 E-STOP', 510, 602);
    };

    // Helper: Draw Monitor Canvas
    const drawMonitorCanvas = (ctx, scan) => {
      ctx.fillStyle = '#050c18';
      ctx.fillRect(0, 0, 512, 320);

      ctx.fillStyle = '#0284c7';
      ctx.fillRect(0, 0, 512, 36);
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 15px sans-serif';
      ctx.fillText('RVMAITECH AI VISION QC — LIVE CAM 01', 14, 24);

      ctx.strokeStyle = scan.status === 'OK' ? '#22c55e' : '#ef4444';
      ctx.lineWidth = 2.5;
      ctx.strokeRect(90, 65, 332, 190);

      ctx.beginPath();
      ctx.moveTo(256, 45); ctx.lineTo(256, 65);
      ctx.moveTo(256, 255); ctx.lineTo(256, 275);
      ctx.moveTo(70, 160); ctx.lineTo(90, 160);
      ctx.moveTo(422, 160); ctx.lineTo(442, 160);
      ctx.stroke();

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 16px monospace';
      ctx.fillText(`TARGET: ${scan.id}`, 105, 100);

      ctx.fillStyle = scan.status === 'OK' ? '#4ade80' : '#f87171';
      ctx.font = 'bold 22px sans-serif';
      ctx.fillText(scan.status === 'OK' ? 'PASS (100% OK)' : 'FAIL: REJECT', 105, 145);

      ctx.fillStyle = '#cbd5e1';
      ctx.font = '14px sans-serif';
      ctx.fillText(`AI Score: ${scan.confidence}%`, 105, 185);
      ctx.fillText(`Weight: ${scan.weight || 501.2}g`, 105, 215);

      if (scan.defect) {
        ctx.fillStyle = '#ef4444';
        ctx.fillText(`Error: ${scan.defect}`, 105, 242);
      }
    };

    drawHmiCanvas(hmiCtx, machineState, currentScan, 501.2);
    hmiTexture.needsUpdate = true;
    drawMonitorCanvas(monitorCtx, currentScan);
    monitorTexture.needsUpdate = true;

    // Raycasting for hardware button clicks
    const dom = renderer.domElement;
    const onPointerDown = (e) => {
      const rect = dom.getBoundingClientRect();
      const mouseX = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      const mouseY = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      simRef.current.mouse.set(mouseX, mouseY);
      simRef.current.raycaster.setFromCamera(simRef.current.mouse, camera);
      const intersects = simRef.current.raycaster.intersectObjects(simRef.current.clickableButtons, false);

      if (intersects.length > 0) {
        const hit = intersects[0].object;
        if (hit.userData.action === 'START') {
          setMachineState('RUNNING');
        } else if (hit.userData.action === 'STOP') {
          setMachineState('IDLE');
        } else if (hit.userData.action === 'ESTOP') {
          setMachineState('ESTOP');
        }
      }
    };

    dom.addEventListener('pointerdown', onPointerDown);

    // Animation Loop
    let animId;
    let lastClock = performance.now();
    let pusherProgress = 0;
    let isPushing = false;
    let lastHmiDraw = 0;

    const animate = () => {
      animId = requestAnimationFrame(animate);

      const now = performance.now();
      const dt = Math.min((now - lastClock) / 1000, 0.1);
      lastClock = now;

      const sim = simRef.current;
      const state = sim.machineState;

      // Smooth Camera Transition toward Target (if preset button clicked)
      if (sim.camera && sim.controls) {
        camera.position.lerp(sim.targetCamPos, 0.05);
        sim.controls.target.lerp(sim.targetLookAt, 0.05);
        sim.controls.update();
      }

      // Smooth Door Swing Open / Close Animation
      const targetDoorAngle = sim.isDoorOpen ? -Math.PI * 0.55 : 0;
      sim.doorAngle += (targetDoorAngle - sim.doorAngle) * 0.1;
      if (sim.doorPivot) {
        sim.doorPivot.rotation.y = sim.doorAngle;
      }

      if (sim.cabinetLight) {
        const openFactor = Math.abs(sim.doorAngle) / (Math.PI * 0.55);
        sim.cabinetLight.intensity = openFactor * 2.5;
      }

      // Periodically refresh the HMI & Monitor CanvasTexture
      if (now - lastHmiDraw > 150) {
        lastHmiDraw = now;
        drawHmiCanvas(sim.hmiCtx, state, currentScan, sim.lastWeight);
        sim.hmiTexture.needsUpdate = true;
        drawMonitorCanvas(sim.monitorCtx, currentScan);
        sim.monitorTexture.needsUpdate = true;
      }

      // Tower Light Logic
      const updateTowerBeacon = (r, y, g, isBlinking) => {
        // Cabinet Tower
        if (sim.stackRedMat) {
          sim.stackRedMat.color.setHex(r ? 0xef4444 : 0x450a0a);
          sim.stackRedMat.emissive.setHex(r ? 0xef4444 : 0x000000);
          sim.stackRedMat.emissiveIntensity = r ? 1.0 : 0;
        }
        if (sim.stackYellowMat) {
          sim.stackYellowMat.color.setHex(y ? 0xfacc15 : 0x451a03);
          sim.stackYellowMat.emissive.setHex(y ? 0xfacc15 : 0x000000);
          sim.stackYellowMat.emissiveIntensity = y ? 0.9 : 0;
        }
        if (sim.stackGreenMat) {
          sim.stackGreenMat.color.setHex(g ? 0x22c55e : 0x064e3b);
          sim.stackGreenMat.emissive.setHex(g ? 0x22c55e : 0x000000);
          sim.stackGreenMat.emissiveIntensity = g ? 0.95 : 0;
        }
        // Conveyor Rail Tower
        if (sim.conveyorTowerRedMat) {
          sim.conveyorTowerRedMat.color.setHex(r ? 0xef4444 : 0x450a0a);
          sim.conveyorTowerRedMat.emissive.setHex(r ? 0xef4444 : 0x000000);
        }
        if (sim.conveyorTowerYellowMat) {
          sim.conveyorTowerYellowMat.color.setHex(y ? 0xfacc15 : 0x451a03);
          sim.conveyorTowerYellowMat.emissive.setHex(y ? 0xfacc15 : 0x000000);
        }
        if (sim.conveyorTowerGreenMat) {
          sim.conveyorTowerGreenMat.color.setHex(g ? 0x22c55e : 0x064e3b);
          sim.conveyorTowerGreenMat.emissive.setHex(g ? 0x22c55e : 0x000000);
        }
        // Ambient Beacon Light
        if (sim.beaconLight) {
          if (r) {
            sim.beaconLight.color.setHex(0xef4444);
            sim.beaconLight.intensity = isBlinking ? 3.2 : 2.0;
          } else if (y) {
            sim.beaconLight.color.setHex(0xfacc15);
            sim.beaconLight.intensity = 2.4;
          } else if (g) {
            sim.beaconLight.color.setHex(0x22c55e);
            sim.beaconLight.intensity = 2.6;
          }
        }
      };

      if (state === 'ESTOP') {
        const blink = Math.sin(now * 0.012) > 0;
        updateTowerBeacon(blink, false, false, true);
      } else if (state === 'IDLE') {
        updateTowerBeacon(false, true, false, false);
      } else {
        // RUNNING State: Green ON, or Flash Red if NG item detected recently
        if (now < sim.ngBlinkTimer) {
          updateTowerBeacon(true, false, false, true);
        } else {
          updateTowerBeacon(false, false, true, false);
        }
      }

      // Conveyor & Belt Motion (WHEN RUNNING)
      if (state === 'RUNNING') {
        const moveDist = 1.25 * sim.speed * dt;

        // Continuous Forward Gliding PVC Belt Motion (Offset UV)
        if (sim.beltTexture) {
          sim.beltTexture.offset.x -= moveDist * 0.12;
        }

        // Rotate Return Rollers & End Pulley Drums
        sim.rollers.forEach((r) => {
          r.rotation.y -= moveDist * 16;
        });
        sim.endDrums.forEach((d) => {
          d.rotation.x += moveDist * 8;
        });

        // Spawn new box
        if (now - sim.lastSpawnTime > 2600 / sim.speed) {
          const leftmostBox = sim.boxes.reduce((min, b) => Math.min(min, b.mesh.position.x), 999);
          if (leftmostBox > -3.2 || sim.boxes.length === 0) {
            let nextIsNg = Math.random() < 0.16;
            let forcedWt = null;
            if (sim.forceNext === 'ng-weight') {
              nextIsNg = true;
              forcedWt = 'under';
              sim.forceNext = null;
              setForceNextType(null);
            } else if (sim.forceNext === 'ng-vision') {
              nextIsNg = true;
              forcedWt = 'vision';
              sim.forceNext = null;
              setForceNextType(null);
            } else if (sim.forceNext === 'ok') {
              nextIsNg = false;
              sim.forceNext = null;
              setForceNextType(null);
            }

            const newBox = createBox(nextIsNg, sim.nextBoxId++, forcedWt);
            sim.boxes.push(newBox);
            sim.lastSpawnTime = now;
          }
        }

        // Process boxes along line
        for (let i = sim.boxes.length - 1; i >= 0; i--) {
          const box = sim.boxes[i];

          if (box.rejected) {
            box.mesh.position.z += 1.8 * sim.speed * dt;
            if (box.mesh.position.z > 0.8) {
              box.mesh.position.y -= 2.2 * sim.speed * dt;
            }
            if (box.mesh.position.y < 0.35 || box.mesh.position.z > 1.35) {
              conveyorGroup.remove(box.mesh);
              sim.boxes.splice(i, 1);
            }
            continue;
          }

          box.mesh.position.x += moveDist;

          // 1. Dynamic Checkweigher (at X = -1.8)
          if (!box.weighed && box.mesh.position.x >= -1.95 && box.mesh.position.x <= -1.65) {
            box.weighed = true;
            sim.lastWeight = box.weight;

            const isWeightOk = box.weight >= TARGET_WEIGHT - WEIGHT_TOLERANCE && box.weight <= TARGET_WEIGHT + WEIGHT_TOLERANCE;
            setMetrics((prev) => ({
              ...prev,
              currentWeight: box.weight,
              weightStatus: isWeightOk ? `OK (${box.weight}g)` : `NG (${box.weight}g OUT OF SPEC)`,
            }));

            // Micro-deflection on load cell
            if (sim.scalePlatform) {
              sim.scalePlatform.position.y = 0.012;
              setTimeout(() => {
                if (sim.scalePlatform) sim.scalePlatform.position.y = 0.02;
              }, 120);
            }
          }

          // 2. Optical Sensor Trigger (at X = -1.1)
          if (box.mesh.position.x >= -1.15 && box.mesh.position.x <= -1.05) {
            sim.sensorRayMat.color.setHex(0xfacc15);
          } else if (sim.boxes.every((b) => Math.abs(b.mesh.position.x - -1.1) > 0.2)) {
            sim.sensorRayMat.color.setHex(0xef4444);
          }

          // 3. Vision Camera Inspection (at X = -0.4)
          if (!box.inspected && box.mesh.position.x >= -0.55 && box.mesh.position.x <= -0.25) {
            box.inspected = true;

            const isOk = !box.isNg;
            const conf = isOk ? parseFloat((99.1 + Math.random() * 0.8).toFixed(1)) : parseFloat((74.0 + Math.random() * 15.0).toFixed(1));

            const scanResult = {
              id: box.id,
              status: isOk ? 'OK' : 'NG',
              confidence: conf,
              weight: box.weight,
              defect: isOk ? null : (box.defect || 'Vision Defect Detected'),
              scanTime: new Date().toLocaleTimeString(),
              barcode: isOk ? `RVM-${Math.floor(1000 + Math.random() * 9000)}-PASS` : 'RVM-ERR-REJECT',
            };

            setCurrentScan(scanResult);

            if (!isOk) {
              sim.ngBlinkTimer = now + 2400; // Flash red tower light
            }

            setMetrics((prev) => ({
              ...prev,
              total: prev.total + 1,
              ok: isOk ? prev.ok + 1 : prev.ok,
              ng: !isOk ? prev.ng + 1 : prev.ng,
              cycleTimeMs: Math.floor(32 + Math.random() * 8),
            }));

            setInspectionLog((prev) => [
              {
                id: box.id,
                time: new Date().toLocaleTimeString(),
                weight: `${box.weight}g`,
                status: isOk ? 'OK' : 'NG',
                defect: isOk ? 'All Specs In Range' : (box.defect || 'Vision Defect Detected'),
                dest: isOk ? 'Main Line (OK)' : 'Reject Chute (NG)',
              },
              ...prev.slice(0, 9),
            ]);
          }

          // 4. Sorting & Reject Station (at X = 1.3)
          if (box.isNg && !box.rejected && box.mesh.position.x >= 1.15 && box.mesh.position.x <= 1.45) {
            box.rejected = true;
            isPushing = true;
            pusherProgress = 0;
          }

          // 5. Reached End of Conveyor (OK Finished Goods at X = 4.3)
          if (!box.rejected && box.mesh.position.x > 4.3) {
            conveyorGroup.remove(box.mesh);
            sim.boxes.splice(i, 1);
          }
        }

        // Animate Pneumatic Pusher Arm
        if (isPushing) {
          pusherProgress += 4.5 * dt * sim.speed;
          if (pusherProgress < 1.0) {
            sim.pusherArm.position.z = -0.45 + Math.sin(pusherProgress * Math.PI) * 0.45;
          } else {
            sim.pusherArm.position.z = -0.45;
            isPushing = false;
            pusherProgress = 0;
          }
        }
      }

      // Render the scene to the canvas
      renderer.render(scene, camera);
    };

    animId = requestAnimationFrame(animate);

    // Responsive window resizing
    const handleResize = () => {
      if (!container || !camera || !renderer) return;
      const nw = container.clientWidth;
      const nh = container.clientHeight;
      camera.aspect = nw / nh;
      camera.updateProjectionMatrix();
      renderer.setSize(nw, nh);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', handleResize);
      dom.removeEventListener('pointerdown', onPointerDown);
      renderer.dispose();
      controls.dispose();
    };
  }, []);

  const totalInspected = metrics.total || 1;
  const yieldRate = ((metrics.ok / totalInspected) * 100).toFixed(1);

  return (
    <div className="smart-conveyor-wrapper" style={{ position: 'relative', width: '100%', borderRadius: '16px', overflow: 'hidden', background: '#0b1626' }}>
      {/* 3D Canvas Viewport */}
      <div
        ref={mountRef}
        className="sc-canvas-container"
        style={{
          width: '100%',
          height: '600px',
          cursor: 'grab',
          position: 'relative',
        }}
      />

      {/* Floating Industrial Machine Status HUD Overlay */}
      <div style={{
        position: 'absolute',
        top: '16px',
        left: '16px',
        zIndex: 10,
        display: 'flex',
        flexWrap: 'wrap',
        gap: '10px',
        alignItems: 'center',
        background: 'rgba(11, 22, 38, 0.88)',
        backdropFilter: 'blur(10px)',
        border: '1px solid rgba(56, 189, 248, 0.3)',
        padding: '10px 14px',
        borderRadius: '12px',
        color: '#fff',
        boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{
            width: '12px',
            height: '12px',
            borderRadius: '50%',
            background: machineState === 'RUNNING' ? '#22c55e' : machineState === 'IDLE' ? '#facc15' : '#ef4444',
            boxShadow: `0 0 10px ${machineState === 'RUNNING' ? '#22c55e' : machineState === 'IDLE' ? '#facc15' : '#ef4444'}`,
          }} />
          <span style={{ fontWeight: 700, fontSize: '0.85rem', letterSpacing: '0.5px' }}>
            LINE: {machineState}
          </span>
        </div>

        <div style={{ width: '1px', height: '18px', background: 'rgba(255,255,255,0.2)' }} />

        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.82rem', color: '#94a3b8' }}>
          <Gauge size={14} color="#38bdf8" />
          <span>Speed: <strong style={{ color: '#fff' }}>{(24.0 * speedMultiplier).toFixed(0)} m/min</strong></span>
        </div>

        <div style={{ width: '1px', height: '18px', background: 'rgba(255,255,255,0.2)' }} />

        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.82rem', color: '#94a3b8' }}>
          <Scale size={14} color="#facc15" />
          <span>Checkweigher: <strong style={{ color: metrics.currentWeight >= 485 && metrics.currentWeight <= 515 ? '#4ade80' : '#f87171' }}>{metrics.currentWeight}g</strong></span>
        </div>

        <div style={{ width: '1px', height: '18px', background: 'rgba(255,255,255,0.2)' }} />

        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.82rem', color: '#94a3b8' }}>
          <Activity size={14} color="#4ade80" />
          <span>Yield: <strong style={{ color: '#4ade80' }}>{yieldRate}%</strong></span>
        </div>
      </div>

      {/* Camera View Presets on Top Right */}
      <div style={{
        position: 'absolute',
        top: '16px',
        right: '16px',
        zIndex: 10,
        display: 'flex',
        gap: '6px',
        background: 'rgba(11, 22, 38, 0.88)',
        backdropFilter: 'blur(10px)',
        border: '1px solid rgba(56, 189, 248, 0.3)',
        padding: '6px',
        borderRadius: '10px',
      }}>
        <button
          onClick={() => setCameraView('overview')}
          style={{
            padding: '6px 10px',
            fontSize: '0.75rem',
            fontWeight: 600,
            borderRadius: '6px',
            border: 'none',
            background: activeCamPreset === 'overview' ? '#0284c7' : 'transparent',
            color: '#fff',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '5px',
          }}
          title="Factory Isometric Overview"
        >
          <Eye size={13} /> Line View
        </button>
        <button
          onClick={() => setCameraView('vision')}
          style={{
            padding: '6px 10px',
            fontSize: '0.75rem',
            fontWeight: 600,
            borderRadius: '6px',
            border: 'none',
            background: activeCamPreset === 'vision' ? '#0284c7' : 'transparent',
            color: '#fff',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '5px',
          }}
          title="Vision Camera Station"
        >
          <Camera size={13} /> Vision QC
        </button>
        <button
          onClick={() => setCameraView('scale')}
          style={{
            padding: '6px 10px',
            fontSize: '0.75rem',
            fontWeight: 600,
            borderRadius: '6px',
            border: 'none',
            background: activeCamPreset === 'scale' ? '#0284c7' : 'transparent',
            color: '#fff',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '5px',
          }}
          title="In-Line Checkweigher"
        >
          <Scale size={13} /> Load Cell
        </button>
        <button
          onClick={() => setCameraView('panel')}
          style={{
            padding: '6px 10px',
            fontSize: '0.75rem',
            fontWeight: 600,
            borderRadius: '6px',
            border: 'none',
            background: activeCamPreset === 'panel' ? '#0284c7' : 'transparent',
            color: '#fff',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '5px',
          }}
          title="Siemens S7-1200 Cabinet & HMI"
        >
          <Cpu size={13} /> Siemens PLC
        </button>
      </div>

      {/* Floating PLC Cabinet Door Toggle Button */}
      <div style={{
        position: 'absolute',
        bottom: '20px',
        left: '20px',
        zIndex: 10,
        display: 'flex',
        gap: '10px',
      }}>
        <button
          onClick={() => setIsDoorOpen(!isDoorOpen)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 16px',
            borderRadius: '10px',
            background: isDoorOpen ? 'linear-gradient(135deg, #0284c7, #0369a1)' : 'rgba(15, 23, 42, 0.92)',
            color: '#fff',
            fontWeight: 700,
            fontSize: '0.85rem',
            border: '1px solid rgba(56, 189, 248, 0.4)',
            cursor: 'pointer',
            boxShadow: '0 4px 20px rgba(0,0,0,0.4)',
            transition: 'all 0.2s ease',
          }}
        >
          {isDoorOpen ? <DoorOpen size={18} color="#38bdf8" /> : <DoorClosed size={18} color="#94a3b8" />}
          <span>{isDoorOpen ? 'Close PLC Panel Door' : 'Open Siemens PLC Cabinet Door'}</span>
        </button>
      </div>

      {/* Operator Control Deck & Live Telemetry Deck */}
      <div style={{
        padding: '24px',
        background: '#07101d',
        borderTop: '1px solid rgba(56, 189, 248, 0.2)',
        color: '#e2e8f0',
      }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '20px',
        }}>
          {/* 1. Control Console */}
          <div style={{
            background: 'rgba(15, 23, 42, 0.8)',
            border: '1px solid rgba(56, 189, 248, 0.25)',
            borderRadius: '12px',
            padding: '18px',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
              <Settings2 size={18} color="#38bdf8" />
              <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700, color: '#f8fafc' }}>
                Hardware Machine Controls
              </h4>
            </div>

            {/* 3 Physical Machine Buttons */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px', marginBottom: '14px' }}>
              <button
                onClick={() => setMachineState('RUNNING')}
                style={{
                  padding: '10px 8px',
                  borderRadius: '8px',
                  border: 'none',
                  background: machineState === 'RUNNING' ? '#15803d' : '#1e293b',
                  color: '#fff',
                  fontWeight: 700,
                  fontSize: '0.8rem',
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '4px',
                  boxShadow: machineState === 'RUNNING' ? '0 0 14px rgba(34, 197, 94, 0.6)' : 'none',
                }}
              >
                <Play size={16} color="#4ade80" />
                START
              </button>

              <button
                onClick={() => setMachineState('IDLE')}
                style={{
                  padding: '10px 8px',
                  borderRadius: '8px',
                  border: 'none',
                  background: machineState === 'IDLE' ? '#a16207' : '#1e293b',
                  color: '#fff',
                  fontWeight: 700,
                  fontSize: '0.8rem',
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '4px',
                  boxShadow: machineState === 'IDLE' ? '0 0 14px rgba(250, 204, 21, 0.6)' : 'none',
                }}
              >
                <Pause size={16} color="#fde047" />
                STOP
              </button>

              <button
                onClick={() => setMachineState('ESTOP')}
                style={{
                  padding: '10px 8px',
                  borderRadius: '8px',
                  border: 'none',
                  background: machineState === 'ESTOP' ? '#b91c1c' : '#1e293b',
                  color: '#fff',
                  fontWeight: 700,
                  fontSize: '0.8rem',
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '4px',
                  boxShadow: machineState === 'ESTOP' ? '0 0 16px rgba(239, 68, 68, 0.8)' : 'none',
                }}
              >
                <Octagon size={16} color="#f87171" />
                E-STOP
              </button>
            </div>

            {/* Force Test Next Injected Carton */}
            <div style={{ fontSize: '0.78rem', color: '#94a3b8', marginBottom: '8px', fontWeight: 600 }}>
              TEST DEFECT SIMULATION:
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '6px' }}>
              <button
                onClick={() => setForceNextType('ok')}
                style={{
                  padding: '6px',
                  borderRadius: '6px',
                  background: forceNextType === 'ok' ? '#047857' : '#1e293b',
                  border: '1px solid rgba(255,255,255,0.1)',
                  color: '#e2e8f0',
                  fontSize: '0.72rem',
                  cursor: 'pointer',
                  fontWeight: 600,
                }}
              >
                Force OK
              </button>
              <button
                onClick={() => setForceNextType('ng-weight')}
                style={{
                  padding: '6px',
                  borderRadius: '6px',
                  background: forceNextType === 'ng-weight' ? '#b91c1c' : '#1e293b',
                  border: '1px solid rgba(255,255,255,0.1)',
                  color: '#e2e8f0',
                  fontSize: '0.72rem',
                  cursor: 'pointer',
                  fontWeight: 600,
                }}
              >
                Underweight
              </button>
              <button
                onClick={() => setForceNextType('ng-vision')}
                style={{
                  padding: '6px',
                  borderRadius: '6px',
                  background: forceNextType === 'ng-vision' ? '#b91c1c' : '#1e293b',
                  border: '1px solid rgba(255,255,255,0.1)',
                  color: '#e2e8f0',
                  fontSize: '0.72rem',
                  cursor: 'pointer',
                  fontWeight: 600,
                }}
              >
                Defect Seal
              </button>
            </div>
          </div>

          {/* 2. Live Vision AI Inspection Telemetry */}
          <div style={{
            background: 'rgba(15, 23, 42, 0.8)',
            border: '1px solid rgba(56, 189, 248, 0.25)',
            borderRadius: '12px',
            padding: '18px',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Camera size={18} color="#38bdf8" />
                <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700, color: '#f8fafc' }}>
                  Overhead Vision Camera Feed
                </h4>
              </div>
              <span style={{
                fontSize: '0.72rem',
                fontWeight: 700,
                padding: '3px 8px',
                borderRadius: '6px',
                background: currentScan.status === 'OK' ? 'rgba(34, 197, 94, 0.2)' : 'rgba(239, 68, 68, 0.2)',
                color: currentScan.status === 'OK' ? '#4ade80' : '#f87171',
                border: `1px solid ${currentScan.status === 'OK' ? '#22c55e' : '#ef4444'}`,
              }}>
                {currentScan.status}
              </span>
            </div>

            <div style={{
              background: '#050c18',
              borderRadius: '8px',
              padding: '12px',
              border: '1px solid rgba(255,255,255,0.08)',
              fontFamily: 'monospace',
              fontSize: '0.8rem',
              lineHeight: 1.6,
            }}>
              <div>Target Item: <strong style={{ color: '#fff' }}>{currentScan.id}</strong></div>
              <div>Weight Sensor: <strong style={{ color: currentScan.weight >= 485 && currentScan.weight <= 515 ? '#4ade80' : '#f87171' }}>{currentScan.weight}g</strong> (Target: 500g)</div>
              <div>AI Confidence: <strong style={{ color: '#38bdf8' }}>{currentScan.confidence}%</strong></div>
              <div>Barcode: <strong style={{ color: '#cbd5e1' }}>{currentScan.barcode}</strong></div>
              {currentScan.defect && (
                <div style={{ color: '#f87171', marginTop: '4px', fontWeight: 700 }}>
                  Defect Alert: {currentScan.defect}
                </div>
              )}
            </div>
          </div>

          {/* 3. Rolling Production Log */}
          <div style={{
            background: 'rgba(15, 23, 42, 0.8)',
            border: '1px solid rgba(56, 189, 248, 0.25)',
            borderRadius: '12px',
            padding: '18px',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Activity size={18} color="#38bdf8" />
                <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700, color: '#f8fafc' }}>
                  Inspection Log
                </h4>
              </div>
              <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                Passed: {metrics.ok} | Rejected: {metrics.ng}
              </span>
            </div>

            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '6px',
              maxHeight: '140px',
              overflowY: 'auto',
              paddingRight: '4px',
            }}>
              {inspectionLog.map((item, idx) => (
                <div
                  key={idx}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '6px 8px',
                    borderRadius: '6px',
                    background: idx === 0 ? 'rgba(56, 189, 248, 0.12)' : 'rgba(255,255,255,0.03)',
                    fontSize: '0.75rem',
                    borderLeft: `3px solid ${item.status === 'OK' ? '#22c55e' : '#ef4444'}`,
                  }}
                >
                  <div>
                    <span style={{ fontWeight: 700, color: '#fff', marginRight: '6px' }}>{item.id}</span>
                    <span style={{ color: '#94a3b8' }}>{item.weight}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ color: item.status === 'OK' ? '#4ade80' : '#f87171', fontWeight: 600 }}>
                      {item.status}
                    </span>
                    <span style={{ color: '#64748b', fontSize: '0.7rem' }}>{item.dest}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Industrial Integration CTA Banner */}
        <div style={{
          marginTop: '20px',
          padding: '16px 20px',
          borderRadius: '12px',
          background: 'linear-gradient(90deg, rgba(2, 132, 199, 0.25), rgba(59, 130, 246, 0.15))',
          border: '1px solid rgba(56, 189, 248, 0.35)',
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '14px',
        }}>
          <div>
            <div style={{ fontWeight: 700, fontSize: '0.95rem', color: '#fff', marginBottom: '2px' }}>
              Want a Custom Automated Vision QC & Smart Conveyor System for Your Plant?
            </div>
            <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
              Rvmaitech engineers end-to-end Siemens PLC automation, checkweighers, high-speed sorting, and AI vision inspection cameras.
            </div>
          </div>

          <button
            onClick={() => {
              if (onBookDemo) onBookDemo('Smart Conveyor & AI Vision QC Line');
              else openAuditModal();
            }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 20px',
              borderRadius: '8px',
              background: 'linear-gradient(135deg, #0284c7, #2563eb)',
              color: '#fff',
              border: 'none',
              fontWeight: 700,
              fontSize: '0.85rem',
              cursor: 'pointer',
              boxShadow: '0 4px 16px rgba(2, 132, 199, 0.4)',
            }}
          >
            <span>Book Live Machine Demo</span>
            <ArrowRight size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
