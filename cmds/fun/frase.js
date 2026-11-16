import { QUOTES, rand } from '../../lib/system/fun-data.js';
export default {
    command: ['frase'],
    aliases: ['motivacion', 'quote', 'inspiracion'],
    desc: 'Una frase motivadora para el día.',
    usage: 'frase',
    category: 'fun',
    isOwner: false, isAdmin: false, botAdmin: false, customPrefix: null, hidden: false,
    run: async ({ msg }) => msg.reply(`✨ _${rand(QUOTES)}_`)
};
