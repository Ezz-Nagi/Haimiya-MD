import db from '#db';
import { defSets } from '../../lib/system/database.js';
import { canManageBot, getBotSettingsId } from '../../lib/haimiya.js';

const fields = {
  name: ['namebot', 'namebot2'],
  prefix: ['prefijo'],
  banner: ['banner', 'bannerCustom'],
  link: ['link'],
  currency: ['currency']
};
const labels = { name: 'nombre', prefix: 'prefijos', banner: 'banner', link: 'enlace', currency: 'moneda' };

export default {
  command: ['resetbotconfig'],
  aliases: ['restaurarbot'],
  desc: 'Restaura una preferencia de la sesión actual a su valor predeterminado.',
  usage: 'resetbotconfig <name|prefix|banner|link|currency|all>',
  category: 'socket',
  isOwner: false,
  isAdmin: false,
  botAdmin: false,
  hidden: false,
  run: async ({ msg, sock, args, usedPrefix, command }) => {
    const id = getBotSettingsId(sock);
    if (!id) return msg.reply('No pude identificar esta sesión.');
    const cfg = await db.getSettings(id);
    if (!canManageBot(msg.sender, cfg, sock)) return msg.reply(mess.socket);
    const key = String(args[0] || '').toLowerCase();
    if (!key) return msg.reply(`Uso: *${usedPrefix}${command} <name|prefix|banner|link|currency|all>*\n\nNo modifica el owner ni el nivel de la sesión.`);
    const selected = key === 'all' ? Object.keys(fields) : fields[key] ? [key] : null;
    if (!selected) return msg.reply('Opción inválida. Usa: name, prefix, banner, link, currency o all.');
    for (const group of selected) {
      for (const field of fields[group]) {
        await db.updateSettings(id, field, structuredClone(defSets[field]));
      }
    }
    const names = selected.map(k => labels[k]).join(', ');
    return msg.reply(`✓ Ajustes restaurados: *${names}*.\nSe conservaron el owner, el nivel y los permisos de esta sesión.`);
  }
};
