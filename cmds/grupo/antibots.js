import db from '#db';
function looksLikeBot(msg, participant) {
    const name = String(msg.pushName || participant?.notify || '').toLowerCase();
    if (/bot\b|whatsapp bot|baileys|wabot|md bot|subbot|haimiya|automat/i.test(name))
        return true;
    return false;
}
export default {
    command: ['antibots', 'antibot'],
    aliases: [],
    category: 'group',
    desc: 'Protege el grupo frente a bots no autorizados.',
    isOwner: false,
    hidden: false,
    description: 'Expulsa bots conocidos o con nombre de bot al escribir/entrar.',
    usage: 'antibots on|off',
    isAdmin: true,
    botAdmin: true,
    run: async ({ msg, args }) => {
        if (!msg.isGroup)
            return msg.reply('Solo en grupos.');
        const sub = String(args[0] || '').toLowerCase();
        if (sub === 'on') {
            await db.updateChat(msg.chat, 'antibots', 1);
            return msg.reply('✅ *Anti-bots* activado.\nExpulsaré cuentas con nombre de bot al entrar o spamear.');
        }
        if (sub === 'off') {
            await db.updateChat(msg.chat, 'antibots', 0);
            return msg.reply('✅ Anti-bots desactivado.');
        }
        const chat = await db.getChat(msg.chat);
        return msg.reply(`Anti-bots: *${Number(chat?.antibots) === 1 ? 'ON' : 'OFF'}*\nUso: #antibots on|off`);
    },
    all: async function (msg, sock) {
        try {
            if (!msg?.isGroup || msg.fromMe)
                return;
            const chat = await db.getChat(msg.chat);
            if (Number(chat?.antibots) !== 1)
                return;
            if (!looksLikeBot(msg))
                return;
            try {
                await sock.groupParticipantsUpdate(msg.chat, [msg.sender], 'remove');
                await sock.sendMessage(msg.chat, { text: '🤖 Bot detectado y expulsado.' });
            }
            catch { }
        }
        catch { }
    }
};
