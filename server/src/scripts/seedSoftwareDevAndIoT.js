const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '..', '.env') });
const mongoose = require('mongoose');

const Capability = require('../models/Capability');
const ErpCard = require('../models/ErpCard');
const Stack = require('../models/Stack');
const Process = require('../models/Process');
const SoftwareDev = require('../models/SoftwareDev');

async function run() {
  const uri = process.env.MONGODB_URI || process.env.MONGO_URI || process.env.MONGO_URL || 'mongodb://127.0.0.1:27017/rvmaitech';
  await mongoose.connect(uri);
  console.log('Connected to MongoDB at', uri);

  // 1. Seed Capabilities (with slugs and detailed content)
  await Capability.deleteMany({});
  await Capability.insertMany([
    {
      title: 'Industrial IoT & Edge Telemetry',
      slug: 'industrial-iot-edge-telemetry',
      summary: 'Custom microcontrollers (ESP32, STM32, ARM) and industrial gateways capturing sensor data over Modbus RTU/TCP, RS485, 4G LTE, and MQTT with local buffering.',
      problemStatement: 'Plants struggle with isolated machines, manual log sheets, and loss of critical telemetry whenever network connectivity fluctuates.',
      solution: 'Custom-engineered hardware edge gateways with flash memory ring-buffering that poll PLCs, store data during outages, and transmit securely once connected.',
      features: [
        'Non-intrusive CT clamp and pulse sensor interfacing',
        'Direct RS485 / Modbus RTU & TCP polling for Siemens, Mitsubishi, Delta PLCs',
        'Cellular 4G LTE fallback with automatic reconnect',
        'Local SD card/Flash storage buffering up to 30 days of offline records',
        'Encrypted TLS/MQTT payload transmission'
      ],
      hardwareUsed: ['ESP32-WROVER', 'STM32F4', 'RS485 Transceivers', 'Quectel 4G LTE Module'],
      softwareUsed: ['FreeRTOS', 'Embedded C/C++', 'MQTT Broker', 'Node.js Ingestion Worker'],
      icon: 'Cpu',
      order: 1,
      published: true,
    },
    {
      title: 'Full-Stack Web & Cloud Platforms',
      slug: 'full-stack-web-cloud-platforms',
      summary: 'High-performance React/Node.js/Python cloud architectures featuring zero-latency WebSockets, interactive dashboards, and scalable REST/GraphQL APIs.',
      problemStatement: 'Legacy SCADA and enterprise applications are slow, locked to on-premise desktop PCs, and impossible for managers to access on mobile devices.',
      solution: 'Modern, high-concurrency cloud web applications with WebSocket streaming, interactive analytics charts, and responsive multi-device layouts.',
      features: [
        'Real-time WebSocket streaming with sub-200ms screen updates',
        'Modular microservice architecture built for 100,000+ daily telemetry events',
        'Role-based access control (Admin, Plant Head, Operator, Auditor)',
        'Automated PDF, Excel, and CSV shift report downloads',
        'Custom REST and GraphQL API gateways for third-party ERP linking'
      ],
      hardwareUsed: ['Cloud Virtual Machines', 'Nginx Reverse Proxies'],
      softwareUsed: ['React', 'Vite', 'Node.js', 'Express', 'Python FastAPI', 'MongoDB', 'PostgreSQL'],
      icon: 'Code',
      order: 2,
      published: true,
    },
    {
      title: 'Factory MDMS & SCADA Software',
      slug: 'factory-mdms-scada-software',
      summary: 'Real-time machine data acquisition systems computing instantaneous OEE, cycle times, operator productivity, and automatic shift downtime reports.',
      problemStatement: 'Unplanned machine breakdowns and inaccurate cycle time reporting lead to 20-35% unseen productivity leakage in factory floors.',
      solution: 'Turnkey Machine Data Monitoring System (MDMS) tracking real-time status (Running, Idle, Breakdown), cycle count vs target, and automated WhatsApp alert triggers.',
      features: [
        'Instant OEE calculation (Availability x Performance x Quality)',
        'Automated shift changeover reports delivered directly to WhatsApp and Email',
        'Operator tablet interface for 1-tap downtime reason logging',
        'Color-coded machine floor-plan dashboard (Green/Yellow/Red)',
        'Preventive maintenance schedules based on machine runtime hours'
      ],
      hardwareUsed: ['RvmAiTech Edge Datalogger', 'Industrial Tablet HMIs', 'Optical Counters'],
      softwareUsed: ['Node.js', 'TimescaleDB', 'React Dashboard', 'Twilio/WhatsApp Cloud API'],
      icon: 'BarChart3',
      order: 3,
      published: true,
    },
    {
      title: 'Enterprise ERP & Business Automation',
      slug: 'enterprise-erp-business-automation',
      summary: 'Specialized School ERP, Hotel Management PMS, and manufacturing inventory workflows designed to eliminate paperwork and automate billing.',
      problemStatement: 'Institutions and businesses suffer from scattered records, delayed fee/invoice collection, and repetitive manual administrative overhead.',
      solution: 'Unified, cloud-hosted ERP suites tailored specifically for educational campuses, hospitality properties, and factory warehouses.',
      features: [
        'Multi-department workflows connecting front desk, billing, and inventory',
        'Automated GST compliant billing and digital payment links',
        'Biometric, RFID, and facial recognition attendance sync',
        'Self-service student/guest portals with automated notifications',
        'Real-time financial audits and executive summary analytics'
      ],
      hardwareUsed: ['Biometric Scanners', 'RFID Readers', 'Thermal POS Printers'],
      softwareUsed: ['React', 'TailwindCSS', 'PostgreSQL', 'Node.js', 'Payment Gateway APIs'],
      icon: 'Database',
      order: 4,
      published: true,
    },
    {
      title: 'Computer Vision & AI Inference',
      slug: 'computer-vision-ai-inference',
      summary: 'Edge camera integration for ANPR vehicle license plate reading, defect inspection on production conveyors, and automated barcode/OCR tracking.',
      problemStatement: 'Manual visual inspection on high-speed conveyors is prone to human fatigue, resulting in defective parts reaching customers.',
      solution: 'High-speed industrial camera pipelines paired with edge AI models (YOLO / OpenCV) to detect defects, read OCR text, and identify number plates in real time.',
      features: [
        'High-speed part defect classification at up to 600 parts per minute',
        'ANPR License Plate Recognition with 99.4% accuracy under night/glare conditions',
        'Optical Character Recognition (OCR) for batch code and expiry validation',
        'Direct digital I/O trigger to pneumatic reject arms on conveyors',
        'Historical image archiving for audit and dispute verification'
      ],
      hardwareUsed: ['GigE Industrial Cameras', 'Nvidia Jetson / Edge AI PC', 'Pneumatic Rejectors'],
      softwareUsed: ['Python', 'OpenCV', 'PyTorch / TensorRT', 'FastAPI'],
      icon: 'Monitor',
      order: 5,
      published: true,
    },
    {
      title: 'Cross-Platform Mobile & Field Apps',
      slug: 'cross-platform-mobile-field-apps',
      summary: 'Responsive progressive web apps and mobile applications for plant maintenance engineers, floor supervisors, and remote equipment control.',
      problemStatement: 'Maintenance engineers cannot stay tied to desktop computers while troubleshooting equipment spread across large industrial campuses.',
      solution: 'Native-feel mobile apps with offline capability, QR code equipment scanning, push notifications, and remote parameter control.',
      features: [
        'Instant push alerts on machine breakdowns or threshold violations',
        'QR code scanning to view machine manual, wiring diagrams, and history',
        'Digital maintenance checklist with supervisor digital sign-off',
        'Bluetooth Low Energy (BLE) direct configuration for IoT gateways',
        'Works seamlessly on iOS, Android, and industrial rugged handhelds'
      ],
      hardwareUsed: ['Android / iOS Devices', 'Rugged Industrial Handheld Scanners'],
      softwareUsed: ['React Native / PWA', 'TypeScript', 'WebSockets', 'Firebase Cloud Messaging'],
      icon: 'Smartphone',
      order: 6,
      published: true,
    },
  ]);
  console.log('Seeded Capabilities with Slugs');

  // 2. Seed ErpCard (with rich details and slugs)
  await ErpCard.deleteMany({});
  await ErpCard.insertMany([
    {
      title: 'School & College ERP Suite',
      slug: 'school-erp',
      badge: 'Education ERP',
      summary: 'Complete campus management with student admissions, fee collection with digital receipts, biometric RFID attendance, examination marksheets, and parent SMS/WhatsApp notifications.',
      problemStatement: 'Schools manage multiple fragmented systems for fee receipts, student records, and attendance, resulting in accounting errors and communication gaps with parents.',
      solution: 'An all-in-one cloud educational ERP with parent/teacher mobile access, automated biometric RFID sync, online fee collection, and digital report card generation.',
      features: [
        'Online admission portal with automated student ID and roll generation',
        'Fee management with instant payment gateway, fee concessions, and fine rules',
        'Biometric & RFID student attendance with automatic SMS/WhatsApp alerts on entry/exit',
        'CBSE / ICSE / State board compliant grade sheet and marksheet generator',
        'Teacher timetable, homework upload, and parent messaging portal',
        'Transport GPS tracking integration for school buses'
      ],
      highlights: ['Biometric & RFID Attendance', 'Online & POS Fee Collection', 'WhatsApp Notifications', 'Automated Grade Sheets'],
      softwareUsed: ['React.js', 'Node.js', 'PostgreSQL', 'Razorpay', 'Twilio'],
      icon: 'Globe',
      order: 1,
      published: true,
    },
    {
      title: 'Hotel & Resort PMS Solution',
      slug: 'hotel-erp',
      badge: 'Hospitality PMS',
      summary: 'Front-desk room booking engine, instant check-in/out, multi-outlet restaurant POS with Kitchen Order Ticketing (KOT), housekeeping workflows, and GST invoice generation.',
      problemStatement: 'Hotel operators struggle with disconnected restaurant billing and room booking software, causing billing leakage and delays during guest check-out.',
      solution: 'Centralized Property Management System (PMS) unifying room reservations, channel manager sync, restaurant POS ordering, banquet scheduling, and single-click checkout.',
      features: [
        'Room inventory matrix with real-time occupancy status (Clean, Dirty, Occupied)',
        'Touchscreen Restaurant POS with instantaneous Kitchen Order Ticketing (KOT)',
        'Consolidated guest billing transferring restaurant/laundry orders to room folio',
        'GST-compliant multi-tax invoice generation and tally accounting export',
        'Housekeeping supervisor mobile view to update cleaned room status in real-time',
        'Guest identity card (Aadhaar/Passport) scanner integration for instant check-in'
      ],
      highlights: ['Room Reservation Engine', 'Restaurant POS & KOT', 'Housekeeping Workflow', 'GST Compliant Invoicing'],
      softwareUsed: ['React', 'Node.js', 'MongoDB', 'Thermal ESC/POS Print Engine'],
      icon: 'ShieldCheck',
      order: 2,
      published: true,
    },
    {
      title: 'Manufacturing & Inventory WMS',
      slug: 'manufacturing-inventory-erp',
      badge: 'Industrial WMS',
      summary: 'Raw material procurement, bill of materials (BOM), batch tracking, barcode dispatch labelling, and real-time shop-floor consumption reconciliation.',
      problemStatement: 'Stock discrepancies between warehouse registers and physical floor inventory cause costly production stops and delayed client dispatches.',
      solution: 'Cloud Warehouse Management System (WMS) tracking materials by batch and barcode from goods receipt note (GRN) to final dispatch inspection.',
      features: [
        'Multi-level Bill of Materials (BOM) with automatic component reservation',
        'Barcode / QR code scanning for raw material issuance and finished goods packing',
        'Reorder level (ROL) alerts and automated vendor purchase requisition (PR)',
        'Batch genealogy and traceability for quality audit compliance',
        'First-In First-Out (FIFO) enforcement preventing inventory obsolescence'
      ],
      highlights: ['Bill of Materials (BOM)', 'Batch & Barcode Tracking', 'Vendor Purchase Orders', 'Stock Level Alerts'],
      softwareUsed: ['React', 'Node.js', 'TimescaleDB', 'Zebra Barcode Print SDK'],
      icon: 'Database',
      order: 3,
      published: true,
    },
    {
      title: 'Custom Enterprise Workflow Apps',
      slug: 'custom-enterprise-workflows',
      badge: 'Tailor-Made SaaS',
      summary: 'Tailor-made cloud software replacing cluttered Excel sheets with centralized role-based access, audit trails, and automated email/WhatsApp alerts.',
      problemStatement: 'High-growth enterprises outgrow spreadsheets, leading to file version conflicts, unauthorized edits, and lack of accountability.',
      solution: 'Custom web software engineered specifically to your exact corporate hierarchy, approval stages, and business rules.',
      features: [
        'Multi-step hierarchical approval chains (Requester -> Manager -> Director)',
        'Granular role-based permissions preventing unauthorized data viewing or tampering',
        'Complete immutable audit log tracking every data creation, modification, and deletion',
        'Automated scheduled report emails and WhatsApp summary notifications',
        'Custom dashboards with tailored KPI metrics and interactive charts'
      ],
      highlights: ['Role-Based Multi-User Access', 'Audit Logs & Versioning', 'REST API Integrations', 'Automated Daily Reports'],
      softwareUsed: ['React', 'TypeScript', 'Node.js', 'PostgreSQL', 'Docker'],
      icon: 'Laptop',
      order: 4,
      published: true,
    },
  ]);
  console.log('Seeded ErpCards with Slugs');

  // 3. Seed Stack
  await Stack.deleteMany({});
  const stackItems = [
    { title: 'Embedded C / C++', category: 'IoT & Firmware', color: 'orange' },
    { title: 'FreeRTOS & ESP-IDF', category: 'Real-Time OS', color: 'blue' },
    { title: 'Modbus RTU & Modbus TCP', category: 'Industrial Protocol', color: 'orange' },
    { title: 'MQTT & WebSockets', category: 'Telemetry Stream', color: 'blue' },
    { title: 'RS-485 / RS-232 DAQ', category: 'Sensor Ingestion', color: 'orange' },
    { title: 'Node.js & Express', category: 'Backend Engine', color: 'blue' },
    { title: 'Python (FastAPI & Django)', category: 'Backend & Data', color: 'orange' },
    { title: 'React.js & Vite', category: 'Frontend UI', color: 'blue' },
    { title: 'TypeScript', category: 'Type Safety', color: 'orange' },
    { title: 'PostgreSQL & TimescaleDB', category: 'Time-Series DB', color: 'blue' },
    { title: 'MongoDB & Redis', category: 'Cache & NoSQL', color: 'orange' },
    { title: 'Docker & Containerization', category: 'DevOps & Deploy', color: 'blue' },
    { title: 'OpenCV & Python AI', category: 'Computer Vision', color: 'orange' },
    { title: 'AWS & Google Cloud IoT', category: 'Cloud Infrastructure', color: 'blue' },
    { title: 'Grafana & Custom Dashboards', category: 'Analytics UI', color: 'orange' },
  ];
  await Stack.insertMany(stackItems.map((item, idx) => ({ ...item, order: idx + 1, published: true })));
  console.log('Seeded Stack with Categories and Colors');

  // 4. Seed Process (with slugs)
  await Process.deleteMany({});
  await Process.insertMany([
    {
      title: 'Discovery & Requirement Analysis',
      slug: 'discovery-requirement-analysis',
      summary: 'We evaluate your machine signals, network topography, plant workflow, or business ERP requirements to engineer the exact technical roadmap.',
      description: 'Our senior system engineers visit your plant floor or conduct detailed technical discovery calls to understand existing PLCs, sensor types, network constraints, and reporting expectations.',
      deliverables: ['System Architecture Document', 'Sensor & IO Mapping List', 'Network Topology Plan'],
      icon: 'Layers',
      order: 1,
      published: true,
    },
    {
      title: 'Hardware & Architecture Design',
      slug: 'hardware-architecture-design',
      summary: 'Selection of edge controllers, sensor interfaces, cloud database schemas, security protocols, and interactive UI/UX screen mockups.',
      description: 'We design custom circuit diagrams, select microcontroller architectures (ESP32 / STM32 / ARM), and create interactive Figma UI/UX screens for manager approval.',
      deliverables: ['Hardware BOM & Schematics', 'Database Schema Models', 'Figma Clickable Prototypes'],
      icon: 'Cpu',
      order: 2,
      published: true,
    },
    {
      title: 'Firmware & Edge Gateway Engineering',
      slug: 'firmware-edge-gateway-engineering',
      summary: 'Writing robust embedded C/C++ firmware with flash memory ring buffers for zero data loss during power or internet outages.',
      description: 'Development of low-level drivers, Modbus register polling routines, watchdog timer safeguards, and cellular/WiFi communication stacks.',
      deliverables: ['Tested Binary Firmware', 'Local Flash Buffer Implementation', 'OTA Update Capabilities'],
      icon: 'Radio',
      order: 3,
      published: true,
    },
    {
      title: 'Cloud Backend & Dashboard Coding',
      slug: 'cloud-backend-dashboard-coding',
      summary: 'Building high-throughput microservices, real-time WebSocket communication pipelines, and fast, intuitive web interfaces.',
      description: 'Writing scalable ingestion workers capable of handling high-frequency sensor ticks, setting up TimescaleDB retention policies, and crafting responsive frontend dashboards.',
      deliverables: ['Real-Time WebSocket Pipeline', 'Admin & Operator Dashboards', 'REST API Documentation'],
      icon: 'Code',
      order: 4,
      published: true,
    },
    {
      title: 'Shop-Floor Commissioning & Testing',
      slug: 'shop-floor-commissioning-testing',
      summary: 'On-site installation, signal calibration with existing PLCs, load stress testing, and operator onboarding training.',
      description: 'Hands-on installation of edge dataloggers in electrical control panels, signal calibration against machine production meters, and operator training sessions.',
      deliverables: ['On-Site Commissioning Sign-Off', 'Calibrated Telemetry Verification', 'User Manuals & Video SOPs'],
      icon: 'CheckCircle2',
      order: 5,
      published: true,
    },
    {
      title: 'Long-Term Support & Remote Maintenance',
      summary: '24/7 technical assistance, scheduled database maintenance, secure over-the-air (OTA) firmware updates, and feature expansions.',
      slug: 'long-term-support-remote-maintenance',
      description: 'Continuous monitoring of telemetry uptime, automated daily backups, remote OTA firmware security updates, and SLA-backed bug resolution.',
      deliverables: ['24/7 Monitoring Dashboard', 'SLA Support Agreement', 'Quarterly System Health Audits'],
      icon: 'ShieldCheck',
      order: 6,
      published: true,
    },
  ]);
  console.log('Seeded Process with Slugs');

  // 5. Seed SoftwareDev Projects
  await SoftwareDev.deleteMany({});
  await SoftwareDev.insertMany([
    {
      title: 'Machine Data Monitoring System (MDMS)',
      slug: 'machine-data-monitoring-system-mdms',
      client: 'Industrial Auto-Components Manufacturer',
      summary: 'Real-time shop-floor machine telemetry capturing cycle times, downtime reasons, and automated OEE calculations across 50+ CNC machines.',
      description: 'Engineered an end-to-end edge IoT to cloud software ecosystem. Non-intrusive current/optical sensors feed into custom hardware dataloggers, transmitting via MQTT to a live dashboard that alert floor supervisors on WhatsApp whenever downtime exceeds threshold.',
      problemStatement: 'Manual paper logs caused delayed reporting, inaccurate machine utilization numbers, and unmonitored production bottlenecks.',
      solution: 'Deployed RS-485 Modbus edge dataloggers with cellular fallback and built a multi-tenant Node.js + React analytics web dashboard.',
      stack: ['ESP32', 'Modbus RTU', 'MQTT', 'Node.js', 'React', 'MongoDB', 'WebSockets'],
      year: '2024',
      order: 1,
      published: true,
    },
    {
      title: 'Multi-Level Smart Parking Automation',
      slug: 'smart-parking-iot-software',
      client: 'Commercial Mall & Urban Parking Operator',
      summary: 'Ultrasonic bay occupancy detection, automatic boom barrier control, ANPR camera number plate logging, and POS billing receipt software.',
      description: 'Integrated hardware ultrasonic sensors with digital LED direction displays and a cloud-synced cashier POS billing software. Drivers easily find free slots while operators prevent revenue leakage.',
      problemStatement: 'Long vehicle queues, unauthorized entry, manual ticketing delays, and lost revenues during peak mall hours.',
      solution: 'Complete IoT parking hardware coupled with an offline-first desktop/web POS billing application and cloud analytics dashboard.',
      stack: ['Ultrasonic Sensors', 'ANPR Computer Vision', 'React', 'Node.js', 'PostgreSQL', 'Thermal POS Print'],
      year: '2024',
      order: 2,
      published: true,
    },
    {
      title: 'Cloud School ERP & Student Information System',
      slug: 'school-erp-suite',
      client: 'K-12 Educational Institutions',
      summary: 'Modular campus management software managing 2,500+ student profiles, fee invoicing with payment gateway, RFID attendance, and WhatsApp reports.',
      description: 'Built a multi-role educational ERP supporting principals, accountants, teachers, and parents. Features automated attendance reports generated upon RFID/biometric punch.',
      problemStatement: 'Paper-based fee receipts, manual attendance registers, and delayed communication between school administrators and parents.',
      solution: 'Custom cloud web portal with role-based security, SMS/WhatsApp messaging APIs, and exportable CBSE/State board reports.',
      stack: ['React', 'Node.js', 'Express', 'PostgreSQL', 'Razorpay', 'Twilio/WhatsApp API'],
      year: '2023',
      order: 3,
      published: true,
    },
    {
      title: 'Smart Hotel & Restaurant Management PMS',
      slug: 'hotel-pms-restaurant-pos',
      client: 'Boutique Hotel & Banquet Chain',
      summary: 'Integrated room reservation engine, quick guest check-in/out, multi-station restaurant POS billing with KOT printing, and GST compliance.',
      description: 'A responsive web application supporting touch-screen restaurant ordering, inventory deduction on food orders, room housekeeping status, and consolidated guest checkout invoices.',
      problemStatement: 'Disjointed restaurant and hotel billing led to missed guest charges and slow checkout experiences.',
      solution: 'Unified cloud PMS with instantaneous kitchen order ticketing and multi-terminal payment reconciliation.',
      stack: ['React', 'TailwindCSS', 'Node.js', 'MongoDB', 'Thermal Esc/Pos'],
      year: '2023',
      order: 4,
      published: true,
    },
  ]);
  console.log('Seeded SoftwareDev projects');

  await mongoose.disconnect();
  console.log('Done!');
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
