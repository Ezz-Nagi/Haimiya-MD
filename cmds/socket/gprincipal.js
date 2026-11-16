import db from '#db';
import crypto from 'node:crypto';
import { isCreator, isMainBot } from '../../lib/haimiya.js';
export default {
    command: ['gprincipal'],
    aliases: [],
    desc: 'Genera capacidad de uso para instancias principales.',
    usage: 'gprincipal <límite>',
    isAdmin: false,
    botAdmin: false,
    customPrefix: null,
    hidden: false,
    category: 'socket',
    isOwner: true,
    run: async ({ msg, sock, args, usedPrefix: prefix, command }) => {
        if (!isCreator(msg.sender) || !isMainBot(sock)) {
            return msg.reply('😑 Este comando solo puede usarse desde el Principal del creador.');
        }
        const limit = Number(args[0]);
        if (!Number.isInteger(limit) || limit < 1 || limit > 100000) {
            return msg.reply(`✿ Uso: *${prefix}${command} <límite de uso>*\n> Ejemplo: *${prefix}${command} 5*`);
        }
        let code;
        do
            code = `HAI-P-${crypto.randomBytes(5).toString('hex').toUpperCase()}`;
        while (db.getPrincipalCode(code));
        const entry = db.createPrincipalCode(code, limit, msg.sender);
        return msg.reply(`✤ *Código Principal generado.*\n\n❖ Código: *${entry.code}*\n❖ Usos: *${entry.maxUses}*\n❖ Restantes: *${entry.maxUses - entry.uses}*\n\n> Usa *${prefix}codeprincipal ${entry.code}* para vincular un Principal.`);
    }
};
