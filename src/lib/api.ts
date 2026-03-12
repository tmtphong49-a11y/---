export const API_BASE = (import.meta as any).env?.VITE_API_URL || '';

export function isRunningOnGitHubPages() {
  return typeof location !== 'undefined' && location.hostname.endsWith('github.io');
}

export async function apiFetch(path: string, init?: RequestInit) {
  const url = /^https?:\/\//i.test(path) ? path : `${API_BASE}${path}`;
  const res = await fetch(url, init);
  const ct = res.headers.get('content-type') || '';
  let body: any = null;
  if (ct.includes('application/json')) {
    body = await res.json();
  } else {
    const text = await res.text();
    if (!res.ok) {
      throw new Error(text.slice(0, 200));
    }
    try {
      body = JSON.parse(text);
    } catch {
      body = text;
    }
  }
  if (!res.ok) {
    const msg =
      (body && typeof body === 'object' && 'error' in body && (body as any).error) ||
      (typeof body === 'string' ? body : 'Request failed');
    throw new Error(String(msg));
  }
  return body;
}
