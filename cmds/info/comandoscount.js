export default {
    command: ['comandos', 'cmdcount'],
    aliases: ['totalcmds'],
    desc: 'Cuántos comandos hay cargados.',
    usage: 'comandos',
    category: 'info',
    isOwner: false,
    isAdmin: false,
    botAdmin: false,
    hidden: false,
    run: async ({ msg }) => {
        const n = global.comandos instanceof Map ? global.comandos.size : 0;
        await msg.reply(`Comandos registrados: *${n}*`);
    }
};
