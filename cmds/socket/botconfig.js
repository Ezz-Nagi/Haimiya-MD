import db from '#db';
import { canManageBot, getBotSettingsId, isMainBot } from '../../lib/haimiya.js';

const show = (value, fallback = 'Sin configurar') => String(value ?? '').trim() || fallback;
const prefixes = value => value === 1 ? 'Sin prefijo' : Array.isArray(value) ? value.join(' ') : show(value, '# / .');

export default {
  command: ['botconfig', 'configbot'],
  aliases: ['ajustesbot'],
  desc: 'Muestra la configuración de la sesión actual del bot.',
  usage: 'botconfig',
  category: 'socket',
  isOwner: false,
  isAdmin: false,
  botAdmin: false,
  hidden: false,
  run: async ({ msg, sock }) => {
    const id = getBotSettingsId(sock);
    if (!id) return msg.reply('No pude identificar esta sesión.');
    const cfg = await db.getSettings(id);
    if (!canManageBot(msg.sender, cfg, sock)) return msg.reply(mess.socket);
    const owner = cfg.owner ? `@${String(cfg.owner).split('@')[0]}` : 'No asignado';
    const text = `⛓️ *CONFIGURACIÓN DE ${show(cfg.namebot2, 'HAIMIYA').toUpperCase()}*\n\n` +
      `• Sesión: *${isMainBot(sock) ? 'Principal' : 'Secundaria'}*\n` +
      `• Nombre corto: *${show(cfg.namebot2)}*\n` +
      `• Nombre largo: *${show(cfg.namebot)}*\n` +
      `• Prefijos: *${prefixes(cfg.prefijo)}*\n` +
      `• Moneda: *${show(cfg.currency)}*\n` +
      `• Enlace: ${show(cfg.link)}\n` +
      `• Banner propio: *${cfg.bannerCustom ? 'Sí' : 'No'}*\n` +
      `• Owner configurado: ${owner}\n` +
      `• Modo Self: *${cfg.self ? 'Activado' : 'Desactivado'}*\n\n` +
      `Usa *#resetbotconfig* para restaurar ajustes visuales y de presentación.`;
    return sock.sendMessage(msg.chat, { text, mentions: cfg.owner ? [cfg.owner] : [] }, { quoted: msg });
  }
};
