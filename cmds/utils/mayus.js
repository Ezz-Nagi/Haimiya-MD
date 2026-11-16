export default {
    command: ['mayus'],
    aliases: ['uppercase'],
    category: 'utils',
    description: 'Convierte un texto a mayúsculas.',
    desc: 'Convierte un texto a mayúsculas.',
    usage: 'mayus <texto>',
    isOwner: false,
    isAdmin: false,
    botAdmin: false,
    customPrefix: null,
    hidden: false,
    run: async ({ msg, args }) => {
        const text = args.join(' ').trim();
        if (!text)
            return msg.reply('😑 Escribe un texto.');
        return msg.reply(text.toUpperCase().slice(0, 4000));
    }
};
