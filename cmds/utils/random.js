export default {
    command: ['random'],
    aliases: ['aleatorio'],
    category: 'utils',
    description: 'Genera un número aleatorio dentro de un rango.',
    desc: 'Genera un número aleatorio dentro de un rango.',
    usage: 'random [mínimo] [máximo]',
    isOwner: false,
    isAdmin: false,
    botAdmin: false,
    customPrefix: null,
    hidden: false,
    run: async ({ msg, args }) => {
        const min = Number(args[0] ?? 1);
        const max = Number(args[1] ?? 100);
        if (!Number.isInteger(min) || !Number.isInteger(max) || min > max || max - min > 1000000) {
            return msg.reply('😑 Usa dos enteros válidos. Ejemplo: *#random 1 100*');
        }
        const value = Math.floor(Math.random() * (max - min + 1)) + min;
        return msg.reply(`✦ Número aleatorio: *${value}*`);
    }
};
