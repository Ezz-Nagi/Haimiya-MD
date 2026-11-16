export default {
    command: ['fecha'],
    aliases: ['date'],
    category: 'utils',
    description: 'Muestra la fecha y hora actuales.',
    desc: 'Muestra la fecha y hora actuales.',
    usage: 'fecha',
    isOwner: false,
    isAdmin: false,
    botAdmin: false,
    customPrefix: null,
    hidden: false,
    run: async ({ msg }) => {
        const now = new Date();
        const fecha = new Intl.DateTimeFormat('es-ES', { dateStyle: 'full', timeStyle: 'medium', timeZone: 'America/Havana' }).format(now);
        return msg.reply(`✦ ${fecha}`);
    }
};
