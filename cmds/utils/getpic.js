import db from "#db";
export default {
    command: ['pfp'],
    aliases: ['getpic'],
    desc: 'Obtiene la foto de perfil de un usuario.',
    usage: 'pfp [@usuario]',
    isOwner: false,
    isAdmin: false,
    botAdmin: false,
    customPrefix: null,
    hidden: false,
    category: 'utils',
    run: async ({ msg, sock }) => {
        const mentioned = msg.mentionedJid;
        const who = mentioned.length > 0 ? mentioned[0] : msg.quoted ? msg.quoted.sender : false;
        if (!who)
            return msg.reply(`✿ Etiqueta o menciona al usuario del que quieras ver su foto de perfil.`);
        try {
            const img = await sock.profilePictureUrl(who, 'image').catch(() => null);
            if (!img)
                return msg.reply('✿ No se pudo obtener la foto de perfil.');
            await sock.sendMessage(msg.chat, { image: { url: img }, caption: null }, { quoted: msg });
        }
        catch {
            await msg.reply(msgglobal);
        }
    },
};
