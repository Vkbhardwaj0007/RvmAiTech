import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import {
  Activity, Cpu, Gauge, Thermometer, Zap, Play, Pause, AlertTriangle, RotateCcw,
  Wifi, Radio, ArrowRight, ShieldCheck, CheckCircle2, Sliders, Eye, Box, Info,
  TrendingUp, BarChart3, Monitor, Layers, Clock
} from 'lucide-react';

/**
 * 3D Live MDMS Shop-Floor & Machine Telemetry
 * Featuring the RvmAiTech MDMS Edge Data Logger:
 * Hardware Model: RvmAiTech MDMS-8DI-8RO-PRO (8CH Digital Inputs + 8CH Relays + Ethernet + CAN + Wi-Fi)
 * Connected directly to an Industrial 5-Axis CNC Milling Center (VMC).
 *
 * Real Machine & Real Telemetry Architecture:
 * 1. Open-Cabin Industrial CNC Machining Center with sliding safety door (opens on Stop, closes on Run)
 * 2. High-speed spindle carriage that feeds down and spins at 6,500 RPM with cutting sparks & coolant spray
 * 3. RvmAiTech branded IoT Edge Data Logger with green screw terminals, Ethernet, gold antenna, and blinking LEDs
 * 4. Exact Client MDMS Dashboard (from Image 4) rendered live on the 3D Operator Console & Monitor Screen
 * 5. Animated electrical pulses flowing from CNC spindle & relays into the RvmAiTech Data Logger
 */

