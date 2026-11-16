export default {
    command: ['moneda'],
    aliases: ['caraocruz'],
    desc: 'Lanza una moneda: cara o cruz.',
    usage: 'moneda',
    category: 'utils',
    isOwner: false,
    isAdmin: false,
    botAdmin: false,
    customPrefix: null,
    hidden: false,
    run: async ({ msg }) => msg.reply(`🪙 Salió: *${Math.random() < 0.5 ? 'CARA' : 'CRUZ'}*`)
};
