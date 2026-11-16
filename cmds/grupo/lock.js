export default {
    command: ['lock', 'unlock'],
    aliases: ['bloquearinfo', 'desbloquearinfo'],
    desc: 'Bloquea o desbloquea la edición de la info del grupo (nombre, foto, descripción) para los miembros.',
    usage: 'lock | unlock',
    category: 'group',
    isOwner: false,
    isAdmin: true,
    botAdmin: true,
    customPrefix: null,
    hidden: false,
    run: async ({ msg, sock, command }) => {
        if (!msg.isGroup)
            return msg.reply('《✧》 Este comando solo funciona en grupos.');
        const lock = command === 'lock' || command === 'bloquearinfo';
        try {
            await sock.groupSettingUpdate(msg.chat, lock ? 'locked' : 'unlocked');
            return msg.reply(lock ? '🔒 Solo los admins pueden editar la info del grupo.' : '🔓 Todos pueden editar la info del grupo.');
        }
        catch (e) {
            return msg.reply(`《✧》 No pude cambiarlo: ${e?.message || 'error desconocido'}`);
        }
    }
};
