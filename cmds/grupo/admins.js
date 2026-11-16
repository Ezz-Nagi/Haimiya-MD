export default {
    command: ['admins'],
    aliases: ['tagadmins', 'listadmins', 'llamaradmins'],
    desc: 'Menciona a todos los administradores del grupo (útil para pedir ayuda).',
    usage: 'admins [motivo]',
    category: 'group',
    isOwner: false,
    isAdmin: false,
    botAdmin: false,
    customPrefix: null,
    hidden: false,
    run: async ({ msg, sock, args }) => {
        if (!msg.isGroup)
            return msg.reply('《✧》 Este comando solo funciona en grupos.');
        const meta = await sock.groupMetadata(msg.chat).catch(() => null);
        const admins = (meta?.participants || []).filter(p => p.admin).map(p => sock.decodeJid(p.jid || p.id || p.phoneNumber || p.lid)).filter(Boolean);
        if (!admins.length)
            return msg.reply('《✧》 No pude obtener la lista de administradores.');
        const motivo = args.join(' ').trim();
        const lista = admins.map((j, i) => `${i + 1}. @${j.split('@')[0]}`).join('\n');
        return sock.sendMessage(msg.chat, { text: `🛡️ *Administradores del grupo* (${admins.length})\n${motivo ? `\n📣 ${motivo}\n` : ''}\n${lista}`, mentions: admins }, { quoted: msg });
    }
};
