import { createContext, useContext, useState, useEffect } from 'react';

const STR = {
  en: {
    get_quote: 'Get a quote',
    hero_eyebrow: 'Automation · Vision · Intelligence in action',
    hero_l1: 'Smarter Machines.', hero_l2: 'Better Tomorrow.',
    hero_lead: 'We build intelligent automation for factories, homes and processes — combining robotics, computer vision and machine intelligence into systems that run themselves.',
    hero_cta1: 'Start your project', hero_cta2: 'Explore services',
  },
  hi: {
    get_quote: 'कोटेशन लें',
    hero_eyebrow: 'ऑटोमेशन · विज़न · इंटेलिजेंस',
    hero_l1: 'स्मार्ट मशीनें।', hero_l2: 'बेहतर कल।',
    hero_lead: 'हम फैक्ट्री, घर और प्रोसेस के लिए इंटेलिजेंट ऑटोमेशन बनाते हैं — रोबोटिक्स, मशीन विज़न और मशीन इंटेलिजेंस को मिलाकर ऐसे सिस्टम जो खुद चलते हैं।',
    hero_cta1: 'प्रोजेक्ट शुरू करें', hero_cta2: 'सेवाएं देखें',
  },
};
// nav label map en -> hi
export const NAV_HI = {
  'Home': 'होम', 'About Us': 'हमारे बारे में', 'Our Leadership': 'हमारी लीडरशिप',
  'In News': 'समाचार में', 'Careers': 'करियर', 'Services': 'सेवाएं',
  'Technologies': 'तकनीक', 'Products': 'उत्पाद', 'MDMS': 'MDMS',
  'Datalogger': 'डेटालॉगर', 'Home Automation': 'होम ऑटोमेशन', 'All Products': 'सभी प्रोडक्ट्स', 'Projects': 'प्रोजेक्ट्स', 'More': 'और',
  'Blogs': 'ब्लॉग', 'Contact': 'संपर्क',
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
