import { useSite } from '../api/SiteContext';
export default function WhatsAppFloat() {
  const { content } = useSite();
  const wa = content?.social?.whatsapp;
  if (!wa) return null;
  const href = wa.startsWith('http') ? wa : `https://wa.me/${wa.replace(/[^0-9]/g, '')}`;
  return (
    <a className="wa-float" href={href} target="_blank" rel="noreferrer" title="WhatsApp">
      <svg viewBox="0 0 24 24" width="30" fill="currentColor"><path d="M12 2a10 10 0 0 0-8.5 15.3L2 22l4.8-1.5A10 10 0 1 0 12 2Zm5.3 14.2c-.2.6-1.3 1.2-1.8 1.2-.5.1-1 .2-3.2-.7-2.7-1.1-4.4-3.8-4.5-4-.1-.2-1-1.4-1-2.6 0-1.2.6-1.8.9-2 .2-.3.5-.3.7-.3h.5c.2 0 .4 0 .6.5l.8 1.9c.1.2.1.4 0 .5l-.4.5c-.2.2-.3.4-.1.7.2.3.9 1.4 1.9 2.3 1.3 1.1 2.3 1.4 2.6 1.6.2.1.4.1.5-.1l.7-.8c.2-.2.3-.2.6-.1l1.8.9c.3.1.5.2.5.4.1.2.1.8-.1 1.2Z"/></svg>
    </a>
  );
}
