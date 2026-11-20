import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import {
  Play, Pause, RotateCcw, CheckCircle2, AlertTriangle,
  Camera, Cpu, Activity, ShieldCheck, Sparkles, ArrowRight,
  Octagon, DoorOpen, DoorClosed, Monitor, Scale, Gauge
} from 'lucide-react';
import { openAuditModal } from './AuditBookingModal';

/**
 * 3D Smart Conveyor Belt & Real Industrial Inspection Line
 * Real Factory Machine Upgrades:
 *  1. Realistic Floor-Standing PLC Control Panel on LEFT SIDE (x = -3.4m) with openable door
 *  2. Real Panel Interior:
 *     - Siemens SIMATIC S7-1200 PLC (CPU 1214C + I/O Expansion Modules + Green RUN LED)
 *     - 24V DC SMPS Industrial Power Supply, 3-Phase MCB Breakers, Safety Relay, Wiring Ducts, Terminal Strips
 *     - Warning Decals ("DANGER 415V"), Cooling Louvers, Door Lock Latches
 *  3. REAL LIVE HMI SCREEN:
 *     - Rendered via high-res CanvasTexture with live WinCC telemetry: Live Weight, OEE %, Line Speed, State
 *  4. DYNAMIC IN-LINE CHECKWEIGHER / WEIGHT SENSOR:
 *     - Load cell sensor platform measuring package weight in real time
 *     - Target 500g (Tolerance ±15g). Underweight/Overweight triggers NG reject!
 *  5. DEDICATED 24" VISION OPERATOR MONITOR on articulating arm showing live camera viewfinder
 *  6. 3 Physical Control Buttons: START (Green), STOP (Yellow), EMERGENCY STOP (Red Mushroom)
 *  7. Tricolor Industrial Tower Light (Green: Run, Yellow: Idle, Red: E-Stop / Defect)
 *  8. High-Speed Pneumatic Reject Pusher sorting Visual/Weight NG defects to side bin
 */

const TARGET_WEIGHT = 500.0; // grams
const WEIGHT_TOLERANCE = 15.0; // ±15g

const DEFECT_TYPES = [
  'Underweight (Missing Content)',
  'Overweight (Overfilled)',
  'Surface Dent / Crack',
  'Barcode Scratched / Unreadable',
  'Seal Open / Tampered',
];

