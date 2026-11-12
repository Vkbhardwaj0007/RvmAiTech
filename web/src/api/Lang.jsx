import { createContext, useContext, useState, useEffect } from 'react';

const STR = {
  en: {
    get_quote: 'Get a quote',
    hero_eyebrow: 'MDMS Intelligence · 30%+ Downtime Reduction · Live OEE',
    hero_l1: 'Smarter Machines.', hero_l2: 'Measurable ROI.',
    hero_lead: 'Transform factory operations with MDMS (Machine Data Management System) and non-intrusive edge datalogging. Track live machine status, automate shift OEE, and cut unplanned downtime by 30% or more.',
    hero_cta1: 'Book MDMS Demo', hero_cta2: 'Explore Solutions',
  },
  hi: {
    get_quote: 'कोटेशन लें',
    hero_eyebrow: 'MDMS इंटेलिजेंस · 30%+ डाउनटाइम में कमी · लाइव OEE',
    hero_l1: 'स्मार्ट मशीनें।', hero_l2: 'मापने योग्य ROI।',
    hero_lead: 'MDMS (मशीन डेटा मैनेजमेंट सिस्टम) और एज डेटालॉगर से अपनी फैक्ट्री को स्मार्ट बनाएं। रियल-टाइम मशीन स्टेटस ट्रैक करें, शिफ्ट OEE कैलकुलेट करें और डाउनटाइम 30% तक घटाएं।',
    hero_cta1: 'MDMS डेमो बुक करें', hero_cta2: 'सॉल्यूशन्स देखें',
  },
};
// nav label map en -> hi
export const NAV_HI = {
  'Home': 'होम', 'About Us': 'हमारे बारे में', 'Our Leadership': 'हमारी लीडरशिप',
  'In News': 'समाचार में', 'Careers': 'करियर', 'Services': 'सेवाएं',
  'Technologies': 'तकनीक', 'Products': 'उत्पाद', 'MDMS': 'MDMS',
  'Datalogger': 'डेटालॉगर', 'Home Automation': 'होम ऑटोमेशन',
  'Smart Parking': 'स्मार्ट पार्किंग', 'Smart Home Automation': 'स्मार्ट होम ऑटोमेशन',
  'School ERP': 'स्कूल ERP', 'Hotel ERP': 'होटल ERP',
  'All Products': 'सभी प्रोडक्ट्स', 'Projects': 'प्रोजेक्ट्स', 'More': 'और',
  'Blogs': 'ब्लॉग', 'Contact': 'संपर्क',
  'Software Development': 'सॉफ्टवेयर डेवलपमेंट',
  'IoT & Software Development': 'IoT एवं सॉफ्टवेयर डेवलपमेंट',
  'Overview & Capabilities': 'अवलोकन और क्षमताएं',
  'Industrial IoT & Edge Telemetry': 'इंडस्ट्रियल IoT और टेलीमेट्री',
  'Custom Web & Cloud Apps': 'कस्टम वेब व क्लाउड ऐप्स',
  'ERP Systems (School & Hotel)': 'ERP सिस्टम (स्कूल और होटल)',
  'School ERP Suite': 'स्कूल ERP सुइट',
  'Hotel & Resort PMS': 'होटल एवं रिसॉर्ट PMS',
};

const LangCtx = createContext({ lang: 'en', t: (k) => k, setLang: () => {} });
export function LangProvider({ children }) {
  const [lang, setLangState] = useState(localStorage.getItem('rv_lang') || 'en');
  useEffect(() => { localStorage.setItem('rv_lang', lang); document.documentElement.lang = lang; }, [lang]);
  const t = (k) => (STR[lang] && STR[lang][k]) || STR.en[k] || k;
  const navLabel = (en) => lang === 'hi' ? (NAV_HI[en] || en) : en;
  return <LangCtx.Provider value={{ lang, setLang: setLangState, t, navLabel }}>{children}</LangCtx.Provider>;
}
export function useLang() { return useContext(LangCtx); }
