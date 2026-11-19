import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import {
  Activity, Cpu, Gauge, Thermometer, Zap, Play, Pause, AlertTriangle, RotateCcw,
} from 'lucide-react';

const INITIAL_MACHINES = [
  {
    id: 'cnc-01',
    code: 'CNC-01',
    name: '5-Axis CNC Machining Center',
    bay: 'Bay A1 · Precision Shop',
    status: 'running', // 'running' | 'idle' | 'fault'
    oee: 88.4,
    availability: 94.2,
    performance: 95.1,
    quality: 98.7,
    rpm: 2420,
    temp: 46,
    power: 14.2,
    parts: 418,
    plc: 'Siemens S7-1500 (Modbus TCP)',
  },
  {
    id: 'press-02',
    code: 'PRESS-02',
    name: 'Hydraulic Stamping Press',
    bay: 'Bay A2 · Forming Line',
    status: 'running',
    oee: 91.2,
    availability: 96.0,
    performance: 96.4,
    quality: 98.6,
    rpm: 38,
    temp: 52,
    power: 22.8,
    parts: 1290,
    plc: 'Mitsubishi FX5U (RS485)',
  },
  {
    id: 'inj-03',
    code: 'INJ-03',
    name: 'Injection Molding Unit',
    bay: 'Bay B1 · Polymer Cell',
    status: 'idle',
    oee: 64.5,
    availability: 71.0,
    performance: 92.2,
    quality: 98.5,
    rpm: 0,
    temp: 39,
    power: 3.1,
    parts: 205,
    plc: 'Delta DVP-SV2 (Modbus RTU)',
  },
  {
    id: 'conv-04',
    code: 'CONV-04',
    name: 'Robotic Assembly & QC Line',
    bay: 'Bay B2 · Final Pack',
    status: 'running',
    oee: 94.1,
    availability: 97.5,
    performance: 97.2,
    quality: 99.3,
    rpm: 185,
    temp: 34,
    power: 8.6,
    parts: 864,
    plc: 'Omron NX1P2 (OPC-UA / MQTT)',
  },
];

const STATUS_META = {
  running: { label: 'RUNNING', color: '#22c55e', hex: 0x22c55e, bg: 'rgba(34, 197, 94, 0.18)', border: 'rgba(74, 222, 128, 0.55)' },
  idle: { label: 'IDLE / SETUP', color: '#facc15', hex: 0xfacc15, bg: 'rgba(250, 204, 21, 0.16)', border: 'rgba(250, 204, 21, 0.55)' },
  fault: { label: 'DOWNTIME ALERT', color: '#ef4444', hex: 0xef4444, bg: 'rgba(239, 68, 68, 0.2)', border: 'rgba(248, 113, 113, 0.65)' },
};

