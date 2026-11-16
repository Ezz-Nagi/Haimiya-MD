import * as promos from '../../lib/system/promos.js';
export default {
    command: ['promociones'],
    aliases: [],
    category: 'info',
    desc: 'Muestra las promociones disponibles de Haimiya.',
    isOwner: false,
    isAdmin: false,
    botAdmin: false,
    hidden: false,
    description: 'Lista promociones publicadas ordenadas por clics.',
    usage: 'promociones',
    run: async ({ msg }) => {
        const list = promos.topPromos(15);
        if (!list.length)
            return msg.reply('No hay promociones publicadas todavía.');
        const lines = list.map((p, i) => {
            const clicks = p.clicks || 0;
            const active = p.ends && p.ends > Date.now() ? '🟢' : '⚪';
            return `${i + 1}. ${active} *${p.title}*\n   👆 ${clicks} clics\n   ${p.link}`;
        });
        return msg.reply('📢 *Promociones* (más cliqueadas)\n\n' + lines.join('\n\n'));
    }
};
