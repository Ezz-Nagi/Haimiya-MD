import { parseDate, ageFrom } from '../../lib/system/toolbox.js';
export default {
    command: ['edad'],
    aliases: ['age', 'calcularedad'],
    desc: 'Calcula una edad exacta a partir de una fecha de nacimiento.',
    usage: 'edad 25/12/2000',
    category: 'utils',
    isOwner: false, isAdmin: false, botAdmin: false, customPrefix: null, hidden: false,
    run: async ({ msg, args, usedPrefix, command }) => {
        const d = parseDate(args[0]);
        if (!d || d > new Date())
            return msg.reply(`《✧》 Uso: *${usedPrefix}${command} DD/MM/AAAA* (una fecha pasada)\nEjemplo: *${usedPrefix}${command} 25/12/2000*`);
        const a = ageFrom(d);
        if (a.years > 130)
            return msg.reply('《✧》 Esa fecha parece demasiado antigua.');
        return msg.reply(`🎂 *Edad exacta*\n\n› *${a.years}* años, *${a.months}* meses y *${a.days}* días\n› Has vivido *${a.totalDays.toLocaleString('es')}* días\n› Tu próximo cumpleaños: ${a.toBirthday === 0 ? '🎉 ¡es hoy!' : `en *${a.toBirthday}* día${a.toBirthday === 1 ? '' : 's'}`}`);
    }
};
