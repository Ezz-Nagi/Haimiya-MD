const OPTS = { off: 0, '24h': 86400, '1d': 86400, '7d': 604800, '90d': 7776000 };
export default {
    command: ['ephemeral'],
    aliases: ['temporales', 'efimeros', 'desaparecen'],
    desc: 'Activa o desactiva los mensajes temporales del grupo.',
    usage: 'ephemeral off|24h|7d|90d',
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
        if (!(k in OPTS))
            return msg.reply(`《✧》 Uso: *${usedPrefix}${command} off|24h|7d|90d*`);
        try {
            await sock.groupToggleEphemeral(msg.chat, OPTS[k]);
            return msg.reply(k === 'off' ? '⏳ Mensajes temporales *desactivados*.' : `⏳ Los mensajes ahora desaparecen a los *${k === '1d' ? '24h' : k}*.`);
        }
        catch (e) {
            return msg.reply(`《✧》 No pude cambiarlo: ${e?.message || 'error desconocido'}`);
        }
    }
};
