import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import {
  Play, Pause, RotateCcw, CheckCircle2, AlertTriangle,
  Camera, Cpu, Activity, ShieldCheck, Sparkles, ArrowRight,
  Octagon, Power
} from 'lucide-react';
import { openAuditModal } from './AuditBookingModal';

/**
 * 3D Smart Conveyor Belt & AI Vision Inspection Machine
 * Real Industrial Machine Simulation:
 *  - Machine States:
 *      * RUNNING: Tower Light = GREEN ON, Rollers roll round-and-round forward
 *      * IDLE (STOP): Tower Light = YELLOW ON, Conveyor paused in standby
 *      * E-STOP: Tower Light = RED FLASHING, Safety interlock tripped, alarm
 *  - Physical 3D Buttons & UI Control Deck:
 *      * START (Green Push Button)
 *      * STOP (Red / Black Push Button)
 *      * EMERGENCY STOP (Big Red Mushroom Head on Yellow Collar)
 *  - High-Speed Overhead AI Vision Camera:
 *      * Strobe & scanning laser sheet inspects each passing package
 *  - Automated Pneumatic Diverter:
 *      * OK packages roll straight to Primary Line
 *      * NG Defect packages get punched out into the NG Reject Chute & Bin
 *  - Real Factory HMI / SCADA Dashboard:
 *      * Live telemetry, camera viewfinder, real-time counters, rolling audit log
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

  // Production Metrics
  const [metrics, setMetrics] = useState({
    total: 142,
    ok: 135,
    ng: 7,
    cycleTimeMs: 38,
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
    eStopBlinkTimer: 0,
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

  // Main Three.js Scene Setup & Animation Loop
  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth || 800;
    const height = container.clientHeight || 540;

    // 1. Scene & Camera Setup
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0a1424);
    scene.fog = new THREE.FogExp2(0x0a1424, 0.04);

    const camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 80);
    camera.position.set(0, 3.6, 6.0);
    camera.lookAt(0, 0.7, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: 'high-performance' });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;
    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    // 2. Industrial Lighting
    const hemiLight = new THREE.HemisphereLight(0xdbeafe, 0x0f172a, 0.95);
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

    // Dynamic point light for Tower Beacon illumination
    const beaconLight = new THREE.PointLight(0x22c55e, 2.5, 5);
    beaconLight.position.set(-1.58, 2.3, -1.05);
    scene.add(beaconLight);
    simRef.current.beaconLight = beaconLight;

    // 3. Factory Epoxy Floor & Grid
    const floorGeo = new THREE.PlaneGeometry(24, 18);
    const floorMat = new THREE.MeshStandardMaterial({
      color: 0x111e33,
      roughness: 0.65,
      metalness: 0.25,
    });
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    scene.add(floor);

    const grid = new THREE.GridHelper(22, 22, 0x1e3a5f, 0x132742);
    grid.position.y = 0.005;
    scene.add(grid);

    // Safety Hazard Yellow / Black border line on floor
    const hazardGeo = new THREE.PlaneGeometry(9.6, 3.4);
    const hazardMat = new THREE.MeshBasicMaterial({ color: 0x1e2e45 });
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
    const rubberMat = new THREE.MeshStandardMaterial({
      color: 0x1e293b,
      roughness: 0.85,
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

    // Guide Skirt Rails on Top
    const guideGeo = new THREE.BoxGeometry(railLength, 0.04, 0.02);
    const guideFront = new THREE.Mesh(guideGeo, darkAluMat);
    guideFront.position.set(0, 1.07, 0.44);
    conveyorGroup.add(guideFront);

    const guideBack = new THREE.Mesh(guideGeo, darkAluMat);
    guideBack.position.set(0, 1.07, -0.44);
    conveyorGroup.add(guideBack);

    // 4 Pairs of Support Legs with Floor Anchors
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
    // IMPORTANT: Cylinders span along Z axis. To make them roll round-and-round without wobbling,
    // we orient with rotation.x = Math.PI / 2 and rotate on their local axis!
    const rollerCount = 28;
    const rollerLength = 0.84;
    const rollerRadius = 0.042;
    const rollerGeo = new THREE.CylinderGeometry(rollerRadius, rollerRadius, rollerLength, 18);
    // Rubber driving rings on each roller for realistic visual spin
    const ringGeo = new THREE.CylinderGeometry(rollerRadius + 0.003, rollerRadius + 0.003, 0.04, 18);

    const rollerMat = new THREE.MeshStandardMaterial({
      color: 0x94a3b8,
      metalness: 0.92,
      roughness: 0.22,
    });
    const ringMat = new THREE.MeshStandardMaterial({
      color: 0x0f172a,
      roughness: 0.9,
    });

    const rollers = [];
    const startX = -4.1;
    const stepX = (railLength - 0.6) / (rollerCount - 1);

    for (let i = 0; i < rollerCount; i++) {
      const rx = startX + i * stepX;
      const rollerGroup = new THREE.Group();
      rollerGroup.position.set(rx, 0.95, 0);

      // Roller core cylinder
      const rollerMesh = new THREE.Mesh(rollerGeo, rollerMat);
      rollerMesh.rotation.x = Math.PI / 2; // Lie along Z
      rollerGroup.add(rollerMesh);

      // Two black rubber friction rings along the roller
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

    // Moving Conveyor Belt Top Bed (Smooth black belt surface)
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

    // 6. Drive AC Electric Motor & Worm Gearbox Assembly
    const motorGroup = new THREE.Group();
    motorGroup.position.set(-4.2, 0.65, 0.6);
    conveyorGroup.add(motorGroup);

    const motorGeo = new THREE.CylinderGeometry(0.14, 0.14, 0.32, 18);
    motorGeo.rotateZ(Math.PI / 2);
    const motorMat = new THREE.MeshStandardMaterial({
      color: 0x0284c7, // Industrial teal
      metalness: 0.7,
      roughness: 0.35,
    });
    const motorBody = new THREE.Mesh(motorGeo, motorMat);
    motorGroup.add(motorBody);

    const gearGeo = new THREE.BoxGeometry(0.24, 0.26, 0.24);
    const gearBox = new THREE.Mesh(gearGeo, darkAluMat);
    gearBox.position.set(0.18, 0, 0);
    motorGroup.add(gearBox);

    // 7. Overhead High-Speed Machine Vision Camera Gantry
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

    // Camera Body (Industrial Cognex safety orange)
    const cameraBodyGeo = new THREE.BoxGeometry(0.14, 0.18, 0.14);
    const cameraBodyMat = new THREE.MeshStandardMaterial({
      color: 0xf97316,
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

    // Laser Sheet Scanner Plane
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

    // 8. Photo-Eye Retroreflective Optical Sensor & Red Trigger Line
    const sensorBodyGeo = new THREE.BoxGeometry(0.06, 0.1, 0.06);
    const sensorBodyMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.4 });
    const sensor1 = new THREE.Mesh(sensorBodyGeo, sensorBodyMat);
    sensor1.position.set(-1.5, 1.12, 0.46);
    conveyorGroup.add(sensor1);

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

    // 9. Real Industrial PLC Control Cabinet & Operator Station
    const cabinetGroup = new THREE.Group();
    cabinetGroup.position.set(-1.8, 0, -1.05);
    scene.add(cabinetGroup);

    const cabinetGeo = new THREE.BoxGeometry(0.68, 1.45, 0.42);
    const cabinetMat = new THREE.MeshStandardMaterial({
      color: 0xcfd8dc, // Rittal light gray
      metalness: 0.5,
      roughness: 0.38,
    });
    const cabinet = new THREE.Mesh(cabinetGeo, cabinetMat);
    cabinet.position.set(0, 0.85, 0);
    cabinet.castShadow = true;
    cabinetGroup.add(cabinet);

    // Cabinet Plinth Base
    const plinthGeo = new THREE.BoxGeometry(0.7, 0.12, 0.44);
    const plinth = new THREE.Mesh(plinthGeo, darkAluMat);
    plinth.position.set(0, 0.06, 0);
    cabinetGroup.add(plinth);

    // HMI Digital Display Screen on Cabinet Door
    const hmiScreenGeo = new THREE.BoxGeometry(0.34, 0.24, 0.02);
    const hmiMat = new THREE.MeshBasicMaterial({ color: 0x0284c7 });
    const hmiScreen = new THREE.Mesh(hmiScreenGeo, hmiMat);
    hmiScreen.position.set(0, 1.18, 0.215);
    cabinetGroup.add(hmiScreen);

    // ----------------------------------------------------
    // REAL 3D PHYSICAL CONTROL BUTTONS ON PLC CABINET DOOR
    // ----------------------------------------------------
    const clickableButtons = [];

    // 1. START Push-Button (Green)
    const btnBaseGeo = new THREE.CylinderGeometry(0.03, 0.03, 0.015, 16);
    btnBaseGeo.rotateX(Math.PI / 2);
    const bezelMat = new THREE.MeshStandardMaterial({ color: 0x475569, metalness: 0.9, roughness: 0.2 });

    const startBase = new THREE.Mesh(btnBaseGeo, bezelMat);
    startBase.position.set(-0.16, 0.92, 0.215);
    cabinetGroup.add(startBase);

    const startCapGeo = new THREE.CylinderGeometry(0.022, 0.022, 0.02, 16);
    startCapGeo.rotateX(Math.PI / 2);
    const startMat = new THREE.MeshStandardMaterial({
      color: 0x22c55e,
      roughness: 0.3,
      emissive: 0x15803d,
      emissiveIntensity: 0.4,
    });
    const startBtnMesh = new THREE.Mesh(startCapGeo, startMat);
    startBtnMesh.position.set(-0.16, 0.92, 0.225);
    startBtnMesh.userData = { action: 'START' };
    cabinetGroup.add(startBtnMesh);
    clickableButtons.push(startBtnMesh);

    // 2. STOP Push-Button (Red/Black)
    const stopBase = new THREE.Mesh(btnBaseGeo, bezelMat);
    stopBase.position.set(0, 0.92, 0.215);
    cabinetGroup.add(stopBase);

    const stopCapGeo = new THREE.CylinderGeometry(0.022, 0.022, 0.02, 16);
    stopCapGeo.rotateX(Math.PI / 2);
    const stopMat = new THREE.MeshStandardMaterial({
      color: 0xef4444,
      roughness: 0.3,
      emissive: 0x991b1b,
      emissiveIntensity: 0.3,
    });
    const stopBtnMesh = new THREE.Mesh(stopCapGeo, stopMat);
    stopBtnMesh.position.set(0, 0.92, 0.225);
    stopBtnMesh.userData = { action: 'STOP' };
    cabinetGroup.add(stopBtnMesh);
    clickableButtons.push(stopBtnMesh);

    // 3. EMERGENCY STOP (Big Red Mushroom Head on Yellow Ring)
    const estopBaseGeo = new THREE.CylinderGeometry(0.042, 0.042, 0.018, 16);
    estopBaseGeo.rotateX(Math.PI / 2);
    const estopYellowMat = new THREE.MeshStandardMaterial({ color: 0xfacc15, roughness: 0.4 });
    const estopBase = new THREE.Mesh(estopBaseGeo, estopYellowMat);
    estopBase.position.set(0.18, 0.92, 0.215);
    cabinetGroup.add(estopBase);

    const estopMushroomGeo = new THREE.CylinderGeometry(0.038, 0.028, 0.035, 18);
    estopMushroomGeo.rotateX(Math.PI / 2);
    const estopMushroomMat = new THREE.MeshStandardMaterial({
      color: 0xdc2626,
      roughness: 0.25,
      emissive: 0x7f1d1d,
      emissiveIntensity: 0.5,
    });
    const estopBtnMesh = new THREE.Mesh(estopMushroomGeo, estopMushroomMat);
    estopBtnMesh.position.set(0.18, 0.92, 0.235);
    estopBtnMesh.userData = { action: 'ESTOP' };
    cabinetGroup.add(estopBtnMesh);
    clickableButtons.push(estopBtnMesh);

    simRef.current.clickableButtons = clickableButtons;

    // ----------------------------------------------------
    // TRICOLOR INDUSTRIAL TOWER LIGHT (STACK LIGHT / BEACON)
    // ----------------------------------------------------
    const stackPoleGeo = new THREE.CylinderGeometry(0.016, 0.016, 0.45, 12);
    const stackPole = new THREE.Mesh(stackPoleGeo, aluMat);
    stackPole.position.set(0.22, 1.8, 0);
    cabinetGroup.add(stackPole);

    const stackLensGeo = new THREE.CylinderGeometry(0.038, 0.038, 0.07, 16);

    // Top: RED
    const stackRedMat = new THREE.MeshStandardMaterial({
      color: 0x450a0a,
      emissive: 0x000000,
      roughness: 0.2,
      metalness: 0.1,
    });
    const stackRed = new THREE.Mesh(stackLensGeo, stackRedMat);
    stackRed.position.set(0.22, 2.16, 0);
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
    stackYellow.position.set(0.22, 2.08, 0);
    cabinetGroup.add(stackYellow);
    simRef.current.stackYellowMat = stackYellowMat;

    // Bottom: GREEN (Default ON when running)
    const stackGreenMat = new THREE.MeshStandardMaterial({
      color: 0x22c55e,
      emissive: 0x22c55e,
      emissiveIntensity: 0.9,
      roughness: 0.2,
      metalness: 0.1,
    });
    const stackGreen = new THREE.Mesh(stackLensGeo, stackGreenMat);
    stackGreen.position.set(0.22, 2.00, 0);
    cabinetGroup.add(stackGreen);
    simRef.current.stackGreenMat = stackGreenMat;

    // 10. Automated Pneumatic Diverter / Pusher (at X = 1.3)
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

    // 11. NG Reject Chute & Bin
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

    // 12. Finished Goods OK Primary Output Chute (at X = 4.4)
    const okTableGeo = new THREE.BoxGeometry(0.7, 0.95, 0.8);
    const okTableMat = new THREE.MeshStandardMaterial({ color: 0x15803d, roughness: 0.6 });
    const okTable = new THREE.Mesh(okTableGeo, okTableMat);
    okTable.position.set(4.6, 0.475, 0);
    conveyorGroup.add(okTable);

    // 13. Box Creation & Spawning
    const boxGeo = new THREE.BoxGeometry(0.38, 0.26, 0.32);
    const okBoxMat = new THREE.MeshStandardMaterial({
      color: 0xd97706, // Cardboard Kraft color
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

    // 14. Mouse / Touch Orbit Controls & Button Raycasting
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
      spherical.radius = Math.max(3.8, Math.min(10.5, spherical.radius));
      camera.position.x = spherical.radius * Math.sin(spherical.phi) * Math.sin(spherical.theta);
      camera.position.y = spherical.radius * Math.cos(spherical.phi) + 0.5;
      camera.position.z = spherical.radius * Math.sin(spherical.phi) * Math.cos(spherical.theta);
      camera.lookAt(0, 0.85, 0);
    };
    updateCameraFromSpherical();

    const dom = renderer.domElement;

    const onPointerDown = (e) => {
      isDragging = true;
      prevMouseX = e.clientX;
      prevMouseY = e.clientY;

      // Raycast for 3D buttons
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

    // 15. Real-Time Animation Loop
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

      // ----------------------------------------------------
      // TOWER LIGHT & BEACON BEHAVIOR ACCORDING TO USER SPEC:
      //  - RUNNING: Green ON (solid), Yellow OFF, Red OFF
      //  - IDLE (STOP): Yellow ON (solid), Green OFF, Red OFF
      //  - ESTOP: Red FLASHING (alarm pulse), Green OFF, Yellow OFF
      // ----------------------------------------------------
      if (state === 'ESTOP') {
        // Red flashing at 3 Hz
        const blink = Math.sin(now * 0.012) > 0;
        if (blink) {
          sim.stackRedMat.color.setHex(0xef4444);
          sim.stackRedMat.emissive.setHex(0xef4444);
          sim.stackRedMat.emissiveIntensity = 1.0;
          sim.beaconLight.color.setHex(0xef4444);
          sim.beaconLight.intensity = 2.8;
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
        // Yellow ON (Solid Standby)
        sim.stackYellowMat.color.setHex(0xfacc15);
        sim.stackYellowMat.emissive.setHex(0xfacc15);
        sim.stackYellowMat.emissiveIntensity = 0.9;
        sim.beaconLight.color.setHex(0xfacc15);
        sim.beaconLight.intensity = 2.0;

        sim.stackGreenMat.color.setHex(0x064e3b);
        sim.stackGreenMat.emissive.setHex(0x000000);
        sim.stackRedMat.color.setHex(0x450a0a);
        sim.stackRedMat.emissive.setHex(0x000000);
      } else {
        // RUNNING State: Green ON
        // If an NG defect was just detected, temporarily flash Red
        if (now < sim.ngBlinkTimer) {
          sim.stackRedMat.color.setHex(0xef4444);
          sim.stackRedMat.emissive.setHex(0xef4444);
          sim.stackRedMat.emissiveIntensity = 1.0;
          sim.beaconLight.color.setHex(0xef4444);
          sim.beaconLight.intensity = 2.8;

          sim.stackGreenMat.color.setHex(0x064e3b);
          sim.stackGreenMat.emissive.setHex(0x000000);
        } else {
          sim.stackGreenMat.color.setHex(0x22c55e);
          sim.stackGreenMat.emissive.setHex(0x22c55e);
          sim.stackGreenMat.emissiveIntensity = 0.95;
          sim.beaconLight.color.setHex(0x22c55e);
          sim.beaconLight.intensity = 2.2;

          sim.stackRedMat.color.setHex(0x450a0a);
          sim.stackRedMat.emissive.setHex(0x000000);
        }
        sim.stackYellowMat.color.setHex(0x451a03);
        sim.stackYellowMat.emissive.setHex(0x000000);
      }

      // ----------------------------------------------------
      // CONVEYOR & BOX MOVEMENT (ONLY WHEN RUNNING)
      // ----------------------------------------------------
      if (state === 'RUNNING') {
        const moveDist = 1.25 * sim.speed * dt;

        // ACCURATE ROLLER SPIN: Rotate cylinder smoothly around its longitudinal axis!
        // No up/down wobbling!
        const rollAngleDelta = (moveDist / rollerRadius);
        sim.rollers.forEach((r) => {
          r.rotation.y -= rollAngleDelta;
        });

        // Spawn new box at regular intervals
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

          // If rejected into bin, slide off
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

          // Move box along X
          box.mesh.position.x += moveDist;

          // Photo-eye Trigger Check
          if (box.mesh.position.x >= -1.55 && box.mesh.position.x <= -1.45) {
            sim.sensorRayMat.color.setHex(0xfacc15);
          } else if (sim.boxes.every((b) => Math.abs(b.mesh.position.x - -1.5) > 0.2)) {
            sim.sensorRayMat.color.setHex(0xef4444);
          }

          // Camera Inspection Station (at X = -0.5)
          if (!box.inspected && box.mesh.position.x >= -0.65 && box.mesh.position.x <= -0.35) {
            box.inspected = true;

            if (box.isNg) {
              sim.scanLaserPlane.material.color.setHex(0xef4444);
              sim.scanSpotLight.color.setHex(0xef4444);
              sim.ngBlinkTimer = now + 1800; // Flash red tower light for 1.8s
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

          // Reset Laser Beam
          if (box.mesh.position.x > -0.2 && box.mesh.position.x < 0.0) {
            sim.scanLaserPlane.material.color.setHex(0x38bdf8);
            sim.scanSpotLight.color.setHex(0x38bdf8);
          }

          // Pneumatic Reject Diverter (at X = 1.3)
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

    // Responsive Resize Handler
    const handleResize = () => {
      if (!container) return;
      const w = container.clientWidth || 800;
      const h = container.clientHeight || 540;
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
            Smart Conveyor Belt · High-Speed AI Vision Inspection &amp; Automated Sorting
          </h3>
          <p className="sc-subtitle">
            Real machine operation with optical photo-eyes, overhead CMOS vision camera, pneumatic reject diverter,
            and industrial 3-tier Tower Light (Green: Run, Yellow: Idle, Red: E-Stop/Defect).
          </p>
        </div>

        {/* Real Industrial Hardware Buttons Bar */}
        <div className="sc-header-actions sc-industrial-deck">
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
        <div className="sc-canvas-container">
          <div ref={mountRef} className="sc-three-canvas" />

          {/* Interactive 3D Canvas HUD overlays */}
          <div className="sc-canvas-hud-top">
            <span className="sc-hud-tag"><Camera size={13} /> Optical AI Gantry</span>
            <span className="sc-hud-tag"><Cpu size={13} /> Siemens S7-1200 PLC</span>
            <span className="sc-hud-tag"><Activity size={13} /> 6.2 Bar Air</span>
          </div>

          <div className="sc-canvas-hud-bottom">
            <span className="sc-hud-tip">
              💡 <strong>Rollers roll forward round-and-round</strong> · Click 3D Buttons on Cabinet or Controls · <strong>Drag 360°</strong>
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
