import { haimiyaRequest, haimiyaText, haimiyaFirstUrl } from './haimiya-api.js';

export function isYouTubeUrl(value) {
  return /^(https?:\/\/)?(www\.)?(youtube\.com\/(watch\?v=|shorts\/|live\/)|youtu\.be\/)/i.test(String(value || '').trim());
}

function getDuration(body) {
  const v = body?.result?.duration ?? body?.result?.durationSeconds ?? body?.duration ?? null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

async function runDownload(endpoint, input) {
  const query = String(input || '').trim();
  if (!query) throw new Error('missing_query');
  const body = await haimiyaRequest(endpoint, query, { timeout: 180000 });
  const url = haimiyaFirstUrl(body);
  if (!url) throw new Error(haimiyaText(body) || 'media_not_returned');
  const response = await fetch(url, { redirect: 'follow', signal: AbortSignal.timeout(180000) });
  if (!response.ok) throw new Error(`media_http_${response.status}`);
  const buffer = Buffer.from(await response.arrayBuffer());
  if (!buffer.length) throw new Error('empty_media');
  const result = body?.result || {};
  return {
    buffer,
    mime: response.headers.get('content-type') || '',
    title: result.title || result.name || haimiyaText(body).slice(0, 120) || 'Haimiya',
    thumbnail: result.thumbnail || result.thumb || null,
    duration: getDuration(body),
    dl: url
  };
}

export const ytAudio = input => runDownload('play', input);
export const ytVideo = (input, quality = 'auto') => runDownload('ytmp4', `${String(input || '').trim()}${quality && quality !== 'auto' ? ` | calidad ${quality}` : ''}`);

export function assertVideoDuration(result, maxSeconds = 0) {
  const duration = Number(result?.duration || 0);
  if (maxSeconds > 0 && duration > maxSeconds) throw new Error('video_too_long');
  return true;
}
