import { parseDate, daysUntil } from '../../lib/system/toolbox.js';
const EVENTS = { navidad: [11, 25, '🎄 Navidad'], nochebuena: [11, 24, '🌟 Nochebuena'], 'añonuevo': [0, 1, '🎆 Año Nuevo'], anonuevo: [0, 1, '🎆 Año Nuevo'], halloween: [9, 31, '🎃 Halloween'], reyes: [0, 6, '👑 Reyes Magos'], sanvalentin: [1, 14, '💘 San Valentín'] };
function nextOccurrence(m, d) {
    const now = new Date(), t0 = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    let t = new Date(now.getFullYear(), m, d, 12);
    if (t < t0)
        t = new Date(now.getFullYear() + 1, m, d, 12);
    return t;
}
export default {
    command: ['cuentaatras'],
    aliases: ['countdown', 'faltan', 'diasfaltan'],
    desc: 'Cuántos días faltan para una fecha o evento (navidad, añonuevo, halloween, reyes, sanvalentin).',
    usage: 'cuentaatras navidad | cuentaatras 25/12/2026',
    category: 'utils',
    isOwner: false, isAdmin: false, botAdmin: false, customPrefix: null, hidden: false,
    run: async ({ msg, args, usedPrefix, command }) => {
        const key = String(args[0] || '').toLowerCase().replace(/\s+/g, '');
        let target, label;
        if (EVENTS[key]) {
            const [m, d, l] = EVENTS[key];
            target = nextOccurrence(m, d);
            label = l;
        }
        else {
            const short = String(args[0] || '').match(/^(\d{1,2})[/.-](\d{1,2})$/);
            target = short ? nextOccurrence(+short[2] - 1, +short[1]) : parseDate(args[0]);
            label = '📅 ' + (args[0] || '');
        }
        if (!target || Number.isNaN(target.getTime()))
            return msg.reply(`《✧》 Uso: *${usedPrefix}${command} navidad* o *${usedPrefix}${command} 25/12/2026*\nEventos: ${Object.keys(EVENTS).filter(k => k !== 'anonuevo').join(', ')}`);
        const n = daysUntil(target);
        return msg.reply(n === 0 ? `${label}\n\n🎉 *¡Es hoy!*` : n > 0 ? `${label}\n\n⏳ Faltan *${n}* día${n === 1 ? '' : 's'} (${Math.floor(n / 7)} semanas y ${n % 7} días).` : `${label}\n\n⌛ Fue hace *${-n}* día${n === -1 ? '' : 's'}.`);
    }
};
