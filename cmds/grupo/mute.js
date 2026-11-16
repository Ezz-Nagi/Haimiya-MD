import db from "#db";
export default {
    command: ['mute'],
    aliases: ['silenciar'],
    category: 'group',
    description: 'Silencia a un usuario eliminando sus mensajes.',
    desc: 'Silencia a un usuario eliminando sus mensajes.',
    usage: 'mute @usuario',
    isOwner: false,
    customPrefix: null,
    hidden: false,
    isAdmin: true,
    botAdmin: true,
    run: async ({ msg, sock, participants }) => {
        const who = msg.mentionedJid?.[0] || msg.quoted?.sender;
        if (!who)
            return msg.reply('《✤》 Menciona o responde al usuario que quieres silenciar.');
        const participant = participants.find(p => [p.id, p.jid, p.lid, p.phoneNumber].includes(who));
        if (!participant)
            return msg.reply('《✤》 Ese usuario no está en el grupo.');
        if (participant.admin === 'admin' || participant.admin === 'superadmin')
            return msg.reply('《✤》 No puedo silenciar a un administrador.');
        const chat = await db.getChat(msg.chat);
        const muted = [...new Set([...(chat.mutedUsers || []), who])];
        await db.updateChat(msg.chat, 'mutedUsers', muted);
        return sock.reply(msg.chat, `🔇 *@${who.split('@')[0]}* ha sido silenciado.\n> Sus mensajes serán eliminados mientras dure el mute.`, msg, { mentions: [who] });
    }
};
