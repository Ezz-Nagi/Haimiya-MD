import db from '#db';
import crypto from 'node:crypto';
import { isCreator, isMainBot } from '../../lib/haimiya.js';
export default {
    command: ['gexpandir'],
    aliases: ['gcapacidad'],
    desc: 'Genera códigos que aumentan la capacidad de instancias.',
    usage: 'gexpandir <sub> <premium> <principal> [usos]',
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
        const sub = Number(args[0]);
        const premium = Number(args[1]);
        const principal = Number(args[2]);
        const uses = Number(args[3] || 1);
        if (![sub, premium, principal, uses].every(Number.isInteger) || sub < 0 || premium < 0 || principal < 0 || uses < 1 || uses > 100000 || (sub + premium + principal) < 1) {
            return msg.reply(`✿ Uso: *${prefix}${command} <sub> <premium> <principal> [usos]*\n> Ejemplo: *${prefix}${command} 10 5 2 3*\n\nCada canje añade esa capacidad y puede repetirse según el límite de usos.`);
        }
        let code;
        do
            code = `HAI-X-${crypto.randomBytes(5).toString('hex').toUpperCase()}`;
        while (db.getExpansionCode(code));
        const entry = db.createExpansionCode(code, { sub, premium, principal }, uses, msg.sender);
        return msg.reply(`✤ *Código de expansión generado.*\n\n❖ Código: *${entry.code}*\n❖ Sub: *+${sub}*\n❖ Premium: *+${premium}*\n❖ Principal: *+${principal}*\n❖ Usos: *${entry.maxUses}*\n\n> Usa *${prefix}expandir ${entry.code}* para aplicarlo.`);
    }
};
