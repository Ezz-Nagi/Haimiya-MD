export default {
    command: ['solicitudes'],
    aliases: ['requests'],
    category: 'group',
    description: 'Muestra las solicitudes pendientes de ingreso.',
    desc: 'Muestra las solicitudes pendientes de ingreso al grupo.',
    usage: 'solicitudes',
    isOwner: false,
    customPrefix: null,
    hidden: false,
    isAdmin: true,
    botAdmin: true,
    run: async ({ msg, sock }) => {
        try {
            const list = await sock.groupRequestParticipantsList(msg.chat);
            if (!list?.length)
                return msg.reply('《✤》 No hay solicitudes pendientes.');
            const ids = list.map(x => x.phone_number ? `${x.phone_number}@s.whatsapp.net` : (x.jid || x.id || x.lid)).filter(Boolean);
            return sock.reply(msg.chat, `ꫝꪖꪊꪑỉꪗꪖ\n\n*SOLICITUDES PENDIENTES*\n\n${ids.map((j, i) => `${i + 1}. @${j.split('@')[0]}`).join('\n')}`, msg, { mentions: ids });
        }
        catch (e) {
            return msg.reply(`《✤》 No pude obtener las solicitudes: ${e?.message || e}`);
        }
    }
};
