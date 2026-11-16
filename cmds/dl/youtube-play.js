import { haimiyaRequest, haimiyaFirstUrl, haimiyaText } from '../../lib/haimiya-api.js';
const NEWSLETTER_JID = '120363424850969101@newsletter';
const NEWSLETTER_NAME = '☆ 𝐻𝒶𝒾𝓂𝒾𝓎𝒶';
function contextInfo() { return { forwardingScore: 1, isForwarded: true, forwardedNewsletterMessageInfo: { newsletterJid: NEWSLETTER_JID, newsletterName: NEWSLETTER_NAME, serverMessageId: 0 } }; }
export default {
  command: ['youtube-play'], aliases: [], desc: 'Procesa contenido de YouTube mediante Haimiya API.',
  usage: 'youtube-play <nombre o enlace>', category: 'download', isOwner: false, isAdmin: false, botAdmin: false, hidden: false,
  run: async ({ msg, sock, text, args }) => {
    const query = String(text || args.join(' ') || '').trim();
    if (!query) return msg.reply('Uso: #youtube-play <nombre o enlace>.');
    try {
      const data = await haimiyaRequest('youtube-play', query, { timeout: 180000 });
      const url = haimiyaFirstUrl(data);
      const resultText = haimiyaText(data);
      if (url) {
        const response = await fetch(url, { redirect: 'follow', signal: AbortSignal.timeout(180000) });
        if (!response.ok) throw new Error(`media_http_${response.status}`);
        const buffer = Buffer.from(await response.arrayBuffer());
        const mime = response.headers.get('content-type') || '';
        if (mime.startsWith('audio/')) return sock.sendMessage(msg.chat, { audio: buffer, mimetype: mime }, { quoted: msg });
        return sock.sendMessage(msg.chat, { video: buffer, caption: resultText.slice(0, 900), mimetype: mime || 'video/mp4', contextInfo: contextInfo() }, { quoted: msg });
      }
      return msg.reply(resultText || 'Haimiya API no devolvió un resultado descargable.');
    } catch (e) {
      console.error('[youtube-play]', e?.code || e?.message || e);
      return msg.reply('No se pudo procesar el contenido mediante Haimiya API.');
    }
  }
};
