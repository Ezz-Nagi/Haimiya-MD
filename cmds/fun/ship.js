export default {
    command: ['shiprandom'],
    aliases: ['shipfake'],
    desc: 'Genera un porcentaje aleatorio de compatibilidad entre dos usuarios.',
    usage: 'shiprandom @a @b',
    category: 'fun',
    isOwner: false,
    isAdmin: false,
    botAdmin: false,
    hidden: false,
    run: async ({ msg }) => {
        const ms = msg.mentionedJid || [];
        let a = ms[0], b = ms[1];
        if (!a && msg.quoted) {
            a = msg.sender;
            b = msg.quoted.sender;
        }
        if (!a || !b)
            return msg.reply('Menciona a dos usuarios o responde un mensaje.');
        const n = (String(a).length * 17 + String(b).length * 31) % 101;
        await msg.reply(`💕 Compatibilidad: *${n}%*`);
    }
};
