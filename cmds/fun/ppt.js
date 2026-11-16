import { parsePPT, playPPT, PPT } from '../../lib/system/fun-data.js';
export default {
    command: ['rps'],
    aliases: ['piedrapapeltijera', 'pptbot'],
    desc: 'Piedra, papel o tijera contra el bot.',
    usage: 'rps piedra|papel|tijera',
    category: 'fun',
    isOwner: false, isAdmin: false, botAdmin: false, customPrefix: null, hidden: false,
    run: async ({ msg, args, usedPrefix, command }) => {
        const pick = parsePPT(args[0]);
        if (!pick)
            return msg.reply(`《✧》 Uso: *${usedPrefix}${command} piedra|papel|tijera*`);
        const r = playPPT(pick);
        const out = r.result === 'empate' ? '🤝 ¡Empate!' : r.result === 'ganas' ? '🎉 ¡Ganaste!' : '😈 ¡Gané yo!';
        return msg.reply(`${PPT[r.user]} *Tú:* ${r.user}\n${PPT[r.bot]} *Yo:* ${r.bot}\n\n${out}`);
    }
};
