import db from "#db";
import { canManageBot } from "../../lib/haimiya.js";
export default {
    command: ['setstatus'],
    aliases: ['setbotstatus'],
    desc: 'Cambia el estado o texto de presencia configurado para el bot.',
    usage: 'setstatus <texto>',
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
            return msg.reply(`✿ Debes escribir un estado valido.\n> Ejemplo: *${prefix + command} Hola! soy Sherry Barnet*`);
        await sock.updateProfileStatus(value);
        return msg.reply(`✿ Se ha actualizado el estado del bot a *${value}*!`);
    },
};