export default function MdmsFactory3D({ onBookDemo }) {
  const mountRef = useRef(null);

  // Machine Operational State: 'running' | 'idle' | 'fault'
  const [machineState, setMachineState] = useState('running');
  const [activeCamPreset, setActiveCamPreset] = useState('cell'); // 'cell' | 'logger' | 'spindle' | 'console'

  // Live Client MDMS Dashboard Metrics for 3 Connected CNC Lathe Machines
  const [dashboardData, setDashboardData] = useState({
    group: 'Group 1 · CNC Lathe Shop',
    groupAvailability: 88,
    groupProducedCount: 1847, // Total Count in Pcs / Cylinders (Replaced mtr!)
    groupTargetCount: 2200,
    groupRunTime: '6h 15m',
    groupIdleTime: '45m',
    groupStoppedTime: '0m',

    // Machine 1: CNC Lathe Machine - 01 (Cylinder Turning Center)
    m1Name: 'CNC Lathe Machine - 01',
    m1Sub: 'Hydraulic Cylinder Turning Center',
    m1Status: 'Running',
    m1Avail: 92,
    m1ProducedCount: 845, // Count (Pcs)
    m1Target: 1000,
    m1OkCount: 840,
    m1NgCount: 5,
    m1Rpm: 2850,
    m1Feed: 0.28, // mm/rev
    m1CycleTime: '1m 35s',
    m1Diameter: 'Ø 65.0 mm',
    m1PowerKw: 12.5,
    m1RunTime: '6h 05m',
    m1IdleTime: '25m',
    m1Downtime: '0m',

    // Machine 2: CNC Lathe Machine - 02 (Piston Rod CNC)
    m2Name: 'CNC Lathe Machine - 02',
    m2Sub: 'Piston Rod Precision Turning',
    m2Status: 'Running',
    m2Avail: 86,
    m2ProducedCount: 612, // Count (Pcs)
    m2Target: 750,
    m2OkCount: 609,
    m2NgCount: 3,
    m2Rpm: 3200,
    m2Feed: 0.22, // mm/rev
    m2CycleTime: '1m 15s',
    m2Diameter: 'Ø 42.0 mm',
    m2PowerKw: 10.8,
    m2RunTime: '5h 45m',
    m2IdleTime: '45m',
    m2Downtime: '0m',

    // Machine 3: CNC Lathe Machine - 03 (Thread & Flange CNC)
    m3Name: 'CNC Lathe Machine - 03',
    m3Sub: 'Flange & Port Threading Center',
    m3Status: 'Idle',
    m3Avail: 74,
    m3ProducedCount: 390, // Count (Pcs)
    m3Target: 500,
    m3OkCount: 388,
    m3NgCount: 2,
    m3Rpm: 0,
    m3Feed: 0.00,
    m3CycleTime: '2m 10s',
    m3Diameter: 'Ø 78.0 mm',
    m3PowerKw: 1.2,
    m3RunTime: '4h 10m',
    m3IdleTime: '2h 20m',
    m3Downtime: '0m',

    // Live Engineering Telemetry for active 3D CNC Lathe Machine
    rpm: 2850,
    feedRate: 0.28,
    powerKw: 12.5,
    tempC: 49,
    partsCompleted: 845,
    gCode: 'N140 G01 X-28.5 Z-145.0 F0.28 S2850 (Cylinder Cut)',
  });

  // Shared simulation refs for Three.js animation
  const simRef = useRef({
    machineState: 'running',
    camera: null,
    controls: null,
    targetCamPos: new THREE.Vector3(0, 3.0, 5.4),
    targetLookAt: new THREE.Vector3(0, 1.4, 0),
    slidingDoor: null,
    doorOffset: 0,
    spindleGroup: null,
    spindleHead: null,
    cutterMesh: null,
    chipsParticles: null,
    workpiece: null,
    dataPulses: [],
    ledPwr: null,
    ledRx: null,
    ledTx: null,
    towerGreenMat: null,
    towerYellowMat: null,
    towerRedMat: null,
    consoleTexture: null,
    consoleCtx: null,
    consoleCanvas: null,
    dashTexture: null,
    dashCtx: null,
    dashCanvas: null,
    lastDashDraw: 0,
    dashboardData: null,
  });

  // Sync state to simRef
  useEffect(() => {
    simRef.current.machineState = machineState;
  }, [machineState]);

  useEffect(() => {
    simRef.current.dashboardData = dashboardData;
  }, [dashboardData]);

  // Live telemetry ticker that updates metrics based on machineState
  useEffect(() => {
    const timer = setInterval(() => {
      setDashboardData((prev) => {
        if (machineState === 'running') {
          const incCount = Math.random() > 0.6 ? 1 : 0;
          const rpmJitter = Math.floor(2820 + Math.random() * 60);
          const pwrJitter = parseFloat((12.3 + Math.random() * 0.5).toFixed(1));
          const tempJitter = Math.floor(48 + Math.random() * 2);

          const next = {
            ...prev,
            m1Status: 'Running',
            m1Rpm: rpmJitter,
            m1PowerKw: pwrJitter,
            m1ProducedCount: prev.m1ProducedCount + incCount,
            m1OkCount: prev.m1OkCount + incCount,
            groupProducedCount: prev.groupProducedCount + incCount,
            groupAvailability: 89,
            rpm: rpmJitter,
            feedRate: 0.28,
            powerKw: pwrJitter,
            tempC: tempJitter,
            partsCompleted: prev.m1ProducedCount + incCount,
            gCode: `N${Math.floor(140 + Math.random() * 20)} G01 X-${(25 + Math.random() * 8).toFixed(1)} Z-${(120 + Math.random() * 50).toFixed(1)} F0.28 S${rpmJitter}`,
          };
          simRef.current.dashboardData = next;
          return next;
        } else if (machineState === 'idle') {
          const next = {
            ...prev,
            m1Status: 'Idle (Hold)',
            m1Rpm: 0,
            m1PowerKw: 1.6,
            groupAvailability: 78,
            rpm: 0,
            powerKw: 1.6,
            tempC: Math.max(36, prev.tempC - 0.4),
            gCode: 'M00 FEED HOLD / OPERATOR INSPECT',
          };
          simRef.current.dashboardData = next;
          return next;
        } else {
          // fault
          const next = {
            ...prev,
            m1Status: 'Alarm / E-Stop',
            m1Rpm: 0,
            m1PowerKw: 0.4,
            groupAvailability: 62,
            rpm: 0,
            powerKw: 0.4,
            gCode: 'ALARM 1024: E-STOP ENGAGED / DOOR INTERLOCK',
          };
          simRef.current.dashboardData = next;
          return next;
        }
      });
    }, 1200);

    return () => clearInterval(timer);
  }, [machineState]);

  // Camera presets
  const setCamView = (preset) => {
    setActiveCamPreset(preset);
    const sim = simRef.current;
    if (!sim.camera || !sim.controls) return;

    if (preset === 'cell') {
      sim.targetCamPos.set(0, 3.0, 5.4);
      sim.targetLookAt.set(0, 1.4, 0);
    } else if (preset === 'logger') {
      // Zoom into RvmAiTech MDMS Data Logger on the right
      sim.targetCamPos.set(1.9, 1.8, 1.6);
      sim.targetLookAt.set(1.85, 1.5, 0.4);
    } else if (preset === 'spindle') {
      // Zoom into the CNC interior machining chamber
      sim.targetCamPos.set(-0.35, 1.7, 1.9);
      sim.targetLookAt.set(-0.35, 1.45, 0);
    } else if (preset === 'console') {
      // Zoom into the CNC operator screen & HMI dashboard
      sim.targetCamPos.set(1.15, 1.95, 2.4);
      sim.targetLookAt.set(0.9, 1.75, 0.9);
    }
  };

  // Main Three.js Scene Setup
  useEffect(() => {
    const host = mountRef.current;
    if (!host) return;

    const w = host.clientWidth || 800;
    const h = host.clientHeight || 580;

    // 1. Scene & Camera
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xdde6f0); // Crisp industrial plant daylight
    scene.fog = new THREE.FogExp2(0xdde6f0, 0.024);

    const camera = new THREE.PerspectiveCamera(40, w / h, 0.1, 70);
    camera.position.set(0, 3.0, 5.4);
    camera.lookAt(0, 1.4, 0);
    simRef.current.camera = camera;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: 'high-performance' });
    renderer.setSize(w, h);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.25;
    host.innerHTML = '';
    host.appendChild(renderer.domElement);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.target.set(0, 1.4, 0);
    controls.maxPolarAngle = Math.PI / 2 - 0.04;
    controls.minDistance = 1.3;
    controls.maxDistance = 12.0;
    simRef.current.controls = controls;

    // 2. High-Bay Factory Lighting
    const hemiLight = new THREE.HemisphereLight(0xffffff, 0x94a3b8, 1.35);
    scene.add(hemiLight);

    const sun = new THREE.DirectionalLight(0xfffbeb, 1.8);
    sun.position.set(6, 12, 6);
    sun.castShadow = true;
    sun.shadow.mapSize.width = 2048;
    sun.shadow.mapSize.height = 2048;
    sun.shadow.bias = -0.0004;
    scene.add(sun);

    const fill = new THREE.DirectionalLight(0xcfd8dc, 0.85);
    fill.position.set(-6, 8, -4);
    scene.add(fill);

    // Bright interior CNC chamber worklights (illuminates inside so it never looks like a black box)
    const chamberLight = new THREE.PointLight(0xffffff, 2.5, 5.0);
    chamberLight.position.set(-0.35, 2.3, 0.2);
    scene.add(chamberLight);

    const chamberSpot = new THREE.SpotLight(0xffffff, 3.0, 4.5, Math.PI / 4, 0.3);
    chamberSpot.position.set(-0.35, 2.4, 0.6);
    chamberSpot.target.position.set(-0.35, 1.1, 0);
    scene.add(chamberSpot);
    scene.add(chamberSpot.target);

    // 3. Polished Factory Epoxy Floor with OSHA Safety Markings
    const floorGeo = new THREE.PlaneGeometry(32, 22);
    const floorMat = new THREE.MeshStandardMaterial({ color: 0xc8d3de, roughness: 0.35, metalness: 0.15 });
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    scene.add(floor);

    const floorGrid = new THREE.GridHelper(30, 16, 0x94a3b8, 0xb0bec5);
    floorGrid.position.y = 0.002;
    scene.add(floorGrid);

    // Yellow 5S Safety Boundary Line around cell
    const yellowZoneMat = new THREE.MeshBasicMaterial({ color: 0xfacc15 });
    const makeStripe = (x, z, sx, sz) => {
      const s = new THREE.Mesh(new THREE.PlaneGeometry(sx, sz), yellowZoneMat);
      s.rotation.x = -Math.PI / 2;
      s.position.set(x, 0.005, z);
      scene.add(s);
    };
    makeStripe(0, -2.4, 6.4, 0.08);
    makeStripe(0, 2.4, 6.4, 0.08);
    makeStripe(-3.2, 0, 0.08, 4.8);
    makeStripe(3.2, 0, 0.08, 4.8);

    // ----------------------------------------------------
    // 4. REAL OPEN-CABIN INDUSTRIAL CNC MILLING CENTER (VMC)
    // Modeled as a real machine with openable front sliding door & bright interior!
    // ----------------------------------------------------
    const cncGroup = new THREE.Group();
    cncGroup.position.set(-0.35, 0, 0);
    scene.add(cncGroup);

    // Materials
    const matDarkBase = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.45, metalness: 0.7 });
    const matLightCabin = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, roughness: 0.35, metalness: 0.35 });
    const matAccentDark = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.4, metalness: 0.6 });
    const matChrome = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.1, metalness: 0.98 });
    const matWayCover = new THREE.MeshStandardMaterial({ color: 0x94a3b8, roughness: 0.25, metalness: 0.9 });
    const matClearGlass = new THREE.MeshPhysicalMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.28,
      roughness: 0.05,
      metalness: 0.05,
      transmission: 0.9,
    });

    // 4A. Heavy Machine Base Bed Casting (Dark Charcoal Anthracite)
    const baseCasting = new THREE.Mesh(new THREE.BoxGeometry(2.6, 0.55, 2.3), matDarkBase);
    baseCasting.position.y = 0.275;
    baseCasting.castShadow = true;
    baseCasting.receiveShadow = true;
    cncGroup.add(baseCasting);

    // Leveling feet
    [[-1.1, -0.9], [1.1, -0.9], [-1.1, 0.9], [1.1, 0.9]].forEach(([fx, fz]) => {
      const foot = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.08, 0.06, 14), matDarkBase);
      foot.position.set(fx, 0.03, fz);
      cncGroup.add(foot);
    });

    // 4B. Open Cabin Walls (NOT a solid box! Enclosure with back, left, right, and top canopy)
    const cabinHeight = 1.95;
    const cabinDepth = 2.1;
    const cabinWidth = 2.5;

    // Back Wall
    const backWall = new THREE.Mesh(new THREE.BoxGeometry(cabinWidth, cabinHeight, 0.08), matLightCabin);
    backWall.position.set(0, 0.55 + cabinHeight / 2, -cabinDepth / 2 + 0.04);
    cncGroup.add(backWall);

    // Left Wall with small side window
    const leftWall = new THREE.Mesh(new THREE.BoxGeometry(0.08, cabinHeight, cabinDepth), matLightCabin);
    leftWall.position.set(-cabinWidth / 2 + 0.04, 0.55 + cabinHeight / 2, 0);
    cncGroup.add(leftWall);

    // Right Wall (adjacent to console)
    const rightWall = new THREE.Mesh(new THREE.BoxGeometry(0.08, cabinHeight, cabinDepth), matLightCabin);
    rightWall.position.set(cabinWidth / 2 - 0.04, 0.55 + cabinHeight / 2, 0);
    cncGroup.add(rightWall);

    // Upper Roof Canopy with Mist Extraction Duct
    const roofCanopy = new THREE.Mesh(new THREE.BoxGeometry(cabinWidth, 0.12, cabinDepth), matLightCabin);
    roofCanopy.position.set(0, 0.55 + cabinHeight + 0.06, 0);
    cncGroup.add(roofCanopy);

    // Oil Mist / Fume Collector on Roof
    const mistCollector = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.24, 0.45, 18), matAccentDark);
    mistCollector.position.set(0.65, 0.55 + cabinHeight + 0.35, -0.4);
    cncGroup.add(mistCollector);

    // Front Upper Fascia Header Panel
    const frontHeader = new THREE.Mesh(new THREE.BoxGeometry(cabinWidth, 0.35, 0.12), matLightCabin);
    frontHeader.position.set(0, 0.55 + cabinHeight - 0.175, cabinDepth / 2 - 0.06);
    cncGroup.add(frontHeader);

    // Front Lower Splash Guard Kickplate
    const frontKickplate = new THREE.Mesh(new THREE.BoxGeometry(cabinWidth, 0.3, 0.12), matDarkBase);
    frontKickplate.position.set(0, 0.55 + 0.15, cabinDepth / 2 - 0.06);
    cncGroup.add(frontKickplate);

    // 4C. Real Front Sliding Door Assembly
    // Smoothly opens when IDLE / STOPPED, and closes when RUNNING!
    const doorFrameGroup = new THREE.Group();
    doorFrameGroup.position.set(0, 1.5, cabinDepth / 2 - 0.02);
    cncGroup.add(doorFrameGroup);
    simRef.current.slidingDoor = doorFrameGroup;

    // Door Frame Surround (Charcoal with orange safety handle)
    const doorWidth = 1.35;
    const doorHeight = 1.35;

    // Top door rail
    const dRailTop = new THREE.Mesh(new THREE.BoxGeometry(doorWidth, 0.06, 0.04), matAccentDark);
    dRailTop.position.set(0, doorHeight / 2 - 0.03, 0);
    doorFrameGroup.add(dRailTop);

    // Bottom door rail
    const dRailBot = new THREE.Mesh(new THREE.BoxGeometry(doorWidth, 0.06, 0.04), matAccentDark);
    dRailBot.position.set(0, -doorHeight / 2 + 0.03, 0);
    doorFrameGroup.add(dRailBot);

    // Left door stile
    const dStileL = new THREE.Mesh(new THREE.BoxGeometry(0.06, doorHeight, 0.04), matAccentDark);
    dStileL.position.set(-doorWidth / 2 + 0.03, 0, 0);
    doorFrameGroup.add(dStileL);

    // Right door stile with door handle
    const dStileR = new THREE.Mesh(new THREE.BoxGeometry(0.06, doorHeight, 0.04), matAccentDark);
    dStileR.position.set(doorWidth / 2 - 0.03, 0, 0);
    doorFrameGroup.add(dStileR);

    // Crystal-Clear Viewing Glass Panel
    const doorGlass = new THREE.Mesh(new THREE.BoxGeometry(doorWidth - 0.12, doorHeight - 0.12, 0.015), matClearGlass);
    doorFrameGroup.add(doorGlass);

    // Stainless Steel Vertical Grab Handle
    const doorHandle = new THREE.Mesh(new THREE.CylinderGeometry(0.016, 0.016, 0.85, 12), matChrome);
    doorHandle.position.set(doorWidth / 2 - 0.08, 0, 0.04);
    doorFrameGroup.add(doorHandle);

    // ----------------------------------------------------
    // 4D. HIGH-DETAIL INTERIOR MACHINING CHAMBER
    // Clearly visible from outside through the open door and crystal glass!
    // ----------------------------------------------------
    // Telescopic Slideway Way Covers (Stainless Accordion Bellows)
    const wayCoverBack = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.8, 0.35), matWayCover);
    wayCoverBack.position.set(0, 1.25, -0.65);
    cncGroup.add(wayCoverBack);

    // Precision Slotted T-Slot Table (Cast Iron XYZ Machining Bed)
    const tableBed = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.12, 0.85), matDarkBase);
    tableBed.position.set(0, 0.78, 0);
    tableBed.receiveShadow = true;
    cncGroup.add(tableBed);

    // ----------------------------------------------------
    // CNC 4TH-AXIS ROTARY CHUCK & CYLINDER MANUFACTURING SETUP
    // Real industrial pneumatic / hydraulic cylinder manufacturing line
    // ----------------------------------------------------
    const fixtureGroup = new THREE.Group();
    fixtureGroup.position.set(0, 0.84, 0);
    cncGroup.add(fixtureGroup);

    // Left Side: 4th-Axis Rotary Headstock (3-Jaw Indexing Chuck)
    const headstockBase = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.22, 0.32), matDarkBase);
    headstockBase.position.set(-0.46, 0.11, 0);
    fixtureGroup.add(headstockBase);

    const rotaryChuck = new THREE.Mesh(
      new THREE.CylinderGeometry(0.12, 0.12, 0.12, 24),
      new THREE.MeshStandardMaterial({ color: 0x475569, metalness: 0.9, roughness: 0.2 })
    );
    rotaryChuck.rotation.z = Math.PI / 2;
    rotaryChuck.position.set(-0.32, 0.14, 0);
    fixtureGroup.add(rotaryChuck);

    // 3 Hardened Chuck Jaws
    for (let j = 0; j < 3; j++) {
      const angle = (j * Math.PI * 2) / 3;
      const jaw = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.05, 0.04), matChrome);
      jaw.position.set(-0.25, 0.14 + Math.sin(angle) * 0.08, Math.cos(angle) * 0.08);
      fixtureGroup.add(jaw);
    }

    // Right Side: CNC Tailstock with Revolving Live Center
    const tailstockBase = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.22, 0.3), matDarkBase);
    tailstockBase.position.set(0.48, 0.11, 0);
    fixtureGroup.add(tailstockBase);

    const tailstockQuill = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.14, 16), matChrome);
    tailstockQuill.rotation.z = Math.PI / 2;
    tailstockQuill.position.set(0.36, 0.14, 0);
    fixtureGroup.add(tailstockQuill);

    const liveCenterCone = new THREE.Mesh(new THREE.ConeGeometry(0.045, 0.08, 16), matChrome);
    liveCenterCone.rotation.z = -Math.PI / 2;
    liveCenterCone.position.set(0.27, 0.14, 0);
    fixtureGroup.add(liveCenterCone);

    // ----------------------------------------------------
    // PRECISION CYLINDER WORKPIECE BEING MACHINED
    // (Hydraulic / Pneumatic Cylinder Barrel with Machined O-Ring Ports & Turned Shaft)
    // ----------------------------------------------------
    const cylinderGroup = new THREE.Group();
    cylinderGroup.position.set(0, 0.98, 0);
    cncGroup.add(cylinderGroup);
    simRef.current.workpiece = cylinderGroup;

    // Polished Chrome-Plated Steel Materials
    const cylMatPolished = new THREE.MeshStandardMaterial({
      color: 0xf1f5f9,
      metalness: 0.98,
      roughness: 0.12,
    });
    const cylMatMachined = new THREE.MeshStandardMaterial({
      color: 0x94a3b8,
      metalness: 0.92,
      roughness: 0.28,
    });
    const cylMatBronze = new THREE.MeshStandardMaterial({
      color: 0xf59e0b,
      metalness: 0.85,
      roughness: 0.25,
    });

    // Main Cylinder Barrel
    const cylinderBarrel = new THREE.Mesh(new THREE.CylinderGeometry(0.065, 0.065, 0.48, 32), cylMatPolished);
    cylinderBarrel.rotation.z = Math.PI / 2;
    cylinderBarrel.castShadow = true;
    cylinderGroup.add(cylinderBarrel);

    // Turned Piston Rod Neck on Left End
    const pistonNeck = new THREE.Mesh(new THREE.CylinderGeometry(0.042, 0.042, 0.14, 24), cylMatMachined);
    pistonNeck.rotation.z = Math.PI / 2;
    pistonNeck.position.set(-0.28, 0, 0);
    cylinderGroup.add(pistonNeck);

    // Mounting Flange Collar with Chamfer
    const flangeCollar = new THREE.Mesh(new THREE.CylinderGeometry(0.078, 0.078, 0.04, 32), cylMatMachined);
    flangeCollar.rotation.z = Math.PI / 2;
    flangeCollar.position.set(-0.18, 0, 0);
    cylinderGroup.add(flangeCollar);

    // Machined O-Ring Seal Channels on Cylinder Body
    [-0.08, 0.08].forEach((px) => {
      const oRingGroove = new THREE.Mesh(new THREE.CylinderGeometry(0.068, 0.068, 0.022, 32), cylMatBronze);
      oRingGroove.rotation.z = Math.PI / 2;
      oRingGroove.position.set(px, 0, 0);
      cylinderGroup.add(oRingGroove);
    });

    // Cylinder End Cap on Right Side
    const cylinderCap = new THREE.Mesh(new THREE.CylinderGeometry(0.052, 0.052, 0.08, 24), cylMatMachined);
    cylinderCap.rotation.z = Math.PI / 2;
    cylinderCap.position.set(0.26, 0, 0);
    cylinderGroup.add(cylinderCap);

    // Z-Axis Vertical Spindle Carriage & Guideways
    const spindleCarriage = new THREE.Mesh(new THREE.BoxGeometry(0.48, 0.9, 0.48), matLightCabin);
    spindleCarriage.position.set(0, 2.05, -0.15);
    cncGroup.add(spindleCarriage);

    // Spindle Group (Feeds down into cut when RUNNING)
    const spindleGroup = new THREE.Group();
    spindleGroup.position.set(0, 1.6, 0);
    cncGroup.add(spindleGroup);
    simRef.current.spindleGroup = spindleGroup;

    // Heavy Cast Iron Spindle Nose Body
    const spindleNose = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.14, 0.38, 20), matDarkBase);
    spindleGroup.add(spindleNose);

    // High-Speed Rotating Spindle Chuck (BT40 Toolholder)
    const spindleHead = new THREE.Group();
    spindleHead.position.set(0, -0.18, 0);
    spindleGroup.add(spindleHead);
    simRef.current.spindleHead = spindleHead;

    const bt40Chuck = new THREE.Mesh(new THREE.CylinderGeometry(0.068, 0.048, 0.14, 16), matChrome);
    spindleHead.add(bt40Chuck);

    // Carbide End Mill Cutter
    const cutterMesh = new THREE.Mesh(
      new THREE.CylinderGeometry(0.016, 0.016, 0.16, 12),
      new THREE.MeshStandardMaterial({ color: 0x475569, roughness: 0.12, metalness: 0.98 })
    );
    cutterMesh.position.y = -0.12;
    spindleHead.add(cutterMesh);
    simRef.current.cutterMesh = cutterMesh;

    // Dual Flexible Coolant Nozzles (Blue/Orange Loc-Line pointing at cutter)
    const coolantL = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.32, 8), new THREE.MeshStandardMaterial({ color: 0x0284c7 }));
    coolantL.rotation.z = Math.PI / 4;
    coolantL.position.set(-0.16, -0.05, 0.08);
    spindleGroup.add(coolantL);

    const coolantR = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.32, 8), new THREE.MeshStandardMaterial({ color: 0xf97316 }));
    coolantR.rotation.z = -Math.PI / 4;
    coolantR.position.set(0.16, -0.05, 0.08);
    spindleGroup.add(coolantR);

    // Machining Sparks & Coolant Spray Particle System
    const chipCount = 45;
    const chipGeo = new THREE.BufferGeometry();
    const chipPositions = new Float32Array(chipCount * 3);
    for (let c = 0; c < chipCount; c++) {
      chipPositions[c * 3] = (Math.random() - 0.5) * 0.16;
      chipPositions[c * 3 + 1] = 1.1 + Math.random() * 0.12;
      chipPositions[c * 3 + 2] = (Math.random() - 0.5) * 0.16;
    }
    chipGeo.setAttribute('position', new THREE.BufferAttribute(chipPositions, 3));
    const chipMat = new THREE.PointsMaterial({ color: 0xfacc15, size: 0.026, transparent: true, opacity: 0.9 });
    const chipParticles = new THREE.Points(chipGeo, chipMat);
    cncGroup.add(chipParticles);
    simRef.current.chipsParticles = chipParticles;

    // ----------------------------------------------------
    // 4E. TRICOLOR SIGNAL TOWER LIGHT (High atop CNC machine)
    // ----------------------------------------------------
    const towerPole = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, 0.45, 12), matChrome);
    towerPole.position.set(-0.85, 2.7, 0);
    cncGroup.add(towerPole);

    const tLensGeo = new THREE.CylinderGeometry(0.045, 0.045, 0.08, 16);
    const towerRedMat = new THREE.MeshStandardMaterial({ color: 0x450a0a, emissive: 0x000000 });
    const towerYellowMat = new THREE.MeshStandardMaterial({ color: 0x451a03, emissive: 0x000000 });
    const towerGreenMat = new THREE.MeshStandardMaterial({ color: 0x22c55e, emissive: 0x22c55e, emissiveIntensity: 0.95 });

    const tRed = new THREE.Mesh(tLensGeo, towerRedMat);
    tRed.position.set(-0.85, 3.12, 0);
    cncGroup.add(tRed);

    const tYellow = new THREE.Mesh(tLensGeo, towerYellowMat);
    tYellow.position.set(-0.85, 3.03, 0);
    cncGroup.add(tYellow);

    const tGreen = new THREE.Mesh(tLensGeo, towerGreenMat);
    tGreen.position.set(-0.85, 2.94, 0);
    cncGroup.add(tGreen);

    simRef.current.towerRedMat = towerRedMat;
    simRef.current.towerYellowMat = towerYellowMat;
    simRef.current.towerGreenMat = towerGreenMat;

    // ----------------------------------------------------
    // 4F. CNC OPERATOR CONSOLE & HMI MONITOR SCREEN (MATCHING IMAGE 4!)
    // Renders the exact MDMS Dashboard: CBR-01, Mercerizer, Group 1 58% Availability
    // ----------------------------------------------------
    const consoleArm = new THREE.Group();
    consoleArm.position.set(1.4, 1.5, 0.7);
    cncGroup.add(consoleArm);

    // Swivel Arm
    const armSupport = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.65, 12), matDarkBase);
    armSupport.rotation.z = Math.PI / 3;
    consoleArm.add(armSupport);

    // 24" Large Console Enclosure Box
    const consoleHousing = new THREE.Mesh(new THREE.BoxGeometry(0.78, 0.62, 0.12), matAccentDark);
    consoleHousing.position.set(0.65, 0.22, 0.22);
    consoleHousing.rotation.y = -0.38;
    consoleArm.add(consoleHousing);

    // CanvasTexture for High-Res Client MDMS Dashboard (Image 4)
    const dashCanvas = document.createElement('canvas');
    dashCanvas.width = 1024;
    dashCanvas.height = 720;
    const dashCtx = dashCanvas.getContext('2d');
    const dashTexture = new THREE.CanvasTexture(dashCanvas);
    dashTexture.minFilter = THREE.LinearFilter;
    simRef.current.dashTexture = dashTexture;
    simRef.current.dashCtx = dashCtx;
    simRef.current.dashCanvas = dashCanvas;

    const dashScreenMesh = new THREE.Mesh(
      new THREE.BoxGeometry(0.72, 0.54, 0.01),
      new THREE.MeshBasicMaterial({ map: dashTexture })
    );
    dashScreenMesh.position.set(0.65, 0.24, 0.285);
    dashScreenMesh.rotation.y = -0.38;
    consoleArm.add(dashScreenMesh);

    // Physical CNC Buttons below the screen
    const keypadStrip = new THREE.Mesh(new THREE.BoxGeometry(0.72, 0.08, 0.02), matDarkBase);
    keypadStrip.position.set(0.65, -0.06, 0.285);
    keypadStrip.rotation.y = -0.38;
    consoleArm.add(keypadStrip);

    // Red Emergency Stop Button on Console
    const estopConsoleBtn = new THREE.Mesh(
      new THREE.CylinderGeometry(0.024, 0.024, 0.03, 14),
      new THREE.MeshStandardMaterial({ color: 0xdc2626, roughness: 0.3 })
    );
    estopConsoleBtn.rotation.x = Math.PI / 2;
    estopConsoleBtn.position.set(0.88, -0.06, 0.31);
    consoleArm.add(estopConsoleBtn);

    // ----------------------------------------------------
    // 5. RVMAITECH BRANDED MDMS DATA LOGGER HARDWARE
    // Model: RvmAiTech MDMS-8DI-8RO-PRO
    // Features: 8CH Digital Inputs + 8CH Relays + Ethernet + CAN + Wi-Fi
    // ----------------------------------------------------
    const loggerStation = new THREE.Group();
    loggerStation.position.set(1.85, 0, 0.4);
    scene.add(loggerStation);

    // Pedestal Stand
    const standPost = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.05, 1.4, 16), matDarkBase);
    standPost.position.y = 0.7;
    standPost.castShadow = true;
    loggerStation.add(standPost);

    const standBase = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.32, 0.04, 20), matDarkBase);
    standBase.position.y = 0.02;
    loggerStation.add(standBase);

    // Galvanized Steel DIN Rail Backplate
    const dinBackplate = new THREE.Mesh(
      new THREE.BoxGeometry(0.74, 0.86, 0.02),
      new THREE.MeshStandardMaterial({ color: 0xe2e8f0, metalness: 0.85, roughness: 0.25 })
    );
    dinBackplate.position.set(0, 1.5, 0);
    loggerStation.add(dinBackplate);

    // Steel DIN Rail (Top-Hat 35mm)
    const dinRail = new THREE.Mesh(
      new THREE.BoxGeometry(0.66, 0.035, 0.015),
      new THREE.MeshStandardMaterial({ color: 0xcfd8dc, metalness: 0.95, roughness: 0.15 })
    );
    dinRail.position.set(0, 1.5, 0.018);
    loggerStation.add(dinRail);

    // The Logger Enclosure
    const loggerGroup = new THREE.Group();
    loggerGroup.position.set(0, 1.5, 0.058);
    loggerStation.add(loggerGroup);

    // Jet Black Industrial Plastic Enclosure
    const loggerBody = new THREE.Mesh(
      new THREE.BoxGeometry(0.34, 0.52, 0.065),
      new THREE.MeshStandardMaterial({ color: 0x181e28, roughness: 0.45, metalness: 0.2 })
    );
    loggerGroup.add(loggerBody);

    // DIN Rail Mounting Tabs (Top & Bottom)
    [-0.27, 0.27].forEach((ey) => {
      const ear = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.03, 0.04), matDarkBase);
      ear.position.set(0, ey, -0.01);
      loggerGroup.add(ear);
    });

    // ------------------------------------------
    // RVMAITECH BRANDED SILKSCREEN LABEL
    // ------------------------------------------
    const labelCanvas = document.createElement('canvas');
    labelCanvas.width = 512;
    labelCanvas.height = 768;
    const lCtx = labelCanvas.getContext('2d');

    // Dark sleek background
    lCtx.fillStyle = '#0a1526';
    lCtx.fillRect(0, 0, 512, 768);

    // Power block header badge on top right
    lCtx.fillStyle = '#0284c7';
    lCtx.fillRect(340, 20, 150, 70);
    lCtx.fillStyle = '#ffffff';
    lCtx.font = 'bold 22px sans-serif';
    lCtx.fillText('7~36V DC', 350, 52);
    lCtx.font = 'bold 18px monospace';
    lCtx.fillText('+   -', 368, 78);

    // RvmAiTech Logo & Branding (Replaced Waveshare!)
    lCtx.fillStyle = '#ffffff';
    lCtx.font = 'bold 40px sans-serif';
    lCtx.fillText('RvmAiTech', 40, 70);

    // Red/Orange dot on Ai
    lCtx.fillStyle = '#f47b20';
    lCtx.beginPath();
    lCtx.arc(178, 48, 6, 0, Math.PI * 2);
    lCtx.fill();

    lCtx.fillStyle = '#38bdf8';
    lCtx.font = 'bold 17px sans-serif';
    lCtx.fillText('SMART INDUSTRIAL TELEMETRY GATEWAY', 40, 98);

    // Model Number Silkscreen
    lCtx.fillStyle = '#ffffff';
    lCtx.font = 'bold 25px monospace';
    lCtx.fillText('MDMS-8DI-8RO-PRO', 40, 145);
    lCtx.fillStyle = '#94a3b8';
    lCtx.font = '18px sans-serif';
    lCtx.fillText('8CH Relay Outputs and 8CH Digital Inputs', 40, 178);

    // Divider Line
    lCtx.strokeStyle = '#334155';
    lCtx.lineWidth = 3;
    lCtx.beginPath();
    lCtx.moveTo(30, 200); lCtx.lineTo(482, 200);
    lCtx.stroke();

    // Left Side: 8CH Relay Outputs (CH1 - CH8)
    lCtx.fillStyle = '#38bdf8';
    lCtx.font = 'bold 20px monospace';
    for (let c = 1; c <= 8; c++) {
      const cy = 240 + (c - 1) * 60;
      lCtx.fillText(`CH${c}`, 40, cy);
      lCtx.strokeStyle = '#64748b';
      lCtx.lineWidth = 2;
      lCtx.strokeRect(95, cy - 18, 30, 22);
    }

    // Right Side: DI1 - DI8 Digital Inputs & Ports
    lCtx.fillStyle = '#facc15';
    lCtx.font = 'bold 20px monospace';
    lCtx.fillText('CAN: H L G', 340, 145);

    lCtx.fillStyle = '#4ade80';
    for (let d = 1; d <= 8; d++) {
      const dy = 240 + (d - 1) * 38;
      lCtx.fillText(`DI${d}`, 340, dy);
    }
    lCtx.fillStyle = '#cbd5e1';
    lCtx.fillText('COM  DGND', 340, 565);

    // Port Badges: ETH & Wi-Fi ANT
    lCtx.fillStyle = '#0284c7';
    lCtx.fillRect(330, 610, 155, 45);
    lCtx.fillStyle = '#ffffff';
    lCtx.font = 'bold 18px sans-serif';
    lCtx.fillText('ETH [RJ45]', 345, 640);

    lCtx.fillStyle = '#f97316';
    lCtx.fillRect(330, 670, 155, 45);
    lCtx.fillStyle = '#ffffff';
    lCtx.font = 'bold 18px sans-serif';
    lCtx.fillText('ANT [Wi-Fi/BT]', 345, 700);

    const labelTex = new THREE.CanvasTexture(labelCanvas);
    labelTex.minFilter = THREE.LinearFilter;

    const labelFace = new THREE.Mesh(
      new THREE.PlaneGeometry(0.31, 0.48),
      new THREE.MeshBasicMaterial({ map: labelTex })
    );
    labelFace.position.set(0, 0, 0.033);
    loggerGroup.add(labelFace);

    // Green Screw Terminal Blocks (Phoenix Contact style)
    const greenTermMat = new THREE.MeshStandardMaterial({ color: 0x15803d, roughness: 0.35, metalness: 0.2 });
    const screwMat = new THREE.MeshStandardMaterial({ color: 0xd1d5db, metalness: 0.9, roughness: 0.1 });

    // Left Side Relays CH1-CH8
    for (let r = 0; r < 8; r++) {
      const ry = 0.18 - r * 0.052;
      const tBlock = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.038, 0.04), greenTermMat);
      tBlock.position.set(-0.18, ry, 0.01);
      loggerGroup.add(tBlock);

      const sc = new THREE.Mesh(new THREE.CylinderGeometry(0.005, 0.005, 0.01, 8), screwMat);
      sc.position.set(-0.18, ry, 0.032);
      loggerGroup.add(sc);
    }

    // Right Side Digital Inputs DI1-DI8 & Power
    for (let d = 0; d < 10; d++) {
      const dy = 0.21 - d * 0.044;
      const tBlock = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.032, 0.04), greenTermMat);
      tBlock.position.set(0.18, dy, 0.01);
      loggerGroup.add(tBlock);

      const sc = new THREE.Mesh(new THREE.CylinderGeometry(0.004, 0.004, 0.01, 8), screwMat);
      sc.position.set(0.18, dy, 0.032);
      loggerGroup.add(sc);
    }

    // Ethernet RJ45 Jack with plugged Blue LAN cable
    const ethJack = new THREE.Mesh(
      new THREE.BoxGeometry(0.065, 0.055, 0.045),
      new THREE.MeshStandardMaterial({ color: 0x64748b, metalness: 0.95, roughness: 0.15 })
    );
    ethJack.position.set(0.14, -0.22, 0.03);
    loggerGroup.add(ethJack);

    const ethCable = new THREE.Mesh(
      new THREE.CylinderGeometry(0.008, 0.008, 1.2, 10),
      new THREE.MeshStandardMaterial({ color: 0x0284c7, roughness: 0.4 })
    );
    ethCable.position.set(0.14, -0.75, 0.03);
    loggerGroup.add(ethCable);

    // Gold SMA Wi-Fi Antenna Connector & Black Antenna Stub
    const smaConnector = new THREE.Mesh(
      new THREE.CylinderGeometry(0.012, 0.012, 0.035, 12),
      new THREE.MeshStandardMaterial({ color: 0xfacc15, metalness: 0.95, roughness: 0.1 })
    );
    smaConnector.rotation.x = Math.PI / 2;
    smaConnector.position.set(0.14, -0.15, 0.055);
    loggerGroup.add(smaConnector);

    const wifiAntenna = new THREE.Mesh(
      new THREE.CylinderGeometry(0.008, 0.008, 0.18, 10),
      new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.5 })
    );
    wifiAntenna.position.set(0.14, -0.05, 0.075);
    loggerGroup.add(wifiAntenna);

    // Status LEDs on RvmAiTech Logger (PWR, RX, TX)
    const ledPwr = new THREE.Mesh(new THREE.SphereGeometry(0.006, 8, 8), new THREE.MeshBasicMaterial({ color: 0x22c55e }));
    ledPwr.position.set(0.06, 0.22, 0.035);
    loggerGroup.add(ledPwr);
    simRef.current.ledPwr = ledPwr;

    const ledRx = new THREE.Mesh(new THREE.SphereGeometry(0.006, 8, 8), new THREE.MeshBasicMaterial({ color: 0x38bdf8 }));
    ledRx.position.set(0.08, 0.22, 0.035);
    loggerGroup.add(ledRx);
    simRef.current.ledRx = ledRx;

    const ledTx = new THREE.Mesh(new THREE.SphereGeometry(0.006, 8, 8), new THREE.MeshBasicMaterial({ color: 0xf97316 }));
    ledTx.position.set(0.10, 0.22, 0.035);
    loggerGroup.add(ledTx);
    simRef.current.ledTx = ledTx;

    // ----------------------------------------------------
    // 6. PHYSICAL INTERCONNECTION WIRING & DATA PARTICLES
    // Flexible signal wires running from CNC Machine -> RvmAiTech Logger DI Pins!
    // ----------------------------------------------------
    const wireHarnessGroup = new THREE.Group();
    scene.add(wireHarnessGroup);

    const makeWire = (start, mid, end, colorHex) => {
      const curve = new THREE.CatmullRomCurve3([start, mid, end]);
      const geo = new THREE.TubeGeometry(curve, 32, 0.006, 8, false);
      const mat = new THREE.MeshStandardMaterial({ color: colorHex, roughness: 0.4 });
      const wire = new THREE.Mesh(geo, mat);
      wireHarnessGroup.add(wire);
      return curve;
    };

    // Wire 1: Yellow Wire -> DI1 (Spindle Run)
    const curve1 = makeWire(
      new THREE.Vector3(-0.35, 1.55, 0.1),
      new THREE.Vector3(0.65, 1.25, 0.3),
      new THREE.Vector3(1.85 + 0.18, 1.5 + 0.166, 0.4 + 0.068),
      0xfacc15
    );

    // Wire 2: Green Wire -> DI2 (In-Cycle M-Code)
    const curve2 = makeWire(
      new THREE.Vector3(-0.35, 1.1, 0.1),
      new THREE.Vector3(0.65, 1.1, 0.3),
      new THREE.Vector3(1.85 + 0.18, 1.5 + 0.122, 0.4 + 0.068),
      0x22c55e
    );

    // Wire 3: Orange Wire -> DI3 (Part Counter Switch)
    const curve3 = makeWire(
      new THREE.Vector3(-0.35, 0.8, 0.1),
      new THREE.Vector3(0.65, 1.0, 0.3),
      new THREE.Vector3(1.85 + 0.18, 1.5 + 0.078, 0.4 + 0.068),
      0xf97316
    );

    // Wire 4: Red Wire -> DI4 (Alarm Interlock)
    const curve4 = makeWire(
      new THREE.Vector3(-0.35, 2.7, 0),
      new THREE.Vector3(0.65, 1.8, 0.3),
      new THREE.Vector3(1.85 + 0.18, 1.5 + 0.034, 0.4 + 0.068),
      0xef4444
    );

    // Glowing Electron Pulses
    const pMatCyan = new THREE.MeshBasicMaterial({ color: 0x38bdf8 });
    const pMatGreen = new THREE.MeshBasicMaterial({ color: 0x4ade80 });
    const pMatOrange = new THREE.MeshBasicMaterial({ color: 0xfbbf24 });
    const pMatRed = new THREE.MeshBasicMaterial({ color: 0xf87171 });

    const createPulse = (mat) => {
      const p = new THREE.Mesh(new THREE.SphereGeometry(0.016, 8, 8), mat);
      scene.add(p);
      return p;
    };

    simRef.current.dataPulses = [
      { mesh: createPulse(pMatCyan), curve: curve1, speed: 0.75, offset: 0 },
      { mesh: createPulse(pMatGreen), curve: curve2, speed: 0.65, offset: 0.35 },
      { mesh: createPulse(pMatOrange), curve: curve3, speed: 0.85, offset: 0.7 },
      { mesh: createPulse(pMatRed), curve: curve4, speed: 0.95, offset: 0.2 },
    ];

    // ----------------------------------------------------
    // HELPER: RENDER CLIENT MDMS DASHBOARD (3 CNC LATHE MACHINES)
    // Displays Count (Pcs) & Parameters (RPM, Feed, Cycle Time, Spec, Load)
    // ----------------------------------------------------
    const drawMdmsDashboardCanvas = (ctx, data, st) => {
      // Dark navy slate background
      ctx.fillStyle = '#0a192f';
      ctx.fillRect(0, 0, 1024, 720);

      // Top Title Bar
      ctx.fillStyle = '#94a3b8';
      ctx.font = 'bold 16px sans-serif';
      ctx.fillText('GROUP SUMMARY · CNC LATHE SHOP (3 MACHINES CONNECTED)', 30, 42);

      // Left Column Card: Group 1 Summary
      ctx.fillStyle = '#0f243e';
      ctx.fillRect(25, 60, 360, 630);
      ctx.strokeStyle = '#1e3a5f';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(25, 60, 360, 630);

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 28px sans-serif';
      ctx.fillText('Group 1', 45, 105);

      ctx.fillStyle = '#94a3b8';
      ctx.font = '16px sans-serif';
      ctx.fillText('3 CNC Lathe Machines · Shift A', 45, 135);

      // Availability Meter
      ctx.fillStyle = '#38bdf8';
      ctx.font = 'bold 54px sans-serif';
      ctx.fillText(`${data.groupAvailability}%`, 45, 215);

      ctx.fillStyle = '#94a3b8';
      ctx.font = 'bold 15px sans-serif';
      ctx.fillText('AVAILABILITY · OEE: 87.2%', 45, 245);

      // Produced Count (CONT) - Replaced meters (mtr) with Count (Pcs)!
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 34px sans-serif';
      ctx.fillText(`${data.groupProducedCount.toLocaleString()} Pcs`, 45, 305);

      ctx.fillStyle = '#94a3b8';
      ctx.font = '14px sans-serif';
      ctx.fillText('TOTAL PRODUCED COUNT', 45, 330);

      ctx.fillStyle = '#cbd5e1';
      ctx.font = 'bold 16px sans-serif';
      ctx.fillText(`Target: ${data.groupTargetCount} Pcs`, 220, 305);

      // Cyan / Orange Progress Bar
      ctx.fillStyle = '#1e3a5f';
      ctx.fillRect(45, 345, 310, 8);
      ctx.fillStyle = '#f97316';
      ctx.fillRect(45, 345, 260, 8);

      // Run Time / Idle / Stopped stats boxes
      const drawMiniStat = (x, y, w, title, val, color) => {
        ctx.fillStyle = '#0a192f';
        ctx.fillRect(x, y, w, 55);
        ctx.strokeStyle = '#1e3a5f';
        ctx.strokeRect(x, y, w, 55);

        ctx.fillStyle = '#94a3b8';
        ctx.font = 'bold 12px sans-serif';
        ctx.fillText(title, x + 10, y + 20);

        ctx.fillStyle = color;
        ctx.font = 'bold 16px sans-serif';
        ctx.fillText(val, x + 10, y + 44);
      };

      drawMiniStat(45, 370, 95, 'RUN TIME', data.groupRunTime, '#22c55e');
      drawMiniStat(150, 370, 95, 'IDLE', data.groupIdleTime, '#facc15');
      drawMiniStat(255, 370, 95, 'STOPPED', data.groupStoppedTime, '#94a3b8');

      // Status pill: 2 machines running, 1 idle
      ctx.fillStyle = '#4ade80';
      ctx.font = 'bold 15px sans-serif';
      ctx.fillText('● 2 Machines Running  |  ⏸ 1 Idle (Setup)', 45, 460);

      // Last 7 Days Production (Pcs) Bar Chart
      ctx.fillStyle = '#cbd5e1';
      ctx.font = 'bold 14px sans-serif';
      ctx.fillText('LAST 7 DAYS · PRODUCTION (Pcs)', 45, 510);
      ctx.fillText('14,250 Pcs', 280, 510);

      const days = ['Sat', 'Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
      const heights = [70, 25, 78, 85, 92, 98, 90];
      days.forEach((day, i) => {
        const bx = 45 + i * 44;
        const by = 640;
        const bh = heights[i];
        ctx.fillStyle = '#0d9488';
        ctx.fillRect(bx, by - bh, 30, bh);
        ctx.fillStyle = '#94a3b8';
        ctx.font = '12px sans-serif';
        ctx.fillText(day, bx, by + 16);
      });

      // Right Column: MACHINES (3 CNC Lathe Machines with Count & Parameters)
      ctx.fillStyle = '#94a3b8';
      ctx.font = 'bold 16px sans-serif';
      ctx.fillText('MACHINES · 3 CNC LATHE CONNECTED', 410, 42);

      const drawMachineCard = (y, name, sub, avail, count, ok, ng, isRun, statusText, rpm, feed, cycle, kw, runT, idleT, downT, spec) => {
        // Card Box
        ctx.fillStyle = '#0f243e';
        ctx.fillRect(410, y, 585, 195);
        ctx.strokeStyle = isRun ? '#0284c7' : '#1e3a5f';
        ctx.lineWidth = isRun ? 1.5 : 1;
        ctx.strokeRect(410, y, 585, 195);

        // Donut / Avail % Badge
        ctx.fillStyle = '#0d9488';
        ctx.font = 'bold 26px sans-serif';
        ctx.fillText(`${avail}%`, 428, y + 40);
        ctx.fillStyle = '#94a3b8';
        ctx.font = 'bold 11px sans-serif';
        ctx.fillText('AVAIL', 430, y + 56);

        // Machine Name & Subtitle
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 20px sans-serif';
        ctx.fillText(name, 505, y + 34);

        ctx.fillStyle = '#94a3b8';
        ctx.font = '13px sans-serif';
        ctx.fillText(sub, 505, y + 54);

        // Status Badge (Top Right)
        ctx.fillStyle = isRun ? '#22c55e' : statusText.includes('Alarm') ? '#ef4444' : '#facc15';
        ctx.font = 'bold 15px sans-serif';
        ctx.fillText(statusText, 860, y + 34);

        // Count (CONT) - Big Bold Text (Replaced mtr!)
        ctx.fillStyle = '#38bdf8';
        ctx.font = 'bold 24px sans-serif';
        ctx.fillText(`${count.toLocaleString()} Pcs`, 505, y + 84);

        // Quality Yield & OK/NG
        const yieldVal = ((ok / Math.max(1, ok + ng)) * 100).toFixed(1);
        ctx.fillStyle = '#cbd5e1';
        ctx.font = 'bold 13px sans-serif';
        ctx.fillText(`Yield: ${yieldVal}% (${ok} OK / ${ng} NG)`, 675, y + 82);

        // Progress Bar
        ctx.fillStyle = '#1e3a5f';
        ctx.fillRect(425, y + 96, 555, 6);
        ctx.fillStyle = isRun ? '#f97316' : '#64748b';
        ctx.fillRect(425, y + 96, isRun ? 420 : 260, 6);

        // Machine Parameters Row (PERA MITTER)
        ctx.fillStyle = '#071527';
        ctx.fillRect(425, y + 110, 555, 42);
        ctx.strokeStyle = '#1e293b';
        ctx.strokeRect(425, y + 110, 555, 42);

        // Parameter 1: Spindle RPM
        ctx.fillStyle = '#94a3b8';
        ctx.font = '10px sans-serif';
        ctx.fillText('SPINDLE', 438, y + 124);
        ctx.fillStyle = '#38bdf8';
        ctx.font = 'bold 14px monospace';
        ctx.fillText(`${rpm} RPM`, 438, y + 142);

        // Parameter 2: Feed Rate
        ctx.fillStyle = '#94a3b8';
        ctx.font = '10px sans-serif';
        ctx.fillText('FEED', 550, y + 124);
        ctx.fillStyle = '#4ade80';
        ctx.font = 'bold 14px monospace';
        ctx.fillText(`${feed} mm/r`, 550, y + 142);

        // Parameter 3: Cycle Time
        ctx.fillStyle = '#94a3b8';
        ctx.font = '10px sans-serif';
        ctx.fillText('CYCLE TIME', 660, y + 124);
        ctx.fillStyle = '#facc15';
        ctx.font = 'bold 14px monospace';
        ctx.fillText(cycle, 660, y + 142);

        // Parameter 4: Power Load / Spec
        ctx.fillStyle = '#94a3b8';
        ctx.font = '10px sans-serif';
        ctx.fillText('LOAD / SPEC', 785, y + 124);
        ctx.fillStyle = '#e2e8f0';
        ctx.font = 'bold 13px monospace';
        ctx.fillText(`${kw} kW · ${spec}`, 785, y + 142);

        // Bottom Times & MDMS Data Link
        ctx.fillStyle = '#64748b';
        ctx.font = '11px sans-serif';
        ctx.fillText(`Run: ${runT} | Idle: ${idleT} | Down: ${downT}`, 425, y + 176);

        ctx.fillStyle = '#38bdf8';
        ctx.font = 'bold 11px sans-serif';
        ctx.fillText('RvmAiTech MDMS Live IoT (ESP32-S3 @ 1000Hz)', 710, y + 176);
      };

      // Card 1: CNC Lathe Machine - 01 (Active machine in 3D scene)
      const m1IsRun = st === 'running';
      const m1StatusLabel = m1IsRun ? '● Running' : st === 'idle' ? '⏸ Idle (Hold)' : '⚠️ Alarm';
      drawMachineCard(
        56,
        data.m1Name,
        data.m1Sub,
        data.m1Avail,
        data.m1ProducedCount,
        data.m1OkCount,
        data.m1NgCount,
        m1IsRun,
        m1StatusLabel,
        data.m1Rpm,
        data.m1Feed,
        data.m1CycleTime,
        data.m1PowerKw,
        data.m1RunTime,
        data.m1IdleTime,
        data.m1Downtime,
        data.m1Diameter
      );

      // Card 2: CNC Lathe Machine - 02 (Piston Rod Turning)
      drawMachineCard(
        265,
        data.m2Name,
        data.m2Sub,
        data.m2Avail,
        data.m2ProducedCount,
        data.m2OkCount,
        data.m2NgCount,
        true,
        '● Running',
        data.m2Rpm,
        data.m2Feed,
        data.m2CycleTime,
        data.m2PowerKw,
        data.m2RunTime,
        data.m2IdleTime,
        data.m2Downtime,
        data.m2Diameter
      );

      // Card 3: CNC Lathe Machine - 03 (Flange Collar Threading)
      drawMachineCard(
        475,
        data.m3Name,
        data.m3Sub,
        data.m3Avail,
        data.m3ProducedCount,
        data.m3OkCount,
        data.m3NgCount,
        false,
        '⏸ Idle (Setup)',
        data.m3Rpm,
        data.m3Feed,
        data.m3CycleTime,
        data.m3PowerKw,
        data.m3RunTime,
        data.m3IdleTime,
        data.m3Downtime,
        data.m3Diameter
      );
    };

    drawMdmsDashboardCanvas(dashCtx, dashboardData, machineState);
    dashTexture.needsUpdate = true;

    // Animation Loop
    let animId;
    let lastClock = performance.now();
    let cutterAngle = 0;

    const animate = () => {
      animId = requestAnimationFrame(animate);
      const now = performance.now();
      const dt = Math.min((now - lastClock) / 1000, 0.1);
      lastClock = now;

      const sim = simRef.current;
      const state = sim.machineState;

      // Smooth camera interpolation toward presets
      if (sim.camera && sim.controls) {
        camera.position.lerp(sim.targetCamPos, 0.06);
        sim.controls.target.lerp(sim.targetLookAt, 0.06);
        sim.controls.update();
      }

      // Periodically refresh the MDMS dashboard canvas texture
      if (now - sim.lastDashDraw > 250) {
        sim.lastDashDraw = now;
        const curData = sim.dashboardData || dashboardData;
        drawMdmsDashboardCanvas(sim.dashCtx, curData, state);
        sim.dashTexture.needsUpdate = true;
      }

      // ------------------------------------------
      // DYNAMIC MACHINE MOTION: RUN vs STOP / IDLE
      // ------------------------------------------
      // Target door position: Open (+0.75m to the right) when IDLE/STOPPED; Closed (0m) when RUNNING
      const targetDoorX = state === 'running' ? 0 : 0.72;
      sim.doorOffset += (targetDoorX - sim.doorOffset) * 0.08;
      if (sim.slidingDoor) {
        sim.slidingDoor.position.x = sim.doorOffset;
      }

      // Target Spindle Z-Feed: Lowers into cutting position when RUNNING; Retracts upward when STOPPED
      const targetSpindleY = state === 'running' ? 1.48 : 1.72;
      if (sim.spindleGroup) {
        sim.spindleGroup.position.y += (targetSpindleY - sim.spindleGroup.position.y) * 0.06;
      }

      // Machine Running Behavior
      if (state === 'running') {
        // High-speed spindle spin (6,500 RPM)
        cutterAngle += 35.0 * dt;
        if (sim.spindleHead) {
          sim.spindleHead.rotation.y = cutterAngle;
        }

        // Rotate Precision Cylinder Workpiece smoothly on 4th-Axis Chuck
        if (sim.workpiece) {
          sim.workpiece.rotation.x += dt * 1.6;
        }

        // Active Sparks & Chip Particles erupting from Cylinder
        if (sim.chipsParticles) {
          sim.chipsParticles.visible = true;
          const pos = sim.chipsParticles.geometry.attributes.position.array;
          for (let i = 0; i < chipCount; i++) {
            pos[i * 3 + 1] -= dt * 0.45;
            if (pos[i * 3 + 1] < 1.04) {
              pos[i * 3 + 1] = 1.18 + Math.random() * 0.04;
              pos[i * 3] = (Math.random() - 0.5) * 0.22;
              pos[i * 3 + 2] = (Math.random() - 0.5) * 0.12;
            }
          }
          sim.chipsParticles.geometry.attributes.position.needsUpdate = true;
        }

        // Tricolor Tower Light: Green ON
        sim.towerGreenMat.emissive.setHex(0x22c55e);
        sim.towerGreenMat.color.setHex(0x22c55e);
        sim.towerYellowMat.emissive.setHex(0x000000);
        sim.towerRedMat.emissive.setHex(0x000000);

        // Blinking LEDs on RvmAiTech Logger (High-speed telemetry transmission)
        if (sim.ledRx) {
          const rxBlink = Math.sin(now * 0.02) > 0.1;
          sim.ledRx.material.color.setHex(rxBlink ? 0x38bdf8 : 0x0284c7);
        }
        if (sim.ledTx) {
          const txBlink = Math.sin(now * 0.024) > 0.2;
          sim.ledTx.material.color.setHex(txBlink ? 0xf97316 : 0x7c2d12);
        }

        // Animated Electrical Pulses flowing into Logger DI pins
        sim.dataPulses.forEach((p) => {
          p.mesh.visible = true;
          const prog = ((now * 0.001 * p.speed) + p.offset) % 1;
          p.mesh.position.copy(p.curve.getPointAt(prog));
        });
      } else if (state === 'idle') {
        // Machine Stopped / Feed Hold: Spindle stops, chips stop, door glides open!
        if (sim.chipsParticles) sim.chipsParticles.visible = false;

        // Tricolor Tower Light: Yellow ON
        sim.towerGreenMat.emissive.setHex(0x000000);
        sim.towerYellowMat.emissive.setHex(0xfacc15);
        sim.towerYellowMat.color.setHex(0xfacc15);
        sim.towerRedMat.emissive.setHex(0x000000);

        // Slow telemetry pulses
        sim.dataPulses.forEach((p, idx) => {
          if (idx === 0) {
            p.mesh.visible = false;
          } else {
            p.mesh.visible = true;
            const prog = ((now * 0.0003 * p.speed) + p.offset) % 1;
            p.mesh.position.copy(p.curve.getPointAt(prog));
          }
        });

        if (sim.ledRx) sim.ledRx.material.color.setHex(0x0369a1);
        if (sim.ledTx) sim.ledTx.material.color.setHex(0x7c2d12);
      } else {
        // Machine Fault / Alarm / E-Stop
        if (sim.chipsParticles) sim.chipsParticles.visible = false;

        // Tricolor Tower Light: Flashing Red
        const redBlink = Math.sin(now * 0.012) > 0;
        sim.towerGreenMat.emissive.setHex(0x000000);
        sim.towerYellowMat.emissive.setHex(0x000000);
        sim.towerRedMat.emissive.setHex(redBlink ? 0xef4444 : 0x000000);
        sim.towerRedMat.color.setHex(redBlink ? 0xef4444 : 0x450a0a);

        // Alarm wire pulse active
        sim.dataPulses.forEach((p, idx) => {
          if (idx === 3) {
            p.mesh.visible = true;
            const prog = ((now * 0.0015) + p.offset) % 1;
            p.mesh.position.copy(p.curve.getPointAt(prog));
          } else {
            p.mesh.visible = false;
          }
        });

        if (sim.ledRx) sim.ledRx.material.color.setHex(0x0284c7);
        if (sim.ledTx) sim.ledTx.material.color.setHex(0xef4444);
      }

      renderer.render(scene, camera);
    };

    animId = requestAnimationFrame(animate);

    const onResize = () => {
      if (!host) return;
      const nw = host.clientWidth;
      const nh = host.clientHeight;
      camera.aspect = nw / nh;
      camera.updateProjectionMatrix();
      renderer.setSize(nw, nh);
    };
    window.addEventListener('resize', onResize);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', onResize);
      renderer.dispose();
      controls.dispose();
    };
  }, []);

  return (
    <div className="sp3d-wrapper" style={{ position: 'relative', width: '100%', borderRadius: '16px', overflow: 'hidden', background: '#0b1626' }}>
      {/* 3D Canvas Viewport */}
      <div
        ref={mountRef}
        style={{
          width: '100%',
          height: '600px',
          cursor: 'grab',
          position: 'relative',
        }}
      />

      {/* Floating Status HUD Overlay on Top Left */}
      <div style={{
        position: 'absolute',
        top: '16px',
        left: '16px',
        zIndex: 10,
        display: 'flex',
        flexWrap: 'wrap',
        gap: '10px',
        alignItems: 'center',
        background: 'rgba(11, 22, 38, 0.92)',
        backdropFilter: 'blur(10px)',
        border: '1px solid rgba(56, 189, 248, 0.35)',
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
            background: machineState === 'running' ? '#22c55e' : machineState === 'idle' ? '#facc15' : '#ef4444',
            boxShadow: `0 0 10px ${machineState === 'running' ? '#22c55e' : machineState === 'idle' ? '#facc15' : '#ef4444'}`,
          }} />
          <span style={{ fontWeight: 800, fontSize: '0.88rem', letterSpacing: '0.5px' }}>
            CNC LATHE MACHINE: {machineState.toUpperCase()}
          </span>
        </div>

        <div style={{ width: '1px', height: '18px', background: 'rgba(255,255,255,0.2)' }} />

        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.82rem', color: '#94a3b8' }}>
          <Cpu size={14} color="#38bdf8" />
          <span>Logger: <strong style={{ color: '#38bdf8' }}>RvmAiTech MDMS Edge</strong></span>
        </div>

        <div style={{ width: '1px', height: '18px', background: 'rgba(255,255,255,0.2)' }} />

        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.82rem', color: '#94a3b8' }}>
          <Activity size={14} color="#4ade80" />
          <span>Availability: <strong style={{ color: '#4ade80' }}>{dashboardData.groupAvailability}%</strong></span>
        </div>

        <div style={{ width: '1px', height: '18px', background: 'rgba(255,255,255,0.2)' }} />

        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.82rem', color: '#94a3b8' }}>
          <Gauge size={14} color="#facc15" />
          <span>Count: <strong style={{ color: '#fff' }}>{dashboardData.m1ProducedCount} Pcs ({dashboardData.rpm} RPM)</strong></span>
        </div>
      </div>

      {/* Camera Preset Quick View Buttons on Top Right */}
      <div style={{
        position: 'absolute',
        top: '16px',
        right: '16px',
        zIndex: 10,
        display: 'flex',
        gap: '6px',
        background: 'rgba(11, 22, 38, 0.92)',
        backdropFilter: 'blur(10px)',
        border: '1px solid rgba(56, 189, 248, 0.3)',
        padding: '6px',
        borderRadius: '10px',
      }}>
        <button
          onClick={() => setCamView('cell')}
          style={{
            padding: '6px 10px',
            fontSize: '0.75rem',
            fontWeight: 700,
            borderRadius: '6px',
            border: 'none',
            background: activeCamPreset === 'cell' ? '#0284c7' : 'transparent',
            color: '#fff',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '5px',
          }}
          title="Overall Machining Cell View"
        >
          <Eye size={13} /> Cell View
        </button>
        <button
          onClick={() => setCamView('logger')}
          style={{
            padding: '6px 10px',
            fontSize: '0.75rem',
            fontWeight: 700,
            borderRadius: '6px',
            border: 'none',
            background: activeCamPreset === 'logger' ? '#0284c7' : 'transparent',
            color: '#fff',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '5px',
          }}
          title="Inspect RvmAiTech MDMS Data Logger"
        >
          <Cpu size={13} /> RvmAiTech Logger
        </button>
        <button
          onClick={() => setCamView('spindle')}
          style={{
            padding: '6px 10px',
            fontSize: '0.75rem',
            fontWeight: 700,
            borderRadius: '6px',
            border: 'none',
            background: activeCamPreset === 'spindle' ? '#0284c7' : 'transparent',
            color: '#fff',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '5px',
          }}
          title="Zoom inside CNC Machining Envelope"
        >
          <Sliders size={13} /> CNC Spindle
        </button>
        <button
          onClick={() => setCamView('console')}
          style={{
            padding: '6px 10px',
            fontSize: '0.75rem',
            fontWeight: 700,
            borderRadius: '6px',
            border: 'none',
            background: activeCamPreset === 'console' ? '#0284c7' : 'transparent',
            color: '#fff',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '5px',
          }}
          title="View HMI Dashboard on Monitor"
        >
          <Monitor size={13} /> HMI Dashboard
        </button>
      </div>

      {/* Operator Machine Controls & Real MDMS Dashboard Cards */}
      <div style={{
        padding: '24px',
        background: '#07101d',
        borderTop: '1px solid rgba(56, 189, 248, 0.2)',
        color: '#e2e8f0',
      }}>
        {/* Machine Hardware Action Buttons */}
        <div style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '12px',
          marginBottom: '20px',
          padding: '14px 18px',
          borderRadius: '12px',
          background: 'rgba(15, 23, 42, 0.85)',
          border: '1px solid rgba(56, 189, 248, 0.25)',
        }}>
          <div>
            <div style={{ fontWeight: 800, fontSize: '0.95rem', color: '#fff' }}>
              Machine Operational State Control:
            </div>
            <div style={{ fontSize: '0.78rem', color: '#94a3b8' }}>
              Cycle Start closes sliding door &amp; ramps spindle to 6,250 RPM. Feed Hold retracts cutter &amp; slides door open!
            </div>
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              onClick={() => setMachineState('running')}
              style={{
                padding: '10px 18px',
                borderRadius: '8px',
                border: 'none',
                background: machineState === 'running' ? '#15803d' : '#1e293b',
                color: '#fff',
                fontWeight: 800,
                fontSize: '0.85rem',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                boxShadow: machineState === 'running' ? '0 0 16px rgba(34, 197, 94, 0.6)' : 'none',
              }}
            >
              <Play size={16} color="#4ade80" />
              CYCLE START (RUN)
            </button>

            <button
              onClick={() => setMachineState('idle')}
              style={{
                padding: '10px 18px',
                borderRadius: '8px',
                border: 'none',
                background: machineState === 'idle' ? '#a16207' : '#1e293b',
                color: '#fff',
                fontWeight: 800,
                fontSize: '0.85rem',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                boxShadow: machineState === 'idle' ? '0 0 16px rgba(250, 204, 21, 0.6)' : 'none',
              }}
            >
              <Pause size={16} color="#fde047" />
              FEED HOLD (STOP / OPEN DOOR)
            </button>

            <button
              onClick={() => setMachineState('fault')}
              style={{
                padding: '10px 18px',
                borderRadius: '8px',
                border: 'none',
                background: machineState === 'fault' ? '#b91c1c' : '#1e293b',
                color: '#fff',
                fontWeight: 800,
                fontSize: '0.85rem',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                boxShadow: machineState === 'fault' ? '0 0 16px rgba(239, 68, 68, 0.8)' : 'none',
              }}
            >
              <AlertTriangle size={16} color="#f87171" />
              ALARM / E-STOP
            </button>
          </div>
        </div>

        {/* 2-Column Grid: Real CNC Lathe MDMS Shop-Floor Telemetry */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
          gap: '20px',
        }}>
          {/* Column 1: Group 1 Overview & Shop-Floor Summary */}
          <div style={{
            background: 'rgba(15, 36, 62, 0.85)',
            border: '1.5px solid rgba(56, 189, 248, 0.35)',
            borderRadius: '12px',
            padding: '20px',
          }}>
            <div style={{ fontSize: '0.75rem', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.05em' }}>
              GROUP SUMMARY · CNC LATHE SHOP
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginTop: '6px' }}>
              <h3 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 800, color: '#fff' }}>Group 1 · Cylinder Turning Cell</h3>
              <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>3 CNC Lathe Machines · Shift A</span>
            </div>

            {/* Circular Availability & Produced Count */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              margin: '20px 0',
              padding: '16px',
              background: '#0a192f',
              borderRadius: '10px',
              border: '1px solid rgba(255,255,255,0.06)',
            }}>
              <div>
                <div style={{ fontSize: '2.4rem', fontWeight: 800, color: '#38bdf8', lineHeight: 1 }}>
                  {dashboardData.groupAvailability}%
                </div>
                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#94a3b8', marginTop: '4px' }}>
                  AVAILABILITY (OEE: 87.2%)
                </div>
              </div>

              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#fff', lineHeight: 1 }}>
                  {dashboardData.groupProducedCount.toLocaleString()} <span style={{ fontSize: '1rem', color: '#38bdf8' }}>Pcs</span>
                </div>
                <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '4px' }}>
                  TOTAL COUNT · Target: {dashboardData.groupTargetCount} Pcs
                </div>
              </div>
            </div>

            {/* 3 Metric Pills: RUN TIME | IDLE | STOPPED */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px', marginBottom: '16px' }}>
              <div style={{ padding: '8px', borderRadius: '8px', background: '#0a192f', border: '1px solid rgba(255,255,255,0.06)' }}>
                <div style={{ fontSize: '0.68rem', color: '#94a3b8', fontWeight: 700 }}>RUN TIME</div>
                <div style={{ fontSize: '0.95rem', fontWeight: 800, color: '#4ade80' }}>{dashboardData.groupRunTime}</div>
              </div>
              <div style={{ padding: '8px', borderRadius: '8px', background: '#0a192f', border: '1px solid rgba(255,255,255,0.06)' }}>
                <div style={{ fontSize: '0.68rem', color: '#94a3b8', fontWeight: 700 }}>IDLE</div>
                <div style={{ fontSize: '0.95rem', fontWeight: 800, color: '#facc15' }}>{dashboardData.groupIdleTime}</div>
              </div>
              <div style={{ padding: '8px', borderRadius: '8px', background: '#0a192f', border: '1px solid rgba(255,255,255,0.06)' }}>
                <div style={{ fontSize: '0.68rem', color: '#94a3b8', fontWeight: 700 }}>STOPPED</div>
                <div style={{ fontSize: '0.95rem', fontWeight: 800, color: '#94a3b8' }}>{dashboardData.groupStoppedTime}</div>
              </div>
            </div>

            <div style={{ fontSize: '0.8rem', color: '#4ade80', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '16px' }}>
              <CheckCircle2 size={14} color="#4ade80" /> 2 Machines Running | ⏸ 1 Machine Idle (CNC Lathe - 03 Tool Setup)
            </div>

            {/* 7 Days Production Bar Chart */}
            <div style={{ background: '#0a192f', padding: '12px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.06)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', fontWeight: 700, color: '#cbd5e1', marginBottom: '8px' }}>
                <span>LAST 7 DAYS · PRODUCTION (Pcs)</span>
                <span style={{ color: '#38bdf8' }}>14,250 Pcs</span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '6px', alignItems: 'flex-end', height: '60px' }}>
                {[
                  { d: 'Sat', c: 1850, h: '70%' },
                  { d: 'Sun', c: 420, h: '25%' },
                  { d: 'Mon', c: 2100, h: '78%' },
                  { d: 'Tue', c: 2300, h: '85%' },
                  { d: 'Wed', c: 2450, h: '92%' },
                  { d: 'Thu', c: 2600, h: '98%' },
                  { d: 'Fri', c: 2530, h: '90%' },
                ].map((item, idx) => (
                  <div key={idx} style={{ textAlign: 'center' }}>
                    <div style={{ height: item.h, background: '#0d9488', borderRadius: '3px 3px 0 0', width: '100%' }} />
                    <div style={{ fontSize: '0.65rem', color: '#94a3b8', marginTop: '4px' }}>{item.d}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Column 2: 3 Connected CNC Lathe Machines with Count & Live Parameters */}
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
          }}>
            <div style={{ fontSize: '0.85rem', fontWeight: 800, color: '#94a3b8', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
              CONNECTED MACHINES · 3 CNC LATHE TURNING CENTERS
            </div>

            {/* Machine 1: CNC Lathe Machine - 01 (Active in 3D) */}
            <div style={{
              background: 'rgba(15, 36, 62, 0.9)',
              border: '1.5px solid #0284c7',
              borderRadius: '10px',
              padding: '14px',
              boxShadow: '0 4px 16px rgba(2, 132, 199, 0.25)',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h4 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: '#fff' }}>
                    {dashboardData.m1Name} <span style={{ fontSize: '0.72rem', color: '#38bdf8', fontWeight: 600 }}>(Active 3D Machining Scene)</span>
                  </h4>
                  <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{dashboardData.m1Sub} · Spec: {dashboardData.m1Diameter}</div>
                </div>
                <span style={{
                  fontSize: '0.75rem',
                  fontWeight: 800,
                  padding: '3px 8px',
                  borderRadius: '6px',
                  background: machineState === 'running' ? 'rgba(34, 197, 94, 0.2)' : machineState === 'idle' ? 'rgba(250, 204, 21, 0.2)' : 'rgba(239, 68, 68, 0.2)',
                  color: machineState === 'running' ? '#4ade80' : machineState === 'idle' ? '#fde047' : '#f87171',
                  border: `1px solid ${machineState === 'running' ? '#22c55e' : machineState === 'idle' ? '#facc15' : '#ef4444'}`,
                }}>
                  ● {dashboardData.m1Status}
                </span>
              </div>

              {/* Count & Yield */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', margin: '8px 0' }}>
                <div>
                  <span style={{ fontSize: '1.4rem', fontWeight: 800, color: '#38bdf8' }}>{dashboardData.m1ProducedCount}</span>
                  <span style={{ fontSize: '0.85rem', color: '#94a3b8', marginLeft: '4px' }}>Pcs (Count)</span>
                </div>
                <div style={{ fontSize: '0.78rem', color: '#cbd5e1' }}>
                  Quality Yield: <strong style={{ color: '#4ade80' }}>99.4%</strong> ({dashboardData.m1OkCount} OK / {dashboardData.m1NgCount} NG)
                </div>
              </div>

              {/* Parameters Box (PERA MITTER) */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(4, 1fr)',
                gap: '6px',
                background: '#071527',
                padding: '8px',
                borderRadius: '6px',
                border: '1px solid rgba(255,255,255,0.06)',
                textAlign: 'center',
              }}>
                <div>
                  <div style={{ fontSize: '0.62rem', color: '#94a3b8' }}>SPINDLE</div>
                  <div style={{ fontSize: '0.82rem', fontWeight: 800, color: '#38bdf8', fontFamily: 'monospace' }}>{dashboardData.m1Rpm} RPM</div>
                </div>
                <div>
                  <div style={{ fontSize: '0.62rem', color: '#94a3b8' }}>FEED RATE</div>
                  <div style={{ fontSize: '0.82rem', fontWeight: 800, color: '#4ade80', fontFamily: 'monospace' }}>{dashboardData.m1Feed} mm/r</div>
                </div>
                <div>
                  <div style={{ fontSize: '0.62rem', color: '#94a3b8' }}>CYCLE TIME</div>
                  <div style={{ fontSize: '0.82rem', fontWeight: 800, color: '#facc15', fontFamily: 'monospace' }}>{dashboardData.m1CycleTime}</div>
                </div>
                <div>
                  <div style={{ fontSize: '0.62rem', color: '#94a3b8' }}>LOAD / TEMP</div>
                  <div style={{ fontSize: '0.82rem', fontWeight: 800, color: '#e2e8f0', fontFamily: 'monospace' }}>{dashboardData.m1PowerKw} kW ({dashboardData.tempC}°C)</div>
                </div>
              </div>
            </div>

            {/* Machine 2: CNC Lathe Machine - 02 */}
            <div style={{
              background: 'rgba(15, 36, 62, 0.75)',
              border: '1px solid rgba(56, 189, 248, 0.25)',
              borderRadius: '10px',
              padding: '12px',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h4 style={{ margin: 0, fontSize: '0.98rem', fontWeight: 800, color: '#fff' }}>{dashboardData.m2Name}</h4>
                  <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>{dashboardData.m2Sub} · Spec: {dashboardData.m2Diameter}</div>
                </div>
                <span style={{ fontSize: '0.72rem', fontWeight: 800, padding: '2px 8px', borderRadius: '6px', background: 'rgba(34, 197, 94, 0.2)', color: '#4ade80', border: '1px solid #22c55e' }}>
                  ● {dashboardData.m2Status}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', margin: '6px 0' }}>
                <div>
                  <span style={{ fontSize: '1.25rem', fontWeight: 800, color: '#38bdf8' }}>{dashboardData.m2ProducedCount}</span>
                  <span style={{ fontSize: '0.8rem', color: '#94a3b8', marginLeft: '4px' }}>Pcs (Count)</span>
                </div>
                <div style={{ fontSize: '0.75rem', color: '#cbd5e1' }}>
                  Spindle: <strong style={{ color: '#38bdf8' }}>{dashboardData.m2Rpm} RPM</strong> | Feed: <strong style={{ color: '#4ade80' }}>{dashboardData.m2Feed} mm/r</strong> | Cycle: <strong style={{ color: '#facc15' }}>{dashboardData.m2CycleTime}</strong>
                </div>
              </div>
            </div>

            {/* Machine 3: CNC Lathe Machine - 03 */}
            <div style={{
              background: 'rgba(15, 36, 62, 0.75)',
              border: '1px solid rgba(56, 189, 248, 0.25)',
              borderRadius: '10px',
              padding: '12px',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h4 style={{ margin: 0, fontSize: '0.98rem', fontWeight: 800, color: '#fff' }}>{dashboardData.m3Name}</h4>
                  <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>{dashboardData.m3Sub} · Spec: {dashboardData.m3Diameter}</div>
                </div>
                <span style={{ fontSize: '0.72rem', fontWeight: 800, padding: '2px 8px', borderRadius: '6px', background: 'rgba(250, 204, 21, 0.2)', color: '#fde047', border: '1px solid #facc15' }}>
                  ⏸ {dashboardData.m3Status}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', margin: '6px 0' }}>
                <div>
                  <span style={{ fontSize: '1.25rem', fontWeight: 800, color: '#94a3b8' }}>{dashboardData.m3ProducedCount}</span>
                  <span style={{ fontSize: '0.8rem', color: '#94a3b8', marginLeft: '4px' }}>Pcs (Count)</span>
                </div>
                <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                  Spindle: <strong style={{ color: '#94a3b8' }}>0 RPM (Standby)</strong> | Cycle: <strong style={{ color: '#facc15' }}>{dashboardData.m3CycleTime}</strong> | Tool Setup
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* CTA Button */}
        {onBookDemo && (
          <div style={{ marginTop: '20px', textAlign: 'center' }}>
            <button
              onClick={onBookDemo}
              className="btn btn-primary btn-3d-orange"
              style={{ padding: '12px 28px', fontSize: '0.9rem', fontWeight: 800, display: 'inline-flex', alignItems: 'center', gap: '8px' }}
            >
              <span>Schedule Live RvmAiTech MDMS Factory Demo</span>
              <ArrowRight size={16} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
