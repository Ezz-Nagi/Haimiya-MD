import db from '#db';
import { canManageBot, getBotSettingsId, isMainBot } from '../../lib/haimiya.js';

export default {
  command: ['subconfig', 'subinfo'],
  aliases: ['configsubbot'],
  desc: 'Muestra los ajustes de la sesión secundaria actual.',
  usage: 'subconfig',
  category: 'socket',
  isOwner: false,
  isAdmin: false,
  botAdmin: false,
  hidden: false,
  run: async ({ msg, sock }) => {
    if (isMainBot(sock)) return msg.reply('Este comando solo funciona dentro de una sesión secundaria.');
    const id = getBotSettingsId(sock);
    if (!id) return msg.reply('No pude identificar esta sesión secundaria.');
    const cfg = await db.getSettings(id);
    if (!canManageBot(msg.sender, cfg, sock)) return msg.reply(mess.socket);
    const prefix = cfg.prefijo === 1 ? 'Sin prefijo' : (Array.isArray(cfg.prefijo) ? cfg.prefijo : [cfg.prefijo || '#']).join(' ');
    return msg.reply(`⛓️ *SUBBOT · ${cfg.namebot2 || 'Haimiya'}*\n\n` +
      `• Número: *${id.split('@')[0]}*\n` +
      `• Nombre: *${cfg.namebot || cfg.namebot2 || 'Haimiya'}*\n` +
      `• Prefijos: *${prefix}*\n` +
      `• Moneda: *${cfg.currency || 'moras'}*\n` +
      `• Banner personalizado: *${cfg.bannerCustom ? 'Sí' : 'No'}*\n` +
      `• Modo Self: *${cfg.self ? 'ON' : 'OFF'}*\n\n` +
      `Puedes personalizar esta sesión con *#setbotname*, *#setbotprefix*, *#setbanner*, *#setlink* y *#setbotcurrency*.\n` +
      `Para restaurar sus ajustes: *#subreset all*.`);
  }
};
