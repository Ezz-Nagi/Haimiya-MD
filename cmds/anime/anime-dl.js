import { haimiyaRequest, haimiyaText, haimiyaFirstUrl } from '../../lib/haimiya-api.js';
export default {
  command: ['anime-dl'], aliases: [], desc: 'Busca información o contenido de anime mediante Haimiya API.',
  usage: 'anime-dl <nombre o enlace>', category: 'anime', isOwner: false, isAdmin: false, botAdmin: false, hidden: false,
  run: async ({ msg, sock, text, args }) => {
    const query = String(text || args.join(' ') || '').trim();
    if (!query) return msg.reply('Uso: #anime-dl <nombre o enlace>.');
    try {
      const data = await haimiyaRequest('anime-dl', query, { timeout: 90000 });
      const result = haimiyaText(data);
      const image = haimiyaFirstUrl(data);
      if (image) return sock.sendMessage(msg.chat, { image: { url: image }, caption: result || 'Resultado de Haimiya API.' }, { quoted: msg });
      return msg.reply(result || 'No se encontraron resultados.');
    } catch (e) {
      console.error('[anime-dl]', e?.code || e?.message || e);
      return msg.reply('No se pudo consultar anime mediante Haimiya API.');
    }
  }
};
