import { OWNER_JID } from '../../lib/haimiya.js';
export default {
    command: ['aceptarid'],
    aliases: [],
    category: 'utils',
    desc: 'Acepta una solicitud pendiente de ingreso cuando el bot tiene permisos.',
    usage: 'aceptarid <id>',
    isOwner: false,
    isAdmin: false,
    botAdmin: false,
    customPrefix: null,
    hidden: false,
    isCreator: true,
    run: async ({ msg, sock, args }) => {
        if (msg.sender !== OWNER_JID) {
            return msg.reply('😑 *Acceso denegado.* Este comando es exclusivo para el desarrollador principal.');
        }
        const groupJid = args[0]?.trim() || '';
        if (!groupJid) {
            return msg.reply('✖️ Ingresa el ID del grupo. Ejemplo: *autoacept 120363123456@g.us*');
        }
        if (!/@g\.us/.test(groupJid)) {
            return msg.reply('✖️ Formato inválido. Debe terminar en *@g.us*.');
        }
        try {
            let groupName = 'Grupo sin nombre';
            try {
                const metadata = await sock.groupMetadata(groupJid);
                groupName = metadata.subject || 'Grupo sin nombre';
            }
            catch { }
            await sock.groupRequestParticipantsUpdate(groupJid, [OWNER_JID], 'approve');
            return msg.reply(`✅ *¡Solicitud aceptada!*\n\n📛 *Grupo:* ${groupName}\n📌 *ID:* ${groupJid}\n\n_El bot te ha aceptado automáticamente._`);
        }
        catch (e) {
            console.error('[AUTOACEPT]', e);
            return msg.reply(`❌ *No se pudo aceptar tu solicitud.*\n\n${e?.message || 'Error desconocido. Asegúrate de que el bot sea ADMIN en ese grupo.'}`);
        }
    }
};
