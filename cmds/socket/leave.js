import db from "#db";
import { canManageBot } from "../../lib/haimiya.js";
export default {
    command: ['leave'],
    aliases: [],
    desc: 'Hace que el bot abandone el grupo actual.',
    usage: 'leave',
    isOwner: false,
    isAdmin: false,
    botAdmin: false,
    customPrefix: null,
    hidden: false,
    category: 'socket',
    run: async ({ msg, sock, args }) => {
        const botId = sock.user.id.split(':')[0] + '@s.whatsapp.net';
        const settings = await db.getSettings(botId);
        if (!canManageBot(msg.sender, settings, sock))
            return msg.reply(mess.socket);
        const groupId = args[0] || msg.chat;
        try {
            await sock.groupLeave(groupId);
        }
        catch (e) {
            return msg.reply(msgglobal);
        }
    },
};
