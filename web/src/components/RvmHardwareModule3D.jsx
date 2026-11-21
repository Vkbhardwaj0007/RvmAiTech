import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import {
  RotateCcw, Sparkles, Layers, CheckCircle2, Zap, Wifi, Cpu, ShieldCheck,
  Maximize2, Eye, Info
} from 'lucide-react';

/**
 * Generates an ultra-crisp, realistic top-sticker texture matching the user's hardware photos.
 * Replaces "WAVESHARE" with "RvmAiTech" and tailors graphics for:
 *   - 'home' : Blue Accent (RVM-HA-ESP32-S3-ETH-8DI-8RO · Smart Home Automation)
 *   - 'mdms' : Green Accent (RVM-MDMS-ESP32-POE-8DI-8DO · Industrial Machine Telemetry)
 */
function createStickerTexture(variant = 'home') {
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');

  const isHome = variant === 'home';
  const primaryColor = isHome ? '#0284c7' : '#16a34a';
  const accentLight = isHome ? '#38bdf8' : '#4ade80';
  const bgDark = '#0e131b';

  // Base Matte Background
  ctx.fillStyle = bgDark;
  ctx.fillRect(0, 0, 1024, 512);

  // Subtle carbon grid texture
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.04)';
  ctx.lineWidth = 1;
  for (let x = 0; x < 1024; x += 16) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, 512);
    ctx.stroke();
  }
  for (let y = 0; y < 512; y += 16) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(1024, y);
    ctx.stroke();
  }

  // Outer Border
  ctx.strokeStyle = primaryColor;
  ctx.lineWidth = 4;
  ctx.strokeRect(16, 16, 992, 480);

  // -------------------------------------------------------------
  // TOP ROW: PORT IDENTIFIERS & PINOUT BLOCKS
  // -------------------------------------------------------------
  const drawBlock = (x, y, w, h, label, sub) => {
    ctx.fillStyle = primaryColor;
    ctx.fillRect(x, y, w, h);
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 15px "Space Grotesk", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(label, x + w / 2, y + 20);
    if (sub) {
      ctx.font = '11px monospace';
      ctx.fillText(sub, x + w / 2, y + 36);
    }
  };

  if (isHome) {
    // HOME AUTOMATION (BLUE)
    drawBlock(36, 26, 110, 48, 'RS485', 'A+ B- PE');
    drawBlock(156, 26, 90, 48, '7~36V', '+  -');

    // DI Pinout strip
    ctx.fillStyle = 'rgba(2, 132, 199, 0.15)';
    ctx.strokeStyle = primaryColor;
    ctx.lineWidth = 1.5;
    ctx.fillRect(256, 26, 420, 48);
    ctx.strokeRect(256, 26, 420, 48);

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 11px monospace';
    ctx.textAlign = 'center';
    const pins = ['BOOT', 'COM', 'DGND', 'DI1', 'DI2', 'DI3', 'DI4', 'DI5', 'DI6', 'DI7', 'DI8'];
    pins.forEach((p, idx) => {
      ctx.fillText(p, 275 + idx * 38, 54);
    });

    drawBlock(686, 26, 68, 48, 'USB', 'TYPE-C');
    drawBlock(764, 26, 50, 48, 'RGB', 'LED');
    drawBlock(824, 26, 78, 48, 'ETH', '10/100');
    drawBlock(912, 26, 76, 48, 'ANT', 'WIFI/BT');
  } else {
    // INDUSTRIAL MDMS (GREEN)
    drawBlock(36, 26, 74, 48, 'ANT', 'WIFI/4G');
    drawBlock(120, 26, 80, 48, 'POE', 'ETH RJ45');
    drawBlock(210, 26, 66, 48, 'USB', 'TYPE-C');
    drawBlock(286, 26, 60, 48, 'RGB', 'BOOT');
    drawBlock(356, 26, 90, 48, 'CAN', 'H  L  G');
    drawBlock(456, 26, 110, 48, 'RS485', 'PE B- A+');
    drawBlock(576, 26, 84, 48, '7~36V', '+  -');

    // High Speed Pulse Inputs (DI1-DI8)
    ctx.fillStyle = 'rgba(22, 163, 74, 0.15)';
    ctx.strokeStyle = primaryColor;
    ctx.lineWidth = 1.5;
    ctx.fillRect(670, 26, 318, 48);
    ctx.strokeRect(670, 26, 318, 48);

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 11px monospace';
    ctx.textAlign = 'center';
    const mdmsPins = ['COM', 'DI1', 'DI2', 'DI3', 'DI4', 'DI5', 'DI6', 'DI7', 'DI8'];
    mdmsPins.forEach((p, idx) => {
      ctx.fillText(p, 690 + idx * 35, 54);
    });
  }

  // -------------------------------------------------------------
  // CENTER SECTION: BRANDING & SPECIFICATIONS
  // -------------------------------------------------------------
  // Stylized Neon Arrows (Matching hardware)
  ctx.strokeStyle = primaryColor;
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(340, 110);
  ctx.lineTo(684, 110);
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(684, 110);
  ctx.lineTo(665, 102);
  ctx.lineTo(665, 118);
  ctx.closePath();
  ctx.fillStyle = primaryColor;
  ctx.fill();

  ctx.beginPath();
  ctx.moveTo(340, 110);
  ctx.lineTo(359, 102);
  ctx.lineTo(359, 118);
  ctx.closePath();
  ctx.fill();

  // Primary Brand Logo: RvmAiTech
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 44px "Space Grotesk", sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('RvmAiTech', 512, 168);

  ctx.fillStyle = accentLight;
  ctx.font = '600 15px "Space Grotesk", sans-serif';
  ctx.fillText(
    isHome
      ? 'ROBOTICS, VISION & SMART HOME INTELLIGENCE'
      : 'INDUSTRIAL AUTOMATION · MDMS MACHINE TELEMETRY',
    512,
    196
  );

  // Model Name Badge
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 26px "Space Grotesk", monospace';
  ctx.fillText(
    isHome
      ? 'ESP32-S3-ETH-8DI-8RO'
      : 'ESP32-S3-POE-ETH-8DI-8DO',
    512,
    242
  );

  // Channel description
  ctx.fillStyle = '#94a3b8';
  ctx.font = '600 16px sans-serif';
  ctx.fillText(
    isHome
      ? '8CH Heavy-Duty Relay Outputs & 8CH Optocoupler Digital Inputs'
      : '8CH High-Speed Pulse Counter Inputs & 8CH Digital Outputs / Alarms',
    512,
    274
  );

  // Technical features row
  ctx.fillStyle = primaryColor;
  ctx.font = 'bold 12.5px monospace';
  ctx.fillText(
    isHome
      ? 'MODBUS RTU · MQTT · ALEXA / GOOGLE READY · DIN-RAIL 35mm'
      : 'CAN 2.0B · ISOLATED RS485 · POE ETHERNET · MODBUS TCP · ZERO PLC TAMPER',
    512,
    306
  );

  // -------------------------------------------------------------
  // BOTTOM SECTION: CHANNEL RELAYS / CONTACT DIAGRAM
  // -------------------------------------------------------------
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(36, 335);
  ctx.lineTo(988, 335);
  ctx.stroke();

  // 8 Channels schematic layout
  const chNames = ['CH8', 'CH7', 'CH6', 'CH5', 'CH4', 'CH3', 'CH2', 'CH1'];
  chNames.forEach((ch, idx) => {
    const cx = 80 + idx * 122;

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 16px "Space Grotesk", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(ch, cx, 370);

    // Switch schematic icon
    ctx.strokeStyle = accentLight;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(cx - 32, 400);
    ctx.lineTo(cx - 10, 400);
    ctx.lineTo(cx + 10, 388);
    ctx.moveTo(cx + 14, 400);
    ctx.lineTo(cx + 32, 400);
    ctx.stroke();

    // 3 Terminal block boxes [o|o|o]
    ctx.strokeStyle = primaryColor;
    ctx.lineWidth = 1.5;
    ctx.strokeRect(cx - 36, 420, 72, 38);

    ctx.beginPath();
    ctx.moveTo(cx - 12, 420);
    ctx.lineTo(cx - 12, 458);
    ctx.moveTo(cx + 12, 420);
    ctx.lineTo(cx + 12, 458);
    ctx.stroke();

    // Screw terminal circles
    ctx.fillStyle = '#ffffff';
    [-24, 0, 24].forEach((sx) => {
      ctx.beginPath();
      ctx.arc(cx + sx, 439, 4.5, 0, Math.PI * 2);
      ctx.fill();
    });
  });

  return new THREE.CanvasTexture(canvas);
}

