import { triviaStart, triviaAnswer } from '../../lib/system/games.js';
export default {
    command: ['trivia'],
    aliases: ['quiz', 'preguntados'],
    desc: 'Pregunta de cultura general con opciones A-D. Responde con #trivia A.',
    usage: 'trivia | trivia A|B|C|D',
    category: 'fun',
    isOwner: false, isAdmin: false, botAdmin: false, customPrefix: null, hidden: false,
    run: async ({ msg, args }) => {
        const a = String(args[0] || '').trim();
        if (/^[a-dA-D]$/.test(a))
            return msg.reply(triviaAnswer(msg.chat, a).text);
        return msg.reply(triviaStart(msg.chat));
    }
};
