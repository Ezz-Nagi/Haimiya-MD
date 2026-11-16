import db from "#db";
import { canManageBot } from "../../lib/haimiya.js";
export default {
    command: ['setusername'],
    aliases: [],
    desc: 'Cambia el nombre de usuario configurado para el bot.',
    usage: 'setusername <nombre>',
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
            return msg.reply(`✿ Debes escribir un nombre de usuario valido.\n> Ejemplo: *${prefix + command} Sherry Barnet*`);
        await sock.updateProfileName(value);
        return msg.reply(`✿ El nombre de usuario del bot ha sido actualizado a *${value}*!`);
    },
};
