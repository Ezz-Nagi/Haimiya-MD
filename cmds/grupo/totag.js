export default {
    command: ['totag', 'tag'],
    aliases: ['tagme'],
    desc: 'Menciona a alguien respondiendo un mensaje.',
    usage: 'totag (responde)',
    category: 'group',
    isOwner: false,
    botAdmin: false,
    hidden: false,
    isAdmin: true,
    run: async ({ msg, sock }) => {
        if (!msg.isGroup)
            return msg.reply('Solo en grupos.');
        if (!msg.quoted)
            return msg.reply('Responde al mensaje que quieres etiquetar.');
        try {
            const meta = await sock.groupMetadata(msg.chat);
            const mentions = (meta.participants || []).map(p => p.id).filter(Boolean);
            const q = msg.quoted;
            const content = q.text || q.body || q.caption || 'Mensaje';
            await sock.sendMessage(msg.chat, { text: String(content).slice(0, 2000), mentions }, { quoted: msg });
        }
        catch {
            await msg.reply('No se pudo etiquetar.');
        }
    }
};
