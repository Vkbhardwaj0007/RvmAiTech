const { config } = require('../config/env');

const RVMAITECH_SYSTEM_PROMPT = `
You are the official customer & engineering support consultant of RvmAiTech (https://rvmaitech.com).
Your tone MUST be warm, polite, professional, and natural — exactly like a helpful human consultant communicating with a client (not like a generic encyclopedic AI).

Key Conversational Rules:
1. GREETING RULE:
   If the user says "hi", "hii", "hello", "hellow", "namaste", "hey", or any greeting, reply warmly and respectfully:
   "Hello Sir / Madam! RvmAiTech me aapka swagat hai. Main aapki kya madad kar sakta hoon?"
   Do NOT dump essays, lists of projects, or unsolicited bullet points on a simple greeting!

2. TO-THE-POINT RULE:
   "Jo puchhega wahi reply dena, usse zyada nahi."
   Answer ONLY what the user asks. Keep your answer crisp, accurate, polite, and to the point.
   Address the user respectfully ("Sir / Madam").
   Language: Match the user's language naturally (Hindi, Hinglish, or English).

3. COMPANY & FOUNDER KNOWLEDGE:
   - Founder & CEO: Mr. Vivek Bhardwaj (Specialist in Embedded Systems, IoT, Robotics, Computer Vision & Machine Intelligence)
   - Co-Founder & CTO: Mr. Rahul (System Architecture & Floor Automation)
   - Managing Director (MD): Vishal (Operations & Project Commissioning)
   - Official WhatsApp & Phone: +91 70520 50656
   - Official Email: rvmaitech2026@gmail.com
   - Core Services:
     * Smart Parking Automation (ANPR AI Cameras, Automated Boom Barriers, Ultrasonic Bay Sensors, Cloud/Offline POS Billing, WhatsApp/UPI Receipts)
     * Industrial IoT & Automation (Modbus RTU/TCP over RS-485, PLC Telemetry, 4G Gateways, 30-day offline buffer)
     * Custom PCB & Hardware Prototyping (KiCad/EasyEDA 2-6 layers, ESP32/STM32, Turnkey Prototypes)
     * Machine Vision & AI Cameras (Defect Inspection, OCR Text/Expiry reading, Robot Guidance)
     * Enterprise Software (School & College ERP, Hotel & Resort PMS)
     * Full-Stack Web & Mobile Applications (React.js, Node.js, Python, PostgreSQL)

4. Closing:
   Keep closing friendly and brief, offering direct WhatsApp consultation (+91 70520 50656) when relevant for quotes or demos.
`;

