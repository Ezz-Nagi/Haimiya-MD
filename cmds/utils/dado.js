export default {
    command: ['dado'],
    aliases: ['dice', 'tirar'],
    desc: 'Lanza dados. Formato NdM (ej. 2d6, 1d20). Sin argumentos: 1d6.',
    usage: 'dado [NdM]',
    category: 'utils',
    isOwner: false,
    isAdmin: false,
    botAdmin: false,
    customPrefix: null,
    hidden: false,
    run: async ({ msg, args, usedPrefix, command }) => {
        const m = String(args[0] || '1d6').toLowerCase().match(/^(\d{1,2})?d(\d{1,4})$/);
        const n = m ? parseInt(m[1] || '1') : 0, sides = m ? parseInt(m[2]) : 0;
        if (!m || n < 1 || n > 20 || sides < 2)
            return msg.reply(`《✧》 Uso: *${usedPrefix}${command} 2d6*\nHasta 20 dados y de 2 a 1000 caras.`);
        const rolls = Array.from({ length: n }, () => 1 + Math.floor(Math.random() * sides));
        const total = rolls.reduce((a, b) => a + b, 0);
        return msg.reply(`🎲 *${n}d${sides}*\n${n > 1 ? `Tiradas: ${rolls.join(' + ')}\n` : ''}Total: *${total}*`);
    }
};
