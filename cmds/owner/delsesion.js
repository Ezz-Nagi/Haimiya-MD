import db from '#db';
import { getBotSettingsId, isCreator, normalizeJid, ownerJid, phoneOf } from '../../lib/haimiya.js';
import { panel, error, success } from '../../lib/system/ui.js';
const units = { m: 60_000, min: 60_000, h: 3_600_000, d: 86_400_000, w: 604_800_000 };
function parseDuration(value) {
    const input = String(value || '').toLowerCase().replace(/\s+/g, '');
    if (!input)
        return 0;
    const parts = [...input.matchAll(/(\d+)(min|[mhdw])/g)];
    if (!parts.length || parts.map(match => match[0]).join('') !== input)
        return 0;
    const total = parts.reduce((sum, match) => sum + Number(match[1]) * units[match[2]], 0);
    return Number.isSafeInteger(total) && total >= 60_000 && total <= 365 * 86_400_000 ? total : 0;
}
function durationLabel(ms) {
    const unitsOut = [['d', 86_400_000], ['h', 3_600_000], ['m', 60_000]];
    let rest = ms;
    const parts = [];
    for (const [label, size] of unitsOut) {
        const amount = Math.floor(rest / size);
        if (amount)
            parts.push(`${amount}${label}`);
        rest %= size;
    }
    return parts.join(' ') || '1m';
}
export default {
    command: ['delsesion'],
    aliases: ['suspender', 'bloqueartemporal'],
    desc: 'Suspende el acceso de un usuario al bot durante un periodo definido.',
    usage: 'delsesion @usuario <30m|2h|7d> [motivo]',
    category: 'owner',
    isAdmin: false,
    botAdmin: false,
    isOwner: true,
    hidden: false,
    run: async ({ msg, sock, args, usedPrefix, command, participants }) => {
        const botId = getBotSettingsId(sock);
        const settings = db.getSettings(botId);
        const owner = ownerJid(settings.owner || '');
        if (!isCreator(msg.sender) && normalizeJid(msg.sender) !== owner)
            return msg.reply(error('Permiso insuficiente', ['Solo el owner o el developer puede suspender el acceso al bot.']));
        const rawTarget = normalizeJid(msg.mentionedJid?.[0] || msg.quoted?.sender || '');
        const participant = participants?.find(entry => [entry?.id, entry?.lid, entry?.phoneNumber].some(value => normalizeJid(value || '') === rawTarget));
        const target = ownerJid(participant?.phoneNumber || rawTarget) || rawTarget;
        const duration = parseDuration(args.find(value => /\d/.test(String(value)) && /[mhdw]/i.test(String(value))));
        if (!target || !duration)
            return msg.reply(panel('Suspender acceso', [`Uso: \`${usedPrefix}${command} @usuario <tiempo> [motivo]\``, `Ejemplo: \`${usedPrefix}${command} @usuario 2h spam\``, 'Tiempo permitido: minutos, horas, días o semanas (máximo 365 días).'], { icon: '⛔' }));
        if (phoneOf(target) === phoneOf(msg.sender) || phoneOf(target) === phoneOf(owner) || phoneOf(target) === phoneOf(sock.user?.id || ''))
            return msg.reply(error('Acción no permitida', ['No puedes suspender tu propia cuenta, al owner ni al bot.']));
        const timeArg = args.findIndex(value => parseDuration(value) > 0);
        const reason = timeArg >= 0 ? args.slice(timeArg + 1).join(' ').trim() : '';
        const entry = db.setSuspension(botId, target, duration, reason);
        const label = durationLabel(duration);
        const notice = `⛔ Tu acceso a *Haimiya mío* ha sido suspendido temporalmente.\nDuración: *${label}*\nHasta: *${new Date(entry.until).toLocaleString('es-CO')}*\nMotivo: ${reason || 'Incumplimiento de las normas de uso.'}`;
        try {
            await sock.sendMessage(target, { text: notice });
        }
        catch { }
        return msg.reply(success('Acceso suspendido', [`• *Usuario:* @${target.split('@')[0]}`, `• *Duración:* ${label}`, `• *Vence:* ${new Date(entry.until).toLocaleString('es-CO')}`, 'La suspensión afecta únicamente el acceso a Haimiya; no elimina la cuenta ni la sesión de WhatsApp.']), { mentions: [target] });
    }
};
