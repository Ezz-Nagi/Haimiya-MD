import { FORTUNES, rand } from '../../lib/system/fun-data.js';
export default {
    command: ['suerte'],
    aliases: ['fortuna', 'galleta', 'fortune'],
    desc: 'Abre una galleta de la fortuna.',
    usage: 'suerte',
    category: 'fun',
    isOwner: false, isAdmin: false, botAdmin: false, customPrefix: null, hidden: false,
    run: async ({ msg }) => msg.reply(`🥠 *Galleta de la fortuna*\n\n${rand(FORTUNES)}\n\n🍀 Número de la suerte: *${1 + Math.floor(Math.random() * 99)}*`)
};
