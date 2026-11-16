import db from '#db';
const DEFAULT_FAKE = [
    '1', '7', '44', '62', '91', '92', '880', '212', '20', '90', '98',
    '880', '966', '971', '972', '994', '995', '996', '998'
];
function isVoidPattern(n) {
    if (!n || n.length < 8)
        return true;
    if (/^(\d)\1{7,}$/.test(n))
        return true;
    if (/0{6,}/.test(n))
        return true;
    if (/^1555/.test(n))
        return true;
    if (/^1000/.test(n) && n.length <= 11)
        return true;
    return false;
}
function isFakeNumber(jid, extra = []) {
    const n = String(jid || '').split('@')[0].split(':')[0].replace(/\D/g, '');
    if (!n)
        return false;
    if (isVoidPattern(n))
        return true;
    const list = [...DEFAULT_FAKE, ...extra];
    return list.some(p => n.startsWith(String(p)));
}
export default {
    command: ['antifake', 'antifakes'],
    aliases: [],
    category: 'group',
    desc: 'Configura la protección del grupo frente a números falsos.',
    isOwner: false,
    hidden: false,
    description: 'Bloquea números void/virtuales/fake.',
    usage: 'antifake on|off',
    isAdmin: true,
    botAdmin: true,
    run: async ({ msg, sock, args }) => {
        if (!msg.isGroup)
            return msg.reply('Solo en grupos.');
        const sub = String(args[0] || '').toLowerCase();
        if (sub === 'on') {
            await db.updateChat(msg.chat, 'antifake', 1);
            let kicked = 0;
            try {
                const meta = await sock.groupMetadata(msg.chat);
                for (const p of meta.participants || []) {
                    const id = p.id || p.jid;
                    if (isFakeNumber(id)) {
                        try {
                            await sock.groupParticipantsUpdate(msg.chat, [id], 'remove');
                            kicked++;
                        }
                        catch { }
                    }
                }
            }
            catch { }
            return msg.reply('✅ *Anti-fake* activado (void / virtuales / prefijos sospechosos).\n' +
                (kicked ? `Expulsados: ${kicked}` : 'Nadie coincidía en el grupo.'));
        }
        if (sub === 'off') {
            await db.updateChat(msg.chat, 'antifake', 0);
            return msg.reply('✅ Anti-fake desactivado.');
        }
        const chat = await db.getChat(msg.chat);
        return msg.reply(`Anti-fake: *${Number(chat?.antifake) === 1 ? 'ON' : 'OFF'}*\nUso: #antifake on|off`);
    }
};
export { isFakeNumber, isVoidPattern };
