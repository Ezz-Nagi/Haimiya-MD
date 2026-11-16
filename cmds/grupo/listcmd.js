import db from "#db";
export default {
    command: ['listcmd'],
    aliases: ['stickercommands'],
    category: 'group',
    description: 'Lista los stickers que tienen comandos asignados.',
    desc: 'Lista los stickers que tienen comandos asignados.',
    usage: 'listcmd',
    isOwner: false,
    botAdmin: false,
    customPrefix: null,
    hidden: false,
    isAdmin: true,
    run: async ({ msg }) => {
        const chat = await db.getChat(msg.chat);
        const entries = Object.entries(chat.stickerCmds || {});
        if (!entries.length)
            return msg.reply('《✤》 No hay stickers configurados como comandos en este grupo.');
        return msg.reply(`✎ *STICKERS → COMANDOS*\n\n${entries.map(([, cmd], i) => `${i + 1}. *${cmd}*`).join('\n')}\n\n> Responde a un sticker con *#delcmd* para eliminar su acción.`);
    }
};
