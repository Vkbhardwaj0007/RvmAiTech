import { useLocation } from 'react-router-dom';
import { useSite } from '../api/SiteContext';
import { HERO_PAGES, BUILTIN_STILLS, pageKeyFromPath } from './heroMedia';

/**
 * Intro block shown under the hero of every page: a heading, a few paragraphs
 * about that page (bullet lines starting with "- " become a list) and an image.
 *
 * Content comes from Admin → Pages (site content key `pageIntro`). Until the
 * admin saves a page, the defaults below are shown; saving with every field
 * empty hides the block on that page. `position` puts the block right under
 * the hero ("top", default) or at the very bottom of the page ("bottom" —
 * rendered by <BottomIntro /> in the site layout).
 */

// Pages that can carry an intro (homepage + every inner page).
export const INTRO_PAGES = [['home', 'Home'], ...HERO_PAGES.filter(([k]) => k !== 'default')];

const [S1, S2, S3] = BUILTIN_STILLS;

export const PAGE_INTRO_DEFAULTS = {
  home: {
    heading: 'Your partner in intelligent automation',
    body: `RvmAiTech builds automation that fits how you operate — from a single machine to a whole plant, and from one smart switch to a whole building. Robotics, machine vision and machine intelligence, delivered by a team that understands the shop floor.

- Process automation: PLC/SCADA integration, live monitoring, traceability
- Home automation: lighting, climate, security and energy in one app
- Industrial automation: robotic cells, vision inspection, line control`,
    image: '', side: 'right',          // text only on the homepage (add one in Admin → Pages if wanted)
  },
  about: {
    heading: 'Who we are',
    body: `RvmAiTech is an automation company from India. We design, build and support systems that let machines see, decide and act on their own — so factories run with less downtime, homes run on autopilot and processes stop depending on manual entries.

Our engineers come from PLC, robotics, computer vision and software backgrounds, and every project ends the same way: a running system, trained operators and a clear payback.`,
    image: S3, side: 'right',
  },
  leadership: {
    // rendered by pages/Leadership.jsx as the centred title above the team grid ("|" = light / bold line break)
    heading: 'The People | Behind Our Success',
    body: `Our team combines expertise in industrial automation, embedded systems, robotics, machine vision, and software to build practical solutions for real-world applications. We stay involved throughout every project—from understanding the requirement and designing the system to development, testing, deployment, and commissioning—because successful automation starts with understanding how the process actually works.`,
    image: '', side: 'left', position: 'top',
  },
  news: {
    heading: 'RvmAiTech in the news',
    body: `Coverage, announcements and milestones — new products, project go-lives, partnerships and events. This page is where you see where we are and what we are building next.`,
    image: S2, side: 'right',
  },
  careers: {
    heading: 'Build automation that runs the real world',
    body: `We hire for PLC and automation, computer vision, embedded and full-stack roles as projects come in. You will work on live customer sites, ship systems that run 24/7 and learn from engineers who have done it before.

- Hands-on work on real machines and plants
- Small teams with direct ownership
- New technology with every project`,
    image: S3, side: 'left',
  },
  services: {
    heading: 'Three ways we put automation to work',
    body: `Process automation turns manual workflows into monitored, self-running processes. Home automation makes homes smart, secure and energy-aware. Industrial automation puts robotics, vision inspection and control on the factory floor.

Every service is delivered end-to-end: study, design, build, commission and support.`,
    image: '', side: 'right',          // text only on the services list page
  },
  technologies: {
    heading: 'Robotics, vision and intelligence',
    body: `Every solution draws on the same three strengths. Robots handle repetitive, precise and heavy tasks shift after shift. Cameras and vision AI inspect, measure and read at line speed. Machine intelligence turns the data into decisions — predicting, optimising and alerting before a problem reaches the customer.`,
    image: S3, side: 'left',
  },
  products: {
    heading: 'Hardware and software, ready to deploy',
    body: `MDMS turns machine data into dashboards, reports and alerts. Datalogger is the edge device that pulls data straight from PLCs, sensors and energy meters without touching the machine program. Our home automation range starts with a retrofit switch kit and grows to a whole-building controller.

Pick what fits today — every product upgrades without changing hardware.`,
    image: S2, side: 'right',
  },
  projects: {
    heading: 'Automation that is already running',
    body: `From vision inspection on textile lines to real-time production data in auto-parts plants, our projects show what automation delivers on the ground: fewer rejects, less downtime and a clear payback. Open a project to see the problem, the solution and the result.`,
    image: S1, side: 'left',
  },
  'software-development': {
    heading: 'Software & IoT Development',
    body: `Custom software built for the shop floor — machine data platforms, dashboards, APIs, IoT device integration and real-time analytics. From PLC/edge connectivity to live OEE dashboards, we build systems that run 24/7 in your plant.

- Custom web apps and dashboards
- PLC, MQTT, OPC UA and Modbus integration
- Edge datalogging and cloud telemetry
- Real-time analytics and OEE tracking
- Mobile apps for operators and plant heads`,
    image: S2, side: 'right',
  },
  workflow: {
    heading: 'How a project moves',
    body: `Process analysis, development, testing, deployment, monitoring and optimisation — a clear, step-by-step path from your process to a running, optimised automation. Each step ends with something you can see and sign off.`,
    image: S2, side: 'right',
  },
  blog: {
    heading: 'Notes from the shop floor',
    body: `Practical articles on PLC integration, machine vision, IoT gateways, home automation and the business side of automation — written by the engineers who build these systems.`,
    image: S3, side: 'right',
  },
  contact: {
    heading: 'Tell us the process you want to improve',
    body: `Send a few lines about your machine, plant or home and what you want to automate. We will come back with the right mix of robotics, vision and intelligence — and a clear estimate of cost and payback.`,
    image: S1, side: 'left',
  },
};

