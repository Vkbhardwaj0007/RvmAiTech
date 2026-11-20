import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import {
  Activity, Cpu, Gauge, Thermometer, Zap, Play, Pause, AlertTriangle, RotateCcw,
  Wifi, Radio, ArrowRight, ShieldCheck, CheckCircle2, Sliders, Eye, Box, Info
} from 'lucide-react';

/**
 * 3D Live MDMS Shop-Floor & Machine Telemetry
 * Featuring the actual Rvmaitech MDMS Edge Data Logger:
 * Hardware Model: Waveshare ESP32-S3-ETH-8DI-8RO-C (8CH Digital Inputs + 8CH Relays + Ethernet + CAN + Wi-Fi)
 * Connected directly to an Industrial 5-Axis CNC Milling Center (VMC).
 *
 * Demonstrates:
 * 1. Physical Signal Acquisition from CNC Machine (Spindle Run, In-Cycle, Part Counter, Error Alarm)
 * 2. High-speed signal processing on ESP32-S3 Edge Gateway
 * 3. Animated data pulses along wiring harness into DI1-DI8 terminals
 * 4. Ethernet / Wi-Fi telemetry transmission to MDMS Cloud Platform
 * 5. Real-time OEE, Spindle RPM, Power Load, Motor Temp, and Parts Counter
 */

