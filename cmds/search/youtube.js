import { haimiyaRequest, haimiyaText } from '../../lib/haimiya-api.js';
export default {
  command: ['youtube'], aliases: [], desc: 'Busca vídeos en YouTube mediante Haimiya API.',
  usage: 'youtube <búsqueda>', category: 'search', isOwner: false, isAdmin: false, botAdmin: false, hidden: false,
  run: async ({ msg, text, args }) => {
    const query = String(text || args.join(' ') || '').trim();
    if (!query) return msg.reply('Uso: #youtube <búsqueda>');
    try {
      const data = await haimiyaRequest('youtube', query);
      const result = haimiyaText(data);
      return msg.reply(result || 'No se encontraron resultados.');
    } catch (error) {
      console.error('[youtube]', error?.code || error?.message || error);
      return msg.reply('No se pudo consultar Haimiya API.');
    }
  }
};