export default function SmartConveyor3D({ onBookDemo }) {
  const mountRef = useRef(null);

  // Machine Operational State: 'RUNNING' | 'IDLE' | 'ESTOP'
  const [machineState, setMachineState] = useState('RUNNING');
  const [speedMultiplier, setSpeedMultiplier] = useState(1);
  const [forceNextType, setForceNextType] = useState(null); // null | 'ok' | 'ng-weight' | 'ng-vision'
  const [isDoorOpen, setIsDoorOpen] = useState(false); // PLC Cabinet Door Open/Close

  // Production Metrics
  const [metrics, setMetrics] = useState({
    total: 156,
    ok: 148,
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
    pusherArm: null,
    scalePlatform: null,
    stackGreenMat: null,
    stackYellowMat: null,
    stackRedMat: null,
    beaconLight: null,
    scanLaserPlane: null,
    scanSpotLight: null,
    sensorRayMat: null,
    hmiTexture: null,
    hmiCanvas: null,
    hmiCtx: null,
    monitorTexture: null,
    monitorCanvas: null,
    monitorCtx: null,
    nextBoxId: 9825,
    lastSpawnTime: 0,
    ngBlinkTimer: 0,
    lastWeight: 501.2,
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

  // Main Three.js Scene Setup & Animation Loop
  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth || 800;
    const height = container.clientHeight || 560;

    // 1. Scene & Camera Setup
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0a1424);
    scene.fog = new THREE.FogExp2(0x0a1424, 0.035);

    const camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 80);
    // Angled view showing the Left PLC Panel, Conveyor, Checkweigher, Camera & Reject Chute
    camera.position.set(-0.8, 3.8, 6.2);
    camera.lookAt(-0.5, 0.85, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: 'high-performance' });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.3;
    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    // 2. Industrial Lighting
    const hemiLight = new THREE.HemisphereLight(0xdbeafe, 0x0f172a, 1.0);
    scene.add(hemiLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, 1.5);
    dirLight.position.set(3, 10, 5);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 1024;
    dirLight.shadow.mapSize.height = 1024;
    scene.add(dirLight);

    const fillLight = new THREE.PointLight(0x38bdf8, 1.4, 14);
    fillLight.position.set(-3.5, 3.5, 2.5);
    scene.add(fillLight);

    // Tower Light Beacon Point Light
    const beaconLight = new THREE.PointLight(0x22c55e, 2.6, 6);
    beaconLight.position.set(-3.1, 2.7, -0.9);
    scene.add(beaconLight);
    simRef.current.beaconLight = beaconLight;

    // Interior Cabinet Inspection Light
    const cabinetLight = new THREE.PointLight(0xffffff, 0, 4.5);
    cabinetLight.position.set(-3.4, 1.3, -0.7);
    scene.add(cabinetLight);
    simRef.current.cabinetLight = cabinetLight;

    // 3. Factory Epoxy Floor & Grid
    const floorGeo = new THREE.PlaneGeometry(28, 20);
    const floorMat = new THREE.MeshStandardMaterial({
      color: 0x111e33,
      roughness: 0.65,
      metalness: 0.25,
    });
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    scene.add(floor);

    const grid = new THREE.GridHelper(26, 26, 0x1e3a5f, 0x132742);
    grid.position.y = 0.005;
    scene.add(grid);

    // Hazard zone outline
    const hazardGeo = new THREE.PlaneGeometry(10.8, 4.2);
    const hazardMat = new THREE.MeshBasicMaterial({ color: 0x18283d });
    const hazardZone = new THREE.Mesh(hazardGeo, hazardMat);
    hazardZone.rotation.x = -Math.PI / 2;
    hazardZone.position.set(0, 0.01, 0.1);
    scene.add(hazardZone);

    // 4. Aluminum Conveyor Frame Assembly
    const conveyorGroup = new THREE.Group();
    scene.add(conveyorGroup);

    const aluMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.88, roughness: 0.28 });
    const darkAluMat = new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.9, roughness: 0.35 });

    const railLength = 8.8;

    // Main Aluminum Side Rails
    const railGeo = new THREE.BoxGeometry(railLength, 0.14, 0.06);
    const railFront = new THREE.Mesh(railGeo, aluMat);
    railFront.position.set(0, 0.95, 0.45);
    railFront.castShadow = true;
    conveyorGroup.add(railFront);

    const railBack = new THREE.Mesh(railGeo, aluMat);
    railBack.position.set(0, 0.95, -0.45);
    railBack.castShadow = true;
    conveyorGroup.add(railBack);

    // Guide Skirt Rails
    const guideGeo = new THREE.BoxGeometry(railLength, 0.04, 0.02);
    const guideFront = new THREE.Mesh(guideGeo, darkAluMat);
    guideFront.position.set(0, 1.07, 0.44);
    conveyorGroup.add(guideFront);

    const guideBack = new THREE.Mesh(guideGeo, darkAluMat);
    guideBack.position.set(0, 1.07, -0.44);
    conveyorGroup.add(guideBack);

    // Support Legs & Feet
    const legXPositions = [-3.8, -1.3, 1.3, 3.8];
    const legGeo = new THREE.BoxGeometry(0.08, 0.95, 0.08);
    const footGeo = new THREE.CylinderGeometry(0.08, 0.09, 0.04, 12);
    const crossGeo = new THREE.BoxGeometry(0.06, 0.06, 0.84);

    legXPositions.forEach((lx) => {
      const legF = new THREE.Mesh(legGeo, aluMat);
      legF.position.set(lx, 0.475, 0.42);
      legF.castShadow = true;
      conveyorGroup.add(legF);

      const footF = new THREE.Mesh(footGeo, darkAluMat);
      footF.position.set(lx, 0.02, 0.42);
      conveyorGroup.add(footF);

      const legB = new THREE.Mesh(legGeo, aluMat);
      legB.position.set(lx, 0.475, -0.42);
      legB.castShadow = true;
      conveyorGroup.add(legB);

      const footB = new THREE.Mesh(footGeo, darkAluMat);
      footB.position.set(lx, 0.02, -0.42);
      conveyorGroup.add(footB);

      const cross = new THREE.Mesh(crossGeo, aluMat);
      cross.position.set(lx, 0.45, 0);
      conveyorGroup.add(cross);
    });

    // 5. Cylindrical Rollers with Rubber Traction Rings (Smooth round-and-round spin)
    const rollerCount = 28;
    const rollerLength = 0.84;
    const rollerRadius = 0.042;
    const rollerGeo = new THREE.CylinderGeometry(rollerRadius, rollerRadius, rollerLength, 18);
    const ringGeo = new THREE.CylinderGeometry(rollerRadius + 0.003, rollerRadius + 0.003, 0.04, 18);

    const rollerMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.92, roughness: 0.22 });
    const ringMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.9 });

    const rollers = [];
    const startX = -4.1;
    const stepX = (railLength - 0.6) / (rollerCount - 1);

    for (let i = 0; i < rollerCount; i++) {
      const rx = startX + i * stepX;
      const rollerGroup = new THREE.Group();
      rollerGroup.position.set(rx, 0.95, 0);

      const rollerMesh = new THREE.Mesh(rollerGeo, rollerMat);
      rollerMesh.rotation.x = Math.PI / 2;
      rollerGroup.add(rollerMesh);

      const ring1 = new THREE.Mesh(ringGeo, ringMat);
      ring1.position.y = 0.22;
      rollerMesh.add(ring1);

      const ring2 = new THREE.Mesh(ringGeo, ringMat);
      ring2.position.y = -0.22;
      rollerMesh.add(ring2);

      conveyorGroup.add(rollerGroup);
      rollers.push(rollerMesh);
    }
    simRef.current.rollers = rollers;

    // Moving Conveyor Belt Top Bed
    const beltGeo = new THREE.BoxGeometry(8.5, 0.015, 0.8);
    const beltMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.92, metalness: 0.05 });
    const belt = new THREE.Mesh(beltGeo, beltMat);
    belt.position.set(0, 0.995, 0);
    belt.receiveShadow = true;
    conveyorGroup.add(belt);

    // ----------------------------------------------------
    // 6. DYNAMIC CHECKWEIGHER / IN-LINE WEIGHT SENSOR PLATFORM
    // (Requested: "ISME WIGHT SENSOR HAI JO IS BOX KI WIGHT KAREGA AUR GAR WIGHT SAHI HAI OK AUR NG DITECT KAREGA")
    // Located at X = -1.8m (before camera inspection)
    // ----------------------------------------------------
    const scaleGroup = new THREE.Group();
    scaleGroup.position.set(-1.8, 0.98, 0);
    conveyorGroup.add(scaleGroup);

    // Stainless Steel Weighing Bed (Separate weighing deck)
    const scaleBedGeo = new THREE.BoxGeometry(0.72, 0.03, 0.78);
    const scaleBedMat = new THREE.MeshStandardMaterial({
      color: 0x38bdf8,
      metalness: 0.8,
      roughness: 0.25,
      transparent: true,
      opacity: 0.85,
    });
    const scalePlatform = new THREE.Mesh(scaleBedGeo, scaleBedMat);
    scalePlatform.position.set(0, 0.02, 0);
    scaleGroup.add(scalePlatform);
    simRef.current.scalePlatform = scalePlatform;

    // 4 Corner Load Cell Strain Gauge Blocks
    const loadCellGeo = new THREE.CylinderGeometry(0.022, 0.022, 0.04, 12);
    const loadCellMat = new THREE.MeshStandardMaterial({ color: 0xfacc15, metalness: 0.9 });
    [[-0.3, -0.32], [0.3, -0.32], [-0.3, 0.32], [0.3, 0.32]].forEach(([cx, cz]) => {
      const lc = new THREE.Mesh(loadCellGeo, loadCellMat);
      lc.position.set(cx, -0.02, cz);
      scaleGroup.add(lc);
    });

    // Checkweigher Digital Weight Readout Terminal Box on side of conveyor
    const weightTerminalGeo = new THREE.BoxGeometry(0.24, 0.16, 0.08);
    const weightTermMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.4 });
    const weightTerminal = new THREE.Mesh(weightTerminalGeo, weightTermMat);
    weightTerminal.position.set(0, 0.22, 0.52);
    scaleGroup.add(weightTerminal);

    // Glowing Green Digital LED Display for Live Weight
    const weightScreenGeo = new THREE.BoxGeometry(0.18, 0.08, 0.01);
    const weightScreenMat = new THREE.MeshBasicMaterial({ color: 0x22c55e });
    const weightScreen = new THREE.Mesh(weightScreenGeo, weightScreenMat);
    weightScreen.position.set(0, 0.22, 0.565);
    scaleGroup.add(weightScreen);

    // 7. AC Electric Drive Motor & Gearbox
    const motorGroup = new THREE.Group();
    motorGroup.position.set(-4.2, 0.65, 0.6);
    conveyorGroup.add(motorGroup);

    const motorGeo = new THREE.CylinderGeometry(0.14, 0.14, 0.32, 18);
    motorGeo.rotateZ(Math.PI / 2);
    const motorMat = new THREE.MeshStandardMaterial({ color: 0x0284c7, metalness: 0.7, roughness: 0.35 });
    const motorBody = new THREE.Mesh(motorGeo, motorMat);
    motorGroup.add(motorBody);

    const gearGeo = new THREE.BoxGeometry(0.24, 0.26, 0.24);
    const gearBox = new THREE.Mesh(gearGeo, darkAluMat);
    gearBox.position.set(0.18, 0, 0);
    motorGroup.add(gearBox);

    // 8. Overhead Machine Vision Camera Gantry
    const visionGantry = new THREE.Group();
    visionGantry.position.set(-0.4, 0, 0);
    conveyorGroup.add(visionGantry);

    const archLegGeo = new THREE.BoxGeometry(0.08, 1.6, 0.08);
    const archLegF = new THREE.Mesh(archLegGeo, darkAluMat);
    archLegF.position.set(0, 1.6, 0.58);
    visionGantry.add(archLegF);

    const archLegB = new THREE.Mesh(archLegGeo, darkAluMat);
    archLegB.position.set(0, 1.6, -0.58);
    visionGantry.add(archLegB);

    const archBridgeGeo = new THREE.BoxGeometry(0.1, 0.08, 1.24);
    const archBridge = new THREE.Mesh(archBridgeGeo, darkAluMat);
    archBridge.position.set(0, 2.38, 0);
    visionGantry.add(archBridge);

    const cameraBodyGeo = new THREE.BoxGeometry(0.14, 0.18, 0.14);
    const cameraBodyMat = new THREE.MeshStandardMaterial({ color: 0xf97316, metalness: 0.5, roughness: 0.35 });
    const cameraBody = new THREE.Mesh(cameraBodyGeo, cameraBodyMat);
    cameraBody.position.set(0, 2.18, 0);
    visionGantry.add(cameraBody);

    const lensGeo = new THREE.CylinderGeometry(0.045, 0.05, 0.08, 16);
    const lensMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, metalness: 0.9, roughness: 0.1 });
    const lens = new THREE.Mesh(lensGeo, lensMat);
    lens.position.set(0, 2.06, 0);
    visionGantry.add(lens);

    const ringLightGeo = new THREE.TorusGeometry(0.065, 0.012, 12, 24);
    ringLightGeo.rotateX(Math.PI / 2);
    const ringLightMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
    const ringLight = new THREE.Mesh(ringLightGeo, ringLightMat);
    ringLight.position.set(0, 2.05, 0);
    visionGantry.add(ringLight);

    const laserSheetGeo = new THREE.PlaneGeometry(0.02, 1.05);
    laserSheetGeo.rotateX(Math.PI / 2);
    const laserSheetMat = new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: 0.75,
      side: THREE.DoubleSide,
    });
    const scanLaserPlane = new THREE.Mesh(laserSheetGeo, laserSheetMat);
    scanLaserPlane.position.set(0, 1.01, 0);
    visionGantry.add(scanLaserPlane);
    simRef.current.scanLaserPlane = scanLaserPlane;

    const scanSpotLight = new THREE.SpotLight(0x38bdf8, 4, 3, Math.PI / 5, 0.4);
    scanSpotLight.position.set(0, 2.05, 0);
    scanSpotLight.target = scanLaserPlane;
    visionGantry.add(scanSpotLight);
    simRef.current.scanSpotLight = scanSpotLight;

    // 9. Photo-Eye Optical Sensor Trigger
    const sensorBodyGeo = new THREE.BoxGeometry(0.06, 0.1, 0.06);
    const sensorBodyMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.4 });
    const sensor1 = new THREE.Mesh(sensorBodyGeo, sensorBodyMat);
    sensor1.position.set(-1.1, 1.12, 0.46);
    conveyorGroup.add(sensor1);

    const laserRayGeo = new THREE.CylinderGeometry(0.005, 0.005, 0.88, 6);
    laserRayGeo.rotateX(Math.PI / 2);
    const sensorRayMat = new THREE.MeshBasicMaterial({ color: 0xef4444, transparent: true, opacity: 0.85 });
    const sensor1Ray = new THREE.Mesh(laserRayGeo, sensorRayMat);
    sensor1Ray.position.set(-1.1, 1.12, 0);
    conveyorGroup.add(sensor1Ray);
    simRef.current.sensorRayMat = sensorRayMat;

    // ----------------------------------------------------
    // 10. DEDICATED 24" VISION OPERATOR MONITOR (WITH DYNAMIC CANVAS TEXTURE)
    // (Requested: "ISME EK MONITOR SCREEN HOGA")
    // ----------------------------------------------------
    const monitorStation = new THREE.Group();
    monitorStation.position.set(-0.4, 0, 1.05);
    scene.add(monitorStation);

    const standPostGeo = new THREE.CylinderGeometry(0.035, 0.045, 1.45, 16);
    const standPost = new THREE.Mesh(standPostGeo, darkAluMat);
    standPost.position.set(0, 0.725, 0);
    standPost.castShadow = true;
    monitorStation.add(standPost);

    const standBaseGeo = new THREE.CylinderGeometry(0.24, 0.25, 0.04, 20);
    const standBase = new THREE.Mesh(standBaseGeo, darkAluMat);
    standBase.position.set(0, 0.02, 0);
    monitorStation.add(standBase);

    const armGeo = new THREE.BoxGeometry(0.04, 0.05, 0.35);
    const armMesh = new THREE.Mesh(armGeo, aluMat);
    armMesh.position.set(0, 1.45, -0.12);
    monitorStation.add(armMesh);

    const monitorBoxGeo = new THREE.BoxGeometry(0.72, 0.46, 0.04);
    const monitorBoxMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.4 });
    const monitorHousing = new THREE.Mesh(monitorBoxGeo, monitorBoxMat);
    monitorHousing.position.set(0, 1.55, -0.3);
    monitorHousing.rotation.x = -0.15;
    monitorStation.add(monitorHousing);

    // Dynamic 2D Canvas for Live Vision Monitor Feed
    const monitorCanvas = document.createElement('canvas');
    monitorCanvas.width = 512;
    monitorCanvas.height = 320;
    const monitorCtx = monitorCanvas.getContext('2d');
    const monitorTexture = new THREE.CanvasTexture(monitorCanvas);
    monitorTexture.minFilter = THREE.LinearFilter;
    simRef.current.monitorTexture = monitorTexture;
    simRef.current.monitorCanvas = monitorCanvas;
    simRef.current.monitorCtx = monitorCtx;

    const monitorScreenGeo = new THREE.BoxGeometry(0.66, 0.4, 0.01);
    const monitorScreenMat = new THREE.MeshBasicMaterial({ map: monitorTexture });
    const monitorScreen = new THREE.Mesh(monitorScreenGeo, monitorScreenMat);
    monitorScreen.position.set(0, 1.55, -0.278);
    monitorScreen.rotation.x = -0.15;
    monitorStation.add(monitorScreen);

    const kbTrayGeo = new THREE.BoxGeometry(0.55, 0.02, 0.22);
    const kbTray = new THREE.Mesh(kbTrayGeo, darkAluMat);
    kbTray.position.set(0, 1.15, -0.22);
    monitorStation.add(kbTray);

    // ----------------------------------------------------
    // 11. REAL INDUSTRIAL PLC CONTROL PANEL (MOVED TO LEFT SIDE: X = -3.4m)
    // (Requested: "PENAL KO SIZE BADA KARO SAHI SE DIKHA NAHI RAHA HAI PENAL KON ACCHE FIT KARO LEFT SIDE ME KARO AUR WO REAL NAHI LAG RAHA HAI USKO REAL PENAL BANA HAI PEANL KA DORE BHI OPEN HOGA")
    // ----------------------------------------------------
    const cabinetGroup = new THREE.Group();
    cabinetGroup.position.set(-3.4, 0, -1.05); // Fitted cleanly on the Left Side
    scene.add(cabinetGroup);

    const cabWidth = 1.35;
    const cabHeight = 1.85;
    const cabDepth = 0.5;

    // Steel Plinth Base
    const plinthGeo = new THREE.BoxGeometry(cabWidth + 0.04, 0.12, cabDepth + 0.04);
    const plinth = new THREE.Mesh(plinthGeo, darkAluMat);
    plinth.position.set(0, 0.06, 0);
    cabinetGroup.add(plinth);

    const rittalGrayMat = new THREE.MeshStandardMaterial({
      color: 0xc8d1d9,
      metalness: 0.45,
      roughness: 0.38,
    });

    // Enclosure walls
    const backWallGeo = new THREE.BoxGeometry(cabWidth, cabHeight, 0.03);
    const backWall = new THREE.Mesh(backWallGeo, rittalGrayMat);
    backWall.position.set(0, cabHeight / 2 + 0.12, -cabDepth / 2 + 0.015);
    cabinetGroup.add(backWall);

    const sideWallGeo = new THREE.BoxGeometry(0.03, cabHeight, cabDepth);
    const leftWall = new THREE.Mesh(sideWallGeo, rittalGrayMat);
    leftWall.position.set(-cabWidth / 2 + 0.015, cabHeight / 2 + 0.12, 0);
    cabinetGroup.add(leftWall);

    const rightWall = new THREE.Mesh(sideWallGeo, rittalGrayMat);
    rightWall.position.set(cabWidth / 2 - 0.015, cabHeight / 2 + 0.12, 0);
    cabinetGroup.add(rightWall);

    // Cooling Louvers on Right Wall
    const louverGeo = new THREE.BoxGeometry(0.01, 0.28, 0.22);
    const louverMat = new THREE.MeshStandardMaterial({ color: 0x475569 });
    const louver = new THREE.Mesh(louverGeo, louverMat);
    louver.position.set(cabWidth / 2 - 0.01, cabHeight / 2 + 0.35, 0);
    cabinetGroup.add(louver);

    const roofGeo = new THREE.BoxGeometry(cabWidth, 0.04, cabDepth);
    const roof = new THREE.Mesh(roofGeo, rittalGrayMat);
    roof.position.set(0, cabHeight + 0.12, 0);
    cabinetGroup.add(roof);

    const bottomPlate = new THREE.Mesh(roofGeo, rittalGrayMat);
    bottomPlate.position.set(0, 0.14, 0);
    cabinetGroup.add(bottomPlate);

    // ----------------------------------------------------
    // REAL PLC PANEL INTERIOR (MATCHING USER'S PHOTO)
    // ----------------------------------------------------
    const interiorGroup = new THREE.Group();
    cabinetGroup.add(interiorGroup);

    // Galvanized Backplate
    const backplateGeo = new THREE.BoxGeometry(cabWidth - 0.08, cabHeight - 0.15, 0.015);
    const zincMat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, metalness: 0.9, roughness: 0.28 });
    const backplate = new THREE.Mesh(backplateGeo, zincMat);
    backplate.position.set(0, cabHeight / 2 + 0.12, -cabDepth / 2 + 0.04);
    interiorGroup.add(backplate);

    // Slotted Cable Trunking
    const ductMat = new THREE.MeshStandardMaterial({ color: 0x64748b, roughness: 0.6 });
    const ductGeo = new THREE.BoxGeometry(cabWidth - 0.12, 0.07, 0.05);
    [-0.55, -0.15, 0.28, 0.68].forEach((dy) => {
      const duct = new THREE.Mesh(ductGeo, ductMat);
      duct.position.set(0, cabHeight / 2 + 0.12 + dy, -cabDepth / 2 + 0.07);
      interiorGroup.add(duct);
    });

    // Steel DIN Rails
    const dinRailMat = new THREE.MeshStandardMaterial({ color: 0xcfd8dc, metalness: 0.95, roughness: 0.15 });
    const dinRailGeo = new THREE.BoxGeometry(cabWidth - 0.18, 0.035, 0.01);
    [-0.35, 0.07, 0.48].forEach((ry) => {
      const dinRail = new THREE.Mesh(dinRailGeo, dinRailMat);
      dinRail.position.set(0, cabHeight / 2 + 0.12 + ry, -cabDepth / 2 + 0.06);
      interiorGroup.add(dinRail);
    });

    // ROW 1: Circuit Breakers & 24V DC SMPS Power Supply
    const mcb3Geo = new THREE.BoxGeometry(0.12, 0.1, 0.07);
    const mcbMat = new THREE.MeshStandardMaterial({ color: 0xf1f5f9, roughness: 0.4 });
    const mcb3 = new THREE.Mesh(mcb3Geo, mcbMat);
    mcb3.position.set(-0.46, cabHeight / 2 + 0.12 + 0.48, -cabDepth / 2 + 0.1);
    interiorGroup.add(mcb3);

    const mcb1Geo = new THREE.BoxGeometry(0.04, 0.09, 0.065);
    for (let b = 0; b < 4; b++) {
      const mcb1 = new THREE.Mesh(mcb1Geo, mcbMat);
      mcb1.position.set(-0.35 + b * 0.045, cabHeight / 2 + 0.12 + 0.48, -cabDepth / 2 + 0.1);
      interiorGroup.add(mcb1);
    }

    const smpsGeo = new THREE.BoxGeometry(0.18, 0.12, 0.08);
    const smpsMat = new THREE.MeshStandardMaterial({ color: 0x475569, metalness: 0.85, roughness: 0.3 });
    const smps = new THREE.Mesh(smpsGeo, smpsMat);
    smps.position.set(-0.04, cabHeight / 2 + 0.12 + 0.48, -cabDepth / 2 + 0.11);
    interiorGroup.add(smps);

    const contactorGeo = new THREE.BoxGeometry(0.11, 0.11, 0.08);
    const contactor = new THREE.Mesh(contactorGeo, darkAluMat);
    contactor.position.set(0.15, cabHeight / 2 + 0.12 + 0.48, -cabDepth / 2 + 0.11);
    interiorGroup.add(contactor);

    // ROW 2: SIEMENS SIMATIC S7-1200 PLC SYSTEM (CPU 1214C + I/O Expansion Cards)
    const plcCpuGeo = new THREE.BoxGeometry(0.18, 0.14, 0.085);
    const plcCpuMat = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.4 });
    const plcCpu = new THREE.Mesh(plcCpuGeo, plcCpuMat);
    plcCpu.position.set(-0.42, cabHeight / 2 + 0.12 + 0.07, -cabDepth / 2 + 0.11);
    interiorGroup.add(plcCpu);

    // Siemens signature cyan branding stripe
    const plcStripeGeo = new THREE.BoxGeometry(0.18, 0.015, 0.005);
    const plcStripeMat = new THREE.MeshBasicMaterial({ color: 0x0ea5e9 });
    const plcStripe = new THREE.Mesh(plcStripeGeo, plcStripeMat);
    plcStripe.position.set(0, 0.045, 0.043);
    plcCpu.add(plcStripe);

    // PLC RUN LED (Bright Green Glowing)
    const ledGeo = new THREE.BoxGeometry(0.01, 0.01, 0.005);
    const runLedMat = new THREE.MeshBasicMaterial({ color: 0x22c55e });
    const runLed = new THREE.Mesh(ledGeo, runLedMat);
    runLed.position.set(-0.06, 0.015, 0.043);
    plcCpu.add(runLed);

    // Expansion I/O Modules (DI, DQ, AI)
    const plcModuleGeo = new THREE.BoxGeometry(0.065, 0.14, 0.085);
    const plcModuleMat = new THREE.MeshStandardMaterial({ color: 0x475569, roughness: 0.45 });
    for (let m = 0; m < 4; m++) {
      const ioMod = new THREE.Mesh(plcModuleGeo, plcModuleMat);
      ioMod.position.set(-0.29 + m * 0.068, cabHeight / 2 + 0.12 + 0.07, -cabDepth / 2 + 0.11);
      interiorGroup.add(ioMod);
    }

    // Yellow Safety Relay Module
    const safetyRelayGeo = new THREE.BoxGeometry(0.065, 0.11, 0.08);
    const safetyRelayMat = new THREE.MeshStandardMaterial({ color: 0xfacc15, roughness: 0.4 });
    const safetyRelay = new THREE.Mesh(safetyRelayGeo, safetyRelayMat);
    safetyRelay.position.set(0.08, cabHeight / 2 + 0.12 + 0.07, -cabDepth / 2 + 0.1);
    interiorGroup.add(safetyRelay);

    // ROW 3: Field I/O Terminal Strips
    const termStripMainGeo = new THREE.BoxGeometry(0.85, 0.07, 0.05);
    const termGrayMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8 });
    const termStripMain = new THREE.Mesh(termStripMainGeo, termGrayMat);
    termStripMain.position.set(-0.06, cabHeight / 2 + 0.12 - 0.35, -cabDepth / 2 + 0.09);
    interiorGroup.add(termStripMain);

    const earthTermGeo = new THREE.BoxGeometry(0.12, 0.07, 0.05);
    const earthMat = new THREE.MeshStandardMaterial({ color: 0x84cc16 });
    const earthTerm = new THREE.Mesh(earthTermGeo, earthMat);
    earthTerm.position.set(0.44, cabHeight / 2 + 0.12 - 0.35, -cabDepth / 2 + 0.09);
    interiorGroup.add(earthTerm);

    // ----------------------------------------------------
    // 12. HINGED CABINET DOOR WITH REAL DYNAMIC HMI SCREEN
    // (Requested: "HMI PE KUCHH SHOW HI NAHI HO RAHA HAI AUR HMI BHI BADI HO")
    // ----------------------------------------------------
    const doorPivot = new THREE.Group();
    doorPivot.position.set(-cabWidth / 2, 0, cabDepth / 2);
    cabinetGroup.add(doorPivot);
    simRef.current.doorPivot = doorPivot;

    const doorGroup = new THREE.Group();
    doorGroup.position.set(cabWidth / 2, cabHeight / 2 + 0.12, 0);
    doorPivot.add(doorGroup);

    const doorPanelGeo = new THREE.BoxGeometry(cabWidth, cabHeight, 0.025);
    const doorPanel = new THREE.Mesh(doorPanelGeo, rittalGrayMat);
    doorGroup.add(doorPanel);

    // Door Hinges & Handle
    const hingeGeo = new THREE.CylinderGeometry(0.018, 0.018, 0.08, 14);
    const hingeTop = new THREE.Mesh(hingeGeo, darkAluMat);
    hingeTop.position.set(-cabWidth / 2 + 0.02, 0.65, 0.015);
    doorGroup.add(hingeTop);

    const hingeBot = new THREE.Mesh(hingeGeo, darkAluMat);
    hingeBot.position.set(-cabWidth / 2 + 0.02, -0.65, 0.015);
    doorGroup.add(hingeBot);

    const handleGeo = new THREE.BoxGeometry(0.035, 0.22, 0.04);
    const handle = new THREE.Mesh(handleGeo, darkAluMat);
    handle.position.set(cabWidth / 2 - 0.05, 0, 0.03);
    doorGroup.add(handle);

    // Warning Lightning Triangle Decal on Door
    const warningDecalGeo = new THREE.PlaneGeometry(0.12, 0.12);
    const warningDecalMat = new THREE.MeshBasicMaterial({ color: 0xfacc15, side: THREE.DoubleSide });
    const warningDecal = new THREE.Mesh(warningDecalGeo, warningDecalMat);
    warningDecal.position.set(cabWidth / 2 - 0.16, 0.72, 0.016);
    doorGroup.add(warningDecal);

    // LARGE 15" HMI FRAME
    const hmiFrameGeo = new THREE.BoxGeometry(0.68, 0.48, 0.03);
    const hmiFrameMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.3 });
    const hmiFrame = new THREE.Mesh(hmiFrameGeo, hmiFrameMat);
    hmiFrame.position.set(0, 0.32, 0.022);
    doorGroup.add(hmiFrame);

    // REAL DYNAMIC 2D CANVAS TEXTURE FOR HMI SCREEN (Siemens WinCC GUI)
    const hmiCanvas = document.createElement('canvas');
    hmiCanvas.width = 1024;
    hmiCanvas.height = 680;
    const hmiCtx = hmiCanvas.getContext('2d');
    const hmiTexture = new THREE.CanvasTexture(hmiCanvas);
    hmiTexture.minFilter = THREE.LinearFilter;
    simRef.current.hmiTexture = hmiTexture;
    simRef.current.hmiCanvas = hmiCanvas;
    simRef.current.hmiCtx = hmiCtx;

    const hmiGlassGeo = new THREE.BoxGeometry(0.62, 0.42, 0.01);
    const hmiGlassMat = new THREE.MeshBasicMaterial({ map: hmiTexture });
    const hmiGlass = new THREE.Mesh(hmiGlassGeo, hmiGlassMat);
    hmiGlass.position.set(0, 0.32, 0.038);
    doorGroup.add(hmiGlass);

    // 3 PHYSICAL BUTTONS ON DOOR
    const clickableButtons = [];
    const btnBaseGeo = new THREE.CylinderGeometry(0.04, 0.04, 0.02, 18);
    btnBaseGeo.rotateX(Math.PI / 2);
    const bezelMat = new THREE.MeshStandardMaterial({ color: 0x475569, metalness: 0.9, roughness: 0.2 });

    // START (Green)
    const startBase = new THREE.Mesh(btnBaseGeo, bezelMat);
    startBase.position.set(-0.25, -0.18, 0.02);
    doorGroup.add(startBase);

    const startCapGeo = new THREE.CylinderGeometry(0.028, 0.028, 0.03, 18);
    startCapGeo.rotateX(Math.PI / 2);
    const startMat = new THREE.MeshStandardMaterial({ color: 0x22c55e, emissive: 0x15803d, emissiveIntensity: 0.4 });
    const startBtnMesh = new THREE.Mesh(startCapGeo, startMat);
    startBtnMesh.position.set(-0.25, -0.18, 0.036);
    startBtnMesh.userData = { action: 'START' };
    doorGroup.add(startBtnMesh);
    clickableButtons.push(startBtnMesh);

    // STOP (Yellow/Red)
    const stopBase = new THREE.Mesh(btnBaseGeo, bezelMat);
    stopBase.position.set(0, -0.18, 0.02);
    doorGroup.add(stopBase);

    const stopCapGeo = new THREE.CylinderGeometry(0.028, 0.028, 0.03, 18);
    stopCapGeo.rotateX(Math.PI / 2);
    const stopMat = new THREE.MeshStandardMaterial({ color: 0xef4444, emissive: 0x991b1b, emissiveIntensity: 0.3 });
    const stopBtnMesh = new THREE.Mesh(stopCapGeo, stopMat);
    stopBtnMesh.position.set(0, -0.18, 0.036);
    stopBtnMesh.userData = { action: 'STOP' };
    doorGroup.add(stopBtnMesh);
    clickableButtons.push(stopBtnMesh);

    // EMERGENCY STOP (Big Red Mushroom Head on Yellow Ring)
    const estopBaseGeo = new THREE.CylinderGeometry(0.052, 0.052, 0.025, 18);
    estopBaseGeo.rotateX(Math.PI / 2);
    const estopYellowMat = new THREE.MeshStandardMaterial({ color: 0xfacc15, roughness: 0.4 });
    const estopBase = new THREE.Mesh(estopBaseGeo, estopYellowMat);
    estopBase.position.set(0.25, -0.18, 0.02);
    doorGroup.add(estopBase);

    const estopMushroomGeo = new THREE.CylinderGeometry(0.048, 0.035, 0.045, 20);
    estopMushroomGeo.rotateX(Math.PI / 2);
    const estopMushroomMat = new THREE.MeshStandardMaterial({ color: 0xdc2626, emissive: 0x7f1d1d, emissiveIntensity: 0.5 });
    const estopBtnMesh = new THREE.Mesh(estopMushroomGeo, estopMushroomMat);
    estopBtnMesh.position.set(0.25, -0.18, 0.048);
    estopBtnMesh.userData = { action: 'ESTOP' };
    doorGroup.add(estopBtnMesh);
    clickableButtons.push(estopBtnMesh);

    simRef.current.clickableButtons = clickableButtons;

    // 13. TRICOLOR TOWER LIGHT (ON CABINET ROOF)
    const stackPoleGeo = new THREE.CylinderGeometry(0.02, 0.02, 0.55, 14);
    const stackPole = new THREE.Mesh(stackPoleGeo, aluMat);
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

    // 14. Automated Pneumatic Reject Pusher (at X = 1.3)
    const sortingStation = new THREE.Group();
    sortingStation.position.set(1.3, 0, 0);
    conveyorGroup.add(sortingStation);

    const cylinderBodyGeo = new THREE.CylinderGeometry(0.05, 0.05, 0.35, 16);
    cylinderBodyGeo.rotateZ(Math.PI / 2);
    cylinderBodyGeo.rotateY(Math.PI / 2);
    const cylinderBodyMat = new THREE.MeshStandardMaterial({ color: 0x64748b, metalness: 0.85, roughness: 0.2 });
    const cylinderBody = new THREE.Mesh(cylinderBodyGeo, cylinderBodyMat);
    cylinderBody.position.set(0, 1.15, -0.65);
    sortingStation.add(cylinderBody);

    const pusherArm = new THREE.Group();
    pusherArm.position.set(0, 1.15, -0.45);
    sortingStation.add(pusherArm);
    simRef.current.pusherArm = pusherArm;

    const pistonRodGeo = new THREE.CylinderGeometry(0.02, 0.02, 0.35, 12);
    pistonRodGeo.rotateX(Math.PI / 2);
    const pistonRod = new THREE.Mesh(pistonRodGeo, aluMat);
    pistonRod.position.set(0, 0, 0);
    pusherArm.add(pistonRod);

    const paddleGeo = new THREE.BoxGeometry(0.36, 0.12, 0.03);
    const paddleMat = new THREE.MeshStandardMaterial({ color: 0xf47b20, roughness: 0.5 });
    const paddle = new THREE.Mesh(paddleGeo, paddleMat);
    paddle.position.set(0, 0, 0.18);
    pusherArm.add(paddle);

    // 15. NG Reject Chute & Bin
    const ngBinGroup = new THREE.Group();
    ngBinGroup.position.set(1.3, 0, 1.05);
    conveyorGroup.add(ngBinGroup);

    const chuteGeo = new THREE.BoxGeometry(0.65, 0.02, 0.75);
    chuteGeo.rotateX(0.24);
    const chuteMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.8, roughness: 0.3 });
    const chute = new THREE.Mesh(chuteGeo, chuteMat);
    chute.position.set(0, 0.92, -0.25);
    ngBinGroup.add(chute);

    const binGeo = new THREE.BoxGeometry(0.75, 0.55, 0.65);
    const binMat = new THREE.MeshStandardMaterial({ color: 0xb91c1c, roughness: 0.65 });
    const bin = new THREE.Mesh(binGeo, binMat);
    bin.position.set(0, 0.3, 0.28);
    bin.castShadow = true;
    ngBinGroup.add(bin);

    // 16. Finished Goods OK Primary Output Table
    const okTableGeo = new THREE.BoxGeometry(0.7, 0.95, 0.8);
    const okTableMat = new THREE.MeshStandardMaterial({ color: 0x15803d, roughness: 0.6 });
    const okTable = new THREE.Mesh(okTableGeo, okTableMat);
    okTable.position.set(4.6, 0.475, 0);
    conveyorGroup.add(okTable);

    // 17. Box Creation & Spawning with Weight Attribution
    const boxGeo = new THREE.BoxGeometry(0.38, 0.26, 0.32);
    const okBoxMat = new THREE.MeshStandardMaterial({ color: 0xd97706, roughness: 0.85, metalness: 0.05 });
    const ngBoxMat = new THREE.MeshStandardMaterial({ color: 0xef4444, roughness: 0.65, metalness: 0.1 });

    const createBox = (isNg, idNum, forcedWeight) => {
      let weight = TARGET_WEIGHT + (Math.random() * 8 - 4); // normal e.g. 496 - 504g
      let defectReason = null;

      if (isNg) {
        if (forcedWeight === 'under') {
          weight = 435.0 + Math.random() * 15; // underweight
          defectReason = `Underweight (${weight.toFixed(1)}g < 485g)`;
        } else if (forcedWeight === 'over') {
          weight = 575.0 + Math.random() * 20; // overweight
          defectReason = `Overweight (${weight.toFixed(1)}g > 515g)`;
        } else {
          defectReason = DEFECT_TYPES[Math.floor(Math.random() * DEFECT_TYPES.length)];
          if (defectReason.includes('Underweight')) weight = 438.0;
          if (defectReason.includes('Overweight')) weight = 572.0;
        }
      }

      const boxMesh = new THREE.Mesh(boxGeo, isNg ? ngBoxMat.clone() : okBoxMat.clone());
      boxMesh.position.set(-4.0, 1.13, 0);
      boxMesh.castShadow = true;
      boxMesh.receiveShadow = true;
      conveyorGroup.add(boxMesh);

      const labelGeo = new THREE.PlaneGeometry(0.18, 0.12);
      labelGeo.rotateX(-Math.PI / 2);
      const labelMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
      const label = new THREE.Mesh(labelGeo, labelMat);
      label.position.set(0, 0.131, 0);
      boxMesh.add(label);

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

    // 18. Helper function to render Real Siemens HMI CanvasTexture
    const drawHmiCanvas = (ctx, st, scan, wt) => {
      ctx.fillStyle = '#061325';
      ctx.fillRect(0, 0, 1024, 680);

      // Top Header Bar
      ctx.fillStyle = '#0284c7';
      ctx.fillRect(0, 0, 1024, 64);
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 26px sans-serif';
      ctx.fillText('SIEMENS SIMATIC HMI — RVMAITECH SMART PACKAGING LINE', 28, 42);

      ctx.fillStyle = st === 'RUNNING' ? '#22c55e' : st === 'IDLE' ? '#facc15' : '#ef4444';
      ctx.font = 'bold 22px sans-serif';
      ctx.fillText(`STATUS: ${st}`, 800, 42);

      // 4 Main Telemetry Cards
      // 1. Weight Sensor Card (Checkweigher)
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

      // 2. Vision QC Inspection Card
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

      // Bottom Row: Production Yield & Diagnostics
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

      // Virtual Buttons on HMI Screen
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

    // 19. Helper function to render Live Vision Operator Monitor Feed
    const drawMonitorCanvas = (ctx, scan) => {
      ctx.fillStyle = '#050c18';
      ctx.fillRect(0, 0, 512, 320);

      // Top title
      ctx.fillStyle = '#0284c7';
      ctx.fillRect(0, 0, 512, 36);
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 15px sans-serif';
      ctx.fillText('RVMAITECH AI VISION QC — LIVE CAM 01', 14, 24);

      // Reticle Crosshairs & Bounding Box
      ctx.strokeStyle = scan.status === 'OK' ? '#22c55e' : '#ef4444';
      ctx.lineWidth = 2.5;
      ctx.strokeRect(90, 65, 332, 190);

      ctx.beginPath();
      ctx.moveTo(256, 45); ctx.lineTo(256, 65);
      ctx.moveTo(256, 255); ctx.lineTo(256, 275);
      ctx.moveTo(70, 160); ctx.lineTo(90, 160);
      ctx.moveTo(422, 160); ctx.lineTo(442, 160);
      ctx.stroke();

      // Info text
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

    // Initial draw
    drawHmiCanvas(hmiCtx, machineState, currentScan, 501.2);
    hmiTexture.needsUpdate = true;
    drawMonitorCanvas(monitorCtx, currentScan);
    monitorTexture.needsUpdate = true;

    // 20. Orbit Controls & Raycasting for 3D Buttons & Door
    let isDragging = false;
    let prevMouseX = 0;
    let prevMouseY = 0;
    let spherical = {
      radius: 7.2,
      theta: 0.28,
      phi: 1.18,
    };

    const updateCameraFromSpherical = () => {
      spherical.phi = Math.max(0.35, Math.min(Math.PI / 2 - 0.05, spherical.phi));
      spherical.radius = Math.max(3.8, Math.min(11.0, spherical.radius));
      camera.position.x = spherical.radius * Math.sin(spherical.phi) * Math.sin(spherical.theta) - 0.5;
      camera.position.y = spherical.radius * Math.cos(spherical.phi) + 0.6;
      camera.position.z = spherical.radius * Math.sin(spherical.phi) * Math.cos(spherical.theta);
      camera.lookAt(-0.5, 0.9, 0);
    };
    updateCameraFromSpherical();

    const dom = renderer.domElement;

    const onPointerDown = (e) => {
      isDragging = true;
      prevMouseX = e.clientX;
      prevMouseY = e.clientY;

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

    const onPointerMove = (e) => {
      if (!isDragging) return;
      const dx = e.clientX - prevMouseX;
      const dy = e.clientY - prevMouseY;
      prevMouseX = e.clientX;
      prevMouseY = e.clientY;
      spherical.theta -= dx * 0.007;
      spherical.phi -= dy * 0.007;
      updateCameraFromSpherical();
    };

    const onPointerUp = () => {
      isDragging = false;
    };

    const onWheel = (e) => {
      e.preventDefault();
      spherical.radius += e.deltaY * 0.004;
      updateCameraFromSpherical();
    };

    dom.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
    dom.addEventListener('wheel', onWheel, { passive: false });

    // 21. Real-Time Animation Loop
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

      // Smooth Door Swing Open / Close Animation
      const targetDoorAngle = sim.isDoorOpen ? -Math.PI * 0.6 : 0;
      sim.doorAngle += (targetDoorAngle - sim.doorAngle) * 0.1;
      if (sim.doorPivot) {
        sim.doorPivot.rotation.y = sim.doorAngle;
      }

      if (sim.cabinetLight) {
        const openFactor = Math.abs(sim.doorAngle) / (Math.PI * 0.6);
        sim.cabinetLight.intensity = openFactor * 2.4;
      }

      // Periodically refresh the HMI & Monitor CanvasTexture
      if (now - lastHmiDraw > 150) {
        lastHmiDraw = now;
        drawHmiCanvas(sim.hmiCtx, state, currentScan, sim.lastWeight);
        sim.hmiTexture.needsUpdate = true;
        drawMonitorCanvas(sim.monitorCtx, currentScan);
        sim.monitorTexture.needsUpdate = true;
      }

      // TOWER LIGHT & BEACON BEHAVIOR:
      //  - RUNNING: Green ON (solid), Yellow OFF, Red OFF
      //  - IDLE (STOP): Yellow ON (solid), Green OFF, Red OFF
      //  - ESTOP: Red FLASHING (alarm pulse), Green OFF, Yellow OFF
      if (state === 'ESTOP') {
        const blink = Math.sin(now * 0.012) > 0;
        if (blink) {
          sim.stackRedMat.color.setHex(0xef4444);
          sim.stackRedMat.emissive.setHex(0xef4444);
          sim.stackRedMat.emissiveIntensity = 1.0;
          sim.beaconLight.color.setHex(0xef4444);
          sim.beaconLight.intensity = 3.2;
        } else {
          sim.stackRedMat.color.setHex(0x450a0a);
          sim.stackRedMat.emissive.setHex(0x000000);
          sim.beaconLight.intensity = 0.2;
        }
        sim.stackYellowMat.color.setHex(0x451a03);
        sim.stackYellowMat.emissive.setHex(0x000000);
        sim.stackGreenMat.color.setHex(0x064e3b);
        sim.stackGreenMat.emissive.setHex(0x000000);
      } else if (state === 'IDLE') {
        sim.stackYellowMat.color.setHex(0xfacc15);
        sim.stackYellowMat.emissive.setHex(0xfacc15);
        sim.stackYellowMat.emissiveIntensity = 0.9;
        sim.beaconLight.color.setHex(0xfacc15);
        sim.beaconLight.intensity = 2.4;

        sim.stackGreenMat.color.setHex(0x064e3b);
        sim.stackGreenMat.emissive.setHex(0x000000);
        sim.stackRedMat.color.setHex(0x450a0a);
        sim.stackRedMat.emissive.setHex(0x000000);
      } else {
        // RUNNING State: Green ON
        if (now < sim.ngBlinkTimer) {
          sim.stackRedMat.color.setHex(0xef4444);
          sim.stackRedMat.emissive.setHex(0xef4444);
          sim.stackRedMat.emissiveIntensity = 1.0;
          sim.beaconLight.color.setHex(0xef4444);
          sim.beaconLight.intensity = 3.2;

          sim.stackGreenMat.color.setHex(0x064e3b);
          sim.stackGreenMat.emissive.setHex(0x000000);
        } else {
          sim.stackGreenMat.color.setHex(0x22c55e);
          sim.stackGreenMat.emissive.setHex(0x22c55e);
          sim.stackGreenMat.emissiveIntensity = 0.95;
          sim.beaconLight.color.setHex(0x22c55e);
          sim.beaconLight.intensity = 2.5;

          sim.stackRedMat.color.setHex(0x450a0a);
          sim.stackRedMat.emissive.setHex(0x000000);
        }
        sim.stackYellowMat.color.setHex(0x451a03);
        sim.stackYellowMat.emissive.setHex(0x000000);
      }

      // CONVEYOR & BOX MOVEMENT (WHEN RUNNING)
      if (state === 'RUNNING') {
        const moveDist = 1.25 * sim.speed * dt;

        // Smooth Round-and-Round Roller Spin
        const rollAngleDelta = (moveDist / rollerRadius);
        sim.rollers.forEach((r) => {
          r.rotation.y -= rollAngleDelta;
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

            // Weighing platform slight depression bounce
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

            const isWeightFail = box.weight < TARGET_WEIGHT - WEIGHT_TOLERANCE || box.weight > TARGET_WEIGHT + WEIGHT_TOLERANCE;
            const isReject = box.isNg || isWeightFail;

            if (isReject) {
              sim.scanLaserPlane.material.color.setHex(0xef4444);
              sim.scanSpotLight.color.setHex(0xef4444);
              sim.ngBlinkTimer = now + 1800;
            } else {
              sim.scanLaserPlane.material.color.setHex(0x22c55e);
              sim.scanSpotLight.color.setHex(0x22c55e);
            }

            const timeStr = new Date().toLocaleTimeString('en-IN', { hour12: false });
            const itemScan = {
              id: box.id,
              status: isReject ? 'NG' : 'OK',
              confidence: isReject ? 97.6 : 99.7,
              weight: box.weight,
              defect: box.defect || (isWeightFail ? `Weight Error (${box.weight}g)` : null),
              scanTime: timeStr,
              barcode: `RVM-${box.id}-${isReject ? 'REJECT' : 'PASS'}`,
            };
            setCurrentScan(itemScan);

            setMetrics((prev) => {
              const newTotal = prev.total + 1;
              const newOk = isReject ? prev.ok : prev.ok + 1;
              const newNg = isReject ? prev.ng + 1 : prev.ng;
              return {
                ...prev,
                total: newTotal,
                ok: newOk,
                ng: newNg,
                cycleTimeMs: Math.floor(32 + Math.random() * 10),
              };
            });

            setInspectionLog((prev) => [
              {
                id: box.id,
                time: timeStr,
                weight: `${box.weight}g`,
                status: isReject ? 'NG' : 'OK',
                defect: itemScan.defect || 'All Specs In Range',
                dest: isReject ? 'Reject Chute (NG)' : 'Main Line (OK)',
              },
              ...prev.slice(0, 5),
            ]);
          }

          if (box.mesh.position.x > -0.1 && box.mesh.position.x < 0.1) {
            sim.scanLaserPlane.material.color.setHex(0x38bdf8);
            sim.scanSpotLight.color.setHex(0x38bdf8);
          }

          // 4. Pneumatic Diverter (at X = 1.3)
          const isWeightFail = box.weight < TARGET_WEIGHT - WEIGHT_TOLERANCE || box.weight > TARGET_WEIGHT + WEIGHT_TOLERANCE;
          if ((box.isNg || isWeightFail) && !box.rejected && box.mesh.position.x >= 1.15 && box.mesh.position.x <= 1.45) {
            box.rejected = true;
            isPushing = true;
            pusherProgress = 0;
          }

          // 5. Finish Line (OK Output)
          if (box.mesh.position.x > 4.6) {
            conveyorGroup.remove(box.mesh);
            sim.boxes.splice(i, 1);
          }
        }

        // Animate Pneumatic Reject Pusher Arm
        if (isPushing) {
          pusherProgress += 5.5 * sim.speed * dt;
          if (pusherProgress < 1.0) {
            sim.pusherArm.position.z = -0.45 + pusherProgress * 0.42;
          } else if (pusherProgress < 2.0) {
            sim.pusherArm.position.z = -0.45 + (2.0 - pusherProgress) * 0.42;
          } else {
            isPushing = false;
            pusherProgress = 0;
            sim.pusherArm.position.z = -0.45;
          }
        }
      }

      renderer.render(scene, camera);
    };

    animId = requestAnimationFrame(animate);

    const handleResize = () => {
      if (!container) return;
      const w = container.clientWidth || 800;
      const h = container.clientHeight || 560;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', handleResize);
      dom.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
      dom.removeEventListener('wheel', onWheel);
      renderer.dispose();
      if (dom.parentNode) {
        dom.parentNode.removeChild(dom);
      }
    };
  }, []);

  const yieldPercent = metrics.total > 0 ? ((metrics.ok / metrics.total) * 100).toFixed(1) : '100.0';
  const defectPercent = metrics.total > 0 ? ((metrics.ng / metrics.total) * 100).toFixed(1) : '0.0';

  const resetStats = () => {
    setMetrics((prev) => ({
      ...prev,
      total: 0,
      ok: 0,
      ng: 0,
    }));
  };

  return (
    <div className="smart-conveyor-wrapper">
      {/* Top Banner / System Bar */}
      <div className="sc-header-bar">
        <div className="sc-header-left">
          <div className="sc-pulse-badge">
            <span
              className={`sc-dot ${
                machineState === 'RUNNING'
                  ? 'sc-dot-active'
                  : machineState === 'IDLE'
                  ? 'sc-dot-paused'
                  : 'sc-dot-estop'
              }`}
            />
            <span>
              {machineState === 'RUNNING' && 'TOWER BEACON: 🟢 GREEN (RUNNING / 50 FPS)'}
              {machineState === 'IDLE' && 'TOWER BEACON: 🟡 YELLOW (IDLE / STANDBY)'}
              {machineState === 'ESTOP' && 'TOWER BEACON: 🔴 RED BLINKING (EMERGENCY STOPPED)'}
            </span>
          </div>
          <h3 className="sc-title">
            Smart Conveyor Belt · In-Line Checkweigher &amp; Real Siemens PLC Vision System
          </h3>
          <p className="sc-subtitle">
            Real industrial setup on Left Side: Openable electrical panel with internal Siemens S7-1200 PLC,
            live 15&quot; HMI touchscreen, in-line load cell weight sensor (500g ±15g), 24&quot; vision monitor, and pneumatic sorting.
          </p>
        </div>

        {/* Real Industrial Hardware Buttons Bar + Open Door Toggle */}
        <div className="sc-header-actions sc-industrial-deck">
          {/* OPEN / CLOSE PANEL DOOR TOGGLE */}
          <button
            type="button"
            className={`sc-hw-btn sc-hw-door ${isDoorOpen ? 'door-open' : ''}`}
            onClick={() => setIsDoorOpen(!isDoorOpen)}
            title="Open or Close PLC Cabinet Front Door"
          >
            {isDoorOpen ? <><DoorOpen size={16} /> Close Panel</> : <><DoorClosed size={16} /> Open Panel (Inspect Siemens PLC)</>}
          </button>

          {/* START BUTTON (Green) */}
          <button
            type="button"
            className={`sc-hw-btn sc-hw-start ${machineState === 'RUNNING' ? 'hw-active' : ''}`}
            onClick={() => setMachineState('RUNNING')}
            title="START Line (Tower Light: Green)"
          >
            <Play size={16} /> START
          </button>

          {/* STOP BUTTON (Yellow / Red) */}
          <button
            type="button"
            className={`sc-hw-btn sc-hw-stop ${machineState === 'IDLE' ? 'hw-active' : ''}`}
            onClick={() => setMachineState('IDLE')}
            title="STOP Line (Tower Light: Yellow / Idle)"
          >
            <Pause size={16} /> STOP
          </button>

          {/* EMERGENCY STOP (Big Red Mushroom) */}
          <button
            type="button"
            className={`sc-hw-btn sc-hw-estop ${machineState === 'ESTOP' ? 'hw-active' : ''}`}
            onClick={() => setMachineState('ESTOP')}
            title="EMERGENCY STOP (Tower Light: Red Blinking)"
          >
            <Octagon size={18} /> E-STOP
          </button>

          <button
            type="button"
            className="sc-btn sc-btn-secondary"
            onClick={resetStats}
            title="Reset Batch Counters"
          >
            <RotateCcw size={15} /> Reset
          </button>
        </div>
      </div>

      {/* Main Grid: 3D Canvas (Left) + Factory SCADA HMI Screen (Right) */}
      <div className="sc-main-grid">
        {/* Left: 3D WebGL Canvas */}
        <div className="sc-canvas-container" style={{ height: 600 }}>
          <div ref={mountRef} className="sc-three-canvas" />

          {/* Interactive 3D Canvas HUD overlays */}
          <div className="sc-canvas-hud-top">
            <span className="sc-hud-tag"><Scale size={13} /> Load Cell: {metrics.currentWeight}g ({metrics.weightStatus})</span>
            <span className="sc-hud-tag"><Cpu size={13} /> Siemens S7-1200 CPU 1214C</span>
            <span className="sc-hud-tag"><Monitor size={13} /> 24&quot; Vision Screen</span>
            <span className="sc-hud-tag"><Activity size={13} /> 6.2 Bar Air</span>
          </div>

          <div className="sc-canvas-hud-bottom">
            <span className="sc-hud-tip">
              🚪 Click <strong>&quot;Open Panel&quot;</strong> to inspect the Siemens PLC inside · <strong>Drag 360°</strong> to orbit around machine
            </span>
          </div>
        </div>

        {/* Right: Real Factory HMI / SCADA Dashboard Screen */}
        <div className="sc-hmi-panel">
          <div className="sc-hmi-header">
            <div className="sc-hmi-title">
              <Sparkles size={16} className="sc-icon-accent" />
              <span>FACTORY SCADA / HMI TOUCH SCREEN</span>
            </div>
            <span className={`sc-hmi-station ${machineState === 'RUNNING' ? 'st-run' : machineState === 'IDLE' ? 'st-idle' : 'st-estop'}`}>
              {machineState}
            </span>
          </div>

          {/* Production KPI Cards Grid */}
          <div className="sc-kpi-grid">
            <div className="sc-kpi-card">
              <span className="sc-kpi-label">TOTAL CHECKED</span>
              <span className="sc-kpi-val">{metrics.total}</span>
              <span className="sc-kpi-sub">Units</span>
            </div>

            <div className="sc-kpi-card sc-kpi-ok">
              <span className="sc-kpi-label">OK (PASS)</span>
              <span className="sc-kpi-val" style={{ color: '#22c55e' }}>{metrics.ok}</span>
              <span className="sc-kpi-sub" style={{ color: '#86efac' }}>Yield: {yieldPercent}%</span>
            </div>

            <div className="sc-kpi-card sc-kpi-ng">
              <span className="sc-kpi-label">NG (REJECT)</span>
              <span className="sc-kpi-val" style={{ color: '#ef4444' }}>{metrics.ng}</span>
              <span className="sc-kpi-sub" style={{ color: '#fca5a5' }}>Defect: {defectPercent}%</span>
            </div>

            <div className="sc-kpi-card">
              <span className="sc-kpi-label">LAST WEIGHT</span>
              <span className="sc-kpi-val" style={{ fontSize: 18, color: '#38bdf8' }}>{metrics.currentWeight}g</span>
              <span className="sc-kpi-sub">Target: 500g ±15g</span>
            </div>
          </div>

          {/* Live Camera Viewfinder Card with Dual Vision + Weight readout */}
          <div className="sc-viewfinder-card">
            <div className="sc-viewfinder-head">
              <div className="sc-vf-live">
                <span className="sc-rec-dot" /> LIVE VISION &amp; WEIGHT CHECK
              </div>
              <span className={`sc-badge-verdict ${currentScan.status === 'OK' ? 'sc-badge-pass' : 'sc-badge-fail'}`}>
                {currentScan.status === 'OK' ? '✓ PASS: ALL SPECS OK' : '✕ REJECT: DEFECT / WEIGHT OUT'}
              </span>
            </div>

            <div className="sc-viewfinder-box">
              <div className="sc-vf-crosshair-tl" />
              <div className="sc-vf-crosshair-tr" />
              <div className="sc-vf-crosshair-bl" />
              <div className="sc-vf-crosshair-br" />

              <div className="sc-vf-center-info">
                <div className="sc-vf-item-id">LOT ID: {currentScan.id}</div>
                <div className="sc-vf-metric">
                  Measured Weight: <strong style={{ color: currentScan.weight >= 485 && currentScan.weight <= 515 ? '#4ade80' : '#f87171' }}>{currentScan.weight} g</strong> (Target: 500g)
                </div>
                <div className="sc-vf-metric">AI Confidence: {currentScan.confidence}% | {currentScan.barcode}</div>
                {currentScan.defect ? (
                  <div className="sc-vf-defect-alert">
                    <AlertTriangle size={14} /> DEFECT: {currentScan.defect}
                  </div>
                ) : (
                  <div className="sc-vf-ok-check">
                    <CheckCircle2 size={14} /> Weight, Seal, Label &amp; Barcode 100% OK
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Interactive Simulation Controls: Test Weight & Visual Defects */}
          <div className="sc-controls-box">
            <span className="sc-ctrl-title">TEST DEFECT &amp; CHECKWEIGHER REJECT:</span>
            <div className="sc-ctrl-buttons" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
              <button
                type="button"
                className={`sc-btn-force sc-btn-force-ng ${forceNextType === 'ng-weight' ? 'active' : ''}`}
                onClick={() => setForceNextType('ng-weight')}
                title="Force Underweight box (e.g. 438g) to test checkweigher reject"
              >
                <Scale size={14} /> Test Weight NG
              </button>
              <button
                type="button"
                className={`sc-btn-force sc-btn-force-ng ${forceNextType === 'ng-vision' ? 'active' : ''}`}
                onClick={() => setForceNextType('ng-vision')}
                title="Force Visual Defect box to test camera reject"
              >
                <Camera size={14} /> Test Vision NG
              </button>
              <button
                type="button"
                className={`sc-btn-force sc-btn-force-ok ${forceNextType === 'ok' ? 'active' : ''}`}
                onClick={() => setForceNextType('ok')}
                title="Force 100% Perfect Box"
              >
                <CheckCircle2 size={14} /> Force OK
              </button>
            </div>

            <div className="sc-speed-bar">
              <span className="sc-speed-label">Line Speed:</span>
              {[0.5, 1, 1.8].map((s) => (
                <button
                  key={s}
                  type="button"
                  className={`sc-speed-btn ${speedMultiplier === s ? 'active' : ''}`}
                  onClick={() => setSpeedMultiplier(s)}
                >
                  {s === 1 ? '1x (Normal)' : `${s}x`}
                </button>
              ))}
            </div>
          </div>

          {/* Live Rolling Audit Log Table */}
          <div className="sc-log-card">
            <div className="sc-log-head">
              <span>LIVE INSPECTION &amp; CHECKWEIGHER LOG</span>
              <span className="sc-log-count">{inspectionLog.length} recent</span>
            </div>
            <div className="sc-log-table-wrapper">
              <table className="sc-log-table">
                <thead>
                  <tr>
                    <th>Time</th>
                    <th>Lot ID</th>
                    <th>Weight</th>
                    <th>Result</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {inspectionLog.map((log, idx) => (
                    <tr key={`${log.id}-${idx}`}>
                      <td>{log.time}</td>
                      <td><strong>{log.id}</strong></td>
                      <td><span style={{ color: '#38bdf8' }}>{log.weight}</span></td>
                      <td>
                        <span className={`sc-table-badge ${log.status === 'OK' ? 'pass' : 'fail'}`}>
                          {log.status}
                        </span>
                      </td>
                      <td className="sc-table-dest">{log.dest}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Book Audit / Demo CTA */}
          <div className="sc-cta-wrap">
            <button
              type="button"
              className="btn btn-primary sc-cta-btn"
              onClick={() => {
                if (onBookDemo) {
                  onBookDemo();
                } else {
                  openAuditModal('Smart Conveyor & In-Line Checkweigher Vision System');
                }
              }}
            >
              <ShieldCheck size={18} /> Book Checkweigher &amp; Vision Audit <ArrowRight size={16} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
