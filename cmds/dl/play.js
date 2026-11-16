import { ytAudio } from '../../lib/ytdl.js';
import { panel, error } from '../../lib/system/ui.js';
export default {
  command: ['play'], aliases: [], desc: 'Procesa audio de YouTube mediante Haimiya API.',
  usage: 'play <enlace o búsqueda>', category: 'download', isOwner: false, isAdmin: false, botAdmin: false, hidden: false,
  run: async ({ msg, sock, text, args }) => {
    const query = String(text || args.join(' ') || '').trim();
    if (!query) return msg.reply(panel('Haimiya Play', ['Escribe el nombre o enlace del contenido.'], { icon: '♫' }));
    try {
      await msg.reply(panel('Preparando audio', ['Procesando mediante Haimiya API.'], { icon: '♫' }));
      const result = await ytAudio(query);
      await sock.sendMessage(msg.chat, { audio: result.buffer, mimetype: result.mime?.includes('audio') ? result.mime : 'audio/mpeg', fileName: `${result.title || 'Haimiya'}.mp3` }, { quoted: msg });
    } catch (e) {
      console.error('[play]', e?.code || e?.message || e);
      await msg.reply(error('Audio no disponible', ['Haimiya API no devolvió un archivo reproducible.']));
    }
  }
};
