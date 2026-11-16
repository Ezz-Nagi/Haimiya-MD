export default {
    command: ['approval'],
    aliases: ['aprobacion', 'aprobarmiembros'],
    desc: 'Activa o desactiva la aprobación de nuevos miembros (los que entran por enlace esperan a un admin).',
    usage: 'approval on|off',
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
        if (!['on', 'off'].includes(k))
            return msg.reply(`《✧》 Uso: *${usedPrefix}${command} on|off*`);
        try {
            await sock.groupJoinApprovalMode(msg.chat, k);
            return msg.reply(k === 'on' ? '🛂 Los nuevos miembros ahora *necesitan aprobación*. Revisa con *#solicitudes*.' : '🛂 Aprobación *desactivada*: entran directamente.');
        }
        catch (e) {
            return msg.reply(`《✧》 No pude cambiarlo: ${e?.message || 'error desconocido'}`);
        }
    }
};
