import db from "#db";
import { canManageBot } from "../../lib/haimiya.js";
export default {
    command: ['setlink'],
    aliases: ['setbotlink'],
    desc: 'Configura el enlace público asociado al bot.',
    usage: 'setlink <url>',
    isOwner: false,
    isAdmin: false,
    botAdmin: false,
    customPrefix: null,
    hidden: false,
    category: 'socket',
    run: async ({ msg, sock, args }) => {
        const idBot = sock.user.id.split(':')[0] + '@s.whatsapp.net';
        const config = await db.getSettings(idBot);
        if (!canManageBot(msg.sender, config, sock))
            return msg.reply(mess.socket);
        const value = args.join(' ').trim();
        if (!value) {
            return msg.reply(`✿ Ingresa un enlace válido que comience con http:// o https://`);
        }
        if (!/^https?:\/\//i.test(value)) {
            return msg.reply('✿ El enlace debe comenzar con http:// o https://');
        }
        config.link = value;
        await db.updateSettings(idBot, 'link', config.link);
        return msg.reply(`✎ Se cambió el enlace del Socket correctamente.`);
    },
};
