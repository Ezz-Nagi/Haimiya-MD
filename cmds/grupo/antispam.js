import db from '#db';
const windowMs = 12_000;
const maxMsg = 6;
const hits = new Map();
export default {
    command: ['antispam'],
    aliases: [],
    category: 'group',
    desc: 'Configura la protección antispam del grupo.',
    isOwner: false,
    hidden: false,
    description: 'Limita mensajes rápidos por usuario (aviso y mute temporal ligero).',
    usage: 'antispam on|off',
    isAdmin: true,
    botAdmin: false,
    run: async ({ msg, args }) => {
        if (!msg.isGroup)
            return msg.reply('Solo en grupos.');
        const sub = String(args[0] || '').toLowerCase();
        if (sub === 'on') {
            await db.updateChat(msg.chat, 'antispam', 1);
            return msg.reply('✅ *Anti-spam* activado.\nMás de 6 mensajes en 12 s → advertencia (no es la lista de raiders).');
        }
        if (sub === 'off') {
            await db.updateChat(msg.chat, 'antispam', 0);
            return msg.reply('✅ Anti-spam desactivado.');
        }
        const chat = await db.getChat(msg.chat);
        return msg.reply(`Anti-spam: *${Number(chat?.antispam) === 1 ? 'ON' : 'OFF'}*\nUso: #antispam on|off`);
    },
    all: async function (msg, sock) {
        try {
            if (!msg?.isGroup || msg.fromMe)
                return;
            const chat = await db.getChat(msg.chat);
            if (Number(chat?.antispam) !== 1)
                return;
            if (msg.isAdmin)
                return;
            const key = msg.chat + '|' + msg.sender;
            const now = Date.now();
            let arr = hits.get(key) || [];
            arr = arr.filter(t => now - t < windowMs);
            arr.push(now);
            hits.set(key, arr);
            if (arr.length === maxMsg) {
                await sock.sendMessage(msg.chat, {
                    text: `⚠️ @${String(msg.sender).split('@')[0]} vas muy rápido. Evita spam.`,
                    mentions: [msg.sender]
                });
            }
        }
        catch { }
    }
};
