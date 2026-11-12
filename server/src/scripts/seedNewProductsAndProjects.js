const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '..', '.env') });
const mongoose = require('mongoose');
const Product = require('../models/Product');
const Project = require('../models/Project');
const slugify = require('../utils/slugify');

const uri = process.env.MONGODB_URI || process.env.MONGO_URI || process.env.MONGO_URL || process.env.DATABASE_URL;
if (!uri) {
  console.error('Mongo URI not found in server/.env');
  process.exit(1);
}

const NEW_PRODUCTS = [
  {
    name: 'Smart Parking Management System',
    category: 'Smart Parking',
    positioning: 'Zero-congestion automated parking guidance & billing',
    summary: 'ANPR camera recognition, automated boom barriers, slot occupancy detection, and digital payment billing.',
    description: 'Comprehensive parking automation system combining high-speed ANPR cameras, ultrasonic slot sensors, automated boom barriers, and cloud management dashboards.',
    purpose: 'Commercial complexes, IT parks, and malls mein parking entry/exit ko 100% automate karna aur revenue leakage khatam karna.',
    features: [
      'Automatic Number Plate Recognition (ANPR) with 99.4% accuracy',
      'Fastag & RFID seamless boom barrier opening (<1.2 sec)',
      'Ultrasonic overhead slot occupancy indicator (Green/Red LED)',
      'Digital dynamic LED signage showing available parking slots per floor',
      'Cashless UPI, QR code & POS credit card billing terminal',
      'Central web dashboard with hourly occupancy analytics & revenue audits',
      'Blacklisted vehicle alert & security barrier lockdown'
    ],
    specs: [
      { label: 'ANPR Accuracy', value: '> 99.4% under all lighting' },
      { label: 'Barrier Speed', value: '0.9 to 1.5 seconds' },
      { label: 'Vehicle Identification', value: 'ANPR, Fastag, RFID, QR Ticket' },
      { label: 'Integration', value: 'Cloud ERP, POS billing, WhatsApp receipt' },
      { label: 'Ideal for', value: 'Malls, Commercial Tech Parks, Hospitals, Airports' }
    ],
    order: 1,
    published: true,
  },
  {
    name: 'CampusCloud School ERP',
    category: 'School ERP',
    positioning: 'Complete paperless campus automation from admission to graduation',
    summary: 'Cloud school management suite: automated online fee collection, biometric attendance, student portal & parent mobile app.',
    description: 'All-in-one educational ERP platform managing admissions, fees, attendance, examinations, grading, timetable scheduling, library, and real-time GPS bus tracking.',
    purpose: 'School administration aur teachers ke daily manual paperwork ko zero karna aur parents ke sath live digital communication provide karna.',
    features: [
      'Online student admission & document verification portal',
      'Automated fee invoice generation with payment gateway & instant receipt SMS',
      'RFID & Biometric student and teacher attendance with parent SMS alert',
      'Dedicated iOS & Android mobile app for parents & teachers',
      'Exam schedule, automated report card generation (CBSE/ICSE/State Board)',
      'Live GPS school bus tracking with geofence arrival alerts',
      'Library, hostel, and digital stock/inventory management'
    ],
    specs: [
      { label: 'Deployment', value: 'Cloud-hosted or On-Premise server' },
      { label: 'Mobile App', value: 'Native Android & iOS apps for Parents & Teachers' },
      { label: 'Payment Gateway', value: 'Razorpay, PayU, Paytm, UPI integration' },
      { label: 'Attendance', value: 'RFID card reader, Biometric finger & face recognition' },
      { label: 'Scale', value: 'From 200 to 20,000+ students' }
    ],
    order: 2,
    published: true,
  },
  {
    name: 'GrandStay Hotel & Resort PMS',
    category: 'Hotel ERP',
    positioning: 'Intelligent front-desk, POS billing & hospitality property management',
    summary: 'Cloud-based hotel management system: front-desk reservations, express check-in, restaurant POS, and housekeeping automation.',
    description: 'Full-featured Property Management System (PMS) designed for boutique hotels, luxury resorts, and restaurants. Synchronizes booking engines, room inventory, restaurant billing, and guest CRM.',
    purpose: 'Hotel reception, restaurant aur housekeeping workflows ko synchronize karna taaki koi double-booking ya billing mistake na ho.',
    features: [
      'Front-desk reservation engine with visual room availability matrix',
      'Express mobile check-in/out with ID card scanner upload',
      'Multi-counter Restaurant & Bar POS with Kitchen Order Ticket (KOT) printing',
      'Real-time housekeeping task assignment & room clean status update',
      'Integrated channel manager syncing Booking.com, MakeMyTrip, Agoda',
      'Comprehensive banquet booking, event invoicing & catering management',
      'Complete daily night audit and GST tax filing reports'
    ],
    specs: [
      { label: 'Modules', value: 'PMS, Restaurant POS, Banquet, Store Inventory, CRM' },
      { label: 'Hardware Support', value: 'Thermal receipt printers, KOT displays, Keycard encoders' },
      { label: 'OTAs Supported', value: 'MakeMyTrip, Booking.com, Agoda, Goibibo via 2-way sync' },
      { label: 'Billing', value: 'Split-billing, Room charge posting, Multi-currency, GST' },
      { label: 'Ideal for', value: 'Boutique Hotels, 3-Star to 5-Star Resorts, Restaurants' }
    ],
    order: 3,
    published: true,
  },
];

(async () => {
  await mongoose.connect(uri);
  console.log('Connected to MongoDB');

  // 1. Seed Products
  for (const p of NEW_PRODUCTS) {
    const slug = slugify(p.name);
    const existing = await Product.findOne({ slug });
    if (existing) {
      Object.assign(existing, p);
      await existing.save();
      console.log(`Product updated: ${p.name}`);
    } else {
      await Product.create({ ...p, slug });
      console.log(`Product created: ${p.name}`);
    }
  }

  // 2. Update EKC Project with full details
  const ekc = await Project.findOne({ title: /machine data/i });
  if (ekc) {
    ekc.title = 'MACHINE DATA MONITORING SYSTEM';
    ekc.client = 'EKC (Everest Kanto Cylinder)';
    ekc.status = 'Live in Production';
    ekc.year = '2026';
    ekc.problemStatement = 'Manual recording of machine cycles, unrecorded downtime, lack of real-time OEE visibility across cylinder manufacturing lines, and delayed maintenance responses during sudden machine stoppages.';
    ekc.solution = 'Engineered an edge-to-cloud MDMS architecture with non-intrusive PLC datalogging, real-time cycle counting, live shift OEE analytics dashboards, and instant WhatsApp/SMS breakdown alerts for plant maintenance supervisors.';
    ekc.hardwareUsed = [
      'Siemens S7-1200 PLC',
      'RvmAiTech DIN-Rail Edge Datalogger',
      'Isolated RS485/Modbus Converter',
      'Industrial 24V Opto-Isolated Sensor Interface',
      'Plant Central Gateway'
    ];
    ekc.softwareUsed = [
      'MDMS Real-Time Analytics Engine',
      'Node.js & Python Edge Services',
      'React Shop-Floor Live Dashboard',
      'Automated Daily Shift PDF Reports',
      'Telegram & WhatsApp Alert Bot'
    ];
    await ekc.save();
    console.log('EKC Project updated with complete details');
  }

  await mongoose.disconnect();
  console.log('Done!');
})().catch((err) => {
  console.error('Error:', err);
  process.exit(1);
});