export const EMPTY_INTRO = { heading: '', body: '', image: '', side: 'right', position: 'top' };

// Old default texts: if one of these was saved to the database from an earlier
// version, the current default replaces it, so wording changes in this file still show.
const LEGACY_TEXT = {
  leadership: ['Our leadership team brings together decades of industrial automation, robotics and software experience. They stay close to every project — from the first site visit to commissioning — because the details on the shop floor decide whether automation delivers.'],
};
const norm = (t = '') => t.replace(/\s+/g, ' ').trim().toLowerCase();
const isLegacy = (key, text = '') => (LEGACY_TEXT[key] || []).some((t) => norm(text).startsWith(norm(t).slice(0, 60)));

// Saved intro for a page, else its default. Null when the block should be hidden.
export function resolvePageIntro(key, content) {
  const saved = content?.pageIntro?.[key];
  let d = saved && typeof saved === 'object' ? saved : PAGE_INTRO_DEFAULTS[key];
  if (!d) return null;
  if (saved && isLegacy(key, saved.body)) d = { ...saved, body: PAGE_INTRO_DEFAULTS[key]?.body || '' };
  const heading = (d.heading || '').trim();
  const body = (d.body || '').trim();
  const image = (d.image || '').trim();
  if (!heading && !body && !image) return null;
  return { heading, body, image, side: d.side === 'left' ? 'left' : 'right', position: d.position === 'bottom' ? 'bottom' : 'top' };
}

// "The People | Behind Our Success" -> light first line + bold second line
// `auto`: with no "|" and at least 4 words, the first two words become the light line.
export function SplitTitle({ text = '', auto = false }) {
  let i = text.indexOf('|');
  let a; let b;
  if (i >= 0) { a = text.slice(0, i).trim(); b = text.slice(i + 1).trim(); }
  else if (auto) {
    const w = text.trim().split(/\s+/);
    if (w.length < 4) return text;
    a = w.slice(0, 2).join(' '); b = w.slice(2).join(' ');
  } else return text;
  return <><span className="t-light">{a}</span><span className="t-bold">{b}</span></>;
}

// "para\n\npara" -> <p>; a paragraph whose lines all start with "- " -> <ul>
export function renderBody(body) {
  return body.split(/\n\s*\n/).map((para, i) => {
    const lines = para.split('\n').map((l) => l.trim()).filter(Boolean);
    if (lines.length && lines.every((l) => /^[-•*]\s+/.test(l))) {
      return <ul key={i}>{lines.map((l, k) => <li key={k}>{l.replace(/^[-•*]\s+/, '')}</li>)}</ul>;
    }
    return <p key={i}>{lines.join(' ')}</p>;
  });
}

export default function PageIntro({ pageKey, slot = 'top' }) {
  const { content } = useSite();
  const d = resolvePageIntro(pageKey, content);
  if (!d || d.position !== slot) return null;
  return (
    <section className={`page-intro${slot === 'bottom' ? ' bottom' : ''}`} data-intro={pageKey}>
      <div className={`wrap intro-grid${d.image ? '' : ' no-media'}${d.side === 'left' ? ' media-left' : ''}`}>
        <div className="intro-text">
          {d.heading && <h2><SplitTitle text={d.heading} /></h2>}
          {d.body && renderBody(d.body)}
        </div>
        {d.image && (
          <div className="intro-media">
            <img src={d.image} alt="" loading="lazy" />
          </div>
        )}
      </div>
    </section>
  );
}

/** Mounted once in the site layout, after the page content: shows the intro of
 *  the current top-level page when its position is "bottom". */
const OWN_INTRO = ['leadership'];                          // pages that place the intro themselves
export function BottomIntro() {
  const { pathname } = useLocation();
  const segs = pathname.split('/').filter(Boolean);
  if (segs.length > 1) return null;                       // not on detail pages
  const key = segs.length ? pageKeyFromPath(pathname) : 'home';
  if (OWN_INTRO.includes(key)) return null;
  return <PageIntro pageKey={key} slot="bottom" />;
}