export default function MdmsFactory3D({ onBookDemo }) {
  const mountRef = useRef(null);
  const [machines, setMachines] = useState(INITIAL_MACHINES);
  const [selectedId, setSelectedId] = useState('cnc-01');
  const stateRef = useRef({ selectedId: 'cnc-01', machines: INITIAL_MACHINES });

  useEffect(() => {
    stateRef.current = { selectedId, machines };
  }, [selectedId, machines]);

  // Subtle live telemetry jitter every 1.4s for running machines
  useEffect(() => {
    const iv = setInterval(() => {
      setMachines((prev) =>
        prev.map((m) => {
          if (m.status !== 'running') return m;
          const delta = (Math.random() - 0.48) * 0.6;
          const nextOee = Math.max(72, Math.min(98.5, Number((m.oee + delta * 0.25).toFixed(1))));
          const nextPower = Math.max(4, Number((m.power + (Math.random() - 0.5) * 0.4).toFixed(1)));
          return {
            ...m,
            oee: nextOee,
            power: nextPower,
            parts: m.parts + (Math.random() > 0.45 ? 1 : 0),
          };
        })
      );
    }, 1400);
    return () => clearInterval(iv);
  }, []);

  const selected = machines.find((m) => m.id === selectedId) || machines[0];
  const stMeta = STATUS_META[selected.status];

  const setMachineStatus = (id, status) => {
    setMachines((prev) =>
      prev.map((m) => {
        if (m.id !== id) return m;
        const base = INITIAL_MACHINES.find((x) => x.id === id) || m;
        if (status === 'running') {
          return { ...m, status, rpm: base.rpm || 1450, power: base.power || 12.4, oee: Math.max(base.oee, 85.0) };
        }
        if (status === 'idle') {
          return { ...m, status, rpm: 0, power: 2.8, oee: Number((m.oee * 0.82).toFixed(1)) };
        }
        return { ...m, status, rpm: 0, power: 0.4, oee: Number((m.oee * 0.68).toFixed(1)) };
      })
    );
  };

  // Three.js 3D Shop-Floor Scene with Raycast Machine Selection
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
    const h = host.clientHeight || 410;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setSize(w, h, false);
    host.innerHTML = '';
    host.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(40, w / h, 0.1, 120);
    camera.position.set(0, 7.6, 12.6);
    camera.lookAt(0, 0.2, 0);

    // Lighting
    scene.add(new THREE.AmbientLight(0xdbeafe, 1.4));
    const key = new THREE.DirectionalLight(0xffffff, 2.2);
    key.position.set(7, 13, 9);
    scene.add(key);
    const cyanSpot = new THREE.PointLight(0x38bdf8, 2.8, 16);
    cyanSpot.position.set(-4, 4, 3);
    scene.add(cyanSpot);
    const orangeSpot = new THREE.PointLight(0xf47b20, 2.5, 16);
    orangeSpot.position.set(4, 4, -3);
    scene.add(orangeSpot);

    const floorGroup = new THREE.Group();
    scene.add(floorGroup);

    // Materials
    const matBase = new THREE.MeshStandardMaterial({ color: 0x0b1c36, metalness: 0.4, roughness: 0.65 });
    const matTrim = new THREE.MeshStandardMaterial({ color: 0x163563, metalness: 0.6, roughness: 0.35 });
    const matMachineBody = new THREE.MeshStandardMaterial({ color: 0x1e4075, metalness: 0.65, roughness: 0.28 });
    const matDarkSteel = new THREE.MeshStandardMaterial({ color: 0x0a1628, metalness: 0.85, roughness: 0.2 });
    const matOrange = new THREE.MeshStandardMaterial({ color: 0xf47b20, emissive: 0xf47b20, emissiveIntensity: 0.25, metalness: 0.45, roughness: 0.28 });
    const matCyan = new THREE.MeshStandardMaterial({ color: 0x38bdf8, emissive: 0x0ea5e9, emissiveIntensity: 0.4, metalness: 0.4, roughness: 0.22 });

    // Shop Floor Platform + Grid Lines
    const slab = new THREE.Mesh(new THREE.BoxGeometry(13.8, 0.35, 8.6), matTrim);
    slab.position.y = -0.22;
    floorGroup.add(slab);

    const deck = new THREE.Mesh(new THREE.BoxGeometry(13.2, 0.06, 8.0), matBase);
    deck.position.y = -0.02;
    floorGroup.add(deck);

    const gridHelper = new THREE.GridHelper(13, 18, 0x38bdf8, 0x16396b);
    gridHelper.position.y = 0.02;
    floorGroup.add(gridHelper);

    // Central Edge Datalogger Gateway Hub
    const hubGroup = new THREE.Group();
    hubGroup.position.set(0, 0.05, 0);
    const hubBase = new THREE.Mesh(new THREE.CylinderGeometry(0.75, 0.88, 0.3, 24), matDarkSteel);
    hubBase.position.y = 0.15;
    hubGroup.add(hubBase);
    const hubCore = new THREE.Mesh(new THREE.OctahedronGeometry(0.42, 0), matCyan);
    hubCore.position.y = 0.9;
    hubGroup.add(hubCore);
    const hubRing = new THREE.Mesh(new THREE.TorusGeometry(0.7, 0.035, 12, 36), matOrange);
    hubRing.position.y = 0.9;
    hubRing.rotation.x = Math.PI / 2;
    hubGroup.add(hubRing);
    floorGroup.add(hubGroup);

    // Selection Ring (follows active machine)
    const selectRing = new THREE.Mesh(
      new THREE.RingGeometry(1.32, 1.5, 40),
      new THREE.MeshBasicMaterial({ color: 0x38bdf8, side: THREE.DoubleSide })
    );
    selectRing.rotation.x = -Math.PI / 2;
    selectRing.position.y = 0.05;
    floorGroup.add(selectRing);

    // Build 4 Clickable 3D Machines
    const machineCoords = [
      { id: 'cnc-01', x: -3.8, z: -1.9 },
      { id: 'press-02', x: 3.8, z: -1.9 },
      { id: 'inj-03', x: -3.8, z: 2.0 },
      { id: 'conv-04', x: 3.8, z: 2.0 },
    ];

    const machineObjects = {};
    const clickableMeshes = [];
    const dataPulses = [];

    machineCoords.forEach(({ id, x, z }) => {
      const mGroup = new THREE.Group();
      mGroup.position.set(x, 0.04, z);

      // Machine Pedestal
      const pad = new THREE.Mesh(new THREE.BoxGeometry(2.3, 0.16, 1.9), matDarkSteel);
      pad.position.y = 0.08;
      mGroup.add(pad);

      // Machine Body
      const body = new THREE.Mesh(new THREE.BoxGeometry(1.75, 1.15, 1.35), matMachineBody);
      body.position.y = 0.72;
      mGroup.add(body);

      // Animated Working Element per machine
      let mover;
      if (id === 'cnc-01') {
        mover = new THREE.Mesh(new THREE.TorusKnotGeometry(0.28, 0.08, 48, 8), matOrange);
        mover.position.set(0, 1.55, 0);
      } else if (id === 'press-02') {
        mover = new THREE.Mesh(new THREE.BoxGeometry(0.95, 0.35, 0.8), matOrange);
        mover.position.set(0, 1.55, 0);
      } else if (id === 'inj-03') {
        mover = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.22, 0.9, 16), matCyan);
        mover.rotation.z = Math.PI / 2;
        mover.position.set(0, 1.48, 0);
      } else {
        mover = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.45, 0.55), matOrange);
        mover.position.set(0, 1.52, 0);
      }
      mGroup.add(mover);

      // Status Tower Light Pole + Glowing Beacon
      const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.9, 10), matDarkSteel);
      pole.position.set(0.75, 1.55, -0.5);
      mGroup.add(pole);

      const beaconMat = new THREE.MeshBasicMaterial({ color: 0x22c55e });
      const beacon = new THREE.Mesh(new THREE.SphereGeometry(0.16, 16, 16), beaconMat);
      beacon.position.set(0.75, 2.02, -0.5);
      mGroup.add(beacon);

      // Tag every child mesh with machineId for raycasting
      mGroup.traverse((child) => {
        if (child.isMesh) {
          child.userData.machineId = id;
          clickableMeshes.push(child);
        }
      });

      floorGroup.add(mGroup);
      machineObjects[id] = { group: mGroup, mover, beaconMat, x, z };

      // Glowing Conduit Line from Machine -> Central Edge Gateway Hub
      const startVec = new THREE.Vector3(x, 0.06, z);
      const endVec = new THREE.Vector3(0, 0.06, 0);
      const lineGeo = new THREE.BufferGeometry().setFromPoints([startVec, endVec]);
      const line = new THREE.Line(lineGeo, new THREE.LineBasicMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.45 }));
      floorGroup.add(line);

      // Travelling Data Pulse Sphere along Conduit
      const pulse = new THREE.Mesh(
        new THREE.SphereGeometry(0.11, 10, 10),
        new THREE.MeshBasicMaterial({ color: 0x7dd3fc })
      );
      floorGroup.add(pulse);
      dataPulses.push({ id, mesh: pulse, startVec, endVec, offset: Math.random() });
    });

    // Orbit Drag + Click Raycasting
    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();
    let isDragging = false;
    let movedDist = 0;
    let prevX = 0;
    let prevY = 0;
    let orbitY = 0;
    let orbitX = 0.04;

    const onDown = (cx, cy) => {
      isDragging = true;
      movedDist = 0;
      prevX = cx;
      prevY = cy;
    };
    const onMove = (cx, cy) => {
      if (!isDragging) return;
      const dx = cx - prevX;
      const dy = cy - prevY;
      movedDist += Math.abs(dx) + Math.abs(dy);
      orbitY += dx * 0.008;
      orbitX = Math.max(-0.22, Math.min(0.45, orbitX + dy * 0.006));
      prevX = cx;
      prevY = cy;
    };
    const onUp = (cx, cy) => {
      const wasClick = isDragging && movedDist < 6;
      isDragging = false;
      if (wasClick && cx !== undefined) {
        const rect = host.getBoundingClientRect();
        pointer.x = ((cx - rect.left) / rect.width) * 2 - 1;
        pointer.y = -((cy - rect.top) / rect.height) * 2 + 1;
        raycaster.setFromCamera(pointer, camera);
        const hits = raycaster.intersectObjects(clickableMeshes, false);
        if (hits.length > 0 && hits[0].object.userData.machineId) {
          setSelectedId(hits[0].object.userData.machineId);
        }
      }
    };

    const hDown = (e) => onDown(e.clientX, e.clientY);
    const hMove = (e) => onMove(e.clientX, e.clientY);
    const hUp = (e) => onUp(e.clientX, e.clientY);
    const hTouchStart = (e) => e.touches.length === 1 && onDown(e.touches[0].clientX, e.touches[0].clientY);
    const hTouchMove = (e) => e.touches.length === 1 && onMove(e.touches[0].clientX, e.touches[0].clientY);
    const hTouchEnd = () => { isDragging = false; };

    host.addEventListener('mousedown', hDown);
    window.addEventListener('mousemove', hMove, { passive: true });
    window.addEventListener('mouseup', hUp);
    host.addEventListener('touchstart', hTouchStart, { passive: true });
    window.addEventListener('touchmove', hTouchMove, { passive: true });
    window.addEventListener('touchend', hTouchEnd);

    let raf = 0;
    const start = performance.now();

    const animate = (now) => {
      const t = (now - start) * 0.001;
      const { selectedId: curSel, machines: curMachines } = stateRef.current;

      // Update selection ring position & pulse
      const selObj = machineObjects[curSel];
      if (selObj) {
        selectRing.position.x = selObj.x;
        selectRing.position.z = selObj.z;
        const s = 1 + Math.sin(t * 4) * 0.07;
        selectRing.scale.set(s, s, s);
      }

      // Animate central gateway hub
      hubCore.rotation.y = t * 1.1;
      hubCore.rotation.x = t * 0.6;
      hubRing.rotation.z = -t * 0.8;

      // Animate each machine according to its live status
      curMachines.forEach((m) => {
        const obj = machineObjects[m.id];
        if (!obj) return;
        obj.beaconMat.color.setHex(STATUS_META[m.status].hex);

        if (m.status === 'running') {
          if (m.id === 'cnc-01') {
            obj.mover.rotation.y = t * 2.5;
            obj.mover.rotation.x = t * 1.2;
          } else if (m.id === 'press-02') {
            obj.mover.position.y = 1.55 + Math.sin(t * 5) * 0.2;
          } else if (m.id === 'inj-03') {
            obj.mover.rotation.x = t * 3;
          } else {
            obj.mover.position.x = Math.sin(t * 2.4) * 0.45;
            obj.mover.rotation.y = t * 1.5;
          }
        }
      });

      // Animate data pulses flowing from running machines into Edge Hub
      dataPulses.forEach((p) => {
        const mach = curMachines.find((x) => x.id === p.id);
        if (mach && mach.status === 'running') {
          p.mesh.visible = true;
          const prog = (t * 0.55 + p.offset) % 1;
          p.mesh.position.lerpVectors(p.startVec, p.endVec, prog);
        } else {
          p.mesh.visible = false;
        }
      });

      floorGroup.rotation.y = orbitY + Math.sin(t * 0.3) * 0.05;
      floorGroup.rotation.x = orbitX;

      renderer.render(scene, camera);
      raf = requestAnimationFrame(animate);
    };
    raf = requestAnimationFrame(animate);

    const onResize = () => {
      if (!host) return;
      const nw = host.clientWidth || 720;
      const nh = host.clientHeight || 410;
      camera.aspect = nw / nh;
      camera.updateProjectionMatrix();
      renderer.setSize(nw, nh, false);
    };
    window.addEventListener('resize', onResize, { passive: true });

    return () => {
      cancelAnimationFrame(raf);
      host.removeEventListener('mousedown', hDown);
      window.removeEventListener('mousemove', hMove);
      window.removeEventListener('mouseup', hUp);
      host.removeEventListener('touchstart', hTouchStart);
      window.removeEventListener('touchmove', hTouchMove);
      window.removeEventListener('touchend', hTouchEnd);
      window.removeEventListener('resize', onResize);
      renderer.dispose();
    };
  }, []);

  return (
    <div className="sp3d-wrapper">
      {/* Top Machine Selector Pills */}
      <div className="mdms3d-tabs">
        {machines.map((m) => {
          const meta = STATUS_META[m.status];
          return (
            <button
              key={m.id}
              type="button"
              onClick={() => setSelectedId(m.id)}
              className={`sp3d-step-btn ${selectedId === m.id ? 'active' : ''}`}
              style={{ justifyContent: 'space-between' }}
            >
              <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ width: 9, height: 9, borderRadius: '50%', background: meta.color, boxShadow: `0 0 8px ${meta.color}` }} />
                <span>{m.code}</span>
              </span>
              <span style={{ fontSize: 11.5, opacity: 0.9 }}>{m.oee}% OEE</span>
            </button>
          );
        })}
      </div>

      {/* Main 3D Factory Floor + Live Telemetry Inspector */}
      <div className="sp3d-main-grid">
        {/* LEFT: Interactive 3D Factory Floor */}
        <div className="sp3d-stage-box">
          <div className="sp3d-hud-top">
            <div className="sp3d-live-pill">
              <span className="pulse-dot-3d" />
              <span>3D MDMS FACTORY FLOOR · CLICK ANY MACHINE OR DRAG 360°</span>
            </div>
            <button
              type="button"
              onClick={() => setMachines(INITIAL_MACHINES)}
              className="sp3d-ctrl-btn"
            >
              <RotateCcw size={13} /> Reset Plant
            </button>
          </div>

          <div ref={mountRef} className="sp3d-canvas-host" />

          <div className="sp3d-stage-caption" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
            <div>
              <div style={{ fontSize: 12, color: '#38bdf8', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                Selected Asset · {selected.bay}
              </div>
              <div style={{ fontSize: 17, fontWeight: 800, color: '#ffffff' }}>
                {selected.code} — {selected.name}
              </div>
            </div>
            <span
              style={{
                padding: '5px 12px',
                borderRadius: 999,
                background: stMeta.bg,
                border: `1px solid ${stMeta.border}`,
                color: stMeta.color,
                fontSize: 12,
                fontWeight: 800,
              }}
            >
              ● {stMeta.label}
            </span>
          </div>
        </div>

        {/* RIGHT: Live MDMS Machine Telemetry & Controls */}
        <div className="sp3d-kiosk-card">
          <div className="sp3d-kiosk-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Activity size={18} color="#38bdf8" />
              <span>LIVE MDMS EDGE TELEMETRY</span>
            </div>
            <span className="sp3d-plate-badge" style={{ background: '#38bdf8', color: '#07162c' }}>
              {selected.code}
            </span>
          </div>

          <div className="sp3d-kiosk-body" style={{ gap: 14 }}>
            {/* OEE Hero Meter */}
            <div className="sp3d-timer-box" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: 11.5, color: '#93c5fd', fontWeight: 700, textTransform: 'uppercase' }}>
                  Live Shift OEE
                </div>
                <div style={{ fontSize: 34, fontWeight: 800, color: '#ffffff', lineHeight: 1.1, marginTop: 4 }}>
                  {selected.oee}%
                </div>
                <div style={{ fontSize: 12, color: '#cbd5e1', marginTop: 4 }}>
                  {selected.plc}
                </div>
              </div>
              <div style={{ textAlign: 'right', fontSize: 12.5, color: '#cbd5e1', lineHeight: 1.7 }}>
                <div>Avail: <b style={{ color: '#4ade80' }}>{selected.availability}%</b></div>
                <div>Perf: <b style={{ color: '#38bdf8' }}>{selected.performance}%</b></div>
                <div>Qual: <b style={{ color: '#ff9d52' }}>{selected.quality}%</b></div>
              </div>
            </div>

            {/* 4 Live Sensor Readouts */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <div className="mdms3d-stat">
                <Gauge size={16} color="#38bdf8" />
                <div>
                  <small>Spindle / Cycle</small>
                  <b>{selected.rpm} {selected.id === 'press-02' ? 'SPM' : 'RPM'}</b>
                </div>
              </div>
              <div className="mdms3d-stat">
                <Zap size={16} color="#facc15" />
                <div>
                  <small>Power Load</small>
                  <b>{selected.power} kW</b>
                </div>
              </div>
              <div className="mdms3d-stat">
                <Thermometer size={16} color="#f47b20" />
                <div>
                  <small>Motor Temp</small>
                  <b>{selected.temp} °C</b>
                </div>
              </div>
              <div className="mdms3d-stat">
                <Cpu size={16} color="#4ade80" />
                <div>
                  <small>Shift Output</small>
                  <b>{selected.parts} pcs</b>
                </div>
              </div>
            </div>

            {/* Interactive Status Simulator Buttons */}
            <div>
              <div style={{ fontSize: 11.5, color: '#93c5fd', fontWeight: 700, textTransform: 'uppercase', marginBottom: 8 }}>
                Simulate Machine State on 3D Floor:
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
                <button
                  type="button"
                  onClick={() => setMachineStatus(selected.id, 'running')}
                  className="mdms3d-state-btn"
                  style={{ borderColor: selected.status === 'running' ? '#22c55e' : undefined, color: '#4ade80' }}
                >
                  <Play size={13} /> Run
                </button>
                <button
                  type="button"
                  onClick={() => setMachineStatus(selected.id, 'idle')}
                  className="mdms3d-state-btn"
                  style={{ borderColor: selected.status === 'idle' ? '#facc15' : undefined, color: '#facc15' }}
                >
                  <Pause size={13} /> Idle
                </button>
                <button
                  type="button"
                  onClick={() => setMachineStatus(selected.id, 'fault')}
                  className="mdms3d-state-btn"
                  style={{ borderColor: selected.status === 'fault' ? '#ef4444' : undefined, color: '#f87171' }}
                >
                  <AlertTriangle size={13} /> Fault
                </button>
              </div>
            </div>

            {onBookDemo && (
              <button
                type="button"
                onClick={onBookDemo}
                className="btn btn-primary btn-3d-orange"
                style={{ width: '100%', justifyContent: 'center' }}
              >
                Book Live MDMS Factory Demo →
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

