const DEFAULT_BASE = 'https://haimiya.hidenplay.net/v1';

export class HaimiyaApiError extends Error {
  constructor(code, status = 0, message = '') {
    super(`haimiya_api:${code}${status ? `:${status}` : ''}${message ? `:${message}` : ''}`);
    this.name = 'HaimiyaApiError';
    this.code = code;
    this.status = status;
  }
}

function getConfig() {
  const api = global.haimiyaApi || {};
  return {
    baseUrl: String(api.baseUrl || DEFAULT_BASE).replace(/\/+$/, ''),
    apiKey: String(api.apiKey || ''),
    timeout: Number(api.timeout || 45000)
  };
}

export async function haimiyaRequest(endpoint, text = '', options = {}) {
  const cfg = getConfig();
  if (!cfg.apiKey) throw new HaimiyaApiError('not_configured', 0, 'Configura HAIMIYA_API_KEY en el entorno del hosting.');
  const id = String(endpoint || '').replace(/^\/+|\/+$/g, '');
  if (!/^[a-z0-9][a-z0-9-]*$/i.test(id)) throw new HaimiyaApiError('invalid_endpoint');

  const url = `${cfg.baseUrl}/${encodeURIComponent(id)}`;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), Number(options.timeout || cfg.timeout));
  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'X-API-Key': cfg.apiKey,
        Accept: 'application/json'
      },
      signal: controller.signal,
      redirect: 'error'
    });
    let body;
    try { body = await response.json(); }
    catch { throw new HaimiyaApiError('invalid_response', response.status); }
    if (!response.ok || body?.ok === false || body?.status === false) {
      const code = body?.error || (response.status === 401 ? 'invalid_apikey' : response.status === 429 ? 'rate_limited' : response.status === 402 ? 'insufficient_credits' : response.status === 403 ? 'premium_required' : 'request_failed');
      throw new HaimiyaApiError(code, response.status, body?.message || '');
    }
    return body;
  } catch (error) {
    if (error instanceof HaimiyaApiError) throw error;
    throw new HaimiyaApiError(error?.name === 'AbortError' ? 'timeout' : 'network');
  } finally {
    clearTimeout(timer);
  }
}

export function haimiyaText(body) {
  const value = body?.result?.text ?? body?.result?.result ?? body?.text ?? body?.response ?? body?.result ?? '';
  if (typeof value === 'string') return value.trim();
  try { return JSON.stringify(value); } catch { return String(value ?? ''); }
}

export function haimiyaMedia(body) {
  const media = body?.result?.media ?? body?.media ?? [];
  return Array.isArray(media) ? media : media ? [media] : [];
}

export function haimiyaMediaUrl(item) {
  if (typeof item === 'string') return item;
  if (!item || typeof item !== 'object') return '';
  return String(item.url || item.src || item.link || item.download || item.file || item.mediaUrl || '');
}

export function haimiyaFirstUrl(body) {
  const media = haimiyaMedia(body);
  for (const item of media) {
    const url = haimiyaMediaUrl(item);
    if (/^https?:\/\//i.test(url)) return url;
  }
  const text = haimiyaText(body);
  const match = text.match(/https?:\/\/[^\s<>]+/i);
  return match?.[0]?.replace(/[),.]+$/, '') || '';
}

export default haimiyaRequest;
