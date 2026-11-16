import db from "#db";
import { getStickerKey } from "../../lib/sticker-key.js";
export default {
    command: ['delcmd'],
    aliases: [],
    category: 'sticker',
    description: 'Elimina el comando asignado a un sticker.',
    desc: 'Elimina el comando asignado a un sticker.',
    usage: 'delcmd',
    isOwner: false,
    botAdmin: false,
    customPrefix: null,
    hidden: false,
    isAdmin: true,
    run: async ({ msg }) => {
        const hash = await getStickerKey(msg);
        if (!hash)
            return msg.reply('《✤》 Responde al sticker cuyo comando quieres eliminar.');
        const chat = await db.getChat(msg.chat);
        const stickerCmds = { ...(chat.stickerCmds || {}) };
        if (!stickerCmds[hash])
            return msg.reply('《✤》 Ese sticker no tiene ningún comando asignado.');
        const old = stickerCmds[hash];
        delete stickerCmds[hash];
        await db.updateChat(msg.chat, 'stickerCmds', stickerCmds);
        return msg.reply(`✎ Comando del sticker eliminado: *${old}*.`);
    }
};
