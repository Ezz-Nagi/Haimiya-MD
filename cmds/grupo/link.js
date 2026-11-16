import db from "#db";
export default {
    command: ['link'],
    aliases: [],
    desc: 'Obtiene el enlace de invitación del grupo.',
    usage: 'link',
    isOwner: false,
    isAdmin: false,
    customPrefix: null,
    hidden: false,
    category: 'group',
    botAdmin: true,
    run: async ({ msg, sock }) => {
        try {
            const code = await sock.groupInviteCode(msg.chat);
            const link = `https://chat.whatsapp.com/${code}`;
            await sock.reply(msg.chat, `${link}`, msg);
        }
        catch (e) {
            await sock.reply(msg.chat, msgglobal, msg);
        }
    },
};
