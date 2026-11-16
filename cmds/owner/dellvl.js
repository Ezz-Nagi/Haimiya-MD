import { hasPerm } from '../../lib/system/staff.js';
import db from '#db';
import { isCreator } from '../../lib/haimiya.js';
export default {
    command: ['dellvl'],
    aliases: ['dellevel'],
    desc: 'Resta niveles a un usuario.',
    usage: 'dellvl @usuario <cantidad>',
    isAdmin: false,
    botAdmin: false,
    customPrefix: null,
    hidden: false,
    category: 'owner',
    isOwner: true,
    perm: 'economia',
    run: async ({ msg, args, usedPrefix: prefix, command }) => {
        if (!isCreator(msg.sender) && !hasPerm(msg.sender, 'economia')) {
            return msg.reply('😑 Este comando solo puede usarlo mi creador.');
        }
        const mentioned = msg.mentionedJid || [];
        const who = mentioned[0] || (msg.quoted ? msg.quoted.sender : msg.sender);
        const amountArg = args.find(a => !a.includes('@') && !isNaN(parseInt(a)));
        const amount = parseInt(amountArg);
        if (!amountArg || isNaN(amount) || amount <= 0) {
            return msg.reply(`✿ Uso: *${prefix}${command} <cantidad>* (mencionando o respondiendo a alguien)\n> Ejemplo: *${prefix}${command} @usuario 5*`);
        }
        const user = await db.getUser(who);
        user.level = Math.max(0, (user.level || 0) - amount);
        await db.updateUser(who, 'level', user.level);
        return msg.reply(`✤ Se quitaron *${amount.toLocaleString()} nivel(es)* a @${who.split('@')[0]}.\n> Nivel actual: *${user.level.toLocaleString()}*`, { mentions: [who] });
    }
};
