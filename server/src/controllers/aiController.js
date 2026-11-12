const { config } = require('../config/env');

const RVMAITECH_SYSTEM_PROMPT = `
You are the official AI Engineering Assistant of RvmAiTech (https://rvmaitech.com).
RvmAiTech is a premier Industrial Automation, Embedded Systems, Machine Vision, Robotics, Smart Parking, IoT, and Custom Software Development engineering firm based in India.

Official Leadership & Founders:
- Founder & CEO: Mr. Vivek Bhardwaj (Embedded Systems, IoT & Machine Intelligence Engineer, Building Machines That See, Decide & Act)
- Co-Founder & CTO: Mr. Rahul (Leads system design and floor automation delivery)
- Managing Director (MD): Vishal (Operations, project commissioning & engineering delivery)

Official Contact & Support:
- WhatsApp & Phone: +91 70520 50656
- Official Email: rvmaitech2026@gmail.com

Company Offerings:
1. Smart Parking Automation System (ANPR cameras, boom barriers, ultrasonic bay sensors, thermal POS billing, WhatsApp bills)
2. Machine Vision & AI Cameras (Automated defect inspection, OCR text extraction, part identification)
3. Industrial Robotics & Process Automation (Custom robotic actuators, conveyor automation, PLC/SCADA programming)
4. Custom PCB Design & Hardware Development (KiCad/EasyEDA schematics, multi-layer layouts, prototyping from POC to PVT)
5. Embedded Systems & Firmware (ESP32, STM32, ARM Cortex-M, FreeRTOS, Embedded C/C++, OTA updates)
6. Industrial IoT & Communication (Modbus RTU/TCP, isolated RS-485, MQTT, 4G LTE gateways, local SD buffering)
7. Enterprise ERP & SaaS Software (School & College ERP Suite, Hotel & Resort PMS)
8. Custom Full-Stack Web & Mobile Apps (React.js, Node.js, Python FastAPI/Django, PostgreSQL, TimescaleDB, MongoDB Atlas)

Rules:
- Match user's language naturally (Hindi, Hinglish, or English).
- Be polite, technically accurate, confident, and structured.
- Always provide direct, helpful answers to questions about the founder, leadership, services, technology, and projects.
`;

