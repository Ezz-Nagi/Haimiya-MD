import db from '#db';
function requestsMap() {
    global.marryRequests = global.marryRequests instanceof Map ? global.marryRequests : new Map();
    return global.marryRequests;
}
export default {
    command: ['marry'],
    aliases: ['casarse', 'matrimonio'],
    category: 'profile',
    description: 'Envía una solicitud de matrimonio a un usuario.',
    desc: 'Envía una solicitud de matrimonio a otro usuario.',
    usage: 'marry @usuario',
    isOwner: false,
    isAdmin: false,
    botAdmin: false,
    customPrefix: null,
    hidden: false,
    run: async ({ msg, sock }) => {
        const proposer = msg.sender;
        const proposee = msg.mentionedJid?.[0] || msg.quoted?.sender;
        if (!proposee)
            return msg.reply('《✤》 Usa *#marry @user* para enviar una propuesta de matrimonio.');
        if (proposer === proposee)
            return msg.reply('《✤》 No puedes proponerte matrimonio a ti mismo.');
        const proposerData = await db.getUser(proposer);
        const proposeeData = await db.getUser(proposee);
        const partnerName = id => id ? (id.split('@')[0]) : 'alguien';
        if (proposerData.marry) {
            const p = await db.getUser(proposerData.marry);
            return msg.reply(`《✤》 Ya estás casad@ con *${p?.name || partnerName(proposerData.marry)}*.`);
        }
        if (proposeeData.marry) {
            const p = await db.getUser(proposeeData.marry);
            return msg.reply(`《✤》 *${proposeeData.name || partnerName(proposee)}* ya está casad@ con *${p?.name || partnerName(proposeeData.marry)}*.`);
        }
        const requests = requestsMap();
        for (const [token, request] of requests) {
            if (Date.now() - request.createdAt > 2 * 60 * 1000)
                requests.delete(token);
            else if (request.proposer === proposer && request.proposee === proposee)
                return msg.reply('《✤》 Ya tienes una propuesta pendiente para esa persona.');
        }
        const token = `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
        requests.set(token, { chat: msg.chat, proposer, proposee, createdAt: Date.now() });
        setTimeout(() => requests.delete(token), 2 * 60 * 1000);
        const a = proposerData.name || partnerName(proposer);
        return sock.sendMessage(msg.chat, {
            text: `╭─〔 💍 *SOLICITUD DE MATRIMONIO* 〕─╮

👑 *${a}* quiere casarse contigo, @${partnerName(proposee)}.

💞 Si aceptas, ambos quedarán registrados como pareja en Haimiya.

Responde con *#aceptar* o *#rechazar*.
La solicitud expira en *2 minutos* y solo puede responderla la persona propuesta.
╰────────────────────────╯`,
            mentions: [proposer, proposee]
        }, { quoted: msg });
    }
};
