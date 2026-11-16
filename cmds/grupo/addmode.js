export default {
    command: ['addmode'],
    aliases: ['modoagregar', 'quienagrega'],
    desc: 'Define quién puede agregar miembros: todos o solo admins.',
    usage: 'addmode all|admins',
    category: 'group',
    isOwner: false,
    isAdmin: true,
    botAdmin: true,
    customPrefix: null,
    hidden: false,
    run: async ({ msg, sock, args, usedPrefix, command }) => {
        if (!msg.isGroup)
            return msg.reply('《✧》 Este comando solo funciona en grupos.');
        const k = String(args[0] || '').toLowerCase();
        const mode = /^(all|todos|miembros)$/.test(k) ? 'all_member_add' : /^(admins?|administradores)$/.test(k) ? 'admin_add' : null;
        if (!mode)
            return msg.reply(`《✧》 Uso: *${usedPrefix}${command} all|admins*`);
        try {
            await sock.groupMemberAddMode(msg.chat, mode);
            return msg.reply(mode === 'admin_add' ? '👥 Ahora *solo los admins* pueden agregar miembros.' : '👥 Ahora *todos* pueden agregar miembros.');
        }
        catch (e) {
            return msg.reply(`《✧》 No pude cambiarlo: ${e?.message || 'error desconocido'}`);
        }
    }
};
