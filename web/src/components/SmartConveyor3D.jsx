import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import {
  Play, Pause, RotateCcw, CheckCircle2, AlertTriangle,
  Camera, Cpu, Activity, ShieldCheck, Sparkles, ArrowRight,
  Octagon, DoorOpen, DoorClosed, Monitor, Zap
} from 'lucide-react';
import { openAuditModal } from './AuditBookingModal';

/**
 * 3D Smart Conveyor Belt & AI Vision Inspection Machine
 * Real Factory Setup with:
 *  - Large Industrial PLC Control Cabinet with swing-open front door
 *  - Detailed Panel Interior matching real electrical schematics:
 *      * Siemens SIMATIC S7-1200 PLC (CPU 1214C + I/O Expansion Cards)
 *      * 24V DC SMPS Power Supply, 3-Phase MCBs, Safety Relay, Terminal Blocks, Wire Ducts
 *  - Large 15" Widescreen HMI Touch-Panel on Door
 *  - Dedicated Industrial Vision Operator Monitor on Articulated Pedestal Arm
 *  - 3 Physical Hardware Buttons on Door (START, STOP, EMERGENCY STOP)
 *  - Tricolor Tower Light (Green: Run, Yellow: Idle, Red: E-Stop / Defect)
 *  - Smooth cylindrical roller rotation forward without wobble
 *  - High-Speed Overhead AI Vision Camera & Pneumatic Reject Sorting Diverter
 */

const DEFECT_TYPES = [
  'Surface Dent / Crack',
  'Barcode Unreadable / Scratched',
  'Label Misaligned (>3mm)',
  'Seal Tampered / Open',
  'Dimensional Tolerance Error',
];

