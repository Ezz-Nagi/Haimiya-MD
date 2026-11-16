export default {
    command: ['minus'],
    aliases: ['lowercase'],
    category: 'utils',
    description: 'Convierte un texto a minúsculas.',
    desc: 'Convierte un texto a minúsculas.',
    usage: 'minus <texto>',
    isOwner: false,
    isAdmin: false,
    botAdmin: false,
    customPrefix: null,
    hidden: false,
    run: async ({ msg, args }) => {
        const text = args.join(' ').trim();
        if (!text)
            return msg.reply('😑 Escribe un texto.');
        return msg.reply(text.toLowerCase().slice(0, 4000));
    }
};
