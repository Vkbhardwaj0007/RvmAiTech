import { BUILTIN_STILLS } from './heroMedia';

// Cards shown on a service detail page.
//  - If the admin saved `cards` (Services → Edit → Detail cards) those are used.
//  - Otherwise the older `groups` (heading + bullet list) are turned into cards,
//    each with a placeholder image, so the page is complete from day one.
export function cardsFromGroups(groups = []) {
  return (Array.isArray(groups) ? groups : [])
    .filter((g) => g && (g.heading || (g.items || []).length))
    .map((g) => ({ image: '', heading: g.heading || '', body: (g.items || []).map((i) => `- ${i}`).join('\n') }));
}

export function serviceCards(service = {}) {
  const saved = (Array.isArray(service.cards) ? service.cards : []).filter((c) => c && (c.heading || c.body || c.image));
  if (saved.length) return saved;
  return cardsFromGroups(service.groups).map((c, i) => ({ ...c, image: BUILTIN_STILLS[(i + 1) % BUILTIN_STILLS.length] }));
}
