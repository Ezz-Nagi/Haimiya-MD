import { OWNER_JID } from '../../lib/haimiya.js';
export default {
    command: ['kickrule'],
    aliases: [],
    desc: 'Ejecuta la selección aleatoria configurada para expulsiones.',
    usage: 'kickrule',
    category: 'group',
    isOwner: false,
    isAdmin: false,
    botAdmin: true,
    customPrefix: null,
    hidden: false,
    isAdmin: true,
    isBotAdmin: true,
    run: async ({ msg, sock }) => {
        if (!msg.isGroup)
            return msg.reply('✖️ Este comando solo se puede usar en grupos.');
        const groupMetadata = await sock.groupMetadata(msg.chat);
        const participants = groupMetadata.participants;
        const botId = sock.user.id.split(':')[0] + '@s.whatsapp.net';
        const candidates = participants
            .filter(p => p.id !== botId)
            .filter(p => p.id !== OWNER_JID);
        if (candidates.length < 1) {
            return msg.reply('✖️ No hay suficientes miembros para jugar a la ruleta.');
        }
        const randomIndex = Math.floor(Math.random() * candidates.length);
        const selectedMember = candidates[randomIndex];
        const selectedName = selectedMember.id.split('@')[0];
        const pasos = ['🤞', '🎲', '🤞', '🎲', '🤞', '🎲', '🔄', '💥'];
        const { key } = await sock.sendMessage(msg.chat, { text: '🎲 *Iniciando ruleta de expulsión...*' });
        let step = 0;
        const interval = setInterval(async () => {
            if (step < pasos.length) {
                await sock.sendMessage(msg.chat, { text: pasos[step], edit: key });
                step++;
            }
            else {
                clearInterval(interval);
                const finalMsg = `💥 *La ruleta ha decidido...*\n\n👤 *Miembro seleccionado:*\n> @${selectedName}\n\n🔨 *Expulsando del grupo...*`;
                await sock.sendMessage(msg.chat, { text: finalMsg, mentions: [selectedMember.id] });
                try {
                    await sock.groupParticipantsUpdate(msg.chat, [selectedMember.id], 'remove');
                    await sock.sendMessage(msg.chat, {
                        text: `✅ *@${selectedName} ha sido expulsado del grupo por la ruleta.*`,
                        mentions: [selectedMember.id]
                    });
                }
                catch (e) {
                    console.error('Error al expulsar:', e);
                    await sock.sendMessage(msg.chat, { text: '❌ No se pudo expulsar al miembro. (¿Sigue siendo admin?)' });
                }
            }
        }, 800);
    },
};
