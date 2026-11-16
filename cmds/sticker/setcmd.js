import db from "#db";
import { getStickerKey } from "../../lib/sticker-key.js";
export default {
    command: ['setcmd'],
    aliases: [],
    category: 'sticker',
    description: 'Asigna un comando a un sticker. Responde al sticker con #setcmd <comando>.',
    desc: 'Asigna un comando a un sticker.',
    usage: 'setcmd <comando>',
    isOwner: false,
    botAdmin: false,
    customPrefix: null,
    hidden: false,
    isAdmin: true,
    run: async ({ msg, args }) => {
        if (!msg.isGroup)
            return msg.reply('《✤》 Este comando solo funciona en grupos.');
        const command = String(args.join(' ') || '').trim().replace(/^[#/.!+-]+/, '').split(/\s+/)[0].toLowerCase();
        if (!command)
            return msg.reply('《✤》 Responde a un sticker y usa: *#setcmd kick*');
        const hash = await getStickerKey(msg);
        if (!hash)
            return msg.reply('《✤》 Debes *responder al sticker* que quieres convertir en comando.');
        const chat = await db.getChat(msg.chat);
        const stickerCmds = { ...(chat.stickerCmds || {}) };
        stickerCmds[hash] = command;
        await db.updateChat(msg.chat, 'stickerCmds', stickerCmds);
        return msg.reply(`✎ Sticker configurado correctamente.\n\n> 🏷️ Comando: *${command}*\n> 🎯 Al enviar ese sticker, Haimiya ejecutará *${command}*.\n> 💡 Si el sticker se responde a un mensaje, el comando podrá usar ese usuario como objetivo.`);
    }
};