// Built-in intelligent knowledge matcher
function getBuiltinKnowledgeResponse(query, language = 'hinglish') {
  const q = (query || '').toLowerCase().trim();

  // 0. Greetings Check (hi, hii, hello, helo, hlo, namaste, etc.)
  const isGreeting =
    /^(hi+|hello+|hey+|hlo+|helo+|namaste|namaskar|pranam|hola|greetings)(\b|\s|$)/i.test(q) ||
    q.includes('kaise ho') ||
    q.includes('good morning') ||
    q.includes('good evening') ||
    q.includes('good afternoon');

  if (isGreeting && q.length < 40 && !q.includes('parking') && !q.includes('founder') && !q.includes('pcb') && !q.includes('erp') && !q.includes('iot') && !q.includes('cost') && !q.includes('price')) {
    return `Hello & Welcome to **RvmAiTech Engineering & Intelligence**! 👋

Main RvmAiTech ka AI Technical Consultant hoon.

Aap mujhse hamari company aur projects ke baare me kuch bhi pooch sakte hain, jaise:
• 🚗 **Smart Parking Automation** (ANPR Cameras, Boom Barriers & POS Billing)
• 👔 **Leadership & Founders** (Mr. Vivek Bhardwaj & Team)
• 👁️ **Machine Vision & AI Cameras** (Defect Inspection & OCR)
• 🤖 **Industrial Robotics & Process Automation** (PLCs & Custom Actuators)
• ⚡ **Custom PCB & Hardware Prototyping** (Schematics to Production)
• 📡 **Industrial IoT & Telemetry** (Modbus RS485 & 4G Gateways)
• 🎓 **School & Hotel ERP Software**
• 💼 **Project Feasibility, Cost & Quotation**

Bataiye, main aapki kis project ya requirement me madad kar sakta hoon?`;
  }

  // 1. Founder & Leadership Team
  if (
    q.includes('founder') ||
    q.includes('ceo') ||
    q.includes('owner') ||
    q.includes('malik') ||
    q.includes('kiska') ||
    q.includes('kiske') ||
    q.includes('director') ||
    q.includes('leader') ||
    q.includes('leadership') ||
    q.includes('team') ||
    q.includes('vivek') ||
    q.includes('rahul') ||
    q.includes('vishal')
  ) {
    return `👔 **RvmAiTech Leadership & Founders**

RvmAiTech ki shuruat aur leadership high-skilled engineering professionals ke dwara ki gayi hai:

1. **Mr. Vivek Bhardwaj — Founder & CEO**
   - RvmAiTech ke mukhya sansthaapak (Founder & CEO) hain.
   - Background: Embedded Systems, IoT, Robotics, Computer Vision aur Machine Intelligence ke specialist hain.
   - Vision: *"Building machines that see, decide, and act on their own."*

2. **Mr. Rahul — Co-Founder & CTO**
   - Floor automation systems aur hardware delivery design ko lead karte hain.

3. **Vishal — Managing Director (MD)**
   - Turnkey project deployment, client coordination aur operational commissioning dekhte hain.

👉 Hamari core team se directly connect karne ya project discuss karne ke liye WhatsApp karein: **+91 70520 50656** ya email karein: **rvmaitech2026@gmail.com**`;
  }

  // 2. About RvmAiTech / What does company do
  if (
    q.includes('about') ||
    q.includes('company') ||
    q.includes('rvmaitech') ||
    q.includes('kya karti hai') ||
    q.includes('kya kaam') ||
    q.includes('kisme kaam') ||
    q.includes('profile') ||
    q.includes('mission') ||
    q.includes('kya banate')
  ) {
    return `🏢 **About RvmAiTech (Robotics, Vision & Intelligence)**

RvmAiTech ek comprehensive **Technology & Engineering Solutions** company hai jo physical machines ko modern software aur electronics se jodata hai:

- 🚗 **Smart Parking Automation**: AI ANPR number plate detection, automatic boom barriers, ultrasonic bay detection aur POS billing software.
- 👁️ **Machine Vision & AI Cameras**: Real-time defect inspection, OCR text reading aur quality validation.
- 🤖 **Industrial Robotics & Process Automation**: Custom controllers, assembly line automation aur PLC/SCADA integration.
- ⚡ **Custom PCB & Hardware Engineering**: Schematics design, multi-layer PCB layout aur rapid hardware prototyping.
- 📡 **Industrial IoT & Edge Telemetry**: Modbus RTU/TCP over RS-485, 4G cellular gateways, aur 30-day offline buffer memory.
- 💻 **Enterprise Software & ERPs**: School & College ERP Suite, Hotel PMS aur custom React/Node.js web dashboards.

👉 Hamara lakshya factory shopfloors aur modern facilities ko sub-second data aur automated intelligence provide karna hai.`;
  }

  // 3. Machine Vision & AI Camera
  if (
    q.includes('vision') ||
    q.includes('machine vision') ||
    q.includes('ai camera') ||
    q.includes('camera') ||
    q.includes('ocr') ||
    q.includes('defect') ||
    q.includes('inspection')
  ) {
    return `👁️ **Machine Vision & AI Camera Systems**

RvmAiTech custom Computer Vision aur Deep Learning solutions develop karta hai:

- **High-Speed ANPR**: Vehicles ke license number plates ko sub-second speed aur 99%+ accuracy ke sath detect karna.
- **Surface Defect Detection**: Packaging, printing, fabric, aur metal parts me flaws aur scratches detect karna.
- **OCR Text & Barcode Extraction**: Batch numbers, expiry dates aur serial barcodes ko real-time read karke database me log karna.
- **Robot Guidance Vision**: Robotic arms ke liye 2D/3D part positioning aur pick-and-place alignment.

👉 Software: Python, OpenCV, PyTorch, Edge AI TensorRT. WhatsApp for demo: **+91 70520 50656**`;
  }

  // 4. Robotics & Process Automation
  if (
    q.includes('robot') ||
    q.includes('robotic') ||
    q.includes('process automation') ||
    q.includes('automation') ||
    q.includes('plc') ||
    q.includes('factory') ||
    q.includes('conveyor')
  ) {
    return `🤖 **Robotics & Industrial Process Automation**

Hum manufacturing plants aur factories ke repetitive tasks ko automated intelligence me convert karte hain:

- **PLC & SCADA Programming**: Siemens, Mitsubishi, Delta, aur Omron PLCs ka ladder logic programming.
- **Custom Robotic Actuators & Grippers**: Pick-and-place, sorting machines aur automated packaging systems.
- **I/O Integration & Safety**: Optical sensors, safety light curtains, emergency stop loops aur digital relay control.
- **Process Telemetry**: Har machine step ka live cycle time, production count, aur reject rate monitor karna.

👉 On-site survey aur automation feasibility discuss karne ke liye WhatsApp karein: **+91 70520 50656**`;
  }

  // 5. Smart Parking
  if (q.includes('parking') || q.includes('boom barrier') || q.includes('anpr') || q.includes('number plate') || q.includes('car')) {
    return `🚗 **RvmAiTech Smart Parking Automation System**

Hamara Smart Parking System ek complete turnkey solution hai jo hardware aur software dono ko seamlessly jodata hai:

1. **ANPR AI Camera**: Entry aur Exit gates par high-speed camera automatically gaadi ka number plate read karta hai (99%+ accuracy).
2. **Automatic Boom Barrier**: Number detect hote hi automatic barrier lift ho jata hai, zero manual delay.
3. **Ultrasonic Bay Guidance**: Har parking slot par ultrasonic sensor laga hota hai jo green/red LED indicator se free slot batata hai.
4. **Thermal POS Billing**: Cashier counter ke liye offline-first billing software jo hourly fees calculate karke thermal receipt print karta hai.
5. **WhatsApp & UPI Bill**: Driver ke WhatsApp par instant PDF receipt aur UPI QR code se digital payment.

👉 Is solution ke live demo ya commercial quote ke liye aap direct hamare WhatsApp **+91 70520 50656** par connect kar sakte hain!`;
  }

  // 6. School ERP / Education
  if (q.includes('school') || q.includes('college') || (q.includes('erp') && (q.includes('student') || q.includes('fee')))) {
    return `🎓 **RvmAiTech Cloud School & College ERP Suite**

Hamara School ERP ek all-in-one institutional software hai jo administrative tasks ko automate karta hai:

- **Automated Fee Management**: Fee invoices, instant online payment gateway integration, aur automated receipt generation.
- **Biometric & RFID Attendance**: Student aur staff punch karte hi parents ko automated WhatsApp/SMS notification deliver hoti hai.
- **Academic & Examination**: Marks entry, automatic report card generation, CBSE/State board format compliance.
- **Multi-Role Portals**: Principal, Accountant, Teacher, Student aur Parents ke liye alag secure portals.

👉 Demo dekhne ya quotation ke liye hamare engineers se WhatsApp par baat karein: **+91 70520 50656**`;
  }

  // 7. Hotel ERP / PMS
  if (q.includes('hotel') || q.includes('resort') || q.includes('pms') || q.includes('room billing')) {
    return `🏨 **RvmAiTech Hotel & Resort PMS (Property Management System)**

Hamara Hotel PMS modern hospitality ke liye tailor-made software hai:

- **Front-Desk Operations**: Instant check-in, check-out, room allocation, aur guest ID records.
- **Multi-Counter Restaurant POS**: Dining, bar aur room-service orders ka instant KOT (Kitchen Order Ticket) aur integrated room billing.
- **Housekeeping & Inventory**: Real-time room clean/dirty status aur store inventory tracking.
- **Channel Sync**: Online travel agencies (OTAs) ke sath room availability synchronization.

👉 Apne hotel/resort ke size ke mutabiq custom quotation ke liye sampark karein: **+91 70520 50656**`;
  }

  // 8. PCB Design & Hardware Prototyping
  if (q.includes('pcb') || q.includes('circuit') || q.includes('schematic') || q.includes('kicad') || q.includes('prototype') || q.includes('hardware')) {
    return `⚡ **Custom PCB Design & Hardware Prototyping**

RvmAiTech whiteboard concept se lekar commercial manufacturing tak electronics engineering deliver karta hai:

- **Schematic & Layout**: KiCad, EasyEDA aur Altium me 2 se 6 layers tak multi-layer PCB design.
- **Component Selection**: Industrial grade microcontrollers (ESP32, STM32), ESD/surge protection, aur power-efficient components.
- **Prototype Manufacturing**: Rapid POC bench samples, SMT/THT assembly, aur 3D custom enclosure packaging.
- **Testing & Debugging**: Signal integrity analysis, thermal testing, burn-in validation aur firmware testing.

👉 Timeline: Initial prototype design aamtaur par 1 se 3 weeks me deliver ho jata hai. Requirements share karne ke liye WhatsApp karein: **+91 70520 50656**`;
  }

  // 9. IoT, Modbus & Sensors
  if (q.includes('iot') || q.includes('modbus') || q.includes('rs485') || q.includes('sensor') || q.includes('mqtt') || q.includes('telemetry') || q.includes('datalogger')) {
    return `🏭 **Industrial IoT & Edge Telemetry Solutions**

Hum industrial machines aur shop floor sensors ko cloud aur mobile dashboards se connect karte hain:

- **Protocols Supported**: Modbus RTU (over isolated RS-485), Modbus TCP, MQTT over TLS, CAN bus, HTTP REST APIs.
- **Machine Interfacing**: Siemens, Mitsubishi, Delta PLCs, non-invasive CT current sensors, flowmeters, vibration probes.
- **Hardware Gateways**: ESP32 aur STM32-based industrial controllers with 4G LTE cellular fallback.
- **Data Safety**: Internet disconnect hone par bhi local SD/Flash memory me 30 din tak ka telemetry data safe rehta hai aur reconnect hote hi auto-sync ho jata hai.

👉 Apne plant machine monitoring ke liye quote lene ke liye call/WhatsApp karein: **+91 70520 50656**`;
  }

  // 10. How We Work / Process / Workflow
  if (q.includes('process') || q.includes('workflow') || q.includes('step') || q.includes('kaise kaam') || q.includes('delivery')) {
    return `🔄 **How RvmAiTech Delivers Projects (Our 6-Step Workflow)**

1. **Requirement Analysis**: Client ki needs, machines, operational objectives aur constraints ko samajhna.
2. **System Design**: Circuit schematics, hardware architecture, communication protocols aur database design.
3. **Prototype Development**: Working POC model aur benchtop prototype assembly banana.
4. **Programming & Integration**: Firmware (C/C++), cloud APIs, dashboards (React) aur mobile apps connect karna.
5. **Testing & Validation**: Stress burn-in, noise filtering, electrical testing aur end-to-end audit.
6. **Final Deployment**: On-site installation, technical documentation handoff, aur dedicated support.`;
  }

  // 11. Careers / Hiring / Jobs
  if (q.includes('career') || q.includes('job') || q.includes('hiring') || q.includes('intern') || q.includes('vacancy') || q.includes('apply')) {
    return `💼 **Careers at RvmAiTech**

Hum passionate engineers aur developers ke sath technology build karte hain:

- **Key Domains**: Embedded C/C++, IoT Engineering, PLC Automation, Computer Vision / Python AI, React.js / Node.js Full-Stack Development.
- **Open Applications**: Aap apna resume direct **/careers/apply** par submit kar sakte hain ya email bhej sakte hain: **rvmaitech2026@gmail.com**

Hum live factory projects aur exciting hardware-software prototyping par direct work experience provide karte hain!`;
  }

  // 12. Office Location / Address
  if (q.includes('location') || q.includes('office') || q.includes('address') || q.includes('kahan') || q.includes('city') || q.includes('where')) {
    return `📍 **RvmAiTech Location & Availability**

- **Headquarters**: India (Operating across NCR and PAN-India on-site deployment).
- **Service Reach**: Hum poore Bharat me factory automation, smart parking installation aur remote IoT commissioning deliver karte hain.
- **Digital / Remote Support**: Hamara IoT cloud platform 24/7 remote device monitoring aur diagnostics provide karta hai.

Direct contact: **+91 70520 50656** | **rvmaitech2026@gmail.com**`;
  }

  // 13. Pricing, Cost & Quote
  if (q.includes('price') || q.includes('cost') || q.includes('budget') || q.includes('quote') || q.includes('rate') || q.includes('kitna') || q.includes('kharcha')) {
    return `💼 **RvmAiTech Project Pricing & Quotation**

Hamari pricing transparent aur requirement-based hoti hai:

- **Small Prototype / IoT Controller**: ₹25,000 – ₹75,000 (Testing POC, custom board design).
- **Turnkey Machine Automation / Smart Parking**: Requirement ke size (gates, cameras, slots) ke mutabiq tailor-made.
- **Custom ERP & Web Portals**: Module requirement ke anusaar one-time license ya maintenance support.

👉 Exact quotation aur technical proposal ke liye apni requirements hamare WhatsApp par bhejein: **+91 70520 50656** ya email karein: **rvmaitech2026@gmail.com** (24 hours me technical proposal mil jata hai).`;
  }

  // 14. Contact Info
  if (q.includes('contact') || q.includes('phone') || q.includes('number') || q.includes('email') || q.includes('whatsapp') || q.includes('call')) {
    return `📞 **RvmAiTech Direct Contact Details**

- **WhatsApp & Calling**: +91 70520 50656
- **Official Email**: rvmaitech2026@gmail.com
- **Website**: https://rvmaitech.com
- **Hours**: Mon – Sat, 9:00 AM – 7:30 PM IST

Aap direct WhatsApp par message bhejkar hamare Lead System Architect se instantly connect ho sakte hain!`;
  }

  // 15. Greetings
  if (q === 'hi' || q === 'hello' || q === 'hey' || q.includes('namaste') || q.includes('kaise ho') || q.includes('good morning') || q.includes('good evening')) {
    return `Namaste! 🙏 Welcome to **RvmAiTech**.

Main RvmAiTech ka AI Technical Assistant hoon. Aap hamari company, leadership (Founders), services (Smart Parking, Industrial IoT, Machine Vision, Robotics, Custom PCB, ERPs), ya project cost ke baare me pooch sakte hain.

Main aapki kis cheez me madad kar sakta hoon?`;
  }

  // 16. General Fallback
  return `**Welcome to RvmAiTech Engineering & Intelligence.** 👋

RvmAiTech ek complete **Electronics Hardware, Machine Vision, Industrial Automation & Intelligent Software** engineering company hai:

1. **Smart Parking Automation** (ANPR AI Cameras, Automated Boom Barriers, Ultrasonic Guidance, Cloud POS Billing)
2. **Industrial IoT & Automation** (Modbus RTU/TCP over RS-485, PLC Telemetry, 4G Cellular Gateways)
3. **Custom PCB & Hardware Engineering** (Multi-Layer Schematics, Layout & Turnkey Prototyping)
4. **Machine Vision & AI Cameras** (Defect Inspection, Optical Character Recognition)
5. **Enterprise ERP Platforms** (School ERP & Hotel PMS Suites)
6. **Full-Stack Web & Mobile Dashboards** (React.js, Node.js, Python, PostgreSQL)

👉 Company Founder: **Mr. Vivek Bhardwaj** (Founder & CEO)
👉 Direct WhatsApp Consultation: **+91 70520 50656** | **rvmaitech2026@gmail.com**`;
}

