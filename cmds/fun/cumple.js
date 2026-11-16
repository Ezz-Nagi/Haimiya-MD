import db from '#db';
const parse = s => {
    const m = String(s || '').trim().match(/^(\d{1,2})[/.-](\d{1,2})$/);
    if (!m)
        return null;
    const d = +m[1], mo = +m[2];
    return d >= 1 && d <= 31 && mo >= 1 && mo <= 12 && d <= new Date(2024, mo, 0).getDate() ? `${String(d).padStart(2, '0')}/${String(mo).padStart(2, '0')}` : null;
};
const daysTo = ddmm => {
    const [d, m] = ddmm.split('/').map(Number), now = new Date(), t0 = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    let t = new Date(now.getFullYear(), m - 1, d);
    if (t < t0)
        t = new Date(now.getFullYear() + 1, m - 1, d);
    return Math.round((t - t0) / 86400000);
};
const peek = jid => db.db?.users?.[jid];
export default {
    command: ['cumple'],
    aliases: ['cumpleaños', 'cumpleanos', 'birthday'],
    desc: 'Guarda tu cumpleaños y mira los próximos del grupo.',
    usage: 'cumple 15/03 | cumple | cumple lista | cumple borrar',
    category: 'fun',
    isOwner: false, isAdmin: false, botAdmin: false, customPrefix: null, hidden: false,
    run: async ({ msg, sock, args, usedPrefix, command }) => {
        const sub = String(args[0] || '').toLowerCase();
        if (sub === 'lista' || sub === 'proximos' || sub === 'próximos' || sub === 'hoy') {
            if (!msg.isGroup)
                return msg.reply('《✧》 La lista solo funciona en grupos.');
            const meta = await sock.groupMetadata(msg.chat).catch(() => null);
            const members = (meta?.participants || []).map(p => sock.decodeJid(p.jid || p.id || p.phoneNumber || p.lid)).filter(Boolean);
            let rows = members.map(j => ({ j, b: peek(j)?.birthday })).filter(x => x.b).map(x => ({ ...x, n: daysTo(x.b) })).sort((a, b) => a.n - b.n);
            if (sub === 'hoy')
                rows = rows.filter(r => r.n === 0);
            rows = rows.slice(0, 8);
            if (!rows.length)
                return msg.reply(sub === 'hoy' ? '🎂 Hoy no cumple nadie del grupo.' : `🎂 Nadie ha guardado su cumpleaños. Usa *${usedPrefix}${command} 15/03*.`);
            return sock.sendMessage(msg.chat, { text: `🎂 *Próximos cumpleaños*\n\n${rows.map(r => `› @${r.j.split('@')[0]} — ${r.b} ${r.n === 0 ? '🎉 ¡HOY!' : `(en ${r.n} día${r.n === 1 ? '' : 's'})`}`).join('\n')}`, mentions: rows.map(r => r.j) }, { quoted: msg });
        }
        if (sub === 'borrar' || sub === 'eliminar') {
            await db.updateUser(msg.sender, 'birthday', '');
            return msg.reply('🎂 Cumpleaños borrado.');
        }
        if (!args[0]) {
            const b = (await db.getUser(msg.sender))?.birthday;
            return msg.reply(b ? `🎂 Tu cumpleaños es el *${b}* (faltan ${daysTo(b)} día${daysTo(b) === 1 ? '' : 's'}).` : `🎂 No has guardado tu cumpleaños. Usa *${usedPrefix}${command} 15/03*.`);
        }
        const v = parse(args[0]);
        if (!v)
            return msg.reply(`《✧》 Formato: *${usedPrefix}${command} DD/MM* (ejemplo: 15/03)`);
        await db.getUser(msg.sender);
        await db.updateUser(msg.sender, 'birthday', v);
        return msg.reply(`🎂 Guardado: *${v}*. Faltan ${daysTo(v)} día${daysTo(v) === 1 ? '' : 's'}.\nMira los del grupo con *${usedPrefix}${command} lista*.`);
    }
};
