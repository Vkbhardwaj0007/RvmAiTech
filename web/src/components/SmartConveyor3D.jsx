import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import {
  Play, Pause, RotateCcw, CheckCircle2, AlertTriangle,
  Camera, Cpu, Activity, ShieldCheck, Sparkles, ArrowRight
} from 'lucide-react';
import { openAuditModal } from './AuditBookingModal';

/**
 * 3D Smart Conveyor Belt & AI Vision Inspection System
 * Real-time 3D Industrial Machine Simulation:
 *  - Aluminum extrusion conveyor frame, roller bed, AC drive motor & gearbox
 *  - Industrial PLC Control Cabinet with HMI touch-panel & E-Stop
 *  - Tricolor Industrial Stack Light (Green / Amber / Red Tower Beacon)
 *  - Retro-reflective Photo-Eye sensors with infrared laser beams
 *  - Overhead High-Speed Machine Vision Camera with strobe & scanning laser
 *  - Automated Pneumatic Diverter / Pusher sorting OK parts straight & NG parts to side bin
 *  - Real Factory HMI / SCADA Dashboard with live telemetry, camera viewfinder & production log
 */

const DEFECT_TYPES = [
  'Surface Scratch / Crack',
  'Barcode Unreadable / Damaged',
  'Label Missing / Misaligned',
  'Seal Tampered / Incomplete',
  'Dimensional Tolerance Error',
];

