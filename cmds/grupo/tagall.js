export default {
    command: ['tagall'],
    aliases: ['todos', 'invocar', 'everyone'],
    desc: 'Menciona a todos los miembros del grupo con un mensaje.',
    usage: 'tagall [mensaje]',
    category: 'group',
    isOwner: false,
    isAdmin: true,
    botAdmin: false,
    customPrefix: null,
    hidden: false,
    run: async ({ msg, sock, args }) => {
        if (!msg.isGroup)
            return msg.reply('《✧》 Este comando solo funciona en grupos.');
        const meta = await sock.groupMetadata(msg.chat).catch(() => null);
        const members = (meta?.participants || []).map(p => sock.decodeJid(p.jid || p.id || p.phoneNumber || p.lid)).filter(Boolean);
        if (!members.length)
            return msg.reply('《✧》 No pude obtener los miembros.');
        const texto = args.join(' ').trim() || 'Atención, por favor.';
        const lista = members.map(j => `› @${j.split('@')[0]}`).join('\n');
        return sock.sendMessage(msg.chat, { text: `📣 *${texto}*\n\n👥 Miembros: *${members.length}*\n\n${lista}`, mentions: members }, { quoted: msg });
    }
};
