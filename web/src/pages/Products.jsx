import { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import client from '../api/client';
import { PageHero } from './_hero.jsx';
const CAT_INTRO = {
  Datalogger: {
    title: 'Datalogger — The Edge of MDMS',
    text: 'Datalogger is the industrial edge hardware that sits beside the machine and pulls real-time telemetry straight from PLCs, sensors, and energy meters with ZERO modification to existing PLC programs. MDMS turns that raw data into live dashboards, alerts, and OEE analytics.',
    plcs: ['Siemens', 'Mitsubishi', 'Delta', 'Omron', 'ABB', 'Inovance', 'Allen-Bradley', 'Modbus RTU/TCP', 'Energy Meters', '4–20 mA / TC', 'Isolated RS485'],
  },
  'Home Automation': {
    title: 'Smart Home Automation — From One Switch to Whole Buildings',
    text: 'Start with retrofit switch kits that install behind existing switchboards without any rewiring, scale to centralized whole-building controllers with scenes and energy telemetry. Operates locally with full offline security and voice assistant integration.',
    plcs: ['Smart Lighting', 'AC & Climate', 'Motorized Curtains', 'Geyser Control', 'Tank & Pump Automation', 'CCTV & Video Doorbell', 'Smart Locks', 'Alexa / Google Assistant'],
  },
  'Smart Home Automation': {
    title: 'Smart Home Automation — Intelligent Living & Energy Control',
    text: 'Engineered for seamless smart home luxury and maximum electrical safety. Control appliances, schedule routines, monitor real-time power draw, and secure your premises through a single mobile application and local offline hub.',
    plcs: ['Retrofit Switch Relays', 'Scene Touch Panels', 'IR AC Automation', 'Motorized Curtains', 'Water Level Controllers', 'Smart Door Locks', 'Voice Integration'],
  },
  MDMS: {
    title: 'MDMS — Machine Data Management System',
    text: 'Our flagship manufacturing intelligence platform. Connect every shop-floor asset, track live machine status, monitor true OEE (Overall Equipment Effectiveness), automate downtime categorization, and receive instant anomaly alerts to cut losses by 30% or more.',
    plcs: ['Live Machine State', 'Real-Time OEE Analytics', 'Shift & Operator Tracking', 'Predictive Downtime Alerts', 'Automated Daily Reports', 'ERP / MES API Integration'],
  },
  'Smart Parking': {
    title: 'Smart Parking — Automated Guidance, ANPR & Billing',
    text: 'Intelligent multi-tier parking management system combining ANPR (Automatic Number Plate Recognition) cameras, magnetic loop detectors, automated boom barriers, and ultrasonic slot guidance for zero-congestion operations.',
    plcs: ['ANPR Camera Recognition', 'Fastag / RFID Integration', 'Ultrasonic Slot Sensors', 'Automated Boom Barriers', 'Digital LED Guidance Displays', 'UPI / Card POS Billing'],
  },
  'School ERP': {
    title: 'School ERP — Complete Campus Automation Suite',
    text: 'End-to-end cloud and on-premise school management software. Seamlessly manages student admissions, automated fee invoicing & online gateways, biometric/RFID attendance, timetable scheduling, report cards, and parent mobile apps.',
    plcs: ['Student Lifecycle & Admissions', 'Automated Fee Management', 'Biometric & RFID Attendance', 'Parent Mobile App & SMS Alerts', 'Examination & Grading', 'Transport & GPS Bus Tracking'],
  },
  'Hotel ERP': {
    title: 'Hotel ERP — Intelligent Hospitality Property Management',
    text: 'All-in-one Property Management System (PMS) designed for hotels, resorts, and restaurants. Streamline front-desk reservations, express check-in, restaurant POS billing, housekeeping task automation, and inventory control.',
    plcs: ['Front Desk & Reservation Engine', 'Restaurant & Bar POS', 'Housekeeping & Maintenance', 'Inventory & Kitchen Recipe Stock', 'Guest CRM & Invoicing', 'Channel Manager Integration'],
  },
};

const DEFAULT_CATS = ['all', 'MDMS', 'Datalogger', 'Smart Parking', 'Smart Home Automation'];

export default function Products() {
  const [params, setParams] = useSearchParams();
  const rawCat = params.get('category') || 'all';
  // normalize category lookup
  const category = rawCat === 'Home Automation' ? 'Smart Home Automation' : rawCat;
  const [items, setItems] = useState([]);
  const [cats, setCats] = useState(DEFAULT_CATS);

  useEffect(() => {
    client.get('/products', { params: { all: 0 } }).then((r) => {
      const all = r.data.items || [];
      const dbCats = all.map((p) => p.category === 'Home Automation' ? 'Smart Home Automation' : p.category).filter(Boolean);
      setCats(['all', ...new Set([...DEFAULT_CATS.slice(1), ...dbCats])]);
    }).catch(() => {});
  }, []);

  useEffect(() => {
    let q = {};
    if (category !== 'all') {
      if (category === 'Smart Home Automation') {
        // query for either Smart Home Automation or Home Automation
        q = { category: 'Smart Home Automation' };
      } else {
        q = { category };
      }
    }
    client.get('/products', { params: q }).then((r) => {
      let list = r.data.items || [];
      if (category === 'Smart Home Automation' && list.length === 0) {
        // fallback to Home Automation
        client.get('/products', { params: { category: 'Home Automation' } }).then((r2) => {
          setItems(r2.data.items || []);
        }).catch(() => setItems([]));
      } else {
        setItems(list);
      }
    }).catch(() => {});
  }, [category]);
  return (
    <>
      <PageHero kicker="What we build" title={category === 'all' ? 'Products & Solutions' : category} sub="Production-ready hardware and intelligent software engineered for industrial and commercial reliability." />
      <section><div className="wrap">
        {CAT_INTRO[category] && (
          <div className="cat-intro" style={{ background: '#f8fbff', border: '1px solid #d4e3f8', borderRadius: 16, padding: '28px 32px', marginBottom: 32 }}>
            <h2 style={{ color: '#0d2649', fontSize: 24, marginBottom: 12 }}>{CAT_INTRO[category].title}</h2>
            <p style={{ color: '#3f4d63', fontSize: 16, lineHeight: 1.6, marginBottom: 18 }}>{CAT_INTRO[category].text}</p>
            {CAT_INTRO[category].plcs && (
              <div className="plc-strip" style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
                <span className="plc-label" style={{ fontWeight: 600, color: '#0d2649', fontSize: 14 }}>Core Capabilities:</span>
                {CAT_INTRO[category].plcs.map((x) => (
                  <span className="plc" key={x} style={{ background: '#eaf1fc', color: '#1351b4', padding: '4px 10px', borderRadius: 6, fontSize: 13, fontWeight: 500 }}>{x}</span>
                ))}
              </div>
            )}
          </div>
        )}
        <div className="chips">
          {cats.map((c) => (
            <button key={c} className={`chip ${category === c ? 'on' : ''}`} onClick={() => setParams(c === 'all' ? {} : { category: c })}>{c}</button>
          ))}
        </div>
        <div className="grid-3" style={{ marginTop: 26 }}>
          {items.map((p) => (
            <article className="card" key={p._id} style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                {p.image && <img className="card-img" src={p.image} alt="" style={{ height: 180, width: '100%', objectFit: 'cover', borderRadius: 8, marginBottom: 14 }} />}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <div className="prod-cat">{p.category}</div>
                  <span style={{ fontSize: 12, fontWeight: 600, color: '#1351b4', background: '#eef4ff', padding: '3px 8px', borderRadius: 4 }}>Quote on Request</span>
                </div>
                <h3>{p.name}</h3>
                <p>{p.summary}</p>
                {p.specs?.length > 0 && (
                  <ul className="tick" style={{ margin: '14px 0' }}>
                    {p.specs.slice(0, 3).map((s, k) => <li key={k}><b>{s.label}:</b> {s.value}</li>)}
                  </ul>
                )}
              </div>
              <div style={{ display: 'flex', gap: 10, marginTop: 18, borderTop: '1px solid #edf2f9', paddingTop: 14 }}>
                <Link to={`/products/${p.slug}`} className="card-link" style={{ flex: 1 }}>View details →</Link>
                <Link to={`/contact?product=${encodeURIComponent(p.name)}`} className="btn btn-primary" style={{ padding: '6px 14px', fontSize: 13 }}>Get Quote</Link>
              </div>
            </article>
          ))}
          {items.length === 0 && (
            <div style={{ gridColumn: '1 / -1', background: '#fff', border: '1px dashed #c9d6ea', borderRadius: 14, padding: '40px 24px', textAlign: 'center' }}>
              <h3 style={{ color: '#0d2649', marginBottom: 10 }}>Enterprise Solution: {category}</h3>
              <p style={{ color: '#55657d', maxWidth: 600, margin: '0 auto 20px' }}>
                We provide custom development, tailored hardware integration, and end-to-end commissioning for {category}. Contact our engineering team for live demo, architecture scoping, and quotation.
              </p>
              <div style={{ display: 'flex', justifyContent: 'center', gap: 12 }}>
                <Link to={`/contact?subject=${encodeURIComponent(category + ' Enquiry')}`} className="btn btn-primary">Request Custom Quotation</Link>
                <Link to="/contact" className="btn btn-ghost">Schedule Tech Consultation</Link>
              </div>
            </div>
          )}
        </div>
      </div></section>
    </>
  );
}
