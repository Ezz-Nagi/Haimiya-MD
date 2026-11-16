import db from '#db';
import { defSets } from '../../lib/system/database.js';
import { canManageBot, getBotSettingsId, isMainBot } from '../../lib/haimiya.js';

const fields = {
  name: ['namebot', 'namebot2'],
  prefix: ['prefijo'],
  banner: ['banner', 'bannerCustom'],
  link: ['link'],
  currency: ['currency']
};
export default {
  command: ['subreset'],
  aliases: ['restaurarsubbot'],
  desc: 'Restaura la personalización de la sesión secundaria actual.',
  usage: 'subreset <name|prefix|banner|link|currency|all>',
  category: 'socket',
  isOwner: false,
  isAdmin: false,
  botAdmin: false,
  hidden: false,
  run: async ({ msg, sock, args, usedPrefix, command }) => {
    if (isMainBot(sock)) return msg.reply('Este comando solo funciona dentro de una sesión secundaria.');
    const id = getBotSettingsId(sock);
    const cfg = await db.getSettings(id);
    if (!canManageBot(msg.sender, cfg, sock)) return msg.reply(mess.socket);
    const key = String(args[0] || '').toLowerCase();
    if (!key) return msg.reply(`Uso: *${usedPrefix}${command} <name|prefix|banner|link|currency|all>*`);
    const selected = key === 'all' ? Object.keys(fields) : fields[key] ? [key] : null;
    if (!selected) return msg.reply('Opción inválida. Usa: name, prefix, banner, link, currency o all.');
    for (const group of selected)
      for (const field of fields[group])
        await db.updateSettings(id, field, structuredClone(defSets[field]));
    return msg.reply(`✓ Personalización restaurada para *${cfg.namebot2 || 'este subbot'}*.\nSe conservaron el owner, el nivel y los permisos.`);
  }
};
