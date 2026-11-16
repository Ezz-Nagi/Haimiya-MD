import { haimiyaRequest, haimiyaText } from '../../lib/haimiya-api.js';
import { startLoading } from '../../lib/loading.js';
export default {
  command: ['traducir'], aliases: [], desc: 'Traduce texto mediante Haimiya API.',
  usage: 'traducir <idioma> <texto>', category: 'utils', isOwner: false, isAdmin: false, botAdmin: false, hidden: false,
  run: async ({ msg, sock, args }) => {
    const language = String(args[0] || 'es').toLowerCase();
    const text = args.slice(1).join(' ').trim() || String(msg.quoted?.text || msg.quoted?.body || '').trim();
    if (!text) return msg.reply('Uso: #traducir <idioma> <texto>.');
    const load = await startLoading(sock, msg.chat, { quoted: msg, label: 'Traducir' });
    try {
      const data = await haimiyaRequest('traducir', `${language} ${text}`);
      const result = haimiyaText(data);
      if (!result) { await load.stop(); return msg.reply('Haimiya API no devolvió una traducción.'); }
      await load.done(`🌐 *Traducción · ${language}*\n\n${result}`);
    } catch (e) {
      console.error('[traducir]', e?.code || e?.message || e);
      await load.stop();
      await msg.reply('No se pudo traducir con Haimiya API.');
    }
  }
};
