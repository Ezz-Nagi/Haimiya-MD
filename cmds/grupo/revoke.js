export default {
    command: ['revoke'],
    aliases: ['resetlink', 'revocarlink', 'nuevolink'],
    desc: 'Invalida el enlace de invitación actual y genera uno nuevo.',
    usage: 'revoke',
    category: 'group',
    isOwner: false,
    isAdmin: true,
    botAdmin: true,
    customPrefix: null,
    hidden: false,
    run: async ({ msg, sock }) => {
        if (!msg.isGroup)
            return msg.reply('《✧》 Este comando solo funciona en grupos.');
        try {
            const code = await sock.groupRevokeInvite(msg.chat);
            return msg.reply(`🔗 *Enlace restablecido.* El anterior ya no funciona.\n\nNuevo: https://chat.whatsapp.com/${code}`);
        }
        catch (e) {
            return msg.reply(`《✧》 No pude restablecer el enlace: ${e?.message || 'error desconocido'}`);
        }
    }
};
