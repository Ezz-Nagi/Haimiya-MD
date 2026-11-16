import { guessStart, guessTry } from '../../lib/system/games.js';
export default {
    command: ['adivina'],
    aliases: ['numero', 'guess'],
    desc: 'Adivina el número del 1 al 100 en 7 intentos.',
    usage: 'adivina | adivina <número>',
    category: 'fun',
    isOwner: false, isAdmin: false, botAdmin: false, customPrefix: null, hidden: false,
    run: async ({ msg, args }) => {
        if (args[0] && /^\d+$/.test(args[0]))
            return msg.reply(guessTry(msg.chat, msg.sender, args[0]).text);
        return msg.reply(guessStart(msg.chat, msg.sender));
    }
};
