export default {
    command: ['infogp', 'groupinfo', 'infogrupo'],
    aliases: ['gpinfo'],
    desc: 'Información del grupo.',
    usage: 'infogp',
    category: 'group',
    isOwner: false,
    isAdmin: false,
    botAdmin: false,
    hidden: false,
    run: async ({ msg, sock }) => {
        if (!msg.isGroup)
            return msg.reply('Solo en grupos.');
        try {
            const m = await sock.groupMetadata(msg.chat);
            const admins = (m.participants || []).filter(p => p.admin).length;
            const lines = [
                `*${m.subject || 'Grupo'}*`,
                `ID: ${m.id}`,
                `Miembros: ${(m.participants || []).length}`,
                `Admins: ${admins}`,
                m.desc ? `\n${String(m.desc).slice(0, 500)}` : null
            ].filter(Boolean);
            await msg.reply(lines.join('\n'));
        }
        catch {
            await msg.reply('No pude obtener la info.');
        }
    }
};
