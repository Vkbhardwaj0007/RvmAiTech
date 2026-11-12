require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });
const connectDB = require('../config/db');
const Capability = require('../models/Capability');

const categories = [
  {
    title: 'Custom PCB Design & Development',
    slug: 'custom-pcb-design-development',
    summary: 'Multi-layer PCB layout routing, schematic capture, component selection, rapid prototype fabrication, and hardware validation.',
    description: 'We design production-ready single and multi-layer printed circuit boards optimized for electromagnetic compatibility (EMC), thermal efficiency, and low-cost component sourcing.',
    features: ['Custom PCB Design', 'Schematic Design', 'PCB Layout & Routing', 'Component Selection', 'Prototype PCB Development', 'PCB Testing & Debugging'],
    hardwareUsed: ['KiCad & EasyEDA', 'Altium Designer', 'FR-4 High-TG Substrate', 'SMD & Through-Hole Soldering'],
    softwareUsed: ['Design Rule Checking (DRC)', 'Gerber / Drill Generation', 'BOM Cost Optimization', 'Thermal & Signal Integrity'],
    icon: 'Cpu',
    order: 1,
    published: true
  },
  {
    title: 'Embedded Systems Development',
    slug: 'embedded-systems-development',
    summary: 'High-reliability microcontroller-based systems with real-time sensor processing and deterministic hardware control.',
    description: 'Custom embedded hardware architectures engineered around ESP32, STM32, and ARM processors designed for 24/7 industrial uptime and harsh shop-floor environments.',
    features: ['ESP32 Development', 'STM32 Microcontrollers', 'Arduino-Based Systems', 'Microcontroller Programming', 'Custom Embedded Controllers', 'Real-Time Data Acquisition'],
    hardwareUsed: ['ESP32-WROOM / S3', 'STM32F4 / G0 ARM Cortex', 'Microchip ATmega', 'Industrial Gateways'],
    softwareUsed: ['FreeRTOS', 'ESP-IDF', 'STM32CubeIDE', 'Embedded C / C++'],
    icon: 'Cpu',
    order: 2,
    published: true
  },
  {
    title: 'Sensor & Electronics Integration',
    slug: 'sensor-electronics-integration',
    summary: 'Interfacing industrial analog and digital sensors with signal conditioning, optoisolation, and precision telemetry.',
    description: 'Direct hookups for CT current transformers, thermocouples, pressure transmitters, optical cycle counters, and rotary encoders with optoisolated protection circuitry.',
    features: ['Temperature Sensors', 'Proximity Sensors', 'Pressure Sensors', 'Current & Voltage Monitoring', 'Encoder Integration', 'Relay and Digital I/O Systems', 'Analog Signal Processing'],
    hardwareUsed: ['Non-Intrusive CT Sensors', 'PT100 & Type-K Probes', 'Inductive Proximity Sensors', 'Solid-State Relays (SSR)', 'Optoisolated I/O'],
    softwareUsed: ['Kalman Filtering', 'Precision ADC Calibration', 'Debouncing Algorithms', 'Instant Threshold Triggers'],
    icon: 'Activity',
    order: 3,
    published: true
  },
  {
    title: 'Firmware Development',
    slug: 'firmware-development',
    summary: 'Production-grade embedded firmware with robust hardware peripheral drivers, memory optimization, and over-the-air updates.',
    description: 'Low-level C/C++ firmware engineering implementing peripheral communication, fault-tolerant state machines, hardware watchdogs, and secure dual-bank OTA remote flashing.',
    features: ['Embedded C/C++', 'Device Control Logic', 'Peripheral Communication', 'Firmware Optimization', 'OTA Firmware Updates', 'Device Configuration', 'Hardware Debugging'],
    hardwareUsed: ['JTAG / SWD Debug Adapters', 'Digital Storage Oscilloscopes', 'Logic Analyzers', 'On-Board Flash Memory'],
    softwareUsed: ['UART / SPI / I2C Protocols', 'Dual-Bank Safe OTA', 'Hardware Watchdog Timers', 'Ultra-Low-Power Sleep Modes'],
    icon: 'Code',
    order: 4,
    published: true
  },
  {
    title: 'IoT & Communication Solutions',
    slug: 'iot-communication-solutions',
    summary: 'Industrial wireless and wired connectivity pipelines transmitting encrypted telemetry to cloud brokers with zero packet loss.',
    description: 'End-to-end industrial connectivity over RS-485 Modbus, MQTT, WebSockets, Wi-Fi, Ethernet, and 4G cellular with local flash buffering for zero data drop during network outages.',
    features: ['Wi-Fi and Bluetooth (BLE)', 'Ethernet Connectivity', 'RS485 Communication', 'Modbus RTU / TCP', 'MQTT Protocol', 'HTTP REST API', 'Cloud Connectivity'],
    hardwareUsed: ['RS-485 Isolated Transceivers', 'W5500 SPI Ethernet', '4G LTE Cellular Modules', 'High-Gain External Antennas'],
    softwareUsed: ['TLS 1.3 Security', 'MQTT QoS 1 / QoS 2', 'Local Flash Queuing', 'Bi-Directional WebSockets'],
    icon: 'Wifi',
    order: 5,
    published: true
  },
  {
    title: 'Backend & API Development',
    slug: 'backend-api-development',
    summary: 'High-concurrency Node.js and Python microservices handling thousands of edge device connections with persistent time-series ingestion.',
    description: 'Scalable backend engines architected for sub-second query performance, time-series telemetry storage, automated alert triggers, and secure third-party enterprise integrations.',
    features: ['Node.js / Express.js', 'Python Backend', 'REST API Development', 'Database Design', 'Device Data Management', 'Authentication & Security'],
    hardwareUsed: ['AWS & GCP Cloud Compute', 'On-Premises Industrial Servers', 'Dockerized Microservices'],
    softwareUsed: ['PostgreSQL & TimescaleDB', 'MongoDB Atlas', 'Redis Cache', 'JWT & OAuth2 Security'],
    icon: 'Database',
    order: 6,
    published: true
  },
  {
    title: 'Web & Mobile Application Development',
    slug: 'web-mobile-application-development',
    summary: 'Intuitive, lightning-fast responsive web portals, supervisory control dashboards, and native field mobile apps for plant engineers.',
    description: 'Interactive React.js web platforms and mobile applications providing live OEE telemetry, machine status indicators, supervisor parameter overrides, and automated reporting.',
    features: ['Custom Web Applications', 'Admin Dashboards', 'Real-Time Monitoring UI', 'Android Applications', 'Device Management Panels', 'Reports & Analytics'],
    hardwareUsed: ['Industrial Touchscreen HMIs', 'Android Tablets & Mobiles', 'Control Room Multi-Displays'],
    softwareUsed: ['React.js & Vite', 'Progressive Web Apps (PWA)', 'Tailwind CSS', 'Live Chart.js & D3.js Visualizations'],
    icon: 'Monitor',
    order: 7,
    published: true
  },
  {
    title: 'Product Prototyping & Integration',
    slug: 'product-prototyping-integration',
    summary: 'Complete product engineering from proof-of-concept (POC) to enclosure assembly, functional verification, and mass deployment.',
    description: 'From rapid 3D prototyping and custom industrial DIN-rail enclosure design to electrical wiring harness assembly, stress testing, and on-site commissioning support.',
    features: ['Electronic Prototype Development', 'Hardware Assembly', 'Enclosure Integration', 'Hardware-Software Testing', 'Functional Validation', 'Product Deployment Support'],
    hardwareUsed: ['Custom 3D Printed Casing', 'Standard IP65 Industrial Boxes', 'DIN-Rail Mountings', 'Automotive-Grade Connectors'],
    softwareUsed: ['Burn-in Stress Testing', 'Thermal Soak Analysis', 'End-to-End Validation Protocols', 'Complete Technical Documentation'],
    icon: 'Layers',
    order: 8,
    published: true
  }
];

async function seed() {
  await connectDB();
  await Capability.deleteMany({});
  await Capability.insertMany(categories);
  console.log('Seeded all 8 Development Categories successfully!');
  process.exit(0);
}

seed().catch((err) => {
  console.error('Seed error:', err);
  process.exit(1);
});

