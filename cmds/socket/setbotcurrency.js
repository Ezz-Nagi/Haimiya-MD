import db from "#db";
import { canManageBot } from "../../lib/haimiya.js";
export default {
    command: ['setbotcurrency'],
    aliases: [],
    desc: 'Cambia la moneda utilizada por el sistema de economía.',
    usage: 'setbotcurrency <moneda>',
    isOwner: false,
    isAdmin: false,
    botAdmin: false,
    customPrefix: null,
    hidden: false,
    category: 'socket',
    run: async ({ msg, sock, args, command, text, usedPrefix: prefix }) => {
        const idBot = sock.user.id.split(':')[0] + '@s.whatsapp.net';
        const config = await db.getSettings(idBot);
        if (!canManageBot(msg.sender, config, sock))
            return msg.reply(mess.socket);
        const value = args.join(' ').trim();
        if (!value)
            return msg.reply(`❖ Debes escribir un nombre de moneda valido.`);
        config.currency = value;
        await db.updateSettings(idBot, 'currency', config.currency);
        return msg.reply(`✿ Se ha cambiado la moneda del bot a *${value}*`);
    },
};
