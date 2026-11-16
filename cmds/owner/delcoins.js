import db from '#db';
import { hasPerm } from '../../lib/system/staff.js';
import { isCreator, getBotSettingsId } from '../../lib/haimiya.js';
export default {
    command: ['delcoins'],
    aliases: ['removecoins'],
    desc: 'Resta monedas del saldo de un usuario.',
    usage: 'delcoins @usuario <cantidad>',
    category: 'owner',
    isAdmin: false,
    botAdmin: false,
    isOwner: true,
    perm: 'economia',
    hidden: false,
    run: async ({ msg, sock, args, usedPrefix, command }) => {
        if (!isCreator(msg.sender) && !hasPerm(msg.sender, 'economia'))
            return msg.reply('⛔ No tienes permiso para modificar la economía.');
        const target = msg.mentionedJid?.[0] || msg.quoted?.sender || '';
        const rawAmount = args.find(value => /^\d+$/.test(String(value)));
        const amount = Number(rawAmount);
        if (!target || !Number.isSafeInteger(amount) || amount < 1 || amount > 1_000_000_000) {
            return msg.reply(`Uso: *${usedPrefix}${command} @usuario <cantidad>*\nEjemplo: *${usedPrefix}${command} @usuario 500*`);
        }
        const botId = getBotSettingsId(sock);
        const currency = db.getSettings(botId).currency || 'coins';
        const before = db.getChatUser(msg.chat, target).coins;
        const balance = db.adjustCoins(msg.chat, target, -amount);
        const removed = before - balance;
        return msg.reply(`✦ Se retiraron *${removed.toLocaleString('es-CO')} ${currency}* a @${target.split('@')[0]}.\nSaldo actual: *${balance.toLocaleString('es-CO')} ${currency}*.`, { mentions: [target] });
    }
};
