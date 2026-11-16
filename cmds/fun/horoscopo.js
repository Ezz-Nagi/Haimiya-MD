import { findSign, horoscope, SIGNS } from '../../lib/system/fun-data.js';
export default {
    command: ['horoscopo'],
    aliases: ['horóscopo', 'signo', 'zodiaco'],
    desc: 'Tu horóscopo de hoy según tu signo (el mismo texto todo el día).',
    usage: 'horoscopo <signo>',
    category: 'fun',
    isOwner: false, isAdmin: false, botAdmin: false, customPrefix: null, hidden: false,
    run: async ({ msg, args, usedPrefix, command }) => {
        const sign = findSign(args[0]);
        if (!sign)
            return msg.reply(`《✧》 Uso: *${usedPrefix}${command} <signo>*\nSignos: ${SIGNS.map(s => s[1] + ' ' + s[0]).join(', ')}`);
        const h = horoscope(sign);
        return msg.reply(`${h.icon} *${h.sign.toUpperCase()}* — hoy\n\n❤️ Amor: ${h.love}\n💼 Trabajo: ${h.work}\n🌿 Salud: ${h.health}\n\n🍀 Número: *${h.number}* · 🎨 Color: *${h.color}*\n\n_Solo por diversión._`);
    }
};
