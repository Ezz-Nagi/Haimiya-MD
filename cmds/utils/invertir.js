export default {
    command: ['invertir'],
    aliases: ['reverse'],
    category: 'utils',
    description: 'Invierte el texto indicado.',
    desc: 'Invierte el texto indicado.',
    usage: 'invertir <texto>',
    isOwner: false,
    isAdmin: false,
    botAdmin: false,
    customPrefix: null,
    hidden: false,
    run: async ({ msg, args }) => {
        const text = args.join(' ').trim();
        if (!text)
            return msg.reply('😑 Escribe un texto.');
        return msg.reply(Array.from(text).reverse().join('').slice(0, 4000));
    }
};
