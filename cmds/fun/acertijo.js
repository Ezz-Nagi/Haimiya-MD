import { riddleStart, riddleAnswer, riddleGiveUp } from '../../lib/system/games.js';
export default {
    command: ['acertijo'],
    aliases: ['respuesta', 'riddle'],
    desc: 'Un acertijo por chat. Responde con #respuesta <texto>.',
    usage: 'acertijo | respuesta <texto> | acertijo rendirse',
    category: 'fun',
    isOwner: false, isAdmin: false, botAdmin: false, customPrefix: null, hidden: false,
    run: async ({ msg, args, command }) => {
        const text = args.join(' ').trim();
        if (command === 'respuesta')
            return msg.reply(riddleAnswer(msg.chat, text).text);
        if (/^(rendirse|rendir|ver)$/i.test(text))
            return msg.reply(riddleGiveUp(msg.chat));
        if (text)
            return msg.reply(riddleAnswer(msg.chat, text).text);
        return msg.reply(riddleStart(msg.chat));
    }
};
