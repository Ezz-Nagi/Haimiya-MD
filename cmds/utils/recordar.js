import fs from 'fs';
import path from 'path';
const FILE = path.resolve(process.cwd(), 'database', 'reminders.json');
const MIN = 5_000, MAX = 7 * 24 * 3600_000, PER_USER = 5;
const timers = global.__remTimers || (global.__remTimers = new Map());
const botKey = sock => String(sock?.user?.id || '').split(':')[0].split('@')[0];
function load() {
    if (!global.__reminders) {
        try {
            global.__reminders = JSON.parse(fs.readFileSync(FILE, 'utf8'));
        }
        catch {
            global.__reminders = [];
        }
    }
    return global.__reminders;
}
function save() {
    try {
        fs.mkdirSync(path.dirname(FILE), { recursive: true });
        fs.writeFileSync(FILE + '.tmp', JSON.stringify(load(), null, 2));
        fs.renameSync(FILE + '.tmp', FILE);
    }
    catch (e) {
        console.error('[recordar] no se pudo guardar:', e?.message || e);
    }
}
function parseTime(s) {
    const m = String(s || '').toLowerCase().match(/^(\d+)(s|seg|m|min|h|d)$/);
    if (!m)
        return null;
    return parseInt(m[1]) * ({ s: 1000, seg: 1000, m: 60_000, min: 60_000, h: 3600_000, d: 86400_000 }[m[2]]);
}
function arm(sock, r) {
    if (timers.has(r.id))
        return;
    const t = setTimeout(async () => {
        timers.delete(r.id);
        const list = load(), i = list.findIndex(x => x.id === r.id);
        if (i === -1)
            return;
        list.splice(i, 1);
        save();
        try {
            await sock.sendMessage(r.chat, { text: `⏰ *Recordatorio* para @${r.user.split('@')[0]}\n\n${r.text}`, mentions: [r.user] });
        }
        catch (e) {
            console.error('[recordar] no se pudo enviar:', e?.message || e);
        }
    }, Math.min(Math.max(r.at - Date.now(), 1000), 2_000_000_000));
    t.unref?.();
    timers.set(r.id, t);
}
export async function all({ sock }) {
    try {
        const k = botKey(sock);
        for (const r of load())
            if (r.bot === k)
                arm(sock, r);
    }
    catch { }
}
export default {
    command: ['recordar'],
    aliases: ['remind', 'recordatorio', 'avisame'],
    desc: 'Te recuerda algo después de un tiempo (hasta 7 días). Sobrevive a reinicios del bot.',
    usage: 'recordar 30m sacar la basura | recordar lista | recordar cancelar <id>',
    category: 'utils',
    isOwner: false,
    isAdmin: false,
    botAdmin: false,
    customPrefix: null,
    hidden: false,
    run: async ({ msg, sock, args, usedPrefix, command }) => {
        const sub = String(args[0] || '').toLowerCase(), list = load(), bot = botKey(sock);
        const mine = () => list.filter(r => r.bot === bot && r.user === msg.sender);
        if (sub === 'lista' || sub === 'list') {
            const l = mine();
            return msg.reply(l.length ? `⏰ *Tus recordatorios*\n\n${l.map(r => `✦ \`${r.id}\` · ${new Date(r.at).toLocaleString('es')}\n   ${r.text.slice(0, 60)}`).join('\n')}\n\nCancelar: *${usedPrefix}${command} cancelar <id>*` : 'No tienes recordatorios pendientes.');
        }
        if (sub === 'cancelar' || sub === 'del') {
            const r = mine().find(x => x.id === String(args[1] || '').toLowerCase());
            if (!r)
                return msg.reply('《✧》 No encontré ese recordatorio. Mira tus ids con *' + usedPrefix + command + ' lista*.');
            list.splice(list.indexOf(r), 1);
            save();
            clearTimeout(timers.get(r.id));
            timers.delete(r.id);
            return msg.reply('⏰ Recordatorio cancelado.');
        }
        const ms = parseTime(args[0]), text = args.slice(1).join(' ').trim();
        if (!ms || !text)
            return msg.reply(`《✧》 Uso: *${usedPrefix}${command} <tiempo> <texto>*\nEjemplos: *${usedPrefix}${command} 30m sacar la basura* · *${usedPrefix}${command} 2h reunión* · *${usedPrefix}${command} 1d pagar la luz*\nTiempo: s, m, h, d (de 5 s a 7 días).`);
        if (ms < MIN || ms > MAX)
            return msg.reply('《✧》 El tiempo debe estar entre 5 segundos y 7 días.');
        if (mine().length >= PER_USER)
            return msg.reply(`《✧》 Ya tienes ${PER_USER} recordatorios pendientes. Cancela alguno primero.`);
        const r = { id: Math.random().toString(36).slice(2, 6), bot, chat: msg.chat, user: msg.sender, text: text.slice(0, 500), at: Date.now() + ms };
        list.push(r);
        save();
        arm(sock, r);
        return msg.reply(`⏰ Listo, te avisaré el *${new Date(r.at).toLocaleString('es')}*.\nId: \`${r.id}\``);
    }
};
