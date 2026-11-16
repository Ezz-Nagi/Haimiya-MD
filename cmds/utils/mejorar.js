import { haimiyaRequest, haimiyaFirstUrl } from '../../lib/haimiya-api.js';
export default {
  command: ['mejorar'], aliases: [], desc: 'Mejora una imagen mediante Haimiya API.',
  usage: 'mejorar <URL de imagen>', category: 'utils', isOwner: false, isAdmin: false, botAdmin: false, hidden: false,
  run: async ({ msg, sock, text, args }) => {
    const url = String(text || args.join(' ') || '').trim();
    if (!/^https?:\/\//i.test(url)) return msg.reply('Uso: #mejorar <URL pública de imagen>.');
    try {
      const data = await haimiyaRequest('mejorar', url, { timeout: 90000 });
      const media = haimiyaFirstUrl(data);
      if (media) return sock.sendMessage(msg.chat, { image: { url: media }, caption: 'Imagen mejorada mediante Haimiya API.' }, { quoted: msg });
      return msg.reply(data?.result?.text || 'Haimiya API no devolvió una imagen.');
    } catch (e) {
      console.error('[mejorar]', e?.code || e?.message || e);
      return msg.reply('No se pudo procesar la imagen con Haimiya API.');
    }
  }
};
