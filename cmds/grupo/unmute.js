import db from "#db";
export default {
    command: ['unmute'],
    aliases: ['desmute', 'desmutear'],
    category: 'group',
    description: 'Quita el mute a un usuario.',
    desc: 'Quita el silencio aplicado a un usuario.',
    usage: 'unmute @usuario',
    isOwner: false,
    botAdmin: false,
    customPrefix: null,
    hidden: false,
    isAdmin: true,
    run: async ({ msg, sock }) => {
        const who = msg.mentionedJid?.[0] || msg.quoted?.sender;
        if (!who)
            return msg.reply('《✤》 Menciona o responde al usuario que quieres desilenciar.');
        const chat = await db.getChat(msg.chat);
        const muted = (chat.mutedUsers || []).filter(j => j !== who);
        if (muted.length === (chat.mutedUsers || []).length)
            return msg.reply('《✤》 Ese usuario no está silenciado.');
        await db.updateChat(msg.chat, 'mutedUsers', muted);
        return sock.reply(msg.chat, `🔊 *@${who.split('@')[0]}* puede volver a escribir.`, msg, { mentions: [who] });
    }
};
