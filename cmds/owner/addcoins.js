import db from '#db';
import { hasPerm } from '../../lib/system/staff.js';
import { isCreator, getBotSettingsId } from '../../lib/haimiya.js';
import { panel, error, success } from '../../lib/system/ui.js';
export default {
    command: ['addcoins'],
    aliases: ['addmoney'],
    desc: 'Añade monedas al saldo de un usuario.',
    usage: 'addcoins @usuario <cantidad>',
    category: 'owner',
    isAdmin: false,
    botAdmin: false,
    isOwner: true,
    perm: 'economia',
    hidden: false,
    run: async ({ msg, sock, args, usedPrefix, command }) => {
        if (!isCreator(msg.sender) && !hasPerm(msg.sender, 'economia'))
            return msg.reply(error('Permiso insuficiente', ['No puedes modificar la economía de este bot.']));
        const target = msg.mentionedJid?.[0] || msg.quoted?.sender || '';
        const rawAmount = args.find(value => /^\d+$/.test(String(value)));
        const amount = Number(rawAmount);
        if (!target || !Number.isSafeInteger(amount) || amount < 1 || amount > 1_000_000_000) {
            return msg.reply(panel('Añadir monedas', [`Uso: \`${usedPrefix}${command} @usuario <cantidad>\``, `Ejemplo: \`${usedPrefix}${command} @usuario 500\``, 'La cantidad debe ser un entero positivo.'], { icon: '¤' }));
        }
        const botId = getBotSettingsId(sock);
        const currency = db.getSettings(botId).currency || 'coins';
        const balance = db.adjustCoins(msg.chat, target, amount);
        return msg.reply(success('Saldo actualizado', [`• *Usuario:* @${target.split('@')[0]}`, `• *Añadido:* +${amount.toLocaleString('es-CO')} ${currency}`, `• *Nuevo saldo:* ${balance.toLocaleString('es-CO')} ${currency}`]), { mentions: [target] });
    }
};
