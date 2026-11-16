import db from '#db';
import crypto from 'node:crypto';
import { isCreator, isMainBot } from '../../lib/haimiya.js';
export default {
    command: ['precode'],
    aliases: [],
    desc: 'Genera códigos de vinculación para instancias secundarias.',
    usage: 'precode <límite>',
    isAdmin: false,
    botAdmin: false,
    customPrefix: null,
    hidden: false,
    category: 'socket',
    isOwner: true,
    run: async ({ msg, sock, args, usedPrefix: prefix, command }) => {
        if (!isCreator(msg.sender) || !isMainBot(sock)) {
            return msg.reply('😑 Este comando solo puede ser usado por el creador desde el Principal.');
        }
        const limit = Number(args[0]);
        if (!Number.isInteger(limit) || limit < 1 || limit > 100000) {
            return msg.reply(`✿ Uso: *${prefix}${command} <límite de uso>*\n> Ejemplo: *${prefix}${command} 10*`);
        }
        let code;
        do {
            code = `HAI-${crypto.randomBytes(5).toString('hex').toUpperCase()}`;
        } while (db.getPremiumCode(code));
        const entry = db.createPremiumCode(code, limit, msg.sender);
        return msg.reply(`✤ Código Premium generado.\n\n❖ Código: *${entry.code}*\n❖ Usos: *${entry.maxUses}*\n❖ Restantes: *${entry.maxUses - entry.uses}*\n\n> Usa *${prefix}codeprem ${entry.code}* directamente en WhatsApp con el comando de canje correspondiente.`);
    }
};
