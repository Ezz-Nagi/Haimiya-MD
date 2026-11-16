export default {
    command: ['doxeo_disabled'],
    aliases: [],
    desc: 'Consulta de datos personales deshabilitada por privacidad.',
    usage: 'No disponible.',
    category: 'utils',
    isOwner: true,
    isAdmin: false,
    botAdmin: false,
    hidden: true,
    run: async ({ msg }) => msg.reply('Esta función está deshabilitada por privacidad.')
};
