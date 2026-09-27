require('dotenv').config();
const connectDB = require('../config/db');
const User = require('../models/User');
const Service = require('../models/Service');
const Technology = require('../models/Technology');
const slugify = require('../utils/slugify');

(async () => {
  await connectDB();

  // `npm run seed:fresh` -> wipe content collections first, then reseed
  if (process.argv.includes('fresh')) {
    const models = ['Product', 'Service', 'Technology', 'Workflow', 'Stat', 'Industry', 'Testimonial', 'Post', 'TeamMember', 'Opening', 'Client'];
    for (const m of models) {
      try { await require(`../models/${m}`).deleteMany({}); } catch { /* ignore */ }
    }
    try { await require('../models/SiteContent').deleteMany({ key: { $in: ['about', 'social', 'contact', 'logo'] } }); } catch { /* ignore */ }
    console.log('Fresh: cleared content collections.');
  }

  const userId = (process.env.SEED_ADMIN_USERID || 'admin').toLowerCase();
  let admin = await User.findOne({ userId });
  if (admin) console.log(`Admin '${userId}' exists — skip.`);
  else {
    admin = new User({ name: process.env.SEED_ADMIN_NAME || 'Admin', userId, password: process.env.SEED_ADMIN_PASSWORD || 'Admin@123' });
    await admin.save();
    console.log(`Admin created -> ${userId} / ${process.env.SEED_ADMIN_PASSWORD || 'Admin@123'}`);
  }
  // seed 3 default services if none
  if (await Service.countDocuments() === 0) {
    const svc = [
      {
        title: 'Process Automation', icon: 'process', order: 1,
        summary: 'Turn manual workflows into monitored, self-running processes.',
        intro: 'We convert manual, repetitive workflows into automated, monitored processes — with live data, control and reporting so nothing runs blind.',
        features: ['PLC & SCADA integration', 'Real-time machine monitoring', 'Production & traceability systems'],
        groups: [
          { heading: 'What we automate', items: ['PLC & SCADA integration', 'Real-time machine monitoring', 'Recipe / sequence control', 'Production & traceability systems', 'Alarm & downtime tracking', 'Reports & dashboards'] },
          { heading: 'What you get', items: ['Live visibility of every machine', 'Automatic production counting', 'Traceability from material to dispatch', 'Fewer manual entries and errors'] },
        ],
      },
      {
        title: 'Home Automation', icon: 'home', order: 2,
        summary: 'Smart, secure and energy-aware homes.',
        intro: 'Comfort, security and energy savings — lighting, climate, security and appliances that respond to you, controlled by app or voice.',
        features: ['Lighting & climate control', 'Cameras & access control', 'Voice & app-based control'],
        groups: [
          { heading: 'What we set up', items: ['Lighting & climate control', 'Cameras & access control', 'Voice & app-based control', 'Energy monitoring', 'Scenes & scheduling', 'Security & alerts'] },
          { heading: 'What you get', items: ['One app for the whole home', 'Lower energy bills', 'Peace-of-mind security', 'Comfort on autopilot'] },
        ],
      },
      {
        title: 'Industrial Automation', icon: 'industry', order: 3,
        summary: 'Robotics, vision inspection and control on the factory floor.',
        intro: 'End-to-end factory automation — robotic cells, vision inspection and control systems that lift throughput and quality across the line.',
        features: ['Robotic pick, place & handling', 'Vision-based quality inspection', 'Line control & IoT gateways'],
        groups: [
          { heading: 'What we build', items: ['Robotic pick, place & handling', 'Vision-based quality inspection', 'Line control & IoT gateways', 'HMI / SCADA systems', 'Safety systems & interlocks', 'MES / ERP integration'] },
          { heading: 'What you get', items: ['Higher throughput per line', 'Consistent, inspected quality', 'Less downtime and rework', 'Plant-wide data & control'] },
        ],
      },
    ];
    await Service.insertMany(svc.map(s => ({ ...s, slug: slugify(s.title) })));
    console.log('Seeded 3 services with details.');
  }
  if (await Technology.countDocuments() === 0) {
    const tech = [
      {
        title: 'Robotics', summary: 'Automate with precision.', icon: 'robot', order: 1,
        intro: 'Robots handle repetitive, precise and heavy tasks reliably — shift after shift — freeing your people for higher-value work. We select, program and integrate the right robot for the job.',
        groups: [
          { heading: 'What robots do for you', items: ['Pick & place', 'Machine loading / unloading', 'Assembly', 'Palletizing & de-palletizing', 'Material handling', 'Welding / dispensing / screwing', 'Vision-guided handling'] },
          { heading: 'Types we work with', items: ['6-axis industrial arms', 'SCARA robots', 'Collaborative robots (cobots)', 'Gantry / cartesian systems'] },
          { heading: 'Where it fits', items: ['CNC / press tending', 'Packaging lines', 'Assembly stations', 'Warehouse & logistics'] },
        ],
      },
      {
        title: 'Machine Vision', summary: 'See more, inspect faster.', icon: 'vision', order: 2,
        intro: 'Cameras and vision AI inspect, measure, read and verify at speeds and consistency no operator can match — and log every result for full traceability.',
        groups: [
          { heading: 'What it inspects', items: ['Defect & flaw detection', 'Dimensional measurement', 'Presence / absence check', 'Colour & surface inspection', 'Assembly verification', 'OCR / barcode / QR reading'] },
          { heading: 'How it helps', items: ['100% inspection at line speed', 'Fewer rejects reaching the customer', 'Data on where defects come from', 'Vision guidance for robots'] },
          { heading: 'Where it fits', items: ['Quality inspection stations', 'Sorting & grading', 'Label / print verification', 'Vision-guided robotics'] },
        ],
      },
      {
        title: 'Machine Intelligence', summary: 'Make smarter decisions.', icon: 'ai', order: 3,
        intro: 'Models learn your process from the data your plant already produces — predicting failures, spotting anomalies and optimising output so you improve continuously.',
        groups: [
          { heading: 'What it delivers', items: ['Predictive maintenance', 'Anomaly & fault detection', 'OEE & performance analytics', 'Quality / yield prediction', 'Process optimisation', 'Condition monitoring'] },
          { heading: 'How it helps', items: ['Stop failures before they happen', 'Reduce unplanned downtime', 'Optimise cycle time & energy', 'Turn raw data into decisions'] },
          { heading: 'Where it fits', items: ['Downtime prediction', 'Quality analytics', 'Energy optimisation', 'Plant-level dashboards'] },
        ],
      },
    ];
    await Technology.insertMany(tech.map(t => ({ ...t, slug: slugify(t.title) })));
    console.log('Seeded 3 technologies with details.');
  }
  // workflow
  const Workflow = require('../models/Workflow');
  if (await Workflow.countDocuments() === 0) {
    const wf = [
      {
        title: 'Process Analysis', summary: 'Identify tasks and design the workflow',
        intro: "The first step is to understand the customer's existing production or industrial process.",
        groups: [{ heading: 'What we do', items: ['Study the existing process and workflow', 'Identify manual and repetitive tasks', 'Understand machine operations', 'Identify automation opportunities', 'Analyze production cycle time', 'Identify required sensors, PLCs, robots, cameras, and software', 'Define the complete Input → Process → Output flow'] }],
        example: 'Manual: Part Loading → Machine Process → Part Unloading → Vision Inspection → OK/NG Sorting.  Automated: Robot → Machine → Vision Camera → PLC → Automatic Sorting.',
        output: 'Process Flow + Automation Requirements + Initial System Design',
      },
      {
        title: 'Development', summary: 'Build automation tools and bots',
        intro: 'Once the process is understood, the required automation solution is developed.',
        groups: [
          { heading: 'PLC Development', items: ['Sequence control', 'Sensor logic', 'Interlocking', 'Alarm handling', 'Machine communication'] },
          { heading: 'Robotics', items: ['Pick & Place', 'Machine loading/unloading', 'Assembly', 'Palletizing', 'Material handling'] },
          { heading: 'Machine Vision', items: ['Image acquisition', 'Object detection', 'Quality inspection', 'Dimension inspection', 'Defect detection', 'OCR / Barcode / QR inspection'] },
          { heading: 'Software', items: ['HMI', 'SCADA', 'Machine dashboards', 'Data logging', 'Database integration', 'API communication'] },
        ],
        example: 'Camera → Image Processing → OK/NG Decision → PLC → Reject Mechanism',
        output: 'Working Automation System / Robot Program / Vision Application / Software',
      },
      {
        title: 'Testing', summary: 'Validate the full workflow end-to-end',
        intro: 'The complete system is tested before being introduced into production — under both normal and abnormal conditions.',
        groups: [{ heading: 'We verify', items: ['Sensor operation', 'Robot movement', 'Camera performance', 'Vision inspection accuracy', 'PLC logic', 'Machine communication', 'Safety interlocks', 'Emergency stop', 'Fault handling', 'System recovery', 'Long-duration operation'] }],
        example: 'If the camera fails: Camera Failure → System Detects Fault → Alarm → Safe Machine State',
        output: 'Validated and Reliable Automation System',
      },
      {
        title: 'Deployment', summary: 'Deploy to production',
        intro: 'After successful testing, the automation system is installed and commissioned at the actual production site.',
        groups: [
          { heading: 'Hardware', items: ['PLC', 'Industrial PC', 'Robot', 'Cameras', 'Sensors', 'Control panels', 'Networking equipment', 'Safety devices'] },
          { heading: 'Software', items: ['PLC program', 'HMI', 'Vision software', 'Database', 'Dashboard', 'Communication drivers'] },
          { heading: 'Other activities', items: ['Electrical wiring', 'Network configuration', 'Sensor alignment', 'Camera calibration', 'Robot positioning', 'Safety validation', 'Operator training'] },
        ],
        example: '',
        output: 'Production-Ready Automation System',
      },
      {
        title: 'Monitoring', summary: '24/7 performance tracking',
        intro: 'After deployment, the system is continuously monitored to ensure stable and efficient operation. This is where MDMS — Machine Data Monitoring System — adds significant value.',
        groups: [
          { heading: 'Machine Status', items: ['Machine ON/OFF', 'Running/Idle', 'Fault status', 'Cycle time'] },
          { heading: 'Production', items: ['Production count', 'OK/NG count', 'Hourly production', 'Shift production'] },
          { heading: 'Performance', items: ['Target vs Actual', 'Efficiency', 'Downtime', 'OEE parameters'] },
          { heading: 'Process Parameters', items: ['Temperature', 'Pressure', 'Speed', 'Current', 'PLC parameters'] },
          { heading: 'Events', items: ['Alarms', 'Machine faults', 'Sensor failures', 'Communication failures'] },
        ],
        example: 'Live dashboard: Machine 01 RUNNING 1,245 · Machine 02 STOPPED 985 · Machine 03 RUNNING 1,532 · Machine 04 FAULT 745',
        output: 'Real-Time Visibility + Historical Data + Alerts',
      },
      {
        title: 'Optimization', summary: 'Continuous improvement',
        intro: 'The final stage uses collected production and machine data to continuously improve the process.',
        groups: [{ heading: 'Optimization focus', items: ['Downtime reduction — identify major causes of stoppages', 'Cycle-time improvement', 'Quality improvement — analyze inspection data & recurring defects', 'Robot optimization — optimize paths and movements', 'Process optimization — improve operating conditions', 'Energy optimization — reduce machine energy consumption'] }],
        example: '',
        output: 'Continuous Process Improvement',
      },
    ];
    await Workflow.insertMany(wf.map((w, i) => ({ ...w, slug: slugify(w.title), order: i + 1 })));
    console.log('Seeded 6 workflow steps with full details.');
  }
  // stats
  const Stat = require('../models/Stat');
  if (await Stat.countDocuments() === 0) {
    const st = [
      { label: 'Automation projects', value: '50+', order: 1 },
      { label: 'Years of expertise', value: '10+', order: 2 },
      { label: 'System uptime', value: '99%', order: 3 },
      { label: 'Support & monitoring', value: '24/7', order: 4 },
    ];
    await Stat.insertMany(st.map(s => ({ ...s, slug: slugify(s.label) })));
    console.log('Seeded 4 stats.');
  }
  // industries
  const Industry = require('../models/Industry');
  if (await Industry.countDocuments() === 0) {
    const ind = ['Textile & Fabric', 'Automotive Parts', 'Packaging', 'Cylinders & Gas', 'Electronics', 'Food & Beverage', 'Warehousing', 'Smart Homes'];
    await Industry.insertMany(ind.map((title, i) => ({ title, slug: slugify(title), order: i + 1 })));
    console.log('Seeded 8 industries.');
  }
  // MDMS product versions (full details)
  const Product = require('../models/Product');
  // Home Automation lineup — seeded only if the category is empty
  if (await Product.countDocuments({ category: 'Home Automation' }) === 0) {
    const ha = [
      {
        name: 'HA-Lite Smart Switch Kit', vname: 'Smart Switch Kit', focus: 'Retrofit — lights & fans',
        cap: 'Wi-Fi smart switch / relay modules that fit behind your existing switchboards — app, voice and schedule control without rewiring',
        purpose: 'Ghar ke existing switches ko smart banana — koi wiring change nahi, purane switch bhi kaam karte rahein.',
        positioning: 'Make your existing switches smart.', buildsOn: '',
        features: ['Fits behind existing switchboard (retrofit)', '2 / 4 / 8-channel relay modules', 'Fan speed regulator module', 'App control — Android & iOS', 'Voice: Alexa & Google Home', 'Schedules & timers (e.g. lights off at 11 pm)', 'Existing physical switches keep working', 'Works on Wi-Fi, local control when internet is down', 'Power-cut memory — restores last state', 'Installed in 2–3 hours per home'],
        specs: [
          { label: 'Channels', value: '2 / 4 / 8 per module, fan module' },
          { label: 'Load', value: 'Up to 10 A per channel (lights, fans, sockets)' },
          { label: 'Connectivity', value: 'Wi-Fi 2.4 GHz' },
          { label: 'Control', value: 'App, voice (Alexa / Google), schedules, wall switch' },
          { label: 'Install', value: 'Behind existing switchboard, no rewiring' },
          { label: 'Ideal for', value: 'Flats, 1–3 BHK, rented homes' },
        ],
      },
      {
        name: 'HA-Home Smart Home Controller', vname: 'Smart Home Controller', focus: 'Whole-home automation',
        cap: 'Central hub for lighting, fans, AC, curtains, geyser and sockets — scenes, energy monitoring and reliable local control',
        purpose: 'Poore ghar ko ek app aur ek hub se chalana — scenes (Good Morning / Movie / Away), energy monitoring aur internet ke bina bhi local control.',
        positioning: 'One app for the whole home.', buildsOn: 'HA-Lite',
        features: ['Central hub — local control, works without internet', 'Lighting, fans, AC (IR), curtains, geyser, sockets', 'Scenes: Good Morning, Movie, Away, Sleep', 'Room-wise and floor-wise control', 'Energy monitoring per circuit', 'Touch panels & scene switches', 'Motion / door sensors for auto lights', 'Water tank level & pump automation', 'Scheduling, sunrise/sunset rules', 'Multi-user access with roles', 'Alexa / Google / Siri shortcuts', 'Remote access from anywhere'],
        specs: [
          { label: 'Hub', value: 'Local controller, 1 per home (up to 64 devices)' },
          { label: 'Devices', value: 'Relay modules, dimmers, IR blaster, curtain motor, sensors' },
          { label: 'Connectivity', value: 'Wi-Fi + Zigbee / RS485 wired option' },
          { label: 'Control', value: 'App, touch panels, voice, automations' },
          { label: 'Energy', value: 'Per-circuit kWh & load monitoring' },
          { label: 'Ideal for', value: 'Independent houses, 3–5 BHK, new construction' },
        ],
      },
      {
        name: 'HA-Secure Security & Access', vname: 'Security & Access', focus: 'Safety, cameras, locks',
        cap: 'Video doorbell, CCTV with AI person detection, smart locks, gate control and door / gas / smoke sensors — alerts on your phone',
        purpose: 'Ghar ki security ko automation se jodna — kaun aaya, darwaza khula ya band, gas/smoke alert, sab phone pe.',
        positioning: 'Know who is at your door — from anywhere.', buildsOn: '',
        features: ['Video doorbell with two-way talk', 'CCTV integration with AI person / vehicle detection', 'Smart door lock — PIN, fingerprint, app', 'Main gate / garage control', 'Door & window sensors', 'Gas leak & smoke sensors with siren', 'Instant alerts on phone / WhatsApp', 'Auto lights on motion at night', 'Away mode — arm everything with one tap', 'Recording & event history'],
        specs: [
          { label: 'Cameras', value: 'IP CCTV / doorbell, AI detection on edge' },
          { label: 'Access', value: 'Smart lock, gate/garage relay, intercom' },
          { label: 'Sensors', value: 'Door, motion, gas, smoke, water leak' },
          { label: 'Alerts', value: 'App push, WhatsApp, siren' },
          { label: 'Works with', value: 'HA-Home controller or standalone' },
          { label: 'Ideal for', value: 'Villas, independent houses, elderly-care homes' },
        ],
      },
      {
        name: 'HA-Villa Building Automation', vname: 'Building Automation', focus: 'Villas, offices, multi-floor',
        cap: 'Multi-floor lighting & HVAC control, energy and solar management, water and pump automation, gate/parking — one dashboard for the whole building',
        purpose: 'Bade ghar, office ya building ko ek system se manage karna — HVAC, lighting, energy, water aur access, sab ek dashboard pe.',
        positioning: 'Automate the whole building.', buildsOn: 'HA-Home',
        features: ['Multi-floor / multi-zone lighting control', 'HVAC & AC scheduling by occupancy', 'Solar + grid energy management', 'Water tank, borewell & pump automation', 'Parking / gate / lift lobby control', 'Common-area lighting on timers & sensors', 'Building dashboard with energy reports', 'Alarm & fault notifications to facility team', 'Integration with CCTV & access control', 'Wired (RS485 / KNX-style) for reliability'],
        specs: [
          { label: 'Scale', value: 'Up to 500 devices, multi-floor' },
          { label: 'Systems', value: 'Lighting, HVAC, energy, water, access' },
          { label: 'Backbone', value: 'Wired RS485 / Ethernet, Wi-Fi for accessories' },
          { label: 'Dashboard', value: 'Web dashboard + app, energy reports' },
          { label: 'Ideal for', value: 'Villas, farmhouses, offices, small buildings' },
        ],
      },
    ];
    await Product.insertMany(ha.map((m, i) => ({
      name: m.name, slug: slugify(m.name), category: 'Home Automation',
      summary: `${m.vname} — ${m.focus}`, description: m.cap,
      purpose: m.purpose, positioning: m.positioning, buildsOn: m.buildsOn, features: m.features,
      specs: [{ label: 'Version Name', value: m.vname }, { label: 'Core Focus', value: m.focus }, ...m.specs],
      order: i + 1,
    })));
    console.log(`Seeded ${ha.length} Home Automation products.`);
  }

  // Datalogger lineup (edge hardware/agent that feeds MDMS) — seeded only if the category is empty
  if (await Product.countDocuments({ category: 'Datalogger' }) === 0) {
    const dl = [
      {
        name: 'DL-100 Basic Datalogger', vname: 'Basic Datalogger', focus: 'Single-machine local logging',
        cap: 'Modbus RTU / digital I/O data recorded locally — machine ON/OFF, production count, key parameters',
        purpose: 'Ek machine ke PLC ya sensor se reliable data nikaal kar locally record karna — bina machine ka program badle.',
        positioning: 'Record what your machine does.', buildsOn: '',
        features: ['RS485 Modbus RTU (PLC / VFD / energy meter)', '4 digital inputs (run, count, alarm)', 'Machine ON / OFF / idle status', 'Production count & cycle time', 'Local storage — CSV / JSONL, day-wise files', 'USB export', 'Auto-start on power-on', 'Watchdog auto-restart', 'Config file — no coding', 'DIN-rail mount, 24 V DC'],
        specs: [
          { label: 'Inputs', value: '1× RS485 (Modbus RTU), 4× DI, 2× DO' },
          { label: 'Protocols', value: 'Modbus RTU' },
          { label: 'Connectivity', value: 'USB export (no network required)' },
          { label: 'Storage', value: 'Local, 90-day retention (extendable)' },
          { label: 'Sampling', value: '1 s (configurable)' },
          { label: 'Machines', value: '1 per unit' },
          { label: 'Power / Mount', value: '24 V DC, DIN rail' },
          { label: 'Ideal for', value: 'One machine, no network, audit/record keeping' },
        ],
      },
      {
        name: 'DL-200 Connected Datalogger', vname: 'Connected Datalogger', focus: 'Multi-machine, online',
        cap: 'Modbus RTU + TCP, Ethernet / Wi-Fi / 4G, cloud & MDMS push with offline buffer and local dashboard',
        purpose: 'Line ki 4–8 machines ko online laana — data MDMS / cloud tak pahunche, net gaya toh bhi data na jaye.',
        positioning: 'Every machine, online.', buildsOn: 'DL-100',
        features: ['Modbus TCP + RTU (mixed machines on one unit)', 'Up to 8 machines per unit', 'Ethernet / Wi-Fi / 4G connectivity', 'Push to MDMS or any cloud API (JSON)', 'Offline buffer — auto-sync when network returns', 'Local live dashboard (browser, no install)', 'Running / idle / stopped detection', 'Shift-wise production & downtime', 'Email / WhatsApp alerts on stop & fault', 'Remote config & health monitoring', 'Systemd/24×7 service with auto-recovery', 'Secure API key + HTTPS'],
        specs: [
          { label: 'Inputs', value: '2× RS485, 1× Ethernet, 8× DI, 4× DO' },
          { label: 'Protocols', value: 'Modbus RTU, Modbus TCP, HTTP/JSON, MQTT' },
          { label: 'Connectivity', value: 'Ethernet, Wi-Fi, 4G (SIM)' },
          { label: 'Storage', value: 'Local buffer 30 days + cloud' },
          { label: 'Sampling', value: '500 ms – 1 s' },
          { label: 'Machines', value: 'Up to 8 per unit' },
          { label: 'Dashboard', value: 'Local web + MDMS 2.0 / 2.1' },
          { label: 'Ideal for', value: 'Production line, shift reporting, remote monitoring' },
        ],
      },
      {
        name: 'DL-300 Multi-Protocol Edge Logger', vname: 'Multi-Protocol Edge Logger', focus: 'Plant-level, any PLC',
        cap: 'PLC-native protocols (Siemens, Mitsubishi, Omron, Delta, ABB, Inovance, Allen-Bradley), analog & thermocouple inputs, energy meters, MQTT / OPC-UA, MDMS 2.2+ integration',
        purpose: 'Mixed-brand PLC wale poore plant ko ek box se cover karna — data direct PLC se, sensor se aur energy meter se, ek hi platform mein.',
        positioning: 'One box, every protocol.', buildsOn: 'DL-200',
        features: ['Siemens S7 (S7-200 SMART / 1200 / 1500)', 'Mitsubishi FX / FX5U / Q (MC / SLMP)', 'Omron CP/CJ (FINS / Host Link)', 'Delta, ABB, Inovance, Allen-Bradley', 'Analog 4–20 mA / 0–10 V inputs', 'Thermocouple (K / J) & RTD inputs', 'Energy meter logging (kWh, PF, load)', 'OPC-UA & MQTT server/client', 'Register auto-discovery & tag mapping', 'Up to 32 machines per unit', 'Edge computing — OEE, cycle time, alarms on device', 'MDMS 2.2 / 2.3 / 2.4 integration', 'ERP / MES API integration', 'Redundant storage & remote diagnostics'],
        specs: [
          { label: 'Inputs', value: '4× RS485, 2× Ethernet, 8× AI (4–20 mA), 4× TC/RTD, 16× DI, 8× DO' },
          { label: 'Protocols', value: 'Modbus RTU/TCP, Siemens S7, MC/SLMP, FINS, Host Link, EtherNet/IP, MQTT, OPC-UA' },
          { label: 'Connectivity', value: 'Dual Ethernet, Wi-Fi, 4G' },
          { label: 'Storage', value: 'Local 1 year + cloud; edge analytics' },
          { label: 'Sampling', value: '100 ms – 1 s' },
          { label: 'Machines', value: 'Up to 32 per unit' },
          { label: 'Dashboard', value: 'MDMS 2.2 – 2.4, plant-level' },
          { label: 'Ideal for', value: 'Whole plant, mixed PLC brands, furnaces / process lines' },
        ],
      },
      {
        name: 'DL-R Retrofit Sensor Card', vname: 'Retrofit Sensor Card', focus: 'Machines without PLC',
        cap: 'Current / vibration / proximity sensor kit that gives running-idle-stopped status and production count on manual or legacy machines',
        purpose: 'Purani ya bina-PLC machines (lathe, press, manual lines) ko bhi monitoring mein laana — machine mein koi change nahi, sirf sensor lagta hai.',
        positioning: 'Monitor machines that have no PLC.', buildsOn: '',
        features: ['Clamp-on current sensor — running / idle / stopped', 'Proximity / photo sensor — production count', 'Vibration sensor option', 'Operator start / stop buttons (optional)', 'Downtime reason entry on small screen (optional)', 'Works with DL-200 / DL-300 over RS485', 'No PLC or machine wiring change', 'Fits in 1–2 hours per machine'],
        specs: [
          { label: 'Sensors', value: 'CT clamp (10–200 A), proximity, vibration' },
          { label: 'Outputs', value: 'RS485 Modbus RTU to DL-200 / DL-300' },
          { label: 'Power', value: '24 V DC from logger' },
          { label: 'Install', value: 'No machine program change, 1–2 hrs' },
          { label: 'Ideal for', value: 'Lathes, presses, manual & legacy machines' },
        ],
      },
    ];
    await Product.insertMany(dl.map((m, i) => ({
      name: m.name, slug: slugify(m.name), category: 'Datalogger',
      summary: `${m.vname} — ${m.focus}`, description: m.cap,
      purpose: m.purpose, positioning: m.positioning, buildsOn: m.buildsOn, features: m.features,
      specs: [{ label: 'Version Name', value: m.vname }, { label: 'Core Focus', value: m.focus }, ...m.specs],
      order: i + 1,
    })));
    console.log(`Seeded ${dl.length} Datalogger products.`);
  }

  if (await Product.countDocuments({ category: 'MDMS' }) === 0) {
    const mdms = [
      {
        name: 'MDMS 1.2', vname: 'Basic Machine Monitoring', focus: 'Machine data collection',
        cap: 'Machine status, sensor/PLC data, basic production monitoring',
        purpose: 'Machine se reliable data collect karke basic monitoring provide karna.',
        positioning: 'Know what your machine is doing.', buildsOn: '',
        features: ['PLC data acquisition', 'Sensor data monitoring', 'Machine ON/OFF status', 'Production count', 'Basic machine parameters', 'Basic dashboard', 'Basic alarm/status indication', 'Local data storage', 'Basic machine communication'],
      },
      {
        name: 'MDMS 2.0', vname: 'Machine Data Management', focus: 'Data & reporting',
        cap: 'Historical data, alarms, downtime, reports, database',
        purpose: 'Machine data ko properly store, manage aur report karna.',
        positioning: 'Collect, store and manage machine data.', buildsOn: 'MDMS 1.2',
        features: ['Historical data', 'Database management', 'Production history', 'Shift-wise production', 'Hour-wise production', 'Downtime monitoring', 'Fault/event history', 'Alarm logging', 'Production reports', 'Excel/CSV data export', 'Multiple machine support', 'User login'],
      },
      {
        name: 'MDMS 2.1', vname: 'Smart Machine Monitoring', focus: 'Real-time intelligence',
        cap: 'Advanced dashboard, cycle time, target vs actual, OEE',
        purpose: 'Raw machine data ko useful real-time information mein convert karna.',
        positioning: 'Understand machine performance in real time.', buildsOn: 'MDMS 2.0',
        features: ['Advanced real-time dashboard', 'Cycle-time monitoring', 'Target vs actual production', 'Production efficiency', 'OEE parameters', 'Trend graphs', 'Machine performance analysis', 'Advanced downtime analysis', 'Shift performance', 'Operator-wise monitoring', 'Improved user permissions'],
      },
      {
        name: 'MDMS 2.2', vname: 'Process Monitoring', focus: 'Process-level visibility',
        cap: 'Centralized monitoring, remote access, notifications, automated reports',
        purpose: 'Individual machine se aage badhkar complete process ko monitor karna.',
        positioning: 'Monitor the complete production process.', buildsOn: 'MDMS 2.1',
        features: ['Centralized monitoring', 'Multiple machine dashboard', 'Process-level dashboard', 'Remote monitoring', 'Automatic reports', 'Email/notification alerts', 'Server integration', 'Automatic data backup', 'System health monitoring', 'Advanced alarm management', 'Process trends', 'Department/line-wise monitoring'],
      },
      {
        name: 'MDMS 2.3', vname: 'Advanced Process Analytics', focus: 'Analytics & optimization',
        cap: 'Advanced analytics, performance analysis, condition monitoring',
        purpose: 'Collected production data ka deeper analysis karke process improvement ke liye information provide karna.',
        positioning: 'Turn process data into actionable insights.', buildsOn: 'MDMS 2.2',
        features: ['Advanced machine analytics', 'Performance comparison', 'Machine-to-machine comparison', 'Process parameter analysis', 'Downtime analytics', 'Loss analysis', 'Efficiency analysis', 'Condition monitoring', 'Abnormal-condition detection', 'Advanced KPI dashboard', 'Plant/line performance analysis', 'Custom reports', 'Advanced data visualization'],
      },
      {
        name: 'MDMS 2.4', vname: 'Intelligent Process Automation', focus: 'Automation & enterprise integration',
        cap: 'Advanced automation, API/cloud integration, predictive monitoring, plant-level system',
        purpose: 'MDMS ko monitoring system se intelligent process automation platform ki taraf le jana.',
        positioning: 'Connect, analyze and optimize the entire process.', buildsOn: 'MDMS 2.3',
        features: ['Advanced Process Automation integration', 'Enterprise/plant-level dashboard', 'Advanced API integration', 'Cloud/server integration', 'Predictive/condition monitoring', 'Automated decision-support', 'Intelligent alerts', 'Automated workflow integration', 'Centralized data architecture', 'Multi-line/multi-plant monitoring', 'Advanced user/role management', 'System diagnostics', 'High-level management dashboard', 'Integration with external ERP/MES systems'],
      },
    ];
    await Product.insertMany(mdms.map((m, i) => ({
      name: m.name, slug: slugify(m.name), category: 'MDMS',
      summary: `${m.vname} — ${m.focus}`, description: m.cap,
      purpose: m.purpose, positioning: m.positioning, buildsOn: m.buildsOn, features: m.features,
      specs: [
        { label: 'Version Name', value: m.vname },
        { label: 'Core Focus', value: m.focus },
        { label: 'Main Capability', value: m.cap },
      ],
      order: i + 1,
    })));
    console.log('Seeded 6 MDMS versions with full details.');
  }
  const Testimonial = require('../models/Testimonial');
  if (await Testimonial.countDocuments() === 0) {
    const t = [
      { author: 'Plant Head, Textile Unit', role: '', quote: 'Downtime dropped and our quality rejects fell sharply after the vision inspection went live.', order: 1 },
      { author: 'Operations Manager, Auto Parts', role: '', quote: 'A clear payback and a team that actually understands the shop floor.', order: 2 },
      { author: 'Director, Packaging Co.', role: '', quote: 'Real-time production data changed how we run every shift.', order: 3 },
    ];
    await Testimonial.insertMany(t.map(x => ({ ...x, slug: slugify(x.author) })));
    console.log('Seeded 3 testimonials.');
  }
  // posts (blog + news)
  const Post = require('../models/Post');
  if (await Post.countDocuments() === 0) {
    const posts = [
      { title: 'Why machine vision beats manual inspection', category: 'Blog', author: 'RvmAiTech', excerpt: 'Vision AI inspects every part the same way, every time — here is what changes on the floor.', content: 'Manual inspection is slow and inconsistent.\n\nMachine vision checks each part against the same standard at line speed, catches defects a tired operator misses, and logs every result for traceability.\n\nThe result: fewer rejects reaching the customer, and clear data on where defects come from.' },
      { title: 'RvmAiTech launches MDMS 2.4', category: 'News', author: 'RvmAiTech', excerpt: 'Our most advanced release brings intelligent process automation and plant-level integration.', content: 'MDMS 2.4 — Intelligent Process Automation — is now available.\n\nIt adds enterprise/plant-level dashboards, advanced API and cloud integration, predictive monitoring and ERP/MES integration, taking MDMS from a monitoring system to a full automation platform.' },
    ];
    await Post.insertMany(posts.map((p, i) => ({ ...p, slug: slugify(p.title), order: i + 1, date: new Date() })));
    console.log('Seeded 2 posts.');
  }
  // team (leadership)
  const TeamMember = require('../models/TeamMember');
  if (await TeamMember.countDocuments() === 0) {
    const team = [
      { name: 'Founder & CEO', role: 'Leadership', bio: 'Drives RvmAiTech vision in robotics, vision and machine intelligence.', linkedin: 'https://www.linkedin.com/' },
      { name: 'Head of Engineering', role: 'Automation & Robotics', bio: 'Leads design and delivery of automation systems on the floor.', linkedin: 'https://www.linkedin.com/' },
    ];
    await TeamMember.insertMany(team.map((t, i) => ({ ...t, slug: slugify(t.name), order: i + 1 })));
    console.log('Seeded 2 team members.');
  }
  // careers (openings)
  const Opening = require('../models/Opening');
  if (await Opening.countDocuments() === 0) {
    const jobs = [
      {
        title: 'Automation Engineer', location: 'Faridabad (On-site)', type: 'Full-time',
        department: 'Automation', experience: '1–4 years', positions: 2,
        summary: 'PLC/SCADA programming, machine integration and commissioning.',
        description: 'You will program PLCs and HMIs, integrate machines with our MDMS / Datalogger platform and commission automation projects at customer plants.\n\nYou will work directly with our founders on live factory projects — forming lines, furnaces, presses and packaging — and own a project from wiring diagram to go-live.',
        responsibilities: ['PLC & HMI programming (Siemens, Mitsubishi, Delta, Omron)', 'Modbus RTU/TCP integration of machines with MDMS / Datalogger', 'Panel design review, I/O mapping and commissioning at site', 'Troubleshooting drives, sensors and communication issues', 'Documentation — I/O lists, wiring diagrams, commissioning reports'],
        requirements: ['Diploma / B.Tech in Electrical, Electronics or Instrumentation', '1–4 years on PLC / SCADA projects (freshers with strong projects welcome)', 'Hands-on with at least one PLC brand and Modbus', 'Comfortable with site work and travel within NCR', 'Basic Python or scripting is a plus'],
        skills: ['PLC', 'HMI / SCADA', 'Modbus', 'VFD', 'Panel wiring', 'Commissioning'],
        benefits: ['Work on real factory automation, not demos', 'Learn IoT + AI vision alongside PLC work', 'Growth to lead engineer as the team scales'],
      },
      { title: 'Machine Vision Engineer', location: 'On-site', type: 'Full-time', description: 'Build vision inspection applications — defect detection, measurement, OCR.' },
    ];
    await Opening.insertMany(jobs.map((j, i) => ({ ...j, slug: slugify(j.title), order: i + 1 })));
    console.log('Seeded 2 openings.');
  }
  // existing DB: fill in details for the sample job if it was seeded before these fields existed
  const ae = await Opening.findOne({ slug: 'automation-engineer' });
  if (ae && !(ae.responsibilities || []).length) {
    Object.assign(ae, {
      location: ae.location || 'Faridabad (On-site)', department: 'Automation', experience: '1–4 years', positions: 2,
      summary: ae.summary || ae.description || 'PLC/SCADA programming, machine integration and commissioning.',
      description: 'You will program PLCs and HMIs, integrate machines with our MDMS / Datalogger platform and commission automation projects at customer plants.\n\nYou will work directly with our founders on live factory projects — forming lines, furnaces, presses and packaging — and own a project from wiring diagram to go-live.',
      responsibilities: ['PLC & HMI programming (Siemens, Mitsubishi, Delta, Omron)', 'Modbus RTU/TCP integration of machines with MDMS / Datalogger', 'Panel design review, I/O mapping and commissioning at site', 'Troubleshooting drives, sensors and communication issues', 'Documentation — I/O lists, wiring diagrams, commissioning reports'],
      requirements: ['Diploma / B.Tech in Electrical, Electronics or Instrumentation', '1–4 years on PLC / SCADA projects (freshers with strong projects welcome)', 'Hands-on with at least one PLC brand and Modbus', 'Comfortable with site work and travel within NCR', 'Basic Python or scripting is a plus'],
      skills: ['PLC', 'HMI / SCADA', 'Modbus', 'VFD', 'Panel wiring', 'Commissioning'],
      benefits: ['Work on real factory automation, not demos', 'Learn IoT + AI vision alongside PLC work', 'Growth to lead engineer as the team scales'],
    });
    await ae.save();
    console.log('Filled in details for the sample "Automation Engineer" opening.');
  }
  // about content
  const SiteContent = require('../models/SiteContent');
  if (!(await SiteContent.findOne({ key: 'about' }))) {
    await SiteContent.create({ key: 'about', value: {
      heading: 'We build machines that see, decide and act',
      body: "RvmAiTech is an automation company focused on robotics, computer vision and machine intelligence. We help factories, businesses and homes run smarter — with less downtime, higher accuracy and lower cost per unit.\n\nFrom PLC-connected monitoring and vision inspection to full robotic cells and smart-home control, we design and integrate systems around how you actually operate.",
      mission: 'Make intelligent automation practical and affordable for every plant and home.',
      vision: 'A world where machines handle the repetitive, and people focus on what matters.',
    }});
    console.log('Seeded about content.');
  }
  // site settings: social, contact, logo
  if (!(await SiteContent.findOne({ key: 'social' }))) {
    await SiteContent.create({ key: 'social', value: { linkedin: '', whatsapp: '', instagram: '', facebook: '', youtube: '', twitter: '' } });
    console.log('Seeded social links.');
  }
  if (!(await SiteContent.findOne({ key: 'contact' }))) {
    await SiteContent.create({ key: 'contact', value: { email: 'info@rvmaitech.com', phone: '+91 00000 00000', address: '' } });
    console.log('Seeded contact info.');
  }
  if (!(await SiteContent.findOne({ key: 'logo' }))) {
    await SiteContent.create({ key: 'logo', value: '' });
  }
  // clients
  const Client = require('../models/Client');
  if (await Client.countDocuments() === 0) {
    const cl = ['Jain Cord Industries', 'JP Minda Group', 'Sanmati Packaging', 'EKC Limited'];
    await Client.insertMany(cl.map((name, i) => ({ name, slug: slugify(name), order: i + 1 })));
    console.log('Seeded 4 clients.');
  }
  process.exit(0);
})().catch(e => { console.error(e); process.exit(1); });