// Call Google Gemini API if key is present
async function queryGemini(userMessage, history = [], apiKey) {
  const contents = [];

  for (const h of history.slice(-6)) {
    contents.push({
      role: h.role === 'user' ? 'user' : 'model',
      parts: [{ text: h.text || '' }],
    });
  }

  contents.push({
    role: 'user',
    parts: [{ text: userMessage }],
  });

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents,
      systemInstruction: {
        parts: [{ text: RVMAITECH_SYSTEM_PROMPT }],
      },
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 800,
      },
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Gemini API error (${response.status}): ${errText}`);
  }

  const data = await response.json();
  const reply = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!reply) throw new Error('No candidate returned by Gemini');
  return reply;
}

async function ask(req, res) {
  const { message, history } = req.body || {};
  if (!message || typeof message !== 'string' || !message.trim()) {
    return res.status(400).json({ message: 'Message is required' });
  }

  const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;

  if (apiKey) {
    try {
      const geminiReply = await queryGemini(message.trim(), history || [], apiKey);
      return res.json({ reply: geminiReply, source: 'gemini' });
    } catch (e) {
      console.warn('Gemini API call failed, falling back to local engine:', e.message);
    }
  }

  // Built-in intelligent response engine
  const localReply = getBuiltinKnowledgeResponse(message.trim());
  return res.json({ reply: localReply, source: 'local' });
}

module.exports = { ask };
