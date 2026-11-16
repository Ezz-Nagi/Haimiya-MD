import { haimiyaRequest, haimiyaText } from '../../lib/haimiya-api.js';
export default {
  command: ['wiki'], aliases: ['wikipedia'], desc: 'Consulta información en Wikipedia mediante Haimiya API.',
  usage: 'wiki <consulta>', category: 'search', isOwner: false, isAdmin: false, botAdmin: false, hidden: false,
  run: async ({ msg, text, args }) => {
    const query = String(text || args.join(' ') || '').trim();
    if (!query) return msg.reply('Uso: #wiki <consulta>');
    try {
      const data = await haimiyaRequest('wiki', query);
      const result = haimiyaText(data);
      return msg.reply(result || 'La API no devolvió resultados.');
    } catch (error) {
      console.error('[wiki]', error?.code || error?.message || error);
      return msg.reply('No se pudo consultar Haimiya API.');
    }
  }
};