export default function SmartConveyor3D({ onBookDemo }) {
  const mountRef = useRef(null);

  // Simulation State
  const [isRunning, setIsRunning] = useState(true);
  const [speedMultiplier, setSpeedMultiplier] = useState(1);
  const [forceNextType, setForceNextType] = useState(null); // null | 'ok' | 'ng'

  // Production Metrics State
  const [metrics, setMetrics] = useState({
    total: 128,
    ok: 122,
    ng: 6,
    speedMpm: 24.0,
    cycleTimeMs: 38,
    plcState: 'RUNNING',
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
    { id: 'LOT-9822', time: '12:44:09', status: 'NG', defect: 'Surface Scratch / Crack', dest: 'Reject Chute (NG)' },
    { id: 'LOT-9821', time: '12:44:05', status: 'OK', defect: 'Passed All Criteria', dest: 'Main Line (OK)' },
    { id: 'LOT-9820', time: '12:44:01', status: 'OK', defect: 'Passed All Criteria', dest: 'Main Line (OK)' },
  ]);

  // Three.js internal shared references
  const simRef = useRef({
    isRunning: true,
    speed: 1,
    forceNext: null,
    boxes: [],
    rollers: [],
    pusherArm: null,
    stackGreen: null,
    stackYellow: null,
    stackRed: null,
    scanLaserPlane: null,
    scanSpotLight: null,
    sensorRayMat: null,
    nextBoxId: 9825,
    lastSpawnTime: 0,
    activeScanBox: null,
    activeRejectBox: null,
  });

  // Sync React state to simRef
  useEffect(() => {
    simRef.current.isRunning = isRunning;
  }, [isRunning]);

  useEffect(() => {
    simRef.current.speed = speedMultiplier;
  }, [speedMultiplier]);

  useEffect(() => {
    simRef.current.forceNext = forceNextType;
  }, [forceNextType]);

  // Main Three.js Scene Setup & Animation Loop
  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth || 900;
    const height = Math.min(Math.max(window.innerHeight * 0.65, 480), 620);

    // Scene & Camera
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0a1424);
    scene.fog = new THREE.FogExp2(0x0a1424, 0.045);

    const camera = new THREE.PerspectiveCamera(42, width / height, 0.1, 80);
    camera.position.set(0, 3.8, 6.2);
    camera.lookAt(0, 0.5, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: 'high-performance' });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    // ----------------------------------------------------
    // Lighting
    // ----------------------------------------------------
    const hemiLight = new THREE.HemisphereLight(0xdbeafe, 0x0f172a, 0.9);
    scene.add(hemiLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, 1.4);
    dirLight.position.set(4, 9, 5);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 1024;
    dirLight.shadow.mapSize.height = 1024;
    dirLight.shadow.camera.near = 1;
    dirLight.shadow.camera.far = 25;
    dirLight.shadow.camera.left = -6;
    dirLight.shadow.camera.right = 6;
    dirLight.shadow.camera.top = 4;
    dirLight.shadow.camera.bottom = -4;
    scene.add(dirLight);

    const fillLight = new THREE.PointLight(0x38bdf8, 1.2, 14);
    fillLight.position.set(-3, 3, 2);
    scene.add(fillLight);

    // ----------------------------------------------------
    // Factory Floor & Safety Markings
    // ----------------------------------------------------
    const floorGeo = new THREE.PlaneGeometry(24, 18);
    const floorMat = new THREE.MeshStandardMaterial({
      color: 0x111e33,
      roughness: 0.72,
      metalness: 0.18,
    });
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    scene.add(floor);

    // Floor Grid
    const grid = new THREE.GridHelper(20, 20, 0x1e3a5f, 0x132742);
    grid.position.y = 0.005;
    scene.add(grid);

    // Yellow / Black Safety Hazard Zone under Conveyor
    const hazardGeo = new THREE.PlaneGeometry(9.6, 3.4);
    const hazardMat = new THREE.MeshBasicMaterial({
      color: 0x223652,
      side: THREE.DoubleSide,
    });
    const hazardZone = new THREE.Mesh(hazardGeo, hazardMat);
    hazardZone.rotation.x = -Math.PI / 2;
    hazardZone.position.set(0, 0.01, 0.1);
    scene.add(hazardZone);

    // ----------------------------------------------------
    // Conveyor Frame & Rollers (Aluminum Extrusion 8020)
    // ----------------------------------------------------
    const conveyorGroup = new THREE.Group();
    scene.add(conveyorGroup);

    const aluMat = new THREE.MeshStandardMaterial({
      color: 0x8a9bb2,
      metalness: 0.85,
      roughness: 0.32,
    });
    const darkAluMat = new THREE.MeshStandardMaterial({
      color: 0x3d4b5c,
      metalness: 0.88,
      roughness: 0.4,
    });
    const blackMat = new THREE.MeshStandardMaterial({
      color: 0x17191d,
      roughness: 0.85,
    });

    // Main longitudinal rails (Length = 8.8m, along X axis)
    const railLength = 8.8;
    const railGeo = new THREE.BoxGeometry(railLength, 0.12, 0.06);
    const railFront = new THREE.Mesh(railGeo, aluMat);
    railFront.position.set(0, 0.95, 0.45);
    railFront.castShadow = true;
    conveyorGroup.add(railFront);

    const railBack = new THREE.Mesh(railGeo, aluMat);
    railBack.position.set(0, 0.95, -0.45);
    railBack.castShadow = true;
    conveyorGroup.add(railBack);

    // Guide rails on top (protect boxes from falling off)
    const guideGeo = new THREE.BoxGeometry(railLength, 0.05, 0.03);
    const guideFront = new THREE.Mesh(guideGeo, darkAluMat);
    guideFront.position.set(0, 1.08, 0.44);
    conveyorGroup.add(guideFront);

    const guideBack = new THREE.Mesh(guideGeo, darkAluMat);
    guideBack.position.set(0, 1.08, -0.44);
    conveyorGroup.add(guideBack);

    // Support Legs & Feet (4 pairs along the line)
    const legXPositions = [-3.8, -1.3, 1.3, 3.8];
    const legGeo = new THREE.BoxGeometry(0.08, 0.95, 0.08);
    const footGeo = new THREE.CylinderGeometry(0.08, 0.09, 0.04, 12);
    const crossGeo = new THREE.BoxGeometry(0.06, 0.06, 0.84);

    legXPositions.forEach((lx) => {
      // Front Leg
      const legF = new THREE.Mesh(legGeo, aluMat);
      legF.position.set(lx, 0.475, 0.42);
      legF.castShadow = true;
      conveyorGroup.add(legF);

      const footF = new THREE.Mesh(footGeo, darkAluMat);
      footF.position.set(lx, 0.02, 0.42);
      conveyorGroup.add(footF);

      // Back Leg
      const legB = new THREE.Mesh(legGeo, aluMat);
      legB.position.set(lx, 0.475, -0.42);
      legB.castShadow = true;
      conveyorGroup.add(legB);

      const footB = new THREE.Mesh(footGeo, darkAluMat);
      footB.position.set(lx, 0.02, -0.42);
      conveyorGroup.add(footB);

      // Cross Brace
      const cross = new THREE.Mesh(crossGeo, aluMat);
      cross.position.set(lx, 0.45, 0);
      conveyorGroup.add(cross);
    });

    // Conveyor Rollers (Array of spinning cylinders under belt)
    const rollerGeo = new THREE.CylinderGeometry(0.042, 0.042, 0.84, 16);
    rollerGeo.rotateX(Math.PI / 2);
    const rollerMat = new THREE.MeshStandardMaterial({
      color: 0x94a3b8,
      metalness: 0.92,
      roughness: 0.25,
    });
    const rollers = [];
    const rollerCount = 26;
    const startX = -4.1;
    const stepX = (railLength - 0.6) / (rollerCount - 1);

    for (let i = 0; i < rollerCount; i++) {
      const rx = startX + i * stepX;
      const roller = new THREE.Mesh(rollerGeo, rollerMat);
      roller.position.set(rx, 0.95, 0);
      conveyorGroup.add(roller);
      rollers.push(roller);
    }
    simRef.current.rollers = rollers;

    // Moving Conveyor Belt Top Surface
    const beltLength = 8.5;
    const beltWidth = 0.8;
    const beltGeo = new THREE.BoxGeometry(beltLength, 0.02, beltWidth);
    const beltMat = new THREE.MeshStandardMaterial({
      color: 0x1f2937,
      roughness: 0.9,
      metalness: 0.05,
    });
    const belt = new THREE.Mesh(beltGeo, beltMat);
    belt.position.set(0, 0.995, 0);
    belt.receiveShadow = true;
    conveyorGroup.add(belt);

    // Drive Motor & Gearbox Assembly (Mounted at Entry Head)
    const motorGroup = new THREE.Group();
    motorGroup.position.set(-4.2, 0.65, 0.6);
    conveyorGroup.add(motorGroup);

    // Motor cylinder (Industrial Teal/Blue)
    const motorGeo = new THREE.CylinderGeometry(0.14, 0.14, 0.32, 18);
    motorGeo.rotateZ(Math.PI / 2);
    const motorMat = new THREE.MeshStandardMaterial({
      color: 0x0284c7,
      metalness: 0.65,
      roughness: 0.35,
    });
    const motorBody = new THREE.Mesh(motorGeo, motorMat);
    motorGroup.add(motorBody);

    // Gearbox
    const gearGeo = new THREE.BoxGeometry(0.24, 0.26, 0.24);
    const gearBox = new THREE.Mesh(gearGeo, darkAluMat);
    gearBox.position.set(0.18, 0, 0);
    motorGroup.add(gearBox);

    // Terminal box
    const termGeo = new THREE.BoxGeometry(0.12, 0.1, 0.1);
    const termBox = new THREE.Mesh(termGeo, blackMat);
    termBox.position.set(-0.06, 0.15, 0);
    motorGroup.add(termBox);

    // ----------------------------------------------------
    // Photo-Eye Sensors (Retro-Reflective Optical Trigger)
    // ----------------------------------------------------
    // Sensor 1: Inspection Trigger (at X = -1.5)
    const sensorBodyGeo = new THREE.BoxGeometry(0.06, 0.1, 0.06);
    const sensorBodyMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.4 });
    const sensor1 = new THREE.Mesh(sensorBodyGeo, sensorBodyMat);
    sensor1.position.set(-1.5, 1.12, 0.46);
    conveyorGroup.add(sensor1);

    // Red photo-eye laser beam line across the belt
    const laserRayGeo = new THREE.CylinderGeometry(0.005, 0.005, 0.88, 6);
    laserRayGeo.rotateX(Math.PI / 2);
    const sensorRayMat = new THREE.MeshBasicMaterial({
      color: 0xef4444,
      transparent: true,
      opacity: 0.85,
    });
    const sensor1Ray = new THREE.Mesh(laserRayGeo, sensorRayMat);
    sensor1Ray.position.set(-1.5, 1.12, 0);
    conveyorGroup.add(sensor1Ray);
    simRef.current.sensorRayMat = sensorRayMat;

    // ----------------------------------------------------
    // Overhead AI Machine Vision Camera Gantry (at X = -0.5)
    // ----------------------------------------------------
    const visionGantry = new THREE.Group();
    visionGantry.position.set(-0.5, 0, 0);
    conveyorGroup.add(visionGantry);

    // Gantry Arch Columns & Bridge
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

    // Vision Camera Body (Cognex/Basler style industrial camera)
    const cameraBodyGeo = new THREE.BoxGeometry(0.14, 0.18, 0.14);
    const cameraBodyMat = new THREE.MeshStandardMaterial({
      color: 0xf97316, // Industrial safety orange
      metalness: 0.5,
      roughness: 0.35,
    });
    const cameraBody = new THREE.Mesh(cameraBodyGeo, cameraBodyMat);
    cameraBody.position.set(0, 2.18, 0);
    visionGantry.add(cameraBody);

    // Camera Lens & LED Ring Illuminator
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

    // Camera Inspection Scanning Laser Sheet (projected down on belt)
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

    // Focused Spot/Strobe Light directly on passing box
    const scanSpotLight = new THREE.SpotLight(0x38bdf8, 4, 3, Math.PI / 5, 0.4);
    scanSpotLight.position.set(0, 2.05, 0);
    scanSpotLight.target = scanLaserPlane;
    visionGantry.add(scanSpotLight);
    simRef.current.scanSpotLight = scanSpotLight;

    // ----------------------------------------------------
    // Industrial PLC Control Cabinet & Operator Station
    // ----------------------------------------------------
    const cabinetGroup = new THREE.Group();
    cabinetGroup.position.set(-1.8, 0, -1.05);
    scene.add(cabinetGroup);

    // Steel Enclosure Cabinet (Rittal style light gray)
    const cabinetGeo = new THREE.BoxGeometry(0.65, 1.45, 0.4);
    const cabinetMat = new THREE.MeshStandardMaterial({
      color: 0xcfd8dc,
      metalness: 0.5,
      roughness: 0.4,
    });
    const cabinet = new THREE.Mesh(cabinetGeo, cabinetMat);
    cabinet.position.set(0, 0.85, 0);
    cabinet.castShadow = true;
    cabinetGroup.add(cabinet);

    // Cabinet plinth base (Dark gray)
    const plinthGeo = new THREE.BoxGeometry(0.66, 0.12, 0.41);
    const plinth = new THREE.Mesh(plinthGeo, darkAluMat);
    plinth.position.set(0, 0.06, 0);
    cabinetGroup.add(plinth);

    // Touchscreen HMI Panel on Cabinet Front Door
    const hmiScreenGeo = new THREE.BoxGeometry(0.32, 0.24, 0.02);
    const hmiMat = new THREE.MeshBasicMaterial({ color: 0x0284c7 });
    const hmiScreen = new THREE.Mesh(hmiScreenGeo, hmiMat);
    hmiScreen.position.set(0, 1.15, 0.205);
    cabinetGroup.add(hmiScreen);

    // Emergency Stop Button (E-Stop: Red mushroom on yellow base)
    const estopBaseGeo = new THREE.CylinderGeometry(0.035, 0.035, 0.02, 14);
    estopBaseGeo.rotateX(Math.PI / 2);
    const estopBaseMat = new THREE.MeshStandardMaterial({ color: 0xfacc15, roughness: 0.5 });
    const estopBase = new THREE.Mesh(estopBaseGeo, estopBaseMat);
    estopBase.position.set(0.2, 0.92, 0.21);
    cabinetGroup.add(estopBase);

    const estopBtnGeo = new THREE.CylinderGeometry(0.026, 0.026, 0.03, 14);
    estopBtnGeo.rotateX(Math.PI / 2);
    const estopBtnMat = new THREE.MeshStandardMaterial({ color: 0xef4444, roughness: 0.3 });
    const estopBtn = new THREE.Mesh(estopBtnGeo, estopBtnMat);
    estopBtn.position.set(0.2, 0.92, 0.225);
    cabinetGroup.add(estopBtn);

    // Main Power Rotary Isolator Switch
    const isolatorGeo = new THREE.CylinderGeometry(0.028, 0.028, 0.025, 12);
    isolatorGeo.rotateX(Math.PI / 2);
    const isolatorMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.3 });
    const isolator = new THREE.Mesh(isolatorGeo, isolatorMat);
    isolator.position.set(-0.2, 0.92, 0.21);
    cabinetGroup.add(isolator);

    // Tricolor Industrial Stack Light (Tower Beacon on Top of Cabinet)
    const stackPoleGeo = new THREE.CylinderGeometry(0.015, 0.015, 0.42, 12);
    const stackPole = new THREE.Mesh(stackPoleGeo, aluMat);
    stackPole.position.set(0.22, 1.78, 0);
    cabinetGroup.add(stackPole);

    const stackLensGeo = new THREE.CylinderGeometry(0.036, 0.036, 0.06, 14);

    // Red Lens (Top)
    const stackRedMat = new THREE.MeshBasicMaterial({ color: 0x330000 });
    const stackRed = new THREE.Mesh(stackLensGeo, stackRedMat);
    stackRed.position.set(0.22, 2.12, 0);
    cabinetGroup.add(stackRed);
    simRef.current.stackRed = stackRed;

    // Amber Lens (Middle)
    const stackYellowMat = new THREE.MeshBasicMaterial({ color: 0x332200 });
    const stackYellow = new THREE.Mesh(stackLensGeo, stackYellowMat);
    stackYellow.position.set(0.22, 2.05, 0);
    cabinetGroup.add(stackYellow);
    simRef.current.stackYellow = stackYellow;

    // Green Lens (Bottom)
    const stackGreenMat = new THREE.MeshBasicMaterial({ color: 0x22c55e });
    const stackGreen = new THREE.Mesh(stackLensGeo, stackGreenMat);
    stackGreen.position.set(0.22, 1.98, 0);
    cabinetGroup.add(stackGreen);
    simRef.current.stackGreen = stackGreen;

    // ----------------------------------------------------
    // Automated Pneumatic Diverter / Pusher (at X = 1.3)
    // ----------------------------------------------------
    const sortingStation = new THREE.Group();
    sortingStation.position.set(1.3, 0, 0);
    conveyorGroup.add(sortingStation);

    // Pneumatic Air Cylinder (Silver cylinder + piston rod)
    const cylinderBodyGeo = new THREE.CylinderGeometry(0.05, 0.05, 0.35, 16);
    cylinderBodyGeo.rotateZ(Math.PI / 2);
    cylinderBodyGeo.rotateY(Math.PI / 2);
    const cylinderBodyMat = new THREE.MeshStandardMaterial({ color: 0x64748b, metalness: 0.85, roughness: 0.2 });
    const cylinderBody = new THREE.Mesh(cylinderBodyGeo, cylinderBodyMat);
    cylinderBody.position.set(0, 1.15, -0.65);
    sortingStation.add(cylinderBody);

    // Pusher Arm assembly (Piston rod + pusher paddle)
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

    // ----------------------------------------------------
    // Reject Chute & NG Bin (Side table where NG boxes drop)
    // ----------------------------------------------------
    const ngBinGroup = new THREE.Group();
    ngBinGroup.position.set(1.3, 0, 1.05);
    conveyorGroup.add(ngBinGroup);

    // NG Reject Slide / Chute
    const chuteGeo = new THREE.BoxGeometry(0.65, 0.02, 0.75);
    chuteGeo.rotateX(0.24);
    const chuteMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.8, roughness: 0.3 });
    const chute = new THREE.Mesh(chuteGeo, chuteMat);
    chute.position.set(0, 0.92, -0.25);
    ngBinGroup.add(chute);

    // NG Collection Bin (Red/Gray Industrial Container)
    const binGeo = new THREE.BoxGeometry(0.75, 0.55, 0.65);
    const binMat = new THREE.MeshStandardMaterial({ color: 0xb91c1c, roughness: 0.65 });
    const bin = new THREE.Mesh(binGeo, binMat);
    bin.position.set(0, 0.3, 0.28);
    bin.castShadow = true;
    ngBinGroup.add(bin);

    // ----------------------------------------------------
    // Finished Goods OK Output Chute (at X = 4.4)
    // ----------------------------------------------------
    const okTableGeo = new THREE.BoxGeometry(0.7, 0.95, 0.8);
    const okTableMat = new THREE.MeshStandardMaterial({ color: 0x15803d, roughness: 0.6 });
    const okTable = new THREE.Mesh(okTableGeo, okTableMat);
    okTable.position.set(4.6, 0.475, 0);
    conveyorGroup.add(okTable);

    // ----------------------------------------------------
    // Box Geometry, Materials & Spawning Manager
    // ----------------------------------------------------
    const boxGeo = new THREE.BoxGeometry(0.38, 0.26, 0.32);

    // Cardboard Box Texture & Colors
    const okBoxMat = new THREE.MeshStandardMaterial({
      color: 0xd97706, // Natural cardboard Kraft color
      roughness: 0.85,
      metalness: 0.05,
    });
    const ngBoxMat = new THREE.MeshStandardMaterial({
      color: 0xef4444, // Defect alert red
      roughness: 0.65,
      metalness: 0.1,
    });

    const createBox = (isNg, idNum) => {
      const boxMesh = new THREE.Mesh(boxGeo, isNg ? ngBoxMat.clone() : okBoxMat.clone());
      boxMesh.position.set(-4.0, 1.13, 0);
      boxMesh.castShadow = true;
      boxMesh.receiveShadow = true;
      conveyorGroup.add(boxMesh);

      // Label on top
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

    // Pre-populate 3 boxes along the belt
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

    // ----------------------------------------------------
    // Mouse / Touch Orbit Controls
    // ----------------------------------------------------
    let isDragging = false;
    let prevMouseX = 0;
    let prevMouseY = 0;
    let spherical = {
      radius: 7.2,
      theta: 0.28,
      phi: 1.18,
    };

    const updateCameraFromSpherical = () => {
      spherical.phi = Math.max(0.4, Math.min(Math.PI / 2 - 0.05, spherical.phi));
      spherical.radius = Math.max(4.0, Math.min(11.0, spherical.radius));
      camera.position.x = spherical.radius * Math.sin(spherical.phi) * Math.sin(spherical.theta);
      camera.position.y = spherical.radius * Math.cos(spherical.phi) + 0.5;
      camera.position.z = spherical.radius * Math.sin(spherical.phi) * Math.cos(spherical.theta);
      camera.lookAt(0, 0.85, 0);
    };
    updateCameraFromSpherical();

    const onPointerDown = (e) => {
      isDragging = true;
      prevMouseX = e.clientX;
      prevMouseY = e.clientY;
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

    const dom = renderer.domElement;
    dom.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
    dom.addEventListener('wheel', onWheel, { passive: false });

    // ----------------------------------------------------
    // Animation Loop
    // ----------------------------------------------------
    let animId;
    let lastClock = performance.now();
    let pusherProgress = 0; // 0 to 1
    let isPushing = false;

    const animate = () => {
      animId = requestAnimationFrame(animate);

      const now = performance.now();
      const dt = Math.min((now - lastClock) / 1000, 0.1);
      lastClock = now;

      const sim = simRef.current;

      if (sim.isRunning) {
        const moveDist = 1.25 * sim.speed * dt;

        // Rotate rollers
        sim.rollers.forEach((r) => {
          r.rotation.x += moveDist * 3.5;
        });

        // Spawn new box when needed
        if (now - sim.lastSpawnTime > 2600 / sim.speed) {
          const leftmostBox = sim.boxes.reduce((min, b) => Math.min(min, b.mesh.position.x), 999);
          if (leftmostBox > -3.2 || sim.boxes.length === 0) {
            let nextIsNg = Math.random() < 0.16; // 16% natural defect rate
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

        // Process boxes along the conveyor
        for (let i = sim.boxes.length - 1; i >= 0; i--) {
          const box = sim.boxes[i];

          // If box was rejected, it slides off into NG bin
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

          // Move box along X axis
          box.mesh.position.x += moveDist;

          // 1. Photo-eye 1 Trigger Check
          if (box.mesh.position.x >= -1.55 && box.mesh.position.x <= -1.45) {
            sim.sensorRayMat.color.setHex(0xfacc15); // Sensor triggers yellow
          } else if (sim.boxes.every((b) => Math.abs(b.mesh.position.x - -1.5) > 0.2)) {
            sim.sensorRayMat.color.setHex(0xef4444); // Idle red
          }

          // 2. Camera Inspection Station (at X = -0.5)
          if (!box.inspected && box.mesh.position.x >= -0.65 && box.mesh.position.x <= -0.35) {
            box.inspected = true;

            // Flash camera laser & strobe
            if (box.isNg) {
              sim.scanLaserPlane.material.color.setHex(0xef4444);
              sim.scanSpotLight.color.setHex(0xef4444);
              sim.stackRed.material.color.setHex(0xef4444);
              sim.stackYellow.material.color.setHex(0x332200);
              sim.stackGreen.material.color.setHex(0x064e3b);
            } else {
              sim.scanLaserPlane.material.color.setHex(0x22c55e);
              sim.scanSpotLight.color.setHex(0x22c55e);
              sim.stackRed.material.color.setHex(0x450a0a);
              sim.stackYellow.material.color.setHex(0x332200);
              sim.stackGreen.material.color.setHex(0x22c55e);
            }

            // Update React UI metrics & current scan card
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

          // 3. Reset Laser Beam after box passes inspection
          if (box.mesh.position.x > -0.2 && box.mesh.position.x < 0.0) {
            sim.scanLaserPlane.material.color.setHex(0x38bdf8);
            sim.scanSpotLight.color.setHex(0x38bdf8);
          }

          // 4. Pneumatic Diverter Station (at X = 1.3)
          if (box.isNg && !box.rejected && box.mesh.position.x >= 1.15 && box.mesh.position.x <= 1.45) {
            box.rejected = true;
            isPushing = true;
            pusherProgress = 0;
          }

          // 5. Box reaches end of main line (OK Finish)
          if (box.mesh.position.x > 4.6) {
            conveyorGroup.remove(box.mesh);
            sim.boxes.splice(i, 1);
          }
        }

        // Animate Pneumatic Pusher Arm
        if (isPushing) {
          pusherProgress += 5.5 * sim.speed * dt;
          if (pusherProgress < 1.0) {
            // Stroke forward
            sim.pusherArm.position.z = -0.45 + pusherProgress * 0.42;
          } else if (pusherProgress < 2.0) {
            // Retract backward
            sim.pusherArm.position.z = -0.45 + (2.0 - pusherProgress) * 0.42;
          } else {
            // Finished cycle
            isPushing = false;
            pusherProgress = 0;
            sim.pusherArm.position.z = -0.45;
            // Restore green stack light
            sim.stackRed.material.color.setHex(0x450a0a);
            sim.stackGreen.material.color.setHex(0x22c55e);
          }
        }
      }

      renderer.render(scene, camera);
    };

    animId = requestAnimationFrame(animate);

    // Responsive Resize Handler
    const handleResize = () => {
      if (!container) return;
      const w = container.clientWidth || 900;
      const h = Math.min(Math.max(window.innerHeight * 0.65, 480), 620);
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

  // Yield calculations
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
            <span className={`sc-dot ${isRunning ? 'sc-dot-active' : 'sc-dot-paused'}`} />
            <span>{isRunning ? 'PLC & VISION SYSTEM: ONLINE (50 FPS)' : 'CONVEYOR LINE: PAUSED'}</span>
          </div>
          <h3 className="sc-title">
            Smart Conveyor Belt · High-Speed AI Vision Inspection &amp; Automated Sorting
          </h3>
          <p className="sc-subtitle">
            Overhead CMOS vision camera scans each unit. Defect-free packages flow to the primary line;
            NG units trigger an instant pneumatic diverter arm to the reject bin.
          </p>
        </div>

        <div className="sc-header-actions">
          <button
            type="button"
            className="sc-btn sc-btn-play"
            onClick={() => setIsRunning(!isRunning)}
            title={isRunning ? 'Pause Line' : 'Start Line'}
          >
            {isRunning ? <><Pause size={16} /> Pause</> : <><Play size={16} /> Run Line</>}
          </button>
          <button
            type="button"
            className="sc-btn sc-btn-secondary"
            onClick={resetStats}
            title="Reset Batch Counters"
          >
            <RotateCcw size={16} /> Reset
          </button>
        </div>
      </div>

      {/* Main Grid: 3D Canvas (Left) + Factory SCADA HMI Screen (Right) */}
      <div className="sc-main-grid">
        {/* Left: 3D WebGL Canvas */}
        <div className="sc-canvas-container">
          <div ref={mountRef} className="sc-three-canvas" />

          {/* Interactive 3D Canvas HUD overlays */}
          <div className="sc-canvas-hud-top">
            <span className="sc-hud-tag"><Camera size={13} /> Optical AI Gantry</span>
            <span className="sc-hud-tag"><Cpu size={13} /> PLC: Siemens S7-1200</span>
            <span className="sc-hud-tag"><Activity size={13} /> 6.2 Bar Air</span>
          </div>

          <div className="sc-canvas-hud-bottom">
            <span className="sc-hud-tip">
              💡 <strong>Drag 360°</strong> to orbit camera · <strong>Scroll</strong> to zoom in/out
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
            <span className="sc-hmi-station">STATION #04 · FINAL QC</span>
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
            <span className="sc-ctrl-title">DEMO INTERACTIVE CONTROLS:</span>
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