export default function MdmsFactory3D({ onBookDemo }) {
  const mountRef = useRef(null);

  // Machine Operational State: 'running' | 'idle' | 'fault'
  const [machineState, setMachineState] = useState('running');
  const [activeCamPreset, setActiveCamPreset] = useState('cell'); // 'cell' | 'logger' | 'spindle' | 'console'

  // Live Machine Telemetry Data
  const [telemetry, setTelemetry] = useState({
    oee: 89.6,
    availability: 95.2,
    performance: 96.1,
    quality: 98.2,
    rpm: 6250,
    power: 12.8,
    temp: 48,
    parts: 342,
    cycleTime: 42,
    feedRate: 1450,
    activeTool: 'T04 (Ø12mm Carbide Endmill)',
    gCode: 'N140 G01 X-120.4 Y45.8 Z-8.5 F1450 S6250',
    loggerStatus: {
      powerOk: true,
      di1_spindle: true,
      di2_inCycle: true,
      di3_partCounter: false,
      di4_alarm: false,
      di5_doorClosed: true,
      ethConnected: true,
      mqttPacketsPerSec: 18,
    },
  });

  // Shared simulation refs
  const simRef = useRef({
    machineState: 'running',
    camera: null,
    controls: null,
    targetCamPos: new THREE.Vector3(0, 3.2, 5.8),
    targetLookAt: new THREE.Vector3(0, 1.4, 0),
    spindleHead: null,
    cutterMesh: null,
    chipsParticles: null,
    coolantMesh: null,
    dataPulses: [],
    ledPwr: null,
    ledRx: null,
    ledTx: null,
    ledDI: [],
    towerGreenMat: null,
    towerYellowMat: null,
    towerRedMat: null,
    cncScreenTexture: null,
    cncScreenCtx: null,
    cncScreenCanvas: null,
    loggerLabelTex: null,
  });

  // Sync machineState to simRef
  useEffect(() => {
    simRef.current.machineState = machineState;
  }, [machineState]);

  // Live telemetry ticker
  useEffect(() => {
    const timer = setInterval(() => {
      setTelemetry((prev) => {
        if (machineState === 'running') {
          const rpmJitter = Math.floor(6200 + Math.random() * 120);
          const powerJitter = parseFloat((12.5 + Math.random() * 0.8).toFixed(1));
          const tempJitter = Math.floor(47 + Math.random() * 3);
          const oeeJitter = parseFloat((89.4 + Math.random() * 0.5).toFixed(1));
          const cycleNext = prev.cycleTime >= 45 ? 1 : prev.cycleTime + 1;
          const partInc = cycleNext === 1 ? 1 : 0;

          return {
            ...prev,
            oee: oeeJitter,
            rpm: rpmJitter,
            power: powerJitter,
            temp: tempJitter,
            cycleTime: cycleNext,
            parts: prev.parts + partInc,
            gCode: `N${Math.floor(120 + Math.random() * 40)} G01 X${(Math.random() * -150).toFixed(1)} Y${(Math.random() * 80).toFixed(1)} Z-8.5 F1450 S${rpmJitter}`,
            loggerStatus: {
              ...prev.loggerStatus,
              di1_spindle: true,
              di2_inCycle: true,
              di3_partCounter: cycleNext === 1,
              di4_alarm: false,
              di5_doorClosed: true,
              mqttPacketsPerSec: Math.floor(16 + Math.random() * 5),
            },
          };
        } else if (machineState === 'idle') {
          return {
            ...prev,
            rpm: 0,
            power: 2.1,
            temp: Math.max(36, prev.temp - 0.2),
            oee: parseFloat(Math.max(68, prev.oee - 0.05).toFixed(1)),
            gCode: 'FEED HOLD / OPERATOR SETUP MODE (M00)',
            loggerStatus: {
              ...prev.loggerStatus,
              di1_spindle: false,
              di2_inCycle: false,
              di3_partCounter: false,
              di4_alarm: false,
              di5_doorClosed: false,
              mqttPacketsPerSec: 4,
            },
          };
        } else {
          // fault
          return {
            ...prev,
            rpm: 0,
            power: 0.6,
            oee: parseFloat(Math.max(55, prev.oee - 0.1).toFixed(1)),
            gCode: 'ALARM 1024: SPINDLE OVERLOAD / E-STOP TRIGGERED',
            loggerStatus: {
              ...prev.loggerStatus,
              di1_spindle: false,
              di2_inCycle: false,
              di3_partCounter: false,
              di4_alarm: true,
              di5_doorClosed: true,
              mqttPacketsPerSec: 2,
            },
          };
        }
      });
    }, 1200);

    return () => clearInterval(timer);
  }, [machineState]);

  // Camera preset handler
  const setCamView = (preset) => {
    setActiveCamPreset(preset);
    const sim = simRef.current;
    if (!sim.camera || !sim.controls) return;

    if (preset === 'cell') {
      sim.targetCamPos.set(0, 3.2, 5.8);
      sim.targetLookAt.set(0, 1.4, 0);
    } else if (preset === 'logger') {
      // Zoom into the Waveshare ESP32-S3 MDMS Logger on the right side
      sim.targetCamPos.set(2.0, 1.9, 1.7);
      sim.targetLookAt.set(1.85, 1.5, 0.4);
    } else if (preset === 'spindle') {
      // Zoom into the CNC cutting chamber
      sim.targetCamPos.set(-0.25, 1.9, 2.2);
      sim.targetLookAt.set(-0.3, 1.55, 0);
    } else if (preset === 'console') {
      // Zoom into the CNC control console
      sim.targetCamPos.set(1.2, 2.1, 2.6);
      sim.targetLookAt.set(0.95, 1.8, 1.0);
    }
  };

  // Main Three.js Scene Setup
  useEffect(() => {
    const host = mountRef.current;
    if (!host) return;

    const w = host.clientWidth || 800;
    const h = host.clientHeight || 560;

    // 1. Scene & Camera
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xdce5ef); // Bright industrial plant ambiance
    scene.fog = new THREE.FogExp2(0xdce5ef, 0.026);

    const camera = new THREE.PerspectiveCamera(40, w / h, 0.1, 60);
    camera.position.set(0, 3.2, 5.8);
    camera.lookAt(0, 1.4, 0);
    simRef.current.camera = camera;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: 'high-performance' });
    renderer.setSize(w, h);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.25;
    host.innerHTML = '';
    host.appendChild(renderer.domElement);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.target.set(0, 1.4, 0);
    controls.maxPolarAngle = Math.PI / 2 - 0.04;
    controls.minDistance = 1.4;
    controls.maxDistance = 11.0;
    simRef.current.controls = controls;

    // 2. High-Bay Factory Lighting
    const hemiLight = new THREE.HemisphereLight(0xffffff, 0x94a3b8, 1.35);
    scene.add(hemiLight);

    const sun = new THREE.DirectionalLight(0xfffbeb, 1.8);
    sun.position.set(5.5, 10, 5.5);
    sun.castShadow = true;
    sun.shadow.mapSize.width = 2048;
    sun.shadow.mapSize.height = 2048;
    sun.shadow.bias = -0.0004;
    scene.add(sun);

    const fill = new THREE.DirectionalLight(0xcfd8dc, 0.9);
    fill.position.set(-6, 8, -4);
    scene.add(fill);

    const spotCnc = new THREE.PointLight(0xffffff, 1.4, 6);
    spotCnc.position.set(-0.3, 2.4, 0.6);
    scene.add(spotCnc);

    // 3. Polished Factory Epoxy Floor with OSHA Safety Markings
    const floorGeo = new THREE.PlaneGeometry(28, 20);
    const floorMat = new THREE.MeshStandardMaterial({ color: 0xc8d3de, roughness: 0.35, metalness: 0.15 });
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    scene.add(floor);

    const floorGrid = new THREE.GridHelper(26, 14, 0x94a3b8, 0xb0bec5);
    floorGrid.position.y = 0.002;
    scene.add(floorGrid);

    // Yellow 5S perimeter zone around the CNC work cell
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
    // 4. INDUSTRIAL 5-AXIS CNC MILLING CENTER (Matching Photo 2)
    // ----------------------------------------------------
    const cncGroup = new THREE.Group();
    cncGroup.position.set(-0.4, 0, 0);
    scene.add(cncGroup);

    // Materials
    const matDarkBase = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.4, metalness: 0.7 });
    const matLightEnclosure = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, roughness: 0.35, metalness: 0.3 });
    const matAccentDark = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.45, metalness: 0.6 });
    const matChrome = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.1, metalness: 0.98 });
    const matGlass = new THREE.MeshPhysicalMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.32,
      roughness: 0.08,
      metalness: 0.1,
      transmission: 0.85,
    });

    // Heavy Cast Base
    const baseCasting = new THREE.Mesh(new THREE.BoxGeometry(2.8, 0.55, 2.4), matDarkBase);
    baseCasting.position.y = 0.275;
    baseCasting.castShadow = true;
    baseCasting.receiveShadow = true;
    cncGroup.add(baseCasting);

    // Main Machine Enclosure (Light Grey Cabin)
    const cabin = new THREE.Mesh(new THREE.BoxGeometry(2.7, 2.1, 2.3), matLightEnclosure);
    cabin.position.y = 1.6;
    cabin.castShadow = true;
    cncGroup.add(cabin);

    // Front Machine Door Frame (Dark Charcoal Accent)
    const doorFrame = new THREE.Mesh(new THREE.BoxGeometry(1.6, 1.8, 0.08), matAccentDark);
    doorFrame.position.set(0, 1.6, 1.16);
    cncGroup.add(doorFrame);

    // Polycarbonate Safety Inspection Window
    const glassWindow = new THREE.Mesh(new THREE.BoxGeometry(1.35, 1.5, 0.02), matGlass);
    glassWindow.position.set(0, 1.6, 1.17);
    cncGroup.add(glassWindow);

    // Stainless Door Handle Bar
    const doorHandle = new THREE.Mesh(new THREE.CylinderGeometry(0.016, 0.016, 0.9, 12), matChrome);
    doorHandle.position.set(0.68, 1.6, 1.22);
    cncGroup.add(doorHandle);

    // ----------------------------------------------------
    // CNC MACHINING CHAMBER INTERIOR (Visible through window)
    // ----------------------------------------------------
    // Slotted T-Slot Worktable (XYZ axis table)
    const tableBed = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.14, 0.95), matDarkBase);
    tableBed.position.set(0, 0.78, 0.1);
    cncGroup.add(tableBed);

    // Heavy Machine Vise
    const vise = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.12, 0.4), matAccentDark);
    vise.position.set(0, 0.91, 0.1);
    cncGroup.add(vise);

    // Raw Aluminum Billet Workpiece being machined
    const workpiece = new THREE.Mesh(
      new THREE.BoxGeometry(0.24, 0.16, 0.24),
      new THREE.MeshStandardMaterial({ color: 0x94a3b8, roughness: 0.25, metalness: 0.9 })
    );
    workpiece.position.set(0, 1.05, 0.1);
    workpiece.castShadow = true;
    cncGroup.add(workpiece);

    // Vertical Spindle Ram / Z-Axis Carriage
    const spindleRam = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.8, 0.42), matLightEnclosure);
    spindleRam.position.set(0, 2.05, 0.1);
    cncGroup.add(spindleRam);

    // Spindle Cartridge Body
    const spindleBody = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.14, 0.4, 20), matDarkBase);
    spindleBody.position.set(0, 1.55, 0.1);
    cncGroup.add(spindleBody);

    // Rotating Spindle Tool Holder (BT40 Chuck) & Carbide Endmill
    const spindleHead = new THREE.Group();
    spindleHead.position.set(0, 1.35, 0.1);
    cncGroup.add(spindleHead);
    simRef.current.spindleHead = spindleHead;

    const toolHolder = new THREE.Mesh(new THREE.CylinderGeometry(0.065, 0.045, 0.12, 16), matChrome);
    spindleHead.add(toolHolder);

    const endmillCutter = new THREE.Mesh(
      new THREE.CylinderGeometry(0.018, 0.018, 0.14, 12),
      new THREE.MeshStandardMaterial({ color: 0x64748b, roughness: 0.15, metalness: 0.95 })
    );
    endmillCutter.position.y = -0.11;
    spindleHead.add(endmillCutter);
    simRef.current.cutterMesh = endmillCutter;

    // Dual Flexible Coolant Nozzles (Blue/Orange Loc-Line)
    const hoseMatBlue = new THREE.MeshStandardMaterial({ color: 0x0284c7, roughness: 0.5 });
    const hoseMatOrange = new THREE.MeshStandardMaterial({ color: 0xf97316, roughness: 0.5 });

    const coolantL = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.28, 8), hoseMatBlue);
    coolantL.rotation.z = Math.PI / 4;
    coolantL.position.set(-0.16, 1.35, 0.15);
    cncGroup.add(coolantL);

    const coolantR = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.28, 8), hoseMatOrange);
    coolantR.rotation.z = -Math.PI / 4;
    coolantR.position.set(0.16, 1.35, 0.15);
    cncGroup.add(coolantR);

    // Animated Chip/Sparks Particle System
    const chipCount = 35;
    const chipGeo = new THREE.BufferGeometry();
    const chipPositions = new Float32Array(chipCount * 3);
    for (let c = 0; c < chipCount; c++) {
      chipPositions[c * 3] = (Math.random() - 0.5) * 0.18;
      chipPositions[c * 3 + 1] = 1.1 + Math.random() * 0.15;
      chipPositions[c * 3 + 2] = 0.1 + (Math.random() - 0.5) * 0.18;
    }
    chipGeo.setAttribute('position', new THREE.BufferAttribute(chipPositions, 3));
    const chipMat = new THREE.PointsMaterial({ color: 0xfacc15, size: 0.024, transparent: true, opacity: 0.85 });
    const chipParticles = new THREE.Points(chipGeo, chipMat);
    cncGroup.add(chipParticles);
    simRef.current.chipsParticles = chipParticles;

    // ----------------------------------------------------
    // CNC OPERATOR CONSOLE ON SWIVEL ARM (Matching Photo 2)
    // ----------------------------------------------------
    const consoleArm = new THREE.Group();
    consoleArm.position.set(1.45, 1.6, 0.85);
    cncGroup.add(consoleArm);

    // Articulated Steel Arm Tube
    const armTube = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.65, 12), matDarkBase);
    armTube.rotation.z = Math.PI / 3;
    consoleArm.add(armTube);

    // Console Enclosure Housing
    const consoleBox = new THREE.Mesh(new THREE.BoxGeometry(0.58, 0.68, 0.16), matAccentDark);
    consoleBox.position.set(0.55, 0.15, 0.18);
    consoleBox.rotation.y = -0.38;
    consoleArm.add(consoleBox);

    // Dynamic 2D Canvas Screen for CNC Controller (Fanuc/Siemens 840D style)
    const cncCanvas = document.createElement('canvas');
    cncCanvas.width = 512;
    cncCanvas.height = 360;
    const cncCtx = cncCanvas.getContext('2d');
    const cncTexture = new THREE.CanvasTexture(cncCanvas);
    cncTexture.minFilter = THREE.LinearFilter;
    simRef.current.cncScreenTexture = cncTexture;
    simRef.current.cncScreenCtx = cncCtx;
    simRef.current.cncScreenCanvas = cncCanvas;

    const cncScreen = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.36, 0.01), new THREE.MeshBasicMaterial({ map: cncTexture }));
    cncScreen.position.set(0.55, 0.24, 0.265);
    cncScreen.rotation.y = -0.38;
    consoleArm.add(cncScreen);

    // Physical CNC Control Keypad & Buttons below screen
    const keypad = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.18, 0.02), matDarkBase);
    keypad.position.set(0.55, -0.07, 0.265);
    keypad.rotation.y = -0.38;
    consoleArm.add(keypad);

    // Red Emergency Stop Mushroom button on CNC Console
    const estopBtn = new THREE.Mesh(
      new THREE.CylinderGeometry(0.026, 0.026, 0.03, 14),
      new THREE.MeshStandardMaterial({ color: 0xdc2626, roughness: 0.3 })
    );
    estopBtn.rotation.x = Math.PI / 2;
    estopBtn.position.set(0.72, -0.07, 0.285);
    consoleArm.add(estopBtn);

    // ----------------------------------------------------
    // TRICOLOR SIGNAL TOWER LIGHT (High atop CNC machine)
    // ----------------------------------------------------
    const towerPole = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, 0.45, 12), matChrome);
    towerPole.position.set(-0.85, 2.85, 0);
    cncGroup.add(towerPole);

    const tLensGeo = new THREE.CylinderGeometry(0.045, 0.045, 0.08, 16);
    const towerRedMat = new THREE.MeshStandardMaterial({ color: 0x450a0a, emissive: 0x000000 });
    const towerYellowMat = new THREE.MeshStandardMaterial({ color: 0x451a03, emissive: 0x000000 });
    const towerGreenMat = new THREE.MeshStandardMaterial({ color: 0x22c55e, emissive: 0x22c55e, emissiveIntensity: 0.95 });

    const tRed = new THREE.Mesh(tLensGeo, towerRedMat);
    tRed.position.set(-0.85, 3.25, 0);
    cncGroup.add(tRed);

    const tYellow = new THREE.Mesh(tLensGeo, towerYellowMat);
    tYellow.position.set(-0.85, 3.16, 0);
    cncGroup.add(tYellow);

    const tGreen = new THREE.Mesh(tLensGeo, towerGreenMat);
    tGreen.position.set(-0.85, 3.07, 0);
    cncGroup.add(tGreen);

    simRef.current.towerRedMat = towerRedMat;
    simRef.current.towerYellowMat = towerYellowMat;
    simRef.current.towerGreenMat = towerGreenMat;

    // ----------------------------------------------------
    // 5. THE REAL RVMAITECH MDMS DATA LOGGER HARDWARE
    // Waveshare ESP32-S3-ETH-8DI-8RO-C (Directly matching Photo 1!)
    // Mounted on an industrial stand on the right side of the machine
    // ----------------------------------------------------
    const loggerStation = new THREE.Group();
    loggerStation.position.set(1.85, 0, 0.4);
    scene.add(loggerStation);

    // Industrial Pedestal & DIN Rail Mounting Backplate
    const standPost = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.05, 1.4, 16), matDarkBase);
    standPost.position.y = 0.7;
    standPost.castShadow = true;
    loggerStation.add(standPost);

    const standBase = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.32, 0.04, 20), matDarkBase);
    standBase.position.y = 0.02;
    loggerStation.add(standBase);

    // DIN Rail Backplate (Galvanized Steel)
    const dinBackplate = new THREE.Mesh(
      new THREE.BoxGeometry(0.72, 0.85, 0.02),
      new THREE.MeshStandardMaterial({ color: 0xe2e8f0, metalness: 0.85, roughness: 0.25 })
    );
    dinBackplate.position.set(0, 1.5, 0);
    loggerStation.add(dinBackplate);

    // Steel DIN Rail (Top-Hat 35mm DIN Rail)
    const dinRail = new THREE.Mesh(
      new THREE.BoxGeometry(0.64, 0.035, 0.015),
      new THREE.MeshStandardMaterial({ color: 0xcfd8dc, metalness: 0.95, roughness: 0.15 })
    );
    dinRail.position.set(0, 1.5, 0.018);
    loggerStation.add(dinRail);

    // ==========================================
    // EXACT ESP32-S3-ETH-8DI-8RO-C CONTROLLER ENCLOSURE
    // Dimensions: ~145mm high x ~90mm wide x ~40mm deep (scaled 3D: 0.38 x 0.54 x 0.08)
    // ==========================================
    const loggerGroup = new THREE.Group();
    loggerGroup.position.set(0, 1.5, 0.058);
    loggerStation.add(loggerGroup);

    // Black Industrial Plastic Enclosure (Matching Photo 1)
    const loggerBodyMat = new THREE.MeshStandardMaterial({
      color: 0x181e28, // Jet black textured industrial housing
      roughness: 0.45,
      metalness: 0.2,
    });
    const loggerBody = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.52, 0.065), loggerBodyMat);
    loggerGroup.add(loggerBody);

    // Side DIN Rail Mounting Ears & Tabs (Top & Bottom)
    [-0.27, 0.27].forEach((ey) => {
      const ear = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.03, 0.04), loggerBodyMat);
      ear.position.set(0, ey, -0.01);
      loggerGroup.add(ear);
    });

    // ------------------------------------------
    // SILKSCREEN LABEL TEXTURE (MATCHING PHOTO 1)
    // ------------------------------------------
    const labelCanvas = document.createElement('canvas');
    labelCanvas.width = 512;
    labelCanvas.height = 768;
    const lCtx = labelCanvas.getContext('2d');

    // Black background
    lCtx.fillStyle = '#0f172a';
    lCtx.fillRect(0, 0, 512, 768);

    // Blue header accent badge on top right
    lCtx.fillStyle = '#0284c7';
    lCtx.fillRect(340, 20, 150, 70);
    lCtx.fillStyle = '#ffffff';
    lCtx.font = 'bold 22px sans-serif';
    lCtx.fillText('7~36V', 355, 52);
    lCtx.font = 'bold 18px monospace';
    lCtx.fillText('+   -', 365, 78);

    // Waveshare Logo & Model Name (Exactly as in Photo 1!)
    lCtx.fillStyle = '#ffffff';
    lCtx.font = 'bold 36px sans-serif';
    lCtx.fillText('WAVESHARE', 40, 68);
    lCtx.fillStyle = '#38bdf8';
    lCtx.font = 'bold 18px sans-serif';
    lCtx.fillText('share awesome hardware', 40, 95);

    // Model Number Silkscreen
    lCtx.fillStyle = '#ffffff';
    lCtx.font = 'bold 26px monospace';
    lCtx.fillText('ESP32-S3-ETH-8DI-8RO-C', 40, 145);
    lCtx.fillStyle = '#94a3b8';
    lCtx.font = '19px sans-serif';
    lCtx.fillText('8CH Relay Outputs and 8CH Digital Inputs', 40, 178);

    // White Divider Line
    lCtx.strokeStyle = '#334155';
    lCtx.lineWidth = 3;
    lCtx.beginPath();
    lCtx.moveTo(30, 200); lCtx.lineTo(482, 200);
    lCtx.stroke();

    // Left Side: 8CH Relay Outputs labels (CH1 - CH8)
    lCtx.fillStyle = '#38bdf8';
    lCtx.font = 'bold 20px monospace';
    for (let c = 1; c <= 8; c++) {
      const cy = 240 + (c - 1) * 60;
      lCtx.fillText(`CH${c}`, 40, cy);
      // Circuit switch diagram icon
      lCtx.strokeStyle = '#64748b';
      lCtx.lineWidth = 2;
      lCtx.strokeRect(95, cy - 18, 30, 22);
    }

    // Right Side: DI1 - DI8 Digital Inputs & Ports (Matching Photo 1)
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

    // Port Badges: USB, ETH, ANT
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
    simRef.current.loggerLabelTex = labelTex;

    const labelFace = new THREE.Mesh(
      new THREE.PlaneGeometry(0.31, 0.48),
      new THREE.MeshBasicMaterial({ map: labelTex })
    );
    labelFace.position.set(0, 0, 0.033);
    loggerGroup.add(labelFace);

    // ------------------------------------------
    // GREEN SCREW TERMINAL BLOCKS (Pluggable Phoenix Contact style)
    // ------------------------------------------
    const greenTerminalMat = new THREE.MeshStandardMaterial({
      color: 0x15803d, // High-visibility industrial terminal green
      roughness: 0.35,
      metalness: 0.2,
    });
    const terminalScrewMat = new THREE.MeshStandardMaterial({ color: 0xd1d5db, metalness: 0.9, roughness: 0.1 });

    // Left Side Terminal Blocks (Relays CH1-CH8)
    for (let r = 0; r < 8; r++) {
      const ry = 0.18 - r * 0.052;
      const tBlock = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.038, 0.04), greenTerminalMat);
      tBlock.position.set(-0.18, ry, 0.01);
      loggerGroup.add(tBlock);

      const screw = new THREE.Mesh(new THREE.CylinderGeometry(0.005, 0.005, 0.01, 8), terminalScrewMat);
      screw.position.set(-0.18, ry, 0.032);
      loggerGroup.add(screw);
    }

    // Right Side Terminal Blocks (Power, CAN, Digital Inputs DI1-DI8)
    for (let d = 0; d < 10; d++) {
      const dy = 0.21 - d * 0.044;
      const tBlock = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.032, 0.04), greenTerminalMat);
      tBlock.position.set(0.18, dy, 0.01);
      loggerGroup.add(tBlock);

      const screw = new THREE.Mesh(new THREE.CylinderGeometry(0.004, 0.004, 0.01, 8), terminalScrewMat);
      screw.position.set(0.18, dy, 0.032);
      loggerGroup.add(screw);
    }

    // Ethernet RJ45 Jack (Bottom Right)
    const ethJack = new THREE.Mesh(
      new THREE.BoxGeometry(0.065, 0.055, 0.045),
      new THREE.MeshStandardMaterial({ color: 0x64748b, metalness: 0.95, roughness: 0.15 })
    );
    ethJack.position.set(0.14, -0.22, 0.03);
    loggerGroup.add(ethJack);

    // Blue Ethernet Cable plugged into RJ45 Jack running down
    const ethCable = new THREE.Mesh(
      new THREE.CylinderGeometry(0.008, 0.008, 1.2, 10),
      new THREE.MeshStandardMaterial({ color: 0x0284c7, roughness: 0.4 })
    );
    ethCable.position.set(0.14, -0.75, 0.03);
    loggerGroup.add(ethCable);

    // Gold SMA Wi-Fi Antenna Connector & Black Antenna Stub (Matching Photo 1!)
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

    // ------------------------------------------
    // STATUS LEDS ON ESP32-S3 (PWR, RX, TX, DI)
    // ------------------------------------------
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
    // 6. PHYSICAL INTERCONNECTION WIRING & DATA FLOW
    // Physical signal wires running from CNC Machine -> MDMS Logger DI Pins!
    // ----------------------------------------------------
    const wireHarnessGroup = new THREE.Group();
    scene.add(wireHarnessGroup);

    // Color-coded industrial signal wires connecting CNC to Logger
    const makeWire = (start, mid, end, colorHex) => {
      const curve = new THREE.CatmullRomCurve3([start, mid, end]);
      const geo = new THREE.TubeGeometry(curve, 32, 0.006, 8, false);
      const mat = new THREE.MeshStandardMaterial({ color: colorHex, roughness: 0.4 });
      const wire = new THREE.Mesh(geo, mat);
      wireHarnessGroup.add(wire);
      return curve;
    };

    // Wire 1: Yellow Wire -> DI1 (Spindle Run Sensor)
    const curve1 = makeWire(
      new THREE.Vector3(-0.4, 1.55, 0.1),
      new THREE.Vector3(0.6, 1.2, 0.3),
      new THREE.Vector3(1.85 + 0.18, 1.5 + 0.166, 0.4 + 0.068),
      0xfacc15
    );

    // Wire 2: Green Wire -> DI2 (In-Cycle M-Code)
    const curve2 = makeWire(
      new THREE.Vector3(-0.4, 1.1, 0.1),
      new THREE.Vector3(0.6, 1.1, 0.3),
      new THREE.Vector3(1.85 + 0.18, 1.5 + 0.122, 0.4 + 0.068),
      0x22c55e
    );

    // Wire 3: Orange Wire -> DI3 (Part Counter Switch)
    const curve3 = makeWire(
      new THREE.Vector3(-0.4, 0.8, 0.1),
      new THREE.Vector3(0.6, 1.0, 0.3),
      new THREE.Vector3(1.85 + 0.18, 1.5 + 0.078, 0.4 + 0.068),
      0xf97316
    );

    // Wire 4: Red Wire -> DI4 (Machine Alarm Interlock)
    const curve4 = makeWire(
      new THREE.Vector3(-0.4, 2.8, 0),
      new THREE.Vector3(0.6, 1.8, 0.3),
      new THREE.Vector3(1.85 + 0.18, 1.5 + 0.034, 0.4 + 0.068),
      0xef4444
    );

    // Animated Glowing Signal Pulses (Electrons) travelling through the wires
    const pulseMatCyan = new THREE.MeshBasicMaterial({ color: 0x38bdf8 });
    const pulseMatGreen = new THREE.MeshBasicMaterial({ color: 0x4ade80 });
    const pulseMatOrange = new THREE.MeshBasicMaterial({ color: 0xfbbf24 });
    const pulseMatRed = new THREE.MeshBasicMaterial({ color: 0xf87171 });

    const createPulseMesh = (mat) => {
      const p = new THREE.Mesh(new THREE.SphereGeometry(0.016, 8, 8), mat);
      scene.add(p);
      return p;
    };

    const pulse1 = createPulseMesh(pulseMatCyan);
    const pulse2 = createPulseMesh(pulseMatGreen);
    const pulse3 = createPulseMesh(pulseMatOrange);
    const pulse4 = createPulseMesh(pulseMatRed);

    simRef.current.dataPulses = [
      { mesh: pulse1, curve: curve1, speed: 0.7, offset: 0 },
      { mesh: pulse2, curve: curve2, speed: 0.6, offset: 0.35 },
      { mesh: pulse3, curve: curve3, speed: 0.8, offset: 0.7 },
      { mesh: pulse4, curve: curve4, speed: 0.9, offset: 0.2 },
    ];

    // Helper: Draw Fanuc/Siemens CNC Screen
    const drawCncScreen = (ctx, st, rpm, feed, pwr) => {
      ctx.fillStyle = '#061325';
      ctx.fillRect(0, 0, 512, 360);

      // Top Header
      ctx.fillStyle = '#0284c7';
      ctx.fillRect(0, 0, 512, 40);
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 18px monospace';
      ctx.fillText('RVMAITECH CNC CONTROLLER — 5-AXIS VMC', 16, 26);

      // Status pill
      ctx.fillStyle = st === 'running' ? '#22c55e' : st === 'idle' ? '#facc15' : '#ef4444';
      ctx.font = 'bold 16px sans-serif';
      ctx.fillText(`[${st.toUpperCase()}]`, 410, 26);

      // Axis Coordinates Display
      ctx.fillStyle = '#0f294d';
      ctx.fillRect(20, 55, 472, 120);
      ctx.strokeStyle = '#0284c7';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(20, 55, 472, 120);

      ctx.fillStyle = '#38bdf8';
      ctx.font = 'bold 22px monospace';
      ctx.fillText('ACTUAL POSITION (MACHINE WORK)', 35, 85);

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 24px monospace';
      ctx.fillText(`X: -120.450 mm    Y: +45.820 mm`, 35, 125);
      ctx.fillText(`Z:   -8.500 mm    B:  +0.000 °`, 35, 158);

      // Spindle & Feed Telemetry
      ctx.fillStyle = '#0b1d38';
      ctx.fillRect(20, 190, 472, 150);
      ctx.strokeRect(20, 190, 472, 150);

      ctx.fillStyle = '#facc15';
      ctx.font = 'bold 20px monospace';
      ctx.fillText(`SPINDLE: ${rpm} RPM   LOAD: ${pwr} kW`, 35, 225);
      ctx.fillText(`FEED:    ${feed} mm/min  TOOL: T04 (Endmill)`, 35, 260);

      ctx.fillStyle = st === 'running' ? '#4ade80' : '#f87171';
      ctx.font = 'bold 16px monospace';
      ctx.fillText(st === 'running' ? '>> MDMS EDGE SAMPLING ACTIVE (1000Hz)' : '>> FEED HOLD / SETUP IN PROGRESS', 35, 305);
    };

    drawCncScreen(cncCtx, machineState, 6250, 1450, 12.8);
    cncTexture.needsUpdate = true;

    // Animation Loop
    let animId;
    let lastClock = performance.now();
    let chipTime = 0;
    let lastCncDraw = 0;

    const animate = () => {
      animId = requestAnimationFrame(animate);
      const now = performance.now();
      const dt = Math.min((now - lastClock) / 1000, 0.1);
      lastClock = now;

      const sim = simRef.current;
      const state = sim.machineState;

      // Smooth camera transition toward presets
      if (sim.camera && sim.controls) {
        camera.position.lerp(sim.targetCamPos, 0.06);
        sim.controls.target.lerp(sim.targetLookAt, 0.06);
        sim.controls.update();
      }

      // Periodically update CNC screen canvas texture
      if (now - lastCncDraw > 200) {
        lastCncDraw = now;
        drawCncScreen(sim.cncScreenCtx, state, state === 'running' ? 6250 : 0, state === 'running' ? 1450 : 0, state === 'running' ? 12.8 : 1.2);
        sim.cncScreenTexture.needsUpdate = true;
      }

      // 1. Spindle Rotation & Machining Chips
      if (state === 'running') {
        if (sim.spindleHead) {
          sim.spindleHead.rotation.y += 28.0 * dt; // Rapid spindle spin
        }
        if (sim.chipsParticles) {
          sim.chipsParticles.visible = true;
          chipTime += dt * 8;
          const pos = sim.chipsParticles.geometry.attributes.position.array;
          for (let i = 0; i < chipCount; i++) {
            pos[i * 3 + 1] -= dt * 0.4;
            if (pos[i * 3 + 1] < 1.05) {
              pos[i * 3 + 1] = 1.22 + Math.random() * 0.05;
              pos[i * 3] = (Math.random() - 0.5) * 0.18;
              pos[i * 3 + 2] = 0.1 + (Math.random() - 0.5) * 0.18;
            }
          }
          sim.chipsParticles.geometry.attributes.position.needsUpdate = true;
        }

        // Tricolor Tower Light: Green ON
        sim.towerGreenMat.emissive.setHex(0x22c55e);
        sim.towerGreenMat.color.setHex(0x22c55e);
        sim.towerYellowMat.emissive.setHex(0x000000);
        sim.towerRedMat.emissive.setHex(0x000000);

        // Blinking Communication LEDs on Waveshare Logger
        if (sim.ledRx) {
          const rxBlink = Math.sin(now * 0.02) > 0.2;
          sim.ledRx.material.color.setHex(rxBlink ? 0x38bdf8 : 0x0284c7);
        }
        if (sim.ledTx) {
          const txBlink = Math.sin(now * 0.025) > 0.3;
          sim.ledTx.material.color.setHex(txBlink ? 0xf97316 : 0x7c2d12);
        }

        // Animate glowing signal pulses flowing through wires into logger
        sim.dataPulses.forEach((p) => {
          p.mesh.visible = true;
          const prog = ((now * 0.001 * p.speed) + p.offset) % 1;
          const pt = p.curve.getPointAt(prog);
          p.mesh.position.copy(pt);
        });
      } else if (state === 'idle') {
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
        // FAULT / ALARM
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
            // Alarm wire
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
          height: '580px',
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
        background: 'rgba(11, 22, 38, 0.9)',
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
            5-AXIS CNC: {machineState.toUpperCase()}
          </span>
        </div>

        <div style={{ width: '1px', height: '18px', background: 'rgba(255,255,255,0.2)' }} />

        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.82rem', color: '#94a3b8' }}>
          <Cpu size={14} color="#38bdf8" />
          <span>Logger: <strong style={{ color: '#38bdf8' }}>ESP32-S3-ETH (Active)</strong></span>
        </div>

        <div style={{ width: '1px', height: '18px', background: 'rgba(255,255,255,0.2)' }} />

        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.82rem', color: '#94a3b8' }}>
          <Activity size={14} color="#4ade80" />
          <span>OEE: <strong style={{ color: '#4ade80' }}>{telemetry.oee}%</strong></span>
        </div>

        <div style={{ width: '1px', height: '18px', background: 'rgba(255,255,255,0.2)' }} />

        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.82rem', color: '#94a3b8' }}>
          <Gauge size={14} color="#facc15" />
          <span>Spindle: <strong style={{ color: '#fff' }}>{telemetry.rpm} RPM</strong></span>
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
        background: 'rgba(11, 22, 38, 0.9)',
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
          title="Inspect Waveshare ESP32-S3 Data Logger"
        >
          <Cpu size={13} /> MDMS Logger
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
          title="View CNC Control Screen"
        >
          <Gauge size={13} /> CNC Console
        </button>
      </div>

      {/* Operator Control Deck & Telemetry Cards */}
      <div style={{
        padding: '24px',
        background: '#07101d',
        borderTop: '1px solid rgba(56, 189, 248, 0.2)',
        color: '#e2e8f0',
      }}>
        {/* 3 Main Informational Grid Cards */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: '20px',
        }}>
          {/* Card 1: Machine Controls & Simulation */}
          <div style={{
            background: 'rgba(15, 23, 42, 0.85)',
            border: '1px solid rgba(56, 189, 248, 0.25)',
            borderRadius: '12px',
            padding: '18px',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Sliders size={18} color="#38bdf8" />
                <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700, color: '#f8fafc' }}>
                  CNC Machine State Controls
                </h4>
              </div>
              <span style={{ fontSize: '0.72rem', color: '#94a3b8' }}>Real-time Signal Generator</span>
            </div>

            {/* 3 State Toggle Buttons */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px', marginBottom: '16px' }}>
              <button
                onClick={() => setMachineState('running')}
                style={{
                  padding: '10px 8px',
                  borderRadius: '8px',
                  border: 'none',
                  background: machineState === 'running' ? '#15803d' : '#1e293b',
                  color: '#fff',
                  fontWeight: 700,
                  fontSize: '0.8rem',
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '4px',
                  boxShadow: machineState === 'running' ? '0 0 14px rgba(34, 197, 94, 0.6)' : 'none',
                }}
              >
                <Play size={16} color="#4ade80" />
                CYCLE START
              </button>

              <button
                onClick={() => setMachineState('idle')}
                style={{
                  padding: '10px 8px',
                  borderRadius: '8px',
                  border: 'none',
                  background: machineState === 'idle' ? '#a16207' : '#1e293b',
                  color: '#fff',
                  fontWeight: 700,
                  fontSize: '0.8rem',
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '4px',
                  boxShadow: machineState === 'idle' ? '0 0 14px rgba(250, 204, 21, 0.6)' : 'none',
                }}
              >
                <Pause size={16} color="#fde047" />
                FEED HOLD
              </button>

              <button
                onClick={() => setMachineState('fault')}
                style={{
                  padding: '10px 8px',
                  borderRadius: '8px',
                  border: 'none',
                  background: machineState === 'fault' ? '#b91c1c' : '#1e293b',
                  color: '#fff',
                  fontWeight: 700,
                  fontSize: '0.8rem',
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '4px',
                  boxShadow: machineState === 'fault' ? '0 0 16px rgba(239, 68, 68, 0.8)' : 'none',
                }}
              >
                <AlertTriangle size={16} color="#f87171" />
                ALARM / E-STOP
              </button>
            </div>

            {/* CNC G-Code / Active Block Readout */}
            <div style={{
              background: '#050c18',
              borderRadius: '8px',
              padding: '10px 12px',
              fontFamily: 'monospace',
              fontSize: '0.78rem',
              border: '1px solid rgba(255,255,255,0.08)',
            }}>
              <div style={{ color: '#94a3b8', fontSize: '0.7rem', marginBottom: '2px' }}>ACTIVE CNC G-CODE BLOCK:</div>
              <div style={{ color: machineState === 'running' ? '#4ade80' : machineState === 'idle' ? '#facc15' : '#f87171', fontWeight: 700 }}>
                {telemetry.gCode}
              </div>
              <div style={{ color: '#cbd5e1', marginTop: '4px', fontSize: '0.72rem' }}>
                Tool: {telemetry.activeTool}
              </div>
            </div>
          </div>

          {/* Card 2: Waveshare ESP32-S3 Edge Logger Status */}
          <div style={{
            background: 'rgba(15, 23, 42, 0.85)',
            border: '1px solid rgba(56, 189, 248, 0.25)',
            borderRadius: '12px',
            padding: '18px',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Cpu size={18} color="#38bdf8" />
                <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700, color: '#f8fafc' }}>
                  Waveshare ESP32-S3 Edge Gateway
                </h4>
              </div>
              <span style={{
                fontSize: '0.7rem',
                fontWeight: 700,
                padding: '2px 8px',
                borderRadius: '6px',
                background: 'rgba(56, 189, 248, 0.15)',
                color: '#38bdf8',
                border: '1px solid rgba(56, 189, 248, 0.3)',
              }}>
                MQTT 1000Hz
              </span>
            </div>

            {/* 8 Digital Input Pin Indicators */}
            <div style={{ fontSize: '0.74rem', color: '#94a3b8', fontWeight: 600, marginBottom: '6px' }}>
              PHYSICAL HARDWARE DIGITAL INPUTS (DI1 - DI8):
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '6px', marginBottom: '12px' }}>
              <div style={{
                padding: '6px',
                borderRadius: '6px',
                background: telemetry.loggerStatus.di1_spindle ? 'rgba(34, 197, 94, 0.2)' : '#1e293b',
                border: `1px solid ${telemetry.loggerStatus.di1_spindle ? '#22c55e' : 'rgba(255,255,255,0.1)'}`,
                textAlign: 'center',
                fontSize: '0.72rem',
              }}>
                <div style={{ fontWeight: 700, color: telemetry.loggerStatus.di1_spindle ? '#4ade80' : '#94a3b8' }}>DI 1</div>
                <div style={{ fontSize: '0.65rem', color: '#cbd5e1' }}>Spindle</div>
              </div>

              <div style={{
                padding: '6px',
                borderRadius: '6px',
                background: telemetry.loggerStatus.di2_inCycle ? 'rgba(34, 197, 94, 0.2)' : '#1e293b',
                border: `1px solid ${telemetry.loggerStatus.di2_inCycle ? '#22c55e' : 'rgba(255,255,255,0.1)'}`,
                textAlign: 'center',
                fontSize: '0.72rem',
              }}>
                <div style={{ fontWeight: 700, color: telemetry.loggerStatus.di2_inCycle ? '#4ade80' : '#94a3b8' }}>DI 2</div>
                <div style={{ fontSize: '0.65rem', color: '#cbd5e1' }}>In-Cycle</div>
              </div>

              <div style={{
                padding: '6px',
                borderRadius: '6px',
                background: telemetry.loggerStatus.di3_partCounter ? 'rgba(249, 115, 22, 0.2)' : '#1e293b',
                border: `1px solid ${telemetry.loggerStatus.di3_partCounter ? '#f97316' : 'rgba(255,255,255,0.1)'}`,
                textAlign: 'center',
                fontSize: '0.72rem',
              }}>
                <div style={{ fontWeight: 700, color: telemetry.loggerStatus.di3_partCounter ? '#fb923c' : '#94a3b8' }}>DI 3</div>
                <div style={{ fontSize: '0.65rem', color: '#cbd5e1' }}>Part Pulse</div>
              </div>

              <div style={{
                padding: '6px',
                borderRadius: '6px',
                background: telemetry.loggerStatus.di4_alarm ? 'rgba(239, 68, 68, 0.25)' : '#1e293b',
                border: `1px solid ${telemetry.loggerStatus.di4_alarm ? '#ef4444' : 'rgba(255,255,255,0.1)'}`,
                textAlign: 'center',
                fontSize: '0.72rem',
              }}>
                <div style={{ fontWeight: 700, color: telemetry.loggerStatus.di4_alarm ? '#f87171' : '#94a3b8' }}>DI 4</div>
                <div style={{ fontSize: '0.65rem', color: '#cbd5e1' }}>Alarm</div>
              </div>
            </div>

            {/* Network & Protocol Status */}
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: '#cbd5e1', padding: '6px 8px', background: '#050c18', borderRadius: '6px' }}>
              <span>Ethernet: <strong style={{ color: '#4ade80' }}>100Mbps Link OK</strong></span>
              <span>Wi-Fi/BT: <strong style={{ color: '#38bdf8' }}>-54 dBm</strong></span>
              <span>CAN Bus: <strong style={{ color: '#facc15' }}>Active</strong></span>
            </div>
          </div>

          {/* Card 3: Cloud MDMS Real-Time Analytics */}
          <div style={{
            background: 'rgba(15, 23, 42, 0.85)',
            border: '1px solid rgba(56, 189, 248, 0.25)',
            borderRadius: '12px',
            padding: '18px',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Activity size={18} color="#38bdf8" />
                <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700, color: '#f8fafc' }}>
                  Live MDMS Cloud Analytics
                </h4>
              </div>
              <span style={{ fontSize: '0.75rem', color: '#4ade80', fontWeight: 700 }}>
                Shift OEE: {telemetry.oee}%
              </span>
            </div>

            {/* 4 Stat Boxes */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <div className="mdms3d-stat" style={{ padding: '8px 10px' }}>
                <Gauge size={16} color="#38bdf8" />
                <div>
                  <small style={{ fontSize: '0.68rem' }}>Spindle Speed</small>
                  <b style={{ fontSize: '0.95rem' }}>{telemetry.rpm} RPM</b>
                </div>
              </div>

              <div className="mdms3d-stat" style={{ padding: '8px 10px' }}>
                <Zap size={16} color="#facc15" />
                <div>
                  <small style={{ fontSize: '0.68rem' }}>Power Load</small>
                  <b style={{ fontSize: '0.95rem' }}>{telemetry.power} kW</b>
                </div>
              </div>

              <div className="mdms3d-stat" style={{ padding: '8px 10px' }}>
                <Thermometer size={16} color="#f47b20" />
                <div>
                  <small style={{ fontSize: '0.68rem' }}>Bearing Temp</small>
                  <b style={{ fontSize: '0.95rem' }}>{telemetry.temp} °C</b>
                </div>
              </div>

              <div className="mdms3d-stat" style={{ padding: '8px 10px' }}>
                <Box size={16} color="#4ade80" />
                <div>
                  <small style={{ fontSize: '0.68rem' }}>Finished Parts</small>
                  <b style={{ fontSize: '0.95rem' }}>{telemetry.parts} pcs</b>
                </div>
              </div>
            </div>

            {/* Availability / Performance / Quality Bar */}
            <div style={{ marginTop: '10px', fontSize: '0.72rem', color: '#94a3b8', display: 'flex', justifyContent: 'space-between' }}>
              <span>Avail: <strong style={{ color: '#4ade80' }}>{telemetry.availability}%</strong></span>
              <span>Perf: <strong style={{ color: '#38bdf8' }}>{telemetry.performance}%</strong></span>
              <span>Quality: <strong style={{ color: '#facc15' }}>{telemetry.quality}%</strong></span>
            </div>
          </div>
        </div>

        {/* HOW RVMAITECH MDMS WORKS - ARCHITECTURE EXPLAINER BANNER */}
        <div style={{
          marginTop: '20px',
          padding: '16px 20px',
          borderRadius: '12px',
          background: 'linear-gradient(90deg, rgba(2, 132, 199, 0.22), rgba(15, 23, 42, 0.8))',
          border: '1px solid rgba(56, 189, 248, 0.35)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <Info size={18} color="#38bdf8" />
            <h4 style={{ margin: 0, fontSize: '0.92rem', fontWeight: 800, color: '#f8fafc' }}>
              How Rvmaitech MDMS Hardware Connects to Any Industrial Machine:
            </h4>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: '12px',
            fontSize: '0.78rem',
            color: '#cbd5e1',
            lineHeight: 1.5,
          }}>
            <div style={{ background: 'rgba(0,0,0,0.25)', padding: '10px', borderRadius: '8px' }}>
              <strong style={{ color: '#38bdf8', display: 'block', marginBottom: '2px' }}>1. Non-Invasive Sensor Tap</strong>
              We connect optocoupler signal taps or current sensors to the machine's spindle, cycle relays, and limits without altering OEM PLC programs.
            </div>

            <div style={{ background: 'rgba(0,0,0,0.25)', padding: '10px', borderRadius: '8px' }}>
              <strong style={{ color: '#4ade80', display: 'block', marginBottom: '2px' }}>2. Waveshare ESP32-S3 Edge</strong>
              The 8-Channel Digital Input &amp; Relay module samples signals at 1000Hz, computing exact machining cycle times and micro-stoppages.
            </div>

            <div style={{ background: 'rgba(0,0,0,0.25)', padding: '10px', borderRadius: '8px' }}>
              <strong style={{ color: '#facc15', display: 'block', marginBottom: '2px' }}>3. Secure MQTT / Ethernet</strong>
              Telemetry is encrypted and transmitted over factory LAN or Wi-Fi to the on-premise gateway or cloud database in milliseconds.
            </div>

            <div style={{ background: 'rgba(0,0,0,0.25)', padding: '10px', borderRadius: '8px' }}>
              <strong style={{ color: '#f87171', display: 'block', marginBottom: '2px' }}>4. Instant OEE &amp; Alerting</strong>
              Plant managers see live OEE, tool degradation, predictive maintenance alarms, and shift reports across mobile &amp; plant screens.
            </div>
          </div>
        </div>

        {/* CTA Button */}
        {onBookDemo && (
          <div style={{ marginTop: '16px', textAlign: 'center' }}>
            <button
              onClick={onBookDemo}
              className="btn btn-primary btn-3d-orange"
              style={{ padding: '12px 28px', fontSize: '0.9rem', fontWeight: 800, display: 'inline-flex', alignItems: 'center', gap: '8px' }}
            >
              <span>Schedule On-Site MDMS Hardware Survey &amp; Demo</span>
              <ArrowRight size={16} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
