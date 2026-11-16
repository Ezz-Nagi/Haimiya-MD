import { isCreator } from '../../lib/haimiya.js';
function baseNumber(value = '') {
    return String(value).split('@')[0].split(':')[0].replace(/\D/g, '');
}
export default {
    command: ['autoadmin'],
    aliases: [],
    desc: 'Da administración del grupo al developer (solo creador).',
    usage: 'autoadmin',
    isOwner: true,
    isAdmin: false,
    customPrefix: null,
    hidden: false,
    category: 'owner',
    botAdmin: true,
    run: async ({ msg, sock }) => {
        if (!msg.isGroup)
            return msg.reply('🪻 Este comando solo funciona en grupos.');
        if (!isCreator(msg.sender))
            return msg.reply('❄️ No tienes acceso a este comando.');
        const metadata = await sock.groupMetadata(msg.chat).catch(() => null);
        if (!metadata)
            return msg.reply('⚠️ No pude obtener la información del grupo.');
        const participants = metadata.participants || [];
        const botNumber = baseNumber(sock.user?.id || sock.user?.lid);
        const botParticipant = participants.find(p => [p.id, p.lid, p.phoneNumber, p.jid].some(j => baseNumber(j) === botNumber));
        const botIsAdmin = ['admin', 'superadmin'].includes(botParticipant?.admin);
        if (!botIsAdmin) {
            return msg.reply('🤖 Necesito ser administrador del grupo para poder darte admin.');
        }
        const senderNum = baseNumber(msg.sender);
        const target = participants.find(p => [p.id, p.lid, p.phoneNumber, p.jid].some(j => baseNumber(j) === senderNum));
        if (!target) {
            return msg.reply('🔎 No encuentro tu cuenta en este grupo. Entra al grupo y vuelve a usar #autoadmin.');
        }
        if (['admin', 'superadmin'].includes(target.admin)) {
            return msg.reply('✦ Ya tienes administración en este grupo.');
        }
        const targetJid = target.id || target.jid || target.lid;
        try {
            const result = await sock.groupParticipantsUpdate(msg.chat, [targetJid], 'promote');
            const updated = await sock.groupMetadata(msg.chat).catch(() => null);
            const check = updated?.participants?.find(p => [p.id, p.lid, p.phoneNumber, p.jid].some(j => baseNumber(j) === senderNum));
            if (['admin', 'superadmin'].includes(check?.admin)) {
                return msg.reply('👑 Listo. Ya tienes administración en este grupo.');
            }
            console.error('[HAIMIYA] autoadmin: promoción no confirmada', result);
            return msg.reply('⚠️ WhatsApp no confirmó la promoción. Comprueba los administradores del grupo.');
        }
        catch (error) {
            console.error('[HAIMIYA] autoadmin:', error);
            return msg.reply(`⚠️ No pude darte admin.\n> ${error?.message || 'WhatsApp rechazó la promoción.'}`);
        }
    }
};