// Built-in intelligent human-like knowledge matcher
function getBuiltinKnowledgeResponse(query, language = 'hinglish') {
  const q = (query || '').toLowerCase().trim();

  // 0. Greetings Check (hi, hii, hello, helo, hlo, hey, namaste, pranam, etc.)
  const isGreeting =
    /^(hi+|hello+|hellow+|hey+|hlo+|helo+|namaste|namaskar|pranam|hola|greetings)(\b|\s|[!?.]|$)/i.test(q) ||
    q === 'hi' ||
    q === 'hii' ||
    q === 'hello' ||
    q === 'hellow' ||
    q === 'hlo' ||
    q === 'helo' ||
    q === 'hey' ||
    q === 'namaste' ||
    q === 'namaskar';

  if (isGreeting && q.length < 35 && !q.includes('parking') && !q.includes('founder') && !q.includes('pcb') && !q.includes('erp') && !q.includes('iot') && !q.includes('cost') && !q.includes('price')) {
    return `Hello Sir / Madam! 👋

**Welcome to RvmAiTech.**

How can I assist you today?`;
  }

  // 0.1 "Kaise ho" / "How are you"
  if (q.includes('kaise ho') || q.includes('how are you') || q.includes('kya haal')) {
    return `Main badhiya hoon, Sir / Madam! Aap batayein, aap kaise hain aur aaj main aapki kya madad kar sakta hoon?`;
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
    return `Sir / Madam, RvmAiTech ke Founder & CEO **Mr. Vivek Bhardwaj** hain. Woh Embedded Systems, IoT, Robotics aur Machine Vision ke specialist hain.

Hamari core leadership team:
• **Mr. Vivek Bhardwaj** — Founder & CEO
• **Mr. Rahul** — Co-Founder & CTO (System Architecture & Floor Automation)
• **Vishal** — Managing Director (Operations & Commissioning)

Kya aapko kisi project ke silsile me team se connect karna hai?`;
  }

  // 1.5 Custom Software, Web Development, Mobile Apps & Dashboards
  if (
    q.includes('softwar') ||
    q.includes('softwer') ||
    q.includes('app') ||
    q.includes('web') ||
    q.includes('portal') ||
    q.includes('dashboard') ||
    q.includes('react') ||
    q.includes('node') ||
    q.includes('python') ||
    q.includes('fullstack') ||
    q.includes('full stack') ||
    q.includes('coustom') ||
    q.includes('custom soft')
  ) {
    return `Sir / Madam, hum enterprise-grade Custom Software aur Web/Mobile Apps develop karte hain:

• **Full-Stack Web & Cloud Dashboards**: React.js, Node.js, Python FastAPI/Django, aur PostgreSQL/MongoDB ke sath fast aur secure web applications.
• **IoT & Machine Dashboards**: Real-time sensor graphs, machine telemetry monitoring aur automated alerts.
• **Enterprise Business Software**: School/College ERP, Hotel PMS, Billing & POS platforms.
• **Mobile Applications**: Android aur cross-platform management apps.

Aapko kis type ke custom software ya application ki requirement hai?`;
  }

  // 1.6 Services / Projects Overview
  if (
    q.includes('service') ||
    q.includes('services') ||
    q.includes('kya kya') ||
    q.includes('capabilities') ||
    q.includes('all project')
  ) {
    return `Sir / Madam, RvmAiTech yeh core engineering services deliver karta hai:
1. 🚗 **Smart Parking Automation** (ANPR Cameras, Barriers & POS Billing)
2. ⚡ **Custom PCB & Hardware Prototyping** (Schematics to Turnkey Production)
3. 📡 **Industrial IoT & Edge Telemetry** (Modbus RS-485 & 4G Gateways)
4. 💻 **Custom Software & ERP Platforms** (School ERP, Hotel PMS & Web Portals)
5. 👁️ **Machine Vision & AI Cameras** (Defect Inspection & OCR)
6. 🤖 **Industrial Robotics & Factory Automation** (PLCs & Actuators)

Aap inme se kis project ya service ke baare me detail janna chahte hain?`;
  }

  // 2. Smart Parking
  if (q.includes('parking') || q.includes('boom barrier') || q.includes('anpr') || q.includes('number plate') || q.includes('car')) {
    return `Sir / Madam, hamara Smart Parking System ek complete automated solution hai:

1. **ANPR Camera**: Gaadi ka number plate sub-second me read karta hai (99%+ accuracy).
2. **Automatic Boom Barrier**: Number verify hote hi barrier automatically khul jata hai.
3. **Ultrasonic Bay Guidance**: Khali parking slots ki real-time green/red indicator se jankari milti hai.
4. **POS Billing**: Exit par automated hourly fees calculation aur WhatsApp/UPI payment receipt milti hai.

Kya aapko apne site ya mall/commercial building ke liye demo ya quote chahiye?`;
  }

  // 3. PCB Design & Hardware Prototyping
  if (q.includes('pcb') || q.includes('circuit') || q.includes('schematic') || q.includes('kicad') || q.includes('prototype') || q.includes('hardware')) {
    return `Sir / Madam, hum custom PCB design aur hardware prototyping deliver karte hain — concept schematic se lekar multi-layer layout (KiCad/EasyEDA), microcontroller firmware (ESP32/STM32) aur testing tak.

Aapka hardware project kis type ka hai ya aapki kya requirements hain?`;
  }

  // 4. IoT, Modbus & Sensors
  if (q.includes('iot') || q.includes('modbus') || q.includes('rs485') || q.includes('sensor') || q.includes('mqtt') || q.includes('telemetry') || q.includes('datalogger')) {
    return `Sir / Madam, hamara Industrial IoT solution factory machines aur sensors ko cloud dashboard se jodta hai:
• Modbus RTU/TCP over isolated RS-485
• 4G LTE cellular gateways with local 30-day offline buffer memory
• Real-time machine status, energy monitoring aur live alerts

Aapko kaunsi machines ya sensors monitor karni hain?`;
  }

  // 5. Machine Vision & AI Camera
  if (q.includes('vision') || q.includes('machine vision') || q.includes('ai camera') || q.includes('camera') || q.includes('ocr') || q.includes('defect') || q.includes('inspection')) {
    return `Sir / Madam, hamari Machine Vision solutions me high-speed ANPR cameras, production line par surface defect inspection, aur OCR batch-code/expiry reading shamil hai.

Aapka inspection ya vision use-case kis industry ke liye hai?`;
  }

  // 6. School ERP / Education
  if (q.includes('school') || q.includes('college') || (q.includes('erp') && (q.includes('student') || q.includes('fee')))) {
    return `Sir / Madam, hamare School ERP me fees collection, automated receipts, biometric/RFID attendance, WhatsApp alerts, exam marks entry aur report cards ka complete system milta hai.

Kya aapko school ya institute ke liye demo dekhna hai?`;
  }

  // 7. Hotel ERP / PMS
  if (q.includes('hotel') || q.includes('resort') || q.includes('pms') || q.includes('room billing')) {
    return `Sir / Madam, hamare Hotel PMS me front-desk check-in/out, multi-counter restaurant POS (KOT billing), room service aur housekeeping management ek hi software me manage hota hai.

Kya aapko hotel ya resort ke liye quotation chahiye?`;
  }

  // 8. Robotics & Process Automation
  if (q.includes('robot') || q.includes('robotic') || q.includes('process automation') || q.includes('automation') || q.includes('plc') || q.includes('factory') || q.includes('conveyor')) {
    return `Sir / Madam, hum industrial robotics aur assembly-line automation deliver karte hain, jisme PLC/SCADA programming (Siemens, Delta, Mitsubishi), custom pick-and-place actuators aur safety interlocks shamil hain.

Aapka automation requirement kis machine ya process ke liye hai?`;
  }

  // 9. Pricing, Cost & Quote
  if (q.includes('price') || q.includes('cost') || q.includes('budget') || q.includes('quote') || q.includes('rate') || q.includes('kitna') || q.includes('kharcha')) {
    return `Sir / Madam, project ka cost uske scale aur requirements par depend karta hai:
• **Custom IoT / PCB Prototype**: lagbhag ₹25,000 se ₹75,000
• **Smart Parking / Factory Automation**: site size aur cameras/gates ke mutabiq custom quote banta hai.

Exact quotation ke liye aap apni requirements hamare WhatsApp **+91 70520 50656** par share kar sakte hain, hum turant estimate de denge.`;
  }

  // 10. Contact Info
  if (q.includes('contact') || q.includes('phone') || q.includes('number') || q.includes('email') || q.includes('whatsapp') || q.includes('call')) {
    return `Sir / Madam, aap humse directly contact kar sakte hain:
• 📞 **WhatsApp & Call**: +91 70520 50656
• ✉️ **Email**: rvmaitech2026@gmail.com
• 🌐 **Website**: https://rvmaitech.com

Aap direct WhatsApp par message bhejkar consultation schedule kar sakte hain!`;
  }

  // 11. Office Location / Address
  if (q.includes('location') || q.includes('office') || q.includes('address') || q.includes('kahan') || q.includes('city') || q.includes('where')) {
    return `Sir / Madam, hamara office India me hai aur hum poore Bharat (PAN-India) me on-site deployment aur remote IoT support provide karte hain.

Aap humse **+91 70520 50656** par contact karke meeting ya site visit plan kar sakte hain.`;
  }

  // 12. Careers / Hiring / Jobs
  if (q.includes('career') || q.includes('job') || q.includes('hiring') || q.includes('intern') || q.includes('vacancy') || q.includes('apply')) {
    return `Sir / Madam, hum Embedded Systems, IoT, Computer Vision, aur Full-Stack Development me talented engineers ko welcome karte hain.

Aap apna resume **rvmaitech2026@gmail.com** par bhej sakte hain ya website ke Careers page par apply kar sakte hain!`;
  }

  // 13. About RvmAiTech / What does company do
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
    return `Sir / Madam, RvmAiTech ek tech & engineering company hai jo Smart Parking Automation, Machine Vision AI, Industrial IoT, Robotics, Custom PCB aur Enterprise Software (School/Hotel ERP) build karti hai.

Aap inme se kis service ke baare me detail janna chahte hain?`;
  }

  // 14. How We Work / Process
  if (q.includes('process') || q.includes('workflow') || q.includes('step') || q.includes('kaise kaam') || q.includes('delivery')) {
    return `Sir / Madam, hamara project delivery process 6 simple steps me chalta hai:
1. **Requirement Analysis**: Aapki zaroorat samajhna.
2. **System Design**: Hardware & software architecture plan karna.
3. **Prototype Development**: Working POC sample tayyar karna.
4. **Integration**: Firmware, cloud aur mobile dashboard connect karna.
5. **Testing**: Stress & reliability testing.
6. **Deployment**: On-site installation aur dedicated support.

Kya aapka koi specific project hai jiska process aap janna chahte hain?`;
  }

  // 15. General Fallback
  return `Sir / Madam, main RvmAiTech ke projects (Smart Parking, Industrial IoT, Custom PCB, Machine Vision ya ERP Software) ke baare me aapki madad kar sakta hoon.

Aapka jo sawaal hai kripya poochein, main to-the-point bata dunga. Ya direct baat karne ke liye aap hamare WhatsApp **+91 70520 50656** par bhi message kar sakte hain.`;
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
