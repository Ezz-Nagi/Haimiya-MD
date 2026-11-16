import db from '#db';
import { canManageBot } from '../../lib/haimiya.js';
export default {
  command: ['seticon'], aliases: [], desc: 'Configura el icono del bot mediante una URL pública.',
  usage: 'seticon <URL de imagen>', category: 'socket', isOwner: false, isAdmin: false, botAdmin: false, hidden: false,
  run: async ({ msg, sock, args }) => {
    const idBot = String(sock.user?.id || '').split(':')[0].split('@')[0] + '@s.whatsapp.net';
    const config = await db.getSettings(idBot);
    if (!canManageBot(msg.sender, config, sock)) return msg.reply(mess.socket);
    const value = args.join(' ').trim();
    if (!/^https?:\/\//i.test(value)) return msg.reply('Uso: #seticon <URL pública directa de imagen>.');
    config.icon = value;
    await db.updateSettings(idBot, 'icon', value);
    return msg.reply(`✿ Icono actualizado para *${config.namebot2 || 'Haimiya'}*.`);
  }
};
