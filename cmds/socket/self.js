import db from "#db";
import { canManageBot } from "../../lib/haimiya.js";
export default {
    command: ['self'],
    aliases: [],
    desc: 'Activa o desactiva el modo de auto-respuesta del socket.',
    usage: 'self <on|off>',
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
        const chat = config;
        const estado = chat.self ?? 0;
        if (args[0] === 'enable' || args[0] === 'on') {
            if (estado)
                return msg.reply('✿ El modo *Self* ya estaba activado.');
            chat.self = 1;
            await db.updateSettings(idBot, 'self', chat.self);
            return msg.reply('✿ Has *Activado* el modo *Self*.');
        }
        if (args[0] === 'disable' || args[0] === 'off') {
            if (!estado)
                return msg.reply('✿ El modo *Self* ya estaba desactivado.');
            chat.self = 0;
            await db.updateSettings(idBot, 'self', chat.self);
            return msg.reply('✿ Has *Desactivado* el modo *Privado*.');
        }
        return msg.reply(`*☆ Self (✿❛◡❛)*\n➮ *Estado ›* ${estado ? '✓ Activado' : '✗ Desactivado'}\n\n❀ Puedes cambiarlo con:\n> ● _Activar ›_ *self enable*\n> ● _Desactivar ›_ *self disable*`);
    },
};
