import { haimiyaRequest, haimiyaFirstUrl } from '../../lib/haimiya-api.js';
export default {
  command: ['quitar-fondo'], aliases: [], desc: 'Elimina el fondo de una imagen mediante Haimiya API.',
  usage: 'quitar-fondo <URL de imagen>', category: 'utils', isOwner: false, isAdmin: false, botAdmin: false, hidden: false,
  run: async ({ msg, sock, text, args }) => {
    const url = String(text || args.join(' ') || '').trim();
    if (!/^https?:\/\//i.test(url)) return msg.reply('Uso: #quitar-fondo <URL pública de imagen>.');
    try {
      const data = await haimiyaRequest('quitar-fondo', url, { timeout: 90000 });
      const media = haimiyaFirstUrl(data);
      if (media) return sock.sendMessage(msg.chat, { image: { url: media }, caption: 'Fondo eliminado mediante Haimiya API.' }, { quoted: msg });
      return msg.reply(data?.result?.text || 'Haimiya API no devolvió una imagen.');
    } catch (e) {
      console.error('[quitar-fondo]', e?.code || e?.message || e);
      return msg.reply('No se pudo quitar el fondo con Haimiya API.');
    }
  }
};
