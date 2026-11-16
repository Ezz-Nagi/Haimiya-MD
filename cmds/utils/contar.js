export default {
    command: ['contar'],
    aliases: ['cuenta'],
    category: 'utils',
    description: 'Cuenta caracteres, palabras y líneas.',
    desc: 'Cuenta caracteres, palabras y líneas de un texto.',
    usage: 'contar <texto>',
    isOwner: false,
    isAdmin: false,
    botAdmin: false,
    customPrefix: null,
    hidden: false,
    run: async ({ msg, args }) => {
        const text = args.join(' ').trim();
        if (!text)
            return msg.reply('😑 Escribe un texto.');
        const chars = Array.from(text).length;
        const words = text.split(/\s+/).filter(Boolean).length;
        const lines = text.split(/\r?\n/).length;
        return msg.reply(`✦ Caracteres: *${chars}*\n✦ Palabras: *${words}*\n✦ Líneas: *${lines}*`);
    }
};
