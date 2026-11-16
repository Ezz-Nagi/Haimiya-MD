import db from "#db";
export default {
    command: ['mutelist'],
    aliases: ['listmute', 'silenciados'],
    category: 'group',
    description: 'Muestra la lista de usuarios silenciados.',
    desc: 'Muestra la lista de usuarios silenciados.',
    usage: 'mutelist',
    isOwner: false,
    botAdmin: false,
    customPrefix: null,
    hidden: false,
    isAdmin: true,
    run: async ({ msg, sock }) => {
        const chat = await db.getChat(msg.chat);
        const list = chat.mutedUsers || [];
        if (!list.length)
            return msg.reply('🔊 No hay usuarios silenciados.');
        return sock.reply(msg.chat, `🔇 *USUARIOS SILENCIADOS*\n\n${list.map(j => `• @${j.split('@')[0]}`).join('\n')}`, msg, { mentions: list });
    }
};
