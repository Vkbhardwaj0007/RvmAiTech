import { useEffect, useRef } from 'react';
import * as THREE from 'three';

/**
 * Interactive 360° 3D Hardware & Digital Twin Viewer (Three.js WebGL).
 * Renders a distinct, interactive 3D engineering model for each product tab:
 *   - 'mdms'       : 3D Industrial Machine Spindle + Live OEE Telemetry Rings
 *   - 'datalogger' : 3D Edge IoT Datalogger PCB + Microprocessor + Antenna + Ports
 *   - 'home'       : 3D Smart Glass Touch Switchboard + Wireless Wave Rings
 *   - 'enterprise' : 3D Smart Parking / Cloud ERP Holographic Data Core
 * Supports mouse & touch drag-to-rotate (360°) + smooth auto-rotation.
 */
export default function InteractiveProduct3D({ mode = 'mdms', label = '360° Interactive 3D Digital Twin' }) {
  const mountRef = useRef(null);

  useEffect(() => {
    const host = mountRef.current;
    if (!host) return undefined;

    let renderer;
    try {
      renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: 'high-performance' });
    } catch {
      return undefined;
    }

    const w = host.clientWidth || 380;
    const h = host.clientHeight || 220;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setSize(w, h, false);
    host.innerHTML = '';
    host.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(42, w / h, 0.1, 100);
    camera.position.set(0, 1.4, 5.4);
    camera.lookAt(0, 0, 0);

    // Lighting
    const amb = new THREE.AmbientLight(0xdbeafe, 1.35);
    scene.add(amb);
    const keyLight = new THREE.DirectionalLight(0xffffff, 2.2);
    keyLight.position.set(4, 6, 5);
    scene.add(keyLight);
    const orangeLight = new THREE.PointLight(0xf47b20, 3.2, 12);
    orangeLight.position.set(-3, -2, 3);
    scene.add(orangeLight);
    const cyanLight = new THREE.PointLight(0x38bdf8, 3.0, 12);
    cyanLight.position.set(3, 2, 3);
    scene.add(cyanLight);

    const root = new THREE.Group();
    scene.add(root);

    const disposables = [];
    const track = (obj) => {
      if (obj) disposables.push(obj);
      return obj;
    };

    const matNavy = track(new THREE.MeshStandardMaterial({ color: 0x0f2d59, metalness: 0.65, roughness: 0.28 }));
    const matDark = track(new THREE.MeshStandardMaterial({ color: 0x07162c, metalness: 0.8, roughness: 0.22 }));
    const matOrange = track(new THREE.MeshStandardMaterial({ color: 0xf47b20, emissive: 0xf47b20, emissiveIntensity: 0.35, metalness: 0.5, roughness: 0.25 }));
    const matCyan = track(new THREE.MeshStandardMaterial({ color: 0x38bdf8, emissive: 0x0ea5e9, emissiveIntensity: 0.45, metalness: 0.4, roughness: 0.2 }));
    const matGreen = track(new THREE.MeshStandardMaterial({ color: 0x22c55e, emissive: 0x16a34a, emissiveIntensity: 0.5, metalness: 0.3, roughness: 0.2 }));
    const matWireCyan = track(new THREE.MeshBasicMaterial({ color: 0x38bdf8, wireframe: true, transparent: true, opacity: 0.42 }));
    const matWireOrange = track(new THREE.MeshBasicMaterial({ color: 0xff9d52, wireframe: true, transparent: true, opacity: 0.48 }));

    const animatedParts = [];

    const matAbsBlack = track(new THREE.MeshStandardMaterial({ color: 0x181c24, metalness: 0.25, roughness: 0.65 }));
    const matTerminalGreen = track(new THREE.MeshStandardMaterial({ color: 0x15803d, roughness: 0.45, metalness: 0.2 }));
    const matScrewSilver = track(new THREE.MeshStandardMaterial({ color: 0xe2e8f0, metalness: 0.95, roughness: 0.15 }));
    const matBrassGold = track(new THREE.MeshStandardMaterial({ color: 0xf59e0b, metalness: 0.92, roughness: 0.25 }));

    if (mode === 'datalogger' || mode === 'mdms') {
      // 3D RvmAiTech Industrial MDMS Datalogger Enclosure (Green Scheme)
      const enc = new THREE.Mesh(track(new THREE.BoxGeometry(2.8, 0.58, 1.65)), matAbsBlack);
      root.add(enc);

      // Green Accent Top Face / Label
      const topLabel = new THREE.Mesh(track(new THREE.BoxGeometry(2.5, 0.04, 1.35)), matGreen);
      topLabel.position.y = 0.3;
      root.add(topLabel);

      // Core Microprocessor Badge
      const chip = new THREE.Mesh(track(new THREE.BoxGeometry(0.8, 0.08, 0.55)), matDark);
      chip.position.set(0, 0.33, 0);
      root.add(chip);

      // Green Front Terminal Blocks (16-Pin for DI/DO)
      const termF = new THREE.Mesh(track(new THREE.BoxGeometry(2.5, 0.32, 0.28)), matTerminalGreen);
      termF.position.set(0, -0.05, 0.88);
      root.add(termF);

      // Terminal Screws
      for (let i = -5; i <= 5; i++) {
        const scr = new THREE.Mesh(track(new THREE.CylinderGeometry(0.04, 0.04, 0.03, 10)), matScrewSilver);
        scr.position.set(i * 0.22, 0.13, 0.9);
        root.add(scr);
      }

      // Top Terminal Block (Power & RS485)
      const termT = new THREE.Mesh(track(new THREE.BoxGeometry(1.6, 0.3, 0.25)), matTerminalGreen);
      termT.position.set(-0.35, 0.05, -0.88);
      root.add(termT);

      // SMA Brass Connector & Dipole Antenna
      const sma = new THREE.Mesh(track(new THREE.CylinderGeometry(0.08, 0.1, 0.18, 12)), matBrassGold);
      sma.rotation.x = Math.PI / 2;
      sma.position.set(1.1, 0.12, -0.88);
      root.add(sma);

      const antMast = new THREE.Mesh(track(new THREE.CylinderGeometry(0.05, 0.07, 1.5, 14)), matDark);
      antMast.position.set(1.1, 0.85, -0.92);
      antMast.rotation.x = -0.15;
      root.add(antMast);

      // RJ45 Ethernet Port
      const rj45 = new THREE.Mesh(track(new THREE.BoxGeometry(0.42, 0.34, 0.38)), matScrewSilver);
      rj45.position.set(0.68, 0.12, -0.88);
      root.add(rj45);

      const signalRing = new THREE.Mesh(track(new THREE.TorusGeometry(0.45, 0.025, 12, 36)), matWireCyan);
      signalRing.position.set(1.1, 1.5, -0.95);
      signalRing.rotation.x = Math.PI / 2;
      root.add(signalRing);
      animatedParts.push((t) => {
        const s = 1 + Math.sin(t * 3) * 0.25;
        signalRing.scale.set(s, s, s);
        signalRing.rotation.z = t;
      });

      const holoShell = new THREE.Mesh(track(new THREE.IcosahedronGeometry(1.85, 1)), matWireOrange);
      root.add(holoShell);
      animatedParts.push((t) => {
        holoShell.rotation.y = -t * 0.35;
      });
    } else if (mode === 'home') {
      // 3D RvmAiTech Smart Home Automation Controller (Blue Scheme)
      const enc = new THREE.Mesh(track(new THREE.BoxGeometry(2.8, 0.58, 1.65)), matAbsBlack);
      root.add(enc);

      // Blue Accent Top Label
      const topLabel = new THREE.Mesh(track(new THREE.BoxGeometry(2.5, 0.04, 1.35)), matCyan);
      topLabel.position.y = 0.3;
      root.add(topLabel);

      // RvmAiTech Badge
      const chip = new THREE.Mesh(track(new THREE.BoxGeometry(0.85, 0.08, 0.55)), matDark);
      chip.position.set(0, 0.33, 0);
      root.add(chip);

      // 8 Relay Terminal Outputs (Front Green Block)
      const termF = new THREE.Mesh(track(new THREE.BoxGeometry(2.5, 0.32, 0.28)), matTerminalGreen);
      termF.position.set(0, -0.05, 0.88);
      root.add(termF);

      for (let i = -5; i <= 5; i++) {
        const scr = new THREE.Mesh(track(new THREE.CylinderGeometry(0.04, 0.04, 0.03, 10)), matScrewSilver);
        scr.position.set(i * 0.22, 0.13, 0.9);
        root.add(scr);
      }

      // Top Terminals (RS485 & 7~36V DC)
      const termT = new THREE.Mesh(track(new THREE.BoxGeometry(1.6, 0.3, 0.25)), matTerminalGreen);
      termT.position.set(-0.35, 0.05, -0.88);
      root.add(termT);

      // SMA Brass Connector & WiFi Dipole Antenna
      const sma = new THREE.Mesh(track(new THREE.CylinderGeometry(0.08, 0.1, 0.18, 12)), matBrassGold);
      sma.rotation.x = Math.PI / 2;
      sma.position.set(1.1, 0.12, -0.88);
      root.add(sma);

      const antMast = new THREE.Mesh(track(new THREE.CylinderGeometry(0.05, 0.07, 1.5, 14)), matDark);
      antMast.position.set(1.1, 0.85, -0.92);
      antMast.rotation.x = -0.15;
      root.add(antMast);

      // RJ45 Ethernet Port
      const rj45 = new THREE.Mesh(track(new THREE.BoxGeometry(0.42, 0.34, 0.38)), matScrewSilver);
      rj45.position.set(0.68, 0.12, -0.88);
      root.add(rj45);

      const wave = new THREE.Mesh(track(new THREE.TorusGeometry(1.65, 0.025, 12, 48)), matWireCyan);
      root.add(wave);
      animatedParts.push((t) => {
        wave.rotation.x = Math.sin(t) * 0.5;
        wave.rotation.y = t * 0.6;
      });
    } else if (mode === 'enterprise') {
      // 3D Cloud ERP & Smart Parking Holographic Core
      const core = new THREE.Mesh(track(new THREE.OctahedronGeometry(0.95, 0)), matCyan);
      root.add(core);

      const cage = new THREE.Mesh(track(new THREE.IcosahedronGeometry(1.45, 1)), matWireOrange);
      root.add(cage);

      const ring1 = new THREE.Mesh(track(new THREE.TorusGeometry(1.75, 0.04, 14, 48)), matOrange);
      ring1.rotation.x = Math.PI / 2.6;
      root.add(ring1);

      const ring2 = new THREE.Mesh(track(new THREE.TorusGeometry(1.95, 0.03, 14, 48)), matCyan);
      ring2.rotation.y = Math.PI / 3;
      root.add(ring2);

      animatedParts.push((t) => {
        core.rotation.y = t * 0.9;
        core.rotation.x = t * 0.5;
        cage.rotation.y = -t * 0.4;
        ring1.rotation.z = t * 0.7;
        ring2.rotation.x = -t * 0.6;
      });
    } else {
      // Default 'mdms': 3D Industrial Machine Digital Twin & OEE Telemetry Core
      const base = new THREE.Mesh(track(new THREE.CylinderGeometry(1.35, 1.5, 0.36, 24)), matNavy);
      base.position.y = -0.85;
      root.add(base);

      const stator = new THREE.Mesh(track(new THREE.CylinderGeometry(0.9, 0.9, 1.1, 20)), matDark);
      stator.position.y = -0.15;
      root.add(stator);

      const rotor = new THREE.Mesh(track(new THREE.TorusKnotGeometry(0.52, 0.14, 64, 12)), matOrange);
      rotor.position.y = 0.25;
      root.add(rotor);

      const ringOuter = new THREE.Mesh(track(new THREE.TorusGeometry(1.55, 0.04, 16, 48)), matCyan);
      ringOuter.rotation.x = Math.PI / 2.2;
      root.add(ringOuter);

      const holoSphere = new THREE.Mesh(track(new THREE.IcosahedronGeometry(1.85, 1)), matWireCyan);
      root.add(holoSphere);

      animatedParts.push((t) => {
        rotor.rotation.y = t * 1.4;
        rotor.rotation.z = t * 0.8;
        ringOuter.rotation.z = -t * 0.9;
        holoSphere.rotation.y = -t * 0.35;
      });
    }

    // Drag-to-rotate interaction (mouse + touch)
    let isDragging = false;
    let prevX = 0;
    let prevY = 0;
    let velX = 0.008;
    let velY = 0;
    let rotY = 0.4;
    let rotX = 0.18;

    const onDown = (clientX, clientY) => {
      isDragging = true;
      prevX = clientX;
      prevY = clientY;
    };
    const onMove = (clientX, clientY) => {
      if (!isDragging) return;
      const dx = clientX - prevX;
      const dy = clientY - prevY;
      prevX = clientX;
      prevY = clientY;
      velX = dx * 0.012;
      velY = dy * 0.012;
      rotY += velX;
      rotX = Math.max(-0.9, Math.min(0.9, rotX + velY));
    };
    const onUp = () => {
      isDragging = false;
    };

    const handleMouseDown = (e) => onDown(e.clientX, e.clientY);
    const handleMouseMove = (e) => onMove(e.clientX, e.clientY);
    const handleTouchStart = (e) => {
      if (e.touches.length === 1) onDown(e.touches[0].clientX, e.touches[0].clientY);
    };
    const handleTouchMove = (e) => {
      if (e.touches.length === 1) onMove(e.touches[0].clientX, e.touches[0].clientY);
    };

    host.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    window.addEventListener('mouseup', onUp);
    host.addEventListener('touchstart', handleTouchStart, { passive: true });
    window.addEventListener('touchmove', handleTouchMove, { passive: true });
    window.addEventListener('touchend', onUp);

    let raf = 0;
    const start = performance.now();

    const animate = (now) => {
      const t = (now - start) * 0.001;
      if (!isDragging) {
        rotY += 0.009;
        velX *= 0.92;
        velY *= 0.92;
      }
      root.rotation.y = rotY;
      root.rotation.x = rotX;
      root.position.y = Math.sin(t * 2.1) * 0.08;

      animatedParts.forEach((fn) => fn(t));

      renderer.render(scene, camera);
      raf = requestAnimationFrame(animate);
    };
    raf = requestAnimationFrame(animate);

    const onResize = () => {
      if (!host) return;
      const nw = host.clientWidth || 380;
      const nh = host.clientHeight || 220;
      camera.aspect = nw / nh;
      camera.updateProjectionMatrix();
      renderer.setSize(nw, nh, false);
    };
    window.addEventListener('resize', onResize, { passive: true });

    return () => {
      cancelAnimationFrame(raf);
      host.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', onUp);
      host.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', onUp);
      window.removeEventListener('resize', onResize);
      disposables.forEach((d) => d.dispose?.());
      renderer.dispose();
    };
  }, [mode]);

  return (
    <div className="interactive-3d-stage" title="Drag with mouse or finger to rotate 360° in 3D">
      <div className="interactive-3d-badge">
        <span className="pulse-dot-3d" />
        <span>{label} · Drag 360°</span>
      </div>
      <div ref={mountRef} className="interactive-3d-canvas" />
    </div>
  );
}

