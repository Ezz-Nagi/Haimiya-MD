import { haimiyaRequest, haimiyaText, haimiyaFirstUrl } from '../../lib/haimiya-api.js';
export default {
  command: ['shazam'], aliases: [], desc: 'Reconoce una canción mediante Haimiya API.',
  usage: 'shazam <URL pública de audio>', category: 'utils', isOwner: false, isAdmin: false, botAdmin: false, hidden: false,
  run: async ({ msg, text, args, sock }) => {
    const url = String(text || args.join(' ') || '').trim();
    if (!/^https?:\/\//i.test(url)) return msg.reply('Uso: #shazam <URL pública de audio>.');
    try {
      const data = await haimiyaRequest('shazam', url, { timeout: 90000 });
      const result = haimiyaText(data);
      const image = haimiyaFirstUrl(data);
      if (image && /image/i.test(String(data?.result?.media?.[0]?.mime || ''))) {
        return sock.sendMessage(msg.chat, { image: { url: image }, caption: result || 'Resultado de Haimiya API.' }, { quoted: msg });
      }
      return msg.reply(result || image || 'No se encontró información de la canción.');
    } catch (e) {
      console.error('[shazam]', e?.code || e?.message || e);
      return msg.reply('No se pudo reconocer la canción con Haimiya API.');
    }
  }
};
