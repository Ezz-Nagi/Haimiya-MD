import { ytVideo } from '../../lib/ytdl.js';
import { panel, error } from '../../lib/system/ui.js';
export default {
  command: ['ytmp4'], aliases: [], desc: 'Procesa vídeo de YouTube mediante Haimiya API.',
  usage: 'ytmp4 <enlace o búsqueda>', category: 'download', isOwner: false, isAdmin: false, botAdmin: false, hidden: false,
  run: async ({ msg, sock, text, args }) => {
    const query = String(text || args.join(' ') || '').trim();
    if (!query) return msg.reply(panel('Haimiya Video', ['Escribe el nombre o enlace del contenido.'], { icon: '▶' }));
    try {
      await msg.reply(panel('Preparando vídeo', ['Procesando mediante Haimiya API.'], { icon: '▶' }));
      const result = await ytVideo(query);
      await sock.sendMessage(msg.chat, { video: result.buffer, caption: result.title || 'Haimiya', mimetype: result.mime?.includes('video') ? result.mime : 'video/mp4' }, { quoted: msg });
    } catch (e) {
      console.error('[ytmp4]', e?.code || e?.message || e);
      await msg.reply(error('Vídeo no disponible', ['Haimiya API no devolvió un archivo reproducible.']));
    }
  }
};
