export default {
    command: ['totales', 'totalgp'],
    aliases: ['countmembers'],
    desc: 'Cuenta miembros y admins del grupo.',
    usage: 'totales',
    category: 'group',
    isOwner: false,
    isAdmin: false,
    botAdmin: false,
    hidden: false,
    run: async ({ msg, sock }) => {
        if (!msg.isGroup)
            return msg.reply('Solo grupos.');
        const m = await sock.groupMetadata(msg.chat).catch(() => null);
        if (!m)
            return msg.reply('No pude leer el grupo.');
        const parts = m.participants || [];
        const admins = parts.filter(p => p.admin).length;
        await msg.reply(`*${m.subject}*\nMiembros: *${parts.length}*\nAdmins: *${admins}*`);
    }
};
