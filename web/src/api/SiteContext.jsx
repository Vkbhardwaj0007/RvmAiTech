import { createContext, useContext, useEffect, useState } from 'react';
import client from './client';

const SiteCtx = createContext({ content: {} });

export function SiteProvider({ children }) {
  const [content, setContent] = useState({});
  useEffect(() => {
    client.get('/site').then((r) => setContent(r.data.content || {})).catch(() => {});
  }, []);
  return <SiteCtx.Provider value={{ content }}>{children}</SiteCtx.Provider>;
}
export function useSite() { return useContext(SiteCtx); }
