export default {
    command: ['echo'],
    aliases: ['repite'],
    category: 'utils',
    description: 'Repite el texto indicado.',
    desc: 'Repite el texto indicado.',
    usage: 'echo <texto>',
    isOwner: false,
    isAdmin: false,
    botAdmin: false,
    customPrefix: null,
    hidden: false,
    run: async ({ msg, args }) => {
        const text = args.join(' ').trim();
        if (!text)
            return msg.reply('😑 Escribe algo para repetir.');
        return msg.reply(text.slice(0, 4000));
    }
};
