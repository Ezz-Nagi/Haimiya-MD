export default {
    command: ['coin'],
    aliases: ['cara'],
    desc: 'Lanza una moneda para obtener cara o cruz.',
    usage: 'coin',
    category: 'fun',
    isOwner: false,
    isAdmin: false,
    botAdmin: false,
    hidden: false,
    run: async ({ msg }) => msg.reply(Math.random() < 0.5 ? '🪙 *Cara*' : '🪙 *Cruz*')
};