export default function SmartConveyor3D({ onBookDemo }) {
  const mountRef = useRef(null);

  // Machine Operational State: 'RUNNING' | 'IDLE' | 'ESTOP'
  const [machineState, setMachineState] = useState('RUNNING');
  const [speedMultiplier, setSpeedMultiplier] = useState(1);
  const [forceNextType, setForceNextType] = useState(null); // null | 'ok' | 'ng'
  const [isDoorOpen, setIsDoorOpen] = useState(false); // Toggle PLC Cabinet Door

  // Production Metrics
  const [metrics, setMetrics] = useState({
    total: 148,
    ok: 141,
    ng: 7,
    cycleTimeMs: 36,
    airPressureBar: 6.2,
  });

  // Current Live Scanned Item
  const [currentScan, setCurrentScan] = useState({
    id: 'LOT-9824',
    status: 'OK',
    confidence: 99.4,
    defect: null,
    scanTime: 'Just now',
    barcode: 'RVM-8849-OK',
  });

  // Rolling Production Inspection Log
  const [inspectionLog, setInspectionLog] = useState([
    { id: 'LOT-9824', time: '12:44:18', status: 'OK', defect: 'Passed All Criteria', dest: 'Main Line (OK)' },
    { id: 'LOT-9823', time: '12:44:14', status: 'OK', defect: 'Passed All Criteria', dest: 'Main Line (OK)' },
    { id: 'LOT-9822', time: '12:44:09', status: 'NG', defect: 'Surface Dent / Crack', dest: 'Reject Chute (NG)' },
    { id: 'LOT-9821', time: '12:44:05', status: 'OK', defect: 'Passed All Criteria', dest: 'Main Line (OK)' },
    { id: 'LOT-9820', time: '12:44:01', status: 'OK', defect: 'Passed All Criteria', dest: 'Main Line (OK)' },
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
    stackGreenMat: null,
    stackYellowMat: null,
    stackRedMat: null,
    beaconLight: null,
    scanLaserPlane: null,
    scanSpotLight: null,
    sensorRayMat: null,
    nextBoxId: 9825,
    lastSpawnTime: 0,
    ngBlinkTimer: 0,
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
    scene.fog = new THREE.FogExp2(0x0a1424, 0.038);

    const camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 80);
    camera.position.set(-0.3, 3.8, 6.4);
    camera.lookAt(-0.2, 0.85, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: 'high-performance' });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.25;
    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    // 2. Industrial Lighting
    const hemiLight = new THREE.HemisphereLight(0xdbeafe, 0x0f172a, 0.95);
    scene.add(hemiLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, 1.45);
    dirLight.position.set(4, 9, 5);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 1024;
    dirLight.shadow.mapSize.height = 1024;
    scene.add(dirLight);

    const fillLight = new THREE.PointLight(0x38bdf8, 1.3, 14);
    fillLight.position.set(-3, 3, 2.5);
    scene.add(fillLight);

    // Beacon Stack Light glow in 3D space
    const beaconLight = new THREE.PointLight(0x22c55e, 2.5, 6);
    beaconLight.position.set(-1.4, 2.65, -0.9);
    scene.add(beaconLight);
    simRef.current.beaconLight = beaconLight;

    // Cabinet interior LED illumination (turns on when door opens)
    const cabinetLight = new THREE.PointLight(0xffffff, 0, 4);
    cabinetLight.position.set(-1.8, 1.2, -0.85);
    scene.add(cabinetLight);
    simRef.current.cabinetLight = cabinetLight;

    // 3. Factory Epoxy Floor & Grid
    const floorGeo = new THREE.PlaneGeometry(26, 20);
    const floorMat = new THREE.MeshStandardMaterial({
      color: 0x111e33,
      roughness: 0.65,
      metalness: 0.25,
    });
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    scene.add(floor);

    const grid = new THREE.GridHelper(24, 24, 0x1e3a5f, 0x132742);
    grid.position.y = 0.005;
    scene.add(grid);

    // Safety Hazard Yellow / Black border line under conveyor
    const hazardGeo = new THREE.PlaneGeometry(10.2, 3.8);
    const hazardMat = new THREE.MeshBasicMaterial({ color: 0x1a293d });
    const hazardZone = new THREE.Mesh(hazardGeo, hazardMat);
    hazardZone.rotation.x = -Math.PI / 2;
    hazardZone.position.set(0, 0.01, 0.1);
    scene.add(hazardZone);

    // 4. Heavy-Duty Conveyor Assembly (Aluminum 8020 Extrusions)
    const conveyorGroup = new THREE.Group();
    scene.add(conveyorGroup);

    const aluMat = new THREE.MeshStandardMaterial({
      color: 0x94a3b8,
      metalness: 0.88,
      roughness: 0.28,
    });
    const darkAluMat = new THREE.MeshStandardMaterial({
      color: 0x334155,
      metalness: 0.9,
      roughness: 0.35,
    });

    const railLength = 8.8;

    // Front & Back Side Structural Rails
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

    // Support Legs & Feet (4 pairs)
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

    // 5. Cylindrical Rollers (Power Roller Bed)
    // Oriented with rotation.x = Math.PI / 2 and rotated on local Y axis for authentic round rolling
    const rollerCount = 28;
    const rollerLength = 0.84;
    const rollerRadius = 0.042;
    const rollerGeo = new THREE.CylinderGeometry(rollerRadius, rollerRadius, rollerLength, 18);
    const ringGeo = new THREE.CylinderGeometry(rollerRadius + 0.003, rollerRadius + 0.003, 0.04, 18);

    const rollerMat = new THREE.MeshStandardMaterial({
      color: 0x94a3b8,
      metalness: 0.92,
      roughness: 0.22,
    });
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
    const beltMat = new THREE.MeshStandardMaterial({
      color: 0x1e293b,
      roughness: 0.92,
      metalness: 0.05,
    });
    const belt = new THREE.Mesh(beltGeo, beltMat);
    belt.position.set(0, 0.995, 0);
    belt.receiveShadow = true;
    conveyorGroup.add(belt);

    // 6. AC Electric Drive Motor & Gearbox
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

    // 7. Overhead Machine Vision Camera Gantry
    const visionGantry = new THREE.Group();
    visionGantry.position.set(-0.5, 0, 0);
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

    // 8. Photo-Eye Retroreflective Optical Sensor
    const sensorBodyGeo = new THREE.BoxGeometry(0.06, 0.1, 0.06);
    const sensorBodyMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.4 });
    const sensor1 = new THREE.Mesh(sensorBodyGeo, sensorBodyMat);
    sensor1.position.set(-1.5, 1.12, 0.46);
    conveyorGroup.add(sensor1);

    const laserRayGeo = new THREE.CylinderGeometry(0.005, 0.005, 0.88, 6);
    laserRayGeo.rotateX(Math.PI / 2);
    const sensorRayMat = new THREE.MeshBasicMaterial({ color: 0xef4444, transparent: true, opacity: 0.85 });
    const sensor1Ray = new THREE.Mesh(laserRayGeo, sensorRayMat);
    sensor1Ray.position.set(-1.5, 1.12, 0);
    conveyorGroup.add(sensor1Ray);
    simRef.current.sensorRayMat = sensorRayMat;

    // ----------------------------------------------------
    // 9. DEDICATED INDUSTRIAL VISION OPERATOR MONITOR SCREEN
    // (Requested: "ISME EK MONITOR SCREEN HOGA")
    // Mounted on articulating pedestal arm right next to conveyor
    // ----------------------------------------------------
    const monitorStation = new THREE.Group();
    monitorStation.position.set(-0.5, 0, 0.95);
    scene.add(monitorStation);

    // Heavy floor pedestal stand
    const standPostGeo = new THREE.CylinderGeometry(0.035, 0.045, 1.45, 16);
    const standPost = new THREE.Mesh(standPostGeo, darkAluMat);
    standPost.position.set(0, 0.725, 0);
    standPost.castShadow = true;
    monitorStation.add(standPost);

    const standBaseGeo = new THREE.CylinderGeometry(0.24, 0.25, 0.04, 20);
    const standBase = new THREE.Mesh(standBaseGeo, darkAluMat);
    standBase.position.set(0, 0.02, 0);
    monitorStation.add(standBase);

    // Articulated Swivel Arm
    const armGeo = new THREE.BoxGeometry(0.04, 0.05, 0.35);
    const armMesh = new THREE.Mesh(armGeo, aluMat);
    armMesh.position.set(0, 1.45, -0.12);
    monitorStation.add(armMesh);

    // 24" Widescreen Vision Monitor Housing
    const monitorBoxGeo = new THREE.BoxGeometry(0.68, 0.44, 0.04);
    const monitorBoxMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.4 });
    const monitorHousing = new THREE.Mesh(monitorBoxGeo, monitorBoxMat);
    monitorHousing.position.set(0, 1.55, -0.3);
    monitorHousing.rotation.x = -0.15; // Tilted towards operator
    monitorStation.add(monitorHousing);

    // Active Screen Display (Simulated Camera Vision Live Feed)
    const monitorScreenGeo = new THREE.BoxGeometry(0.62, 0.38, 0.01);
    const monitorScreenMat = new THREE.MeshBasicMaterial({ color: 0x0284c7 });
    const monitorScreen = new THREE.Mesh(monitorScreenGeo, monitorScreenMat);
    monitorScreen.position.set(0, 1.55, -0.278);
    monitorScreen.rotation.x = -0.15;
    monitorStation.add(monitorScreen);

    // Industrial Keyboard & Trackball Tray
    const kbTrayGeo = new THREE.BoxGeometry(0.55, 0.02, 0.22);
    const kbTray = new THREE.Mesh(kbTrayGeo, darkAluMat);
    kbTray.position.set(0, 1.15, -0.22);
    monitorStation.add(kbTray);

    // ----------------------------------------------------
    // 10. LARGE REAL INDUSTRIAL PLC CONTROL CABINET (ENLARGED)
    // (Requested: "PENAL KO SIZE BADA KARO SAHI SE DIKHA NAHI RAHA HAI PENAL KO OPEN BHI KAREGE KON SI PLC LAGA HAI HMI BHI BADI HO")
    // ----------------------------------------------------
    const cabinetGroup = new THREE.Group();
    cabinetGroup.position.set(-1.8, 0, -1.15);
    scene.add(cabinetGroup);

    // Large Cabinet Dimensions: Width = 1.35m, Height = 1.85m, Depth = 0.5m
    const cabWidth = 1.35;
    const cabHeight = 1.85;
    const cabDepth = 0.48;

    // Cabinet Plinth (Black Steel Base)
    const plinthGeo = new THREE.BoxGeometry(cabWidth + 0.04, 0.12, cabDepth + 0.04);
    const plinth = new THREE.Mesh(plinthGeo, darkAluMat);
    plinth.position.set(0, 0.06, 0);
    cabinetGroup.add(plinth);

    // Cabinet Enclosure Body (Walls & Roof - Rittal light gray)
    const rittalGrayMat = new THREE.MeshStandardMaterial({
      color: 0xc8d1d9,
      metalness: 0.45,
      roughness: 0.38,
    });

    // Back wall
    const backWallGeo = new THREE.BoxGeometry(cabWidth, cabHeight, 0.03);
    const backWall = new THREE.Mesh(backWallGeo, rittalGrayMat);
    backWall.position.set(0, cabHeight / 2 + 0.12, -cabDepth / 2 + 0.015);
    cabinetGroup.add(backWall);

    // Left wall
    const sideWallGeo = new THREE.BoxGeometry(0.03, cabHeight, cabDepth);
    const leftWall = new THREE.Mesh(sideWallGeo, rittalGrayMat);
    leftWall.position.set(-cabWidth / 2 + 0.015, cabHeight / 2 + 0.12, 0);
    cabinetGroup.add(leftWall);

    // Right wall
    const rightWall = new THREE.Mesh(sideWallGeo, rittalGrayMat);
    rightWall.position.set(cabWidth / 2 - 0.015, cabHeight / 2 + 0.12, 0);
    cabinetGroup.add(rightWall);

    // Top roof
    const roofGeo = new THREE.BoxGeometry(cabWidth, 0.04, cabDepth);
    const roof = new THREE.Mesh(roofGeo, rittalGrayMat);
    roof.position.set(0, cabHeight + 0.12, 0);
    cabinetGroup.add(roof);

    // Bottom floor plate
    const bottomPlate = new THREE.Mesh(roofGeo, rittalGrayMat);
    bottomPlate.position.set(0, 0.14, 0);
    cabinetGroup.add(bottomPlate);

    // ----------------------------------------------------
    // REAL PLC PANEL INTERIOR (MATCHING USER'S PHOTO)
    // ----------------------------------------------------
    const interiorGroup = new THREE.Group();
    interiorGroup.position.set(0, 0, 0);
    cabinetGroup.add(interiorGroup);

    // 1. Galvanized Zinc-plated Steel Mounting Backplate
    const backplateGeo = new THREE.BoxGeometry(cabWidth - 0.08, cabHeight - 0.15, 0.015);
    const zincMat = new THREE.MeshStandardMaterial({
      color: 0xe2e8f0,
      metalness: 0.9,
      roughness: 0.28,
    });
    const backplate = new THREE.Mesh(backplateGeo, zincMat);
    backplate.position.set(0, cabHeight / 2 + 0.12, -cabDepth / 2 + 0.04);
    interiorGroup.add(backplate);

    // 2. Horizontal Slotted Cable Ducts / Wire Trunking (Gray with wire slots)
    const ductMat = new THREE.MeshStandardMaterial({ color: 0x64748b, roughness: 0.6 });
    const ductGeo = new THREE.BoxGeometry(cabWidth - 0.12, 0.07, 0.05);

    [-0.55, -0.15, 0.28, 0.68].forEach((dy) => {
      const duct = new THREE.Mesh(ductGeo, ductMat);
      duct.position.set(0, cabHeight / 2 + 0.12 + dy, -cabDepth / 2 + 0.07);
      interiorGroup.add(duct);
    });

    // 3. Steel DIN Rails (35mm Top Hat)
    const dinRailMat = new THREE.MeshStandardMaterial({ color: 0xcfd8dc, metalness: 0.95, roughness: 0.15 });
    const dinRailGeo = new THREE.BoxGeometry(cabWidth - 0.18, 0.035, 0.01);

    [-0.35, 0.07, 0.48].forEach((ry) => {
      const dinRail = new THREE.Mesh(dinRailGeo, dinRailMat);
      dinRail.position.set(0, cabHeight / 2 + 0.12 + ry, -cabDepth / 2 + 0.06);
      interiorGroup.add(dinRail);
    });

    // 4. TOP DIN RAIL COMPONENTS (Row 1):
    // 3-Phase Main MCB Breaker (Black & Red switch levers)
    const mcb3Geo = new THREE.BoxGeometry(0.12, 0.1, 0.07);
    const mcbMat = new THREE.MeshStandardMaterial({ color: 0xf1f5f9, roughness: 0.4 });
    const mcb3 = new THREE.Mesh(mcb3Geo, mcbMat);
    mcb3.position.set(-0.46, cabHeight / 2 + 0.12 + 0.48, -cabDepth / 2 + 0.1);
    interiorGroup.add(mcb3);

    // Single-phase circuit breakers (4 breakers)
    const mcb1Geo = new THREE.BoxGeometry(0.04, 0.09, 0.065);
    for (let b = 0; b < 4; b++) {
      const mcb1 = new THREE.Mesh(mcb1Geo, mcbMat);
      mcb1.position.set(-0.35 + b * 0.045, cabHeight / 2 + 0.12 + 0.48, -cabDepth / 2 + 0.1);
      interiorGroup.add(mcb1);
    }

    // 24V DC SMPS Power Supply (Perforated metal cage)
    const smpsGeo = new THREE.BoxGeometry(0.18, 0.12, 0.08);
    const smpsMat = new THREE.MeshStandardMaterial({ color: 0x475569, metalness: 0.85, roughness: 0.3 });
    const smps = new THREE.Mesh(smpsGeo, smpsMat);
    smps.position.set(-0.04, cabHeight / 2 + 0.12 + 0.48, -cabDepth / 2 + 0.11);
    interiorGroup.add(smps);

    // Industrial Main Contactor & Overload
    const contactorGeo = new THREE.BoxGeometry(0.11, 0.11, 0.08);
    const contactor = new THREE.Mesh(contactorGeo, darkAluMat);
    contactor.position.set(0.15, cabHeight / 2 + 0.12 + 0.48, -cabDepth / 2 + 0.11);
    interiorGroup.add(contactor);

    // Top Terminal strip
    const termStripTopGeo = new THREE.BoxGeometry(0.24, 0.06, 0.05);
    const termBlueMat = new THREE.MeshStandardMaterial({ color: 0x0284c7 });
    const termStripTop = new THREE.Mesh(termStripTopGeo, termBlueMat);
    termStripTop.position.set(0.38, cabHeight / 2 + 0.12 + 0.48, -cabDepth / 2 + 0.09);
    interiorGroup.add(termStripTop);

    // 5. MIDDLE DIN RAIL COMPONENTS (Row 2 - MAIN PLC SYSTEM):
    // SIEMENS SIMATIC S7-1200 / S7-1500 MODULAR PLC
    // CPU 1214C Module (Siemens Dark Slate Gray + Siemens Cyan Stripe)
    const plcCpuGeo = new THREE.BoxGeometry(0.18, 0.14, 0.085);
    const plcCpuMat = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.4 });
    const plcCpu = new THREE.Mesh(plcCpuGeo, plcCpuMat);
    plcCpu.position.set(-0.42, cabHeight / 2 + 0.12 + 0.07, -cabDepth / 2 + 0.11);
    interiorGroup.add(plcCpu);

    // Siemens Cyan Brand Accent Bar & LEDs on CPU
    const plcStripeGeo = new THREE.BoxGeometry(0.18, 0.015, 0.005);
    const plcStripeMat = new THREE.MeshBasicMaterial({ color: 0x0ea5e9 }); // Siemens Cyan
    const plcStripe = new THREE.Mesh(plcStripeGeo, plcStripeMat);
    plcStripe.position.set(0, 0.045, 0.043);
    plcCpu.add(plcStripe);

    // CPU RUN LED (Glowing Green)
    const ledGeo = new THREE.BoxGeometry(0.01, 0.01, 0.005);
    const runLedMat = new THREE.MeshBasicMaterial({ color: 0x22c55e });
    const runLed = new THREE.Mesh(ledGeo, runLedMat);
    runLed.position.set(-0.06, 0.015, 0.043);
    plcCpu.add(runLed);

    // Expansion I/O Modules (Digital Input DI, Digital Output DQ, Analog AI)
    const plcModuleGeo = new THREE.BoxGeometry(0.065, 0.14, 0.085);
    const plcModuleMat = new THREE.MeshStandardMaterial({ color: 0x475569, roughness: 0.45 });

    for (let m = 0; m < 4; m++) {
      const ioMod = new THREE.Mesh(plcModuleGeo, plcModuleMat);
      ioMod.position.set(-0.29 + m * 0.068, cabHeight / 2 + 0.12 + 0.07, -cabDepth / 2 + 0.11);
      interiorGroup.add(ioMod);
    }

    // Safety Relay (Pilz style Yellow Module)
    const safetyRelayGeo = new THREE.BoxGeometry(0.065, 0.11, 0.08);
    const safetyRelayMat = new THREE.MeshStandardMaterial({ color: 0xfacc15, roughness: 0.4 });
    const safetyRelay = new THREE.Mesh(safetyRelayGeo, safetyRelayMat);
    safetyRelay.position.set(0.08, cabHeight / 2 + 0.12 + 0.07, -cabDepth / 2 + 0.1);
    interiorGroup.add(safetyRelay);

    // Auxiliary Miniature Relays (Clear plastic cube relays)
    const relayCubeGeo = new THREE.BoxGeometry(0.035, 0.06, 0.05);
    const relayCubeMat = new THREE.MeshStandardMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.75 });
    for (let r = 0; r < 4; r++) {
      const relay = new THREE.Mesh(relayCubeGeo, relayCubeMat);
      relay.position.set(0.18 + r * 0.042, cabHeight / 2 + 0.12 + 0.07, -cabDepth / 2 + 0.09);
      interiorGroup.add(relay);
    }

    // 6. BOTTOM DIN RAIL (Row 3 - FIELD I/O TERMINAL BLOCK ARRAY):
    const termStripMainGeo = new THREE.BoxGeometry(0.85, 0.07, 0.05);
    const termGrayMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8 });
    const termStripMain = new THREE.Mesh(termStripMainGeo, termGrayMat);
    termStripMain.position.set(-0.06, cabHeight / 2 + 0.12 - 0.35, -cabDepth / 2 + 0.09);
    interiorGroup.add(termStripMain);

    // Earth PE Terminals (Green / Yellow stripes)
    const earthTermGeo = new THREE.BoxGeometry(0.12, 0.07, 0.05);
    const earthMat = new THREE.MeshStandardMaterial({ color: 0x84cc16 });
    const earthTerm = new THREE.Mesh(earthTermGeo, earthMat);
    earthTerm.position.set(0.44, cabHeight / 2 + 0.12 - 0.35, -cabDepth / 2 + 0.09);
    interiorGroup.add(earthTerm);

    // ----------------------------------------------------
    // 11. HINGED CABINET FRONT DOOR (OPENS & CLOSES)
    // Pivot located at left edge: x = -cabWidth/2, z = cabDepth/2
    // ----------------------------------------------------
    const doorPivot = new THREE.Group();
    doorPivot.position.set(-cabWidth / 2, 0, cabDepth / 2);
    cabinetGroup.add(doorPivot);
    simRef.current.doorPivot = doorPivot;

    const doorGroup = new THREE.Group();
    doorGroup.position.set(cabWidth / 2, cabHeight / 2 + 0.12, 0);
    doorPivot.add(doorGroup);

    // Front Door Panel Slab
    const doorPanelGeo = new THREE.BoxGeometry(cabWidth, cabHeight, 0.025);
    const doorPanel = new THREE.Mesh(doorPanelGeo, rittalGrayMat);
    doorGroup.add(doorPanel);

    // Chrome Hinges (Top & Bottom)
    const hingeGeo = new THREE.CylinderGeometry(0.018, 0.018, 0.08, 14);
    const hingeTop = new THREE.Mesh(hingeGeo, darkAluMat);
    hingeTop.position.set(-cabWidth / 2 + 0.02, 0.65, 0.015);
    doorGroup.add(hingeTop);

    const hingeBot = new THREE.Mesh(hingeGeo, darkAluMat);
    hingeBot.position.set(-cabWidth / 2 + 0.02, -0.65, 0.015);
    doorGroup.add(hingeBot);

    // Industrial Door Handle / Latch (Right Edge)
    const handleGeo = new THREE.BoxGeometry(0.035, 0.22, 0.04);
    const handle = new THREE.Mesh(handleGeo, darkAluMat);
    handle.position.set(cabWidth / 2 - 0.05, 0, 0.03);
    doorGroup.add(handle);

    // ----------------------------------------------------
    // LARGE 15" WIDESCREEN HMI TOUCHSCREEN ON DOOR
    // (Requested: "HMI BHI BADI HO")
    // ----------------------------------------------------
    const hmiFrameGeo = new THREE.BoxGeometry(0.58, 0.42, 0.03);
    const hmiFrameMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.3 });
    const hmiFrame = new THREE.Mesh(hmiFrameGeo, hmiFrameMat);
    hmiFrame.position.set(0, 0.36, 0.022);
    doorGroup.add(hmiFrame);

    // HMI Active Screen Display
    const hmiGlassGeo = new THREE.BoxGeometry(0.52, 0.34, 0.01);
    const hmiGlassMat = new THREE.MeshBasicMaterial({ color: 0x0284c7 });
    const hmiGlass = new THREE.Mesh(hmiGlassGeo, hmiGlassMat);
    hmiGlass.position.set(0, 0.36, 0.038);
    doorGroup.add(hmiGlass);

    // ----------------------------------------------------
    // 3 PHYSICAL HARDWARE CONTROL BUTTONS ON DOOR
    // (START, STOP, EMERGENCY STOP)
    // ----------------------------------------------------
    const clickableButtons = [];
    const btnBaseGeo = new THREE.CylinderGeometry(0.04, 0.04, 0.02, 18);
    btnBaseGeo.rotateX(Math.PI / 2);
    const bezelMat = new THREE.MeshStandardMaterial({ color: 0x475569, metalness: 0.9, roughness: 0.2 });

    // 1. START Push-Button (Green)
    const startBase = new THREE.Mesh(btnBaseGeo, bezelMat);
    startBase.position.set(-0.25, -0.15, 0.02);
    doorGroup.add(startBase);

    const startCapGeo = new THREE.CylinderGeometry(0.028, 0.028, 0.03, 18);
    startCapGeo.rotateX(Math.PI / 2);
    const startMat = new THREE.MeshStandardMaterial({
      color: 0x22c55e,
      roughness: 0.3,
      emissive: 0x15803d,
      emissiveIntensity: 0.4,
    });
    const startBtnMesh = new THREE.Mesh(startCapGeo, startMat);
    startBtnMesh.position.set(-0.25, -0.15, 0.036);
    startBtnMesh.userData = { action: 'START' };
    doorGroup.add(startBtnMesh);
    clickableButtons.push(startBtnMesh);

    // 2. STOP Push-Button (Red/Black)
    const stopBase = new THREE.Mesh(btnBaseGeo, bezelMat);
    stopBase.position.set(0, -0.15, 0.02);
    doorGroup.add(stopBase);

    const stopCapGeo = new THREE.CylinderGeometry(0.028, 0.028, 0.03, 18);
    stopCapGeo.rotateX(Math.PI / 2);
    const stopMat = new THREE.MeshStandardMaterial({
      color: 0xef4444,
      roughness: 0.3,
      emissive: 0x991b1b,
      emissiveIntensity: 0.3,
    });
    const stopBtnMesh = new THREE.Mesh(stopCapGeo, stopMat);
    stopBtnMesh.position.set(0, -0.15, 0.036);
    stopBtnMesh.userData = { action: 'STOP' };
    doorGroup.add(stopBtnMesh);
    clickableButtons.push(stopBtnMesh);

    // 3. EMERGENCY STOP (Big Red Mushroom Head on Yellow Ring)
    const estopBaseGeo = new THREE.CylinderGeometry(0.052, 0.052, 0.025, 18);
    estopBaseGeo.rotateX(Math.PI / 2);
    const estopYellowMat = new THREE.MeshStandardMaterial({ color: 0xfacc15, roughness: 0.4 });
    const estopBase = new THREE.Mesh(estopBaseGeo, estopYellowMat);
    estopBase.position.set(0.25, -0.15, 0.02);
    doorGroup.add(estopBase);

    const estopMushroomGeo = new THREE.CylinderGeometry(0.048, 0.035, 0.045, 20);
    estopMushroomGeo.rotateX(Math.PI / 2);
    const estopMushroomMat = new THREE.MeshStandardMaterial({
      color: 0xdc2626,
      roughness: 0.25,
      emissive: 0x7f1d1d,
      emissiveIntensity: 0.5,
    });
    const estopBtnMesh = new THREE.Mesh(estopMushroomGeo, estopMushroomMat);
    estopBtnMesh.position.set(0.25, -0.15, 0.048);
    estopBtnMesh.userData = { action: 'ESTOP' };
    doorGroup.add(estopBtnMesh);
    clickableButtons.push(estopBtnMesh);

    // Main Rotary Power Isolator Switch (Door interlock handle)
    const isolatorGeo = new THREE.CylinderGeometry(0.038, 0.038, 0.03, 16);
    isolatorGeo.rotateX(Math.PI / 2);
    const isolator = new THREE.Mesh(isolatorGeo, darkAluMat);
    isolator.position.set(0.25, 0.36, 0.03);
    doorGroup.add(isolator);

    simRef.current.clickableButtons = clickableButtons;

    // ----------------------------------------------------
    // 12. TRICOLOR INDUSTRIAL TOWER LIGHT (STACK BEACON ON CABINET ROOF)
    // ----------------------------------------------------
    const stackPoleGeo = new THREE.CylinderGeometry(0.02, 0.02, 0.55, 14);
    const stackPole = new THREE.Mesh(stackPoleGeo, aluMat);
    stackPole.position.set(0.4, cabHeight + 0.12 + 0.275, 0);
    cabinetGroup.add(stackPole);

    const stackLensGeo = new THREE.CylinderGeometry(0.048, 0.048, 0.09, 18);

    // Top: RED
    const stackRedMat = new THREE.MeshStandardMaterial({
      color: 0x450a0a,
      emissive: 0x000000,
      roughness: 0.2,
      metalness: 0.1,
    });
    const stackRed = new THREE.Mesh(stackLensGeo, stackRedMat);
    stackRed.position.set(0.4, cabHeight + 0.12 + 0.55 + 0.18, 0);
    cabinetGroup.add(stackRed);
    simRef.current.stackRedMat = stackRedMat;

    // Middle: YELLOW / AMBER
    const stackYellowMat = new THREE.MeshStandardMaterial({
      color: 0x451a03,
      emissive: 0x000000,
      roughness: 0.2,
      metalness: 0.1,
    });
    const stackYellow = new THREE.Mesh(stackLensGeo, stackYellowMat);
    stackYellow.position.set(0.4, cabHeight + 0.12 + 0.55 + 0.09, 0);
    cabinetGroup.add(stackYellow);
    simRef.current.stackYellowMat = stackYellowMat;

    // Bottom: GREEN (Default ON when running)
    const stackGreenMat = new THREE.MeshStandardMaterial({
      color: 0x22c55e,
      emissive: 0x22c55e,
      emissiveIntensity: 0.95,
      roughness: 0.2,
      metalness: 0.1,
    });
    const stackGreen = new THREE.Mesh(stackLensGeo, stackGreenMat);
    stackGreen.position.set(0.4, cabHeight + 0.12 + 0.55, 0);
    cabinetGroup.add(stackGreen);
    simRef.current.stackGreenMat = stackGreenMat;

    // 13. Automated Pneumatic Diverter / Pusher (at X = 1.3)
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

    // 14. NG Reject Chute & Bin
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

    // 15. Finished Goods OK Primary Output Table
    const okTableGeo = new THREE.BoxGeometry(0.7, 0.95, 0.8);
    const okTableMat = new THREE.MeshStandardMaterial({ color: 0x15803d, roughness: 0.6 });
    const okTable = new THREE.Mesh(okTableGeo, okTableMat);
    okTable.position.set(4.6, 0.475, 0);
    conveyorGroup.add(okTable);

    // 16. Box Creation & Spawning
    const boxGeo = new THREE.BoxGeometry(0.38, 0.26, 0.32);
    const okBoxMat = new THREE.MeshStandardMaterial({
      color: 0xd97706,
      roughness: 0.85,
      metalness: 0.05,
    });
    const ngBoxMat = new THREE.MeshStandardMaterial({
      color: 0xef4444,
      roughness: 0.65,
      metalness: 0.1,
    });

    const createBox = (isNg, idNum) => {
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
        inspected: false,
        rejected: false,
        defect: isNg ? DEFECT_TYPES[Math.floor(Math.random() * DEFECT_TYPES.length)] : null,
      };
    };

    const initialBoxes = [
      createBox(false, 9822),
      createBox(true, 9823),
      createBox(false, 9824),
    ];
    initialBoxes[0].mesh.position.x = 2.4;
    initialBoxes[0].inspected = true;
    initialBoxes[1].mesh.position.x = 0.5;
    initialBoxes[1].inspected = true;
    initialBoxes[2].mesh.position.x = -1.8;
    simRef.current.boxes = initialBoxes;

    // 17. Mouse / Touch Orbit Controls & Button Raycasting
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
      camera.position.x = spherical.radius * Math.sin(spherical.phi) * Math.sin(spherical.theta) - 0.2;
      camera.position.y = spherical.radius * Math.cos(spherical.phi) + 0.6;
      camera.position.z = spherical.radius * Math.sin(spherical.phi) * Math.cos(spherical.theta);
      camera.lookAt(-0.2, 0.9, 0);
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

    // 18. Real-Time Animation Loop
    let animId;
    let lastClock = performance.now();
    let pusherProgress = 0;
    let isPushing = false;

    const animate = () => {
      animId = requestAnimationFrame(animate);

      const now = performance.now();
      const dt = Math.min((now - lastClock) / 1000, 0.1);
      lastClock = now;

      const sim = simRef.current;
      const state = sim.machineState;

      // Smooth Door Swing Open / Close Animation
      const targetDoorAngle = sim.isDoorOpen ? -Math.PI * 0.6 : 0; // ~108 degrees open
      sim.doorAngle += (targetDoorAngle - sim.doorAngle) * 0.1;
      if (sim.doorPivot) {
        sim.doorPivot.rotation.y = sim.doorAngle;
      }

      // Interior Light Intensity follows door opening
      if (sim.cabinetLight) {
        const openFactor = Math.abs(sim.doorAngle) / (Math.PI * 0.6);
        sim.cabinetLight.intensity = openFactor * 2.2;
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
          sim.beaconLight.intensity = 3.0;
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
        sim.beaconLight.intensity = 2.2;

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
          sim.beaconLight.intensity = 3.0;

          sim.stackGreenMat.color.setHex(0x064e3b);
          sim.stackGreenMat.emissive.setHex(0x000000);
        } else {
          sim.stackGreenMat.color.setHex(0x22c55e);
          sim.stackGreenMat.emissive.setHex(0x22c55e);
          sim.stackGreenMat.emissiveIntensity = 0.95;
          sim.beaconLight.color.setHex(0x22c55e);
          sim.beaconLight.intensity = 2.4;

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
            if (sim.forceNext === 'ng') {
              nextIsNg = true;
              sim.forceNext = null;
              setForceNextType(null);
            } else if (sim.forceNext === 'ok') {
              nextIsNg = false;
              sim.forceNext = null;
              setForceNextType(null);
            }

            const newBox = createBox(nextIsNg, sim.nextBoxId++);
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

          // Photo-eye Trigger Check
          if (box.mesh.position.x >= -1.55 && box.mesh.position.x <= -1.45) {
            sim.sensorRayMat.color.setHex(0xfacc15);
          } else if (sim.boxes.every((b) => Math.abs(b.mesh.position.x - -1.5) > 0.2)) {
            sim.sensorRayMat.color.setHex(0xef4444);
          }

          // Camera Inspection Station
          if (!box.inspected && box.mesh.position.x >= -0.65 && box.mesh.position.x <= -0.35) {
            box.inspected = true;

            if (box.isNg) {
              sim.scanLaserPlane.material.color.setHex(0xef4444);
              sim.scanSpotLight.color.setHex(0xef4444);
              sim.ngBlinkTimer = now + 1800;
            } else {
              sim.scanLaserPlane.material.color.setHex(0x22c55e);
              sim.scanSpotLight.color.setHex(0x22c55e);
            }

            const timeStr = new Date().toLocaleTimeString('en-IN', { hour12: false });
            setCurrentScan({
              id: box.id,
              status: box.isNg ? 'NG' : 'OK',
              confidence: box.isNg ? 97.8 : 99.6,
              defect: box.defect,
              scanTime: timeStr,
              barcode: `RVM-${box.id}-${box.isNg ? 'REJECT' : 'PASS'}`,
            });

            setMetrics((prev) => {
              const newTotal = prev.total + 1;
              const newOk = box.isNg ? prev.ok : prev.ok + 1;
              const newNg = box.isNg ? prev.ng + 1 : prev.ng;
              return {
                ...prev,
                total: newTotal,
                ok: newOk,
                ng: newNg,
                cycleTimeMs: Math.floor(32 + Math.random() * 12),
              };
            });

            setInspectionLog((prev) => [
              {
                id: box.id,
                time: timeStr,
                status: box.isNg ? 'NG' : 'OK',
                defect: box.isNg ? box.defect : 'Passed All Criteria',
                dest: box.isNg ? 'Reject Chute (NG)' : 'Main Line (OK)',
              },
              ...prev.slice(0, 5),
            ]);
          }

          if (box.mesh.position.x > -0.2 && box.mesh.position.x < 0.0) {
            sim.scanLaserPlane.material.color.setHex(0x38bdf8);
            sim.scanSpotLight.color.setHex(0x38bdf8);
          }

          // Pneumatic Reject Diverter
          if (box.isNg && !box.rejected && box.mesh.position.x >= 1.15 && box.mesh.position.x <= 1.45) {
            box.rejected = true;
            isPushing = true;
            pusherProgress = 0;
          }

          // Finish Line (OK Output)
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
            Smart Conveyor Belt · Real PLC Cabinet (Siemens S7) &amp; Vision Inspection Machine
          </h3>
          <p className="sc-subtitle">
            Enlarged industrial electrical panel with interactive openable door. Inspect internal Siemens S7-1200 PLC,
            DIN breakers, safety relays, large 15&quot; door HMI, articulated vision monitor, and pneumatic sorting.
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
            {isDoorOpen ? <><DoorOpen size={16} /> Close Panel</> : <><DoorClosed size={16} /> Open Panel (Inspect PLC)</>}
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
        <div className="sc-canvas-container" style={{ height: 580 }}>
          <div ref={mountRef} className="sc-three-canvas" />

          {/* Interactive 3D Canvas HUD overlays */}
          <div className="sc-canvas-hud-top">
            <span className="sc-hud-tag"><Cpu size={13} /> PLC: Siemens S7-1200 (CPU 1214C)</span>
            <span className="sc-hud-tag"><Monitor size={13} /> 24&quot; Vision Station Monitor</span>
            <span className="sc-hud-tag"><Zap size={13} /> 24V DC SMPS &amp; Safety Relay</span>
            <span className="sc-hud-tag"><Activity size={13} /> 6.2 Bar Air</span>
          </div>

          <div className="sc-canvas-hud-bottom">
            <span className="sc-hud-tip">
              🚪 Click <strong>&quot;Open Panel&quot;</strong> to inspect the Siemens PLC inside · <strong>Drag 360°</strong> to orbit
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
              <span className="sc-kpi-label">CYCLE TIME</span>
              <span className="sc-kpi-val">{metrics.cycleTimeMs}</span>
              <span className="sc-kpi-sub">Milliseconds</span>
            </div>
          </div>

          {/* Live Camera Viewfinder Card */}
          <div className="sc-viewfinder-card">
            <div className="sc-viewfinder-head">
              <div className="sc-vf-live">
                <span className="sc-rec-dot" /> LIVE VISION CAMERA FEED
              </div>
              <span className={`sc-badge-verdict ${currentScan.status === 'OK' ? 'sc-badge-pass' : 'sc-badge-fail'}`}>
                {currentScan.status === 'OK' ? '✓ PASS: OK PRODUCT' : '✕ REJECT: DEFECT DETECTED'}
              </span>
            </div>

            <div className="sc-viewfinder-box">
              <div className="sc-vf-crosshair-tl" />
              <div className="sc-vf-crosshair-tr" />
              <div className="sc-vf-crosshair-bl" />
              <div className="sc-vf-crosshair-br" />

              <div className="sc-vf-center-info">
                <div className="sc-vf-item-id">LOT ID: {currentScan.id}</div>
                <div className="sc-vf-metric">AI Confidence: {currentScan.confidence}%</div>
                <div className="sc-vf-metric">Barcode: {currentScan.barcode}</div>
                {currentScan.defect ? (
                  <div className="sc-vf-defect-alert">
                    <AlertTriangle size={14} /> DEFECT: {currentScan.defect}
                  </div>
                ) : (
                  <div className="sc-vf-ok-check">
                    <CheckCircle2 size={14} /> Dimensions, Seal &amp; Label 100% OK
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Interactive Simulation Controls */}
          <div className="sc-controls-box">
            <span className="sc-ctrl-title">TEST DEFECT &amp; SORTING:</span>
            <div className="sc-ctrl-buttons">
              <button
                type="button"
                className={`sc-btn-force sc-btn-force-ng ${forceNextType === 'ng' ? 'active' : ''}`}
                onClick={() => setForceNextType('ng')}
              >
                <AlertTriangle size={15} /> Force Next as NG (Defect)
              </button>
              <button
                type="button"
                className={`sc-btn-force sc-btn-force-ok ${forceNextType === 'ok' ? 'active' : ''}`}
                onClick={() => setForceNextType('ok')}
              >
                <CheckCircle2 size={15} /> Force Next as OK
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
              <span>LIVE INSPECTION &amp; SORTING LOG</span>
              <span className="sc-log-count">{inspectionLog.length} recent</span>
            </div>
            <div className="sc-log-table-wrapper">
              <table className="sc-log-table">
                <thead>
                  <tr>
                    <th>Time</th>
                    <th>Lot ID</th>
                    <th>Result</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {inspectionLog.map((log, idx) => (
                    <tr key={`${log.id}-${idx}`}>
                      <td>{log.time}</td>
                      <td><strong>{log.id}</strong></td>
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
                  openAuditModal('Smart Conveyor & AI Vision Inspection System');
                }
              }}
            >
              <ShieldCheck size={18} /> Book Machine Vision &amp; Conveyor Audit <ArrowRight size={16} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