export default function RvmHardwareModule3D({
  initialVariant = 'home',
  showControls = true,
  height = '480px',
}) {
  const mountRef = useRef(null);
  const [variant, setVariant] = useState(initialVariant); // 'home' | 'mdms'
  const [activePinout, setActivePinout] = useState('overview'); // 'overview' | 'relays' | 'inputs' | 'rs485' | 'antenna' | 'din'
  const [autoRotate, setAutoRotate] = useState(true);

  // Interactive 3D scene refs
  const simRef = useRef({
    renderer: null,
    scene: null,
    camera: null,
    moduleGroup: null,
    stickerMesh: null,
    isDragging: false,
    prevMouseX: 0,
    prevMouseY: 0,
    targetRotX: 0.35,
    targetRotY: -0.45,
  });

  // Switch texture on variant change
  useEffect(() => {
    if (simRef.current.stickerMesh) {
      simRef.current.stickerMesh.material.map = createStickerTexture(variant);
      simRef.current.stickerMesh.material.needsUpdate = true;
    }
  }, [variant]);

  useEffect(() => {
    const host = mountRef.current;
    if (!host) return undefined;

    let renderer;
    try {
      renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: 'high-performance' });
    } catch {
      return undefined;
    }

    const w = host.clientWidth || 600;
    const h = host.clientHeight || 480;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setSize(w, h, false);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFShadowMap;
    host.innerHTML = '';
    host.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    scene.background = null;

    const camera = new THREE.PerspectiveCamera(38, w / h, 0.1, 100);
    camera.position.set(0, 3.2, 5.8);
    camera.lookAt(0, 0, 0);
    simRef.current.camera = camera;

    // Studio Quality Multi-Point Lighting for Electronics
    scene.add(new THREE.AmbientLight(0xffffff, 1.4));
    const mainSun = new THREE.DirectionalLight(0xffffff, 2.5);
    mainSun.position.set(5, 8, 6);
    mainSun.castShadow = true;
    scene.add(mainSun);

    const blueRim = new THREE.DirectionalLight(0x38bdf8, 1.8);
    blueRim.position.set(-6, 3, -4);
    scene.add(blueRim);

    const greenAccent = new THREE.PointLight(0x22c55e, 2.2, 10);
    greenAccent.position.set(0, -2, 3);
    scene.add(greenAccent);

    const moduleGroup = new THREE.Group();
    scene.add(moduleGroup);
    simRef.current.moduleGroup = moduleGroup;

    // -------------------------------------------------------------
    // 3D PHYSICAL ENCLOSURE (175mm x 90mm x 40mm DIN-Rail Unit)
    // -------------------------------------------------------------
    const matAbsBlack = new THREE.MeshStandardMaterial({
      color: 0x181c24,
      metalness: 0.25,
      roughness: 0.65,
    });
    const matTerminalGreen = new THREE.MeshStandardMaterial({
      color: 0x15803d,
      roughness: 0.45,
      metalness: 0.2,
    });
    const matScrewSilver = new THREE.MeshStandardMaterial({
      color: 0xe2e8f0,
      metalness: 0.95,
      roughness: 0.15,
    });
    const matBrassGold = new THREE.MeshStandardMaterial({
      color: 0xf59e0b,
      metalness: 0.92,
      roughness: 0.25,
    });
    const matAntennaRubber = new THREE.MeshStandardMaterial({
      color: 0x0f172a,
      roughness: 0.85,
    });
    const matOrangeClip = new THREE.MeshStandardMaterial({
      color: 0xea580c,
      roughness: 0.35,
      metalness: 0.2,
    });

    // 1. Main ABS Plastic Enclosure
    const mainBody = new THREE.Mesh(new THREE.BoxGeometry(3.6, 0.75, 2.0), matAbsBlack);
    mainBody.castShadow = true;
    mainBody.receiveShadow = true;
    moduleGroup.add(mainBody);

    // 2. Side Mounting Ears with Screw Holes (175mm width)
    [-1.9, 1.9].forEach((ex) => {
      const ear = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.18, 2.0), matAbsBlack);
      ear.position.set(ex, -0.28, 0);
      moduleGroup.add(ear);

      // Screw hole recesses
      [-0.7, 0.7].forEach((ez) => {
        const hole = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.2, 16), new THREE.MeshBasicMaterial({ color: 0x090d14 }));
        hole.position.set(ex, -0.28, ez);
        moduleGroup.add(hole);
      });
    });

    // 3. Top Sticker Recess & Branded RvmAiTech Label Face
    const stickerMat = new THREE.MeshBasicMaterial({
      map: createStickerTexture(variant),
      transparent: false,
    });
    const stickerMesh = new THREE.Mesh(new THREE.PlaneGeometry(3.3, 1.76), stickerMat);
    stickerMesh.rotation.x = -Math.PI / 2;
    stickerMesh.position.set(0, 0.382, 0);
    moduleGroup.add(stickerMesh);
    simRef.current.stickerMesh = stickerMesh;

    // 4. Pluggable Green Screw Terminal Blocks (Bottom / Front CH1-CH8)
    const termBlockFront = new THREE.Group();
    termBlockFront.position.set(0, -0.05, 1.08);

    const termBodyF = new THREE.Mesh(new THREE.BoxGeometry(3.2, 0.42, 0.35), matTerminalGreen);
    termBlockFront.add(termBodyF);

    // 16 Screw Terminals with silver screw heads
    for (let i = -7.5; i <= 7.5; i += 1.0) {
      const sx = i * 0.2;
      const screw = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.04, 12), matScrewSilver);
      screw.position.set(sx, 0.215, 0.02);
      termBlockFront.add(screw);

      const wireHole = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.14, 0.06), new THREE.MeshBasicMaterial({ color: 0x05080e }));
      wireHole.position.set(sx, 0, 0.16);
      termBlockFront.add(wireHole);
    }
    moduleGroup.add(termBlockFront);

    // 5. Top Terminal Blocks (Power, RS485, Digital Inputs)
    const termBlockTop = new THREE.Group();
    termBlockTop.position.set(-0.45, 0.05, -1.08);

    const termBodyT = new THREE.Mesh(new THREE.BoxGeometry(2.1, 0.38, 0.32), matTerminalGreen);
    termBlockTop.add(termBodyT);

    for (let i = -4.5; i <= 4.5; i += 1.0) {
      const sx = i * 0.2;
      const screw = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.04, 12), matScrewSilver);
      screw.position.set(sx, 0.195, -0.02);
      termBlockTop.add(screw);
    }
    moduleGroup.add(termBlockTop);

    // 6. Gold Brass SMA Antenna Connector & Rubber Dipole Antenna
    const smaConnector = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.12, 0.22, 16), matBrassGold);
    smaConnector.rotation.x = Math.PI / 2;
    smaConnector.position.set(1.4, 0.15, -1.08);
    moduleGroup.add(smaConnector);

    // Antenna Swivel Elbow & Mast
    const antGroup = new THREE.Group();
    antGroup.position.set(1.4, 0.15, -1.18);
    antGroup.rotation.x = -0.32; // Tilted slightly backwards
    antGroup.rotation.y = 0.15;

    const antElbow = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.09, 0.28, 16), matAntennaRubber);
    antGroup.add(antElbow);

    const antRod = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.08, 1.85, 18), matAntennaRubber);
    antRod.position.y = 1.02;
    antGroup.add(antRod);

    const antCap = new THREE.Mesh(new THREE.SphereGeometry(0.06, 12, 12), matAntennaRubber);
    antCap.position.y = 1.95;
    antGroup.add(antCap);

    moduleGroup.add(antGroup);

    // 7. Metal Shielded RJ45 Ethernet Port
    const ethJack = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.42, 0.48), matScrewSilver);
    ethJack.position.set(0.9, 0.15, -1.08);
    moduleGroup.add(ethJack);

    // 8. USB Type-C Metallic Port
    const usbC = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.14, 0.18), matScrewSilver);
    usbC.position.set(0.42, 0.15, -1.08);
    moduleGroup.add(usbC);

    // 9. Back 35mm DIN-Rail Channel & Orange Spring Snap Clips
    const dinChannel = new THREE.Mesh(new THREE.BoxGeometry(3.6, 0.12, 0.95), new THREE.MeshBasicMaterial({ color: 0x070a10 }));
    dinChannel.position.set(0, -0.36, 0);
    moduleGroup.add(dinChannel);

    [-0.95, 0.95].forEach((cx) => {
      const clip = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.18, 0.45), matOrangeClip);
      clip.position.set(cx, -0.38, 0);
      moduleGroup.add(clip);
    });

    // 10. Live Blinking Status Indicator LEDs
    const pwrLed = new THREE.Mesh(new THREE.SphereGeometry(0.04, 12, 12), new THREE.MeshBasicMaterial({ color: 0x22c55e }));
    pwrLed.position.set(0.18, 0.39, -0.75);
    moduleGroup.add(pwrLed);

    const actLed = new THREE.Mesh(new THREE.SphereGeometry(0.04, 12, 12), new THREE.MeshBasicMaterial({ color: 0x38bdf8 }));
    actLed.position.set(0.28, 0.39, -0.75);
    moduleGroup.add(actLed);

    // -------------------------------------------------------------
    // INTERACTIVE MOUSE / TOUCH DRAG ORBIT CONTROLS
    // -------------------------------------------------------------
    const onMouseDown = (e) => {
      simRef.current.isDragging = true;
      simRef.current.prevMouseX = e.clientX;
      simRef.current.prevMouseY = e.clientY;
      setAutoRotate(false);
    };

    const onMouseMove = (e) => {
      if (!simRef.current.isDragging) return;
      const dx = e.clientX - simRef.current.prevMouseX;
      const dy = e.clientY - simRef.current.prevMouseY;
      simRef.current.targetRotY += dx * 0.008;
      simRef.current.targetRotX += dy * 0.008;
      simRef.current.prevMouseX = e.clientX;
      simRef.current.prevMouseY = e.clientY;
    };

    const onMouseUp = () => {
      simRef.current.isDragging = false;
    };

    const onTouchStart = (e) => {
      if (e.touches.length === 1) {
        simRef.current.isDragging = true;
        simRef.current.prevMouseX = e.touches[0].clientX;
        simRef.current.prevMouseY = e.touches[0].clientY;
        setAutoRotate(false);
      }
    };

    const onTouchMove = (e) => {
      if (!simRef.current.isDragging || e.touches.length !== 1) return;
      const dx = e.touches[0].clientX - simRef.current.prevMouseX;
      const dy = e.touches[0].clientY - simRef.current.prevMouseY;
      simRef.current.targetRotY += dx * 0.01;
      simRef.current.targetRotX += dy * 0.01;
      simRef.current.prevMouseX = e.touches[0].clientX;
      simRef.current.prevMouseY = e.touches[0].clientY;
    };

    host.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    host.addEventListener('touchstart', onTouchStart, { passive: true });
    window.addEventListener('touchmove', onTouchMove, { passive: true });
    window.addEventListener('touchend', onMouseUp);

    // -------------------------------------------------------------
    // ANIMATION & ROTATION LOOP
    // -------------------------------------------------------------
    let raf = 0;
    const startTime = performance.now();

    const animate = (now) => {
      const t = (now - startTime) * 0.001;

      // Auto rotation when idle
      if (autoRotate && !simRef.current.isDragging) {
        simRef.current.targetRotY += 0.005;
      }

      // Smooth dampening towards target rotation
      moduleGroup.rotation.y += (simRef.current.targetRotY - moduleGroup.rotation.y) * 0.08;
      moduleGroup.rotation.x += (simRef.current.targetRotX - moduleGroup.rotation.x) * 0.08;

      // Subtle floating levitation effect
      moduleGroup.position.y = Math.sin(t * 1.5) * 0.06;

      // Blinking status LEDs
      actLed.material.color.setHex(Math.sin(t * 12) > 0 ? 0x38bdf8 : 0x0369a1);

      renderer.render(scene, camera);
      raf = requestAnimationFrame(animate);
    };

    raf = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(raf);
      host.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      host.removeEventListener('touchstart', onTouchStart);
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('touchend', onMouseUp);
      renderer.dispose();
      host.innerHTML = '';
    };
  }, [variant, autoRotate]);

  return (
    <div style={{
      background: 'radial-gradient(ellipse at center, #0e1e33 0%, #060c18 100%)',
      borderRadius: '16px',
      border: '1.5px solid rgba(56, 189, 248, 0.35)',
      overflow: 'hidden',
      boxShadow: '0 12px 38px rgba(0,0,0,0.6)',
      position: 'relative',
    }}>
      {/* Top Header Controls Bar */}
      <div style={{
        padding: '12px 18px',
        background: 'rgba(10, 20, 36, 0.95)',
        borderBottom: '1px solid rgba(56, 189, 248, 0.2)',
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '12px',
      }}>
        {/* Edition Selector Tabs */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '0.78rem', color: '#94a3b8', fontWeight: 800 }}>
            3D HARDWARE EDITION:
          </span>

          <button
            type="button"
            onClick={() => setVariant('home')}
            style={{
              padding: '6px 14px',
              borderRadius: '6px',
              border: variant === 'home' ? '1.5px solid #38bdf8' : '1px solid rgba(255,255,255,0.1)',
              background: variant === 'home' ? '#0284c7' : 'rgba(255,255,255,0.05)',
              color: '#ffffff',
              fontSize: '0.8rem',
              fontWeight: 800,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              transition: 'all 0.2s ease',
              boxShadow: variant === 'home' ? '0 0 12px rgba(2, 132, 199, 0.5)' : 'none',
            }}
          >
            <span>🏠</span>
            <span>Home Automation (Blue)</span>
          </button>

          <button
            type="button"
            onClick={() => setVariant('mdms')}
            style={{
              padding: '6px 14px',
              borderRadius: '6px',
              border: variant === 'mdms' ? '1.5px solid #22c55e' : '1px solid rgba(255,255,255,0.1)',
              background: variant === 'mdms' ? '#16a34a' : 'rgba(255,255,255,0.05)',
              color: '#ffffff',
              fontSize: '0.8rem',
              fontWeight: 800,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              transition: 'all 0.2s ease',
              boxShadow: variant === 'mdms' ? '0 0 12px rgba(34, 197, 94, 0.5)' : 'none',
            }}
          >
            <span>🏭</span>
            <span>Industrial MDMS Datalogger (Green)</span>
          </button>
        </div>

        {/* View / Auto-Rotate Action Buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            type="button"
            onClick={() => setAutoRotate(!autoRotate)}
            style={{
              padding: '5px 12px',
              borderRadius: '6px',
              border: '1px solid rgba(255,255,255,0.15)',
              background: autoRotate ? 'rgba(56, 189, 248, 0.2)' : 'rgba(255,255,255,0.05)',
              color: autoRotate ? '#38bdf8' : '#cbd5e1',
              fontSize: '0.74rem',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '5px',
            }}
          >
            <RotateCcw size={13} />
            {autoRotate ? '360° AUTO-ROTATE ON' : 'PAUSED (DRAG TO ROTATE)'}
          </button>
        </div>
      </div>

      {/* 3D WebGL Viewport */}
      <div style={{ position: 'relative', width: '100%', height: height }}>
        <div ref={mountRef} style={{ width: '100%', height: '100%', cursor: 'grab' }} />

        {/* Floating Product Specification Card (Top Left) */}
        <div style={{
          position: 'absolute',
          top: '16px',
          left: '16px',
          padding: '12px 16px',
          background: 'rgba(7, 16, 29, 0.88)',
          backdropFilter: 'blur(10px)',
          borderRadius: '10px',
          border: `1.5px solid ${variant === 'home' ? 'rgba(56, 189, 248, 0.4)' : 'rgba(34, 197, 94, 0.4)'}`,
          maxWidth: '320px',
          pointerEvents: 'none',
        }}>
          <div style={{
            fontSize: '0.68rem',
            color: variant === 'home' ? '#38bdf8' : '#4ade80',
            fontWeight: 900,
            letterSpacing: '0.06em',
            textTransform: 'uppercase',
          }}>
            {variant === 'home' ? 'RvmAiTech Home IoT Controller' : 'RvmAiTech MDMS Edge Gateway'}
          </div>
          <div style={{ fontSize: '1rem', fontWeight: 900, color: '#ffffff', marginTop: '2px' }}>
            {variant === 'home' ? 'RVM-HA-ESP32-8DI-8RO' : 'RVM-MDMS-ESP32-POE-8DI-8DO'}
          </div>
          <p style={{ fontSize: '0.74rem', color: '#cbd5e1', margin: '4px 0 0', lineHeight: 1.5 }}>
            {variant === 'home'
              ? '8x 10A Heavy-duty relays for AC, lighting, curtains, tank pumps, with optocoupled input channels & Wi-Fi/Ethernet.'
              : 'Zero-program machine pulse capture, Modbus RTU/TCP, CAN 2.0B, PoE Ethernet, and dual RS485 for CNC & PLC monitoring.'}
          </p>
        </div>

        {/* Drag Helper Tip Badge (Bottom Center) */}
        <div style={{
          position: 'absolute',
          bottom: '14px',
          left: '50%',
          transform: 'translateX(-50%)',
          padding: '4px 14px',
          background: 'rgba(15, 23, 42, 0.8)',
          borderRadius: '20px',
          border: '1px solid rgba(255,255,255,0.15)',
          fontSize: '0.72rem',
          color: '#94a3b8',
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          pointerEvents: 'none',
        }}>
          <Eye size={13} color="#38bdf8" />
          <span>Click &amp; Drag in any direction for full 360° 3D inspection</span>
        </div>
      </div>

      {/* Hardware Specifications & Pinout Quick Bar */}
      <div style={{
        padding: '12px 18px',
        background: 'rgba(8, 16, 28, 0.98)',
        borderTop: '1px solid rgba(56, 189, 248, 0.15)',
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
        gap: '12px',
        fontSize: '0.78rem',
      }}>
        <div style={{ background: 'rgba(255,255,255,0.03)', padding: '8px 12px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.06)' }}>
          <div style={{ color: '#94a3b8', fontSize: '0.7rem' }}>Enclosure &amp; Mounting:</div>
          <div style={{ fontWeight: 800, color: '#f8fafc', marginTop: '2px' }}>175×90×40mm ABS DIN-Rail 35mm</div>
        </div>

        <div style={{ background: 'rgba(255,255,255,0.03)', padding: '8px 12px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.06)' }}>
          <div style={{ color: '#94a3b8', fontSize: '0.7rem' }}>Power Input Voltage:</div>
          <div style={{ fontWeight: 800, color: '#f8fafc', marginTop: '2px' }}>7V ~ 36V DC Wide Range / PoE</div>
        </div>

        <div style={{ background: 'rgba(255,255,255,0.03)', padding: '8px 12px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.06)' }}>
          <div style={{ color: '#94a3b8', fontSize: '0.7rem' }}>Connectivity:</div>
          <div style={{ fontWeight: 800, color: '#f8fafc', marginTop: '2px' }}>Ethernet RJ45, WiFi, BLE, RS485, CAN</div>
        </div>

        <div style={{ background: 'rgba(255,255,255,0.03)', padding: '8px 12px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.06)' }}>
          <div style={{ color: '#94a3b8', fontSize: '0.7rem' }}>Branding &amp; Engineering:</div>
          <div style={{ fontWeight: 800, color: '#38bdf8', marginTop: '2px' }}>RvmAiTech Custom Firmware</div>
        </div>
      </div>
    </div>
  );
}
