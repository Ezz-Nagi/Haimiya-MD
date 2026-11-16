import { JOKES, rand } from '../../lib/system/fun-data.js';
export default {
    command: ['chiste'],
    aliases: ['joke', 'chistes'],
    desc: 'Te cuenta un chiste.',
    usage: 'chiste',
    category: 'fun',
    isOwner: false, isAdmin: false, botAdmin: false, customPrefix: null, hidden: false,
    run: async ({ msg }) => msg.reply(`😂 ${rand(JOKES)}`)
};
