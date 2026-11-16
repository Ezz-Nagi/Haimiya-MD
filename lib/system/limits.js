import { isPremiumBot } from '../haimiya.js';
const DEFAULTS = {
    daily: { youtube: 50, instagram: 50 },
    premiumOnly: ['deepseek', 'claude', 'gemini', 'program', 'img'],
    commandQuota: { play: 'youtube', instagram: 'instagram' },
    labels: { youtube: 'Descargas de YouTube', instagram: 'Descargas de Instagram' }
};
export const cfg = () => ({ ...DEFAULTS, ...(global.subLimits || {}) });
export const utcDay = () => new Date().toISOString().slice(0, 10);
export const nextResetISO = () => { const d = new Date(); d.setUTCHours(24, 0, 0, 0); return d.toISOString(); };
export const planOf = (settings, isMain) => isMain ? 'main' : (isPremiumBot(settings || {}) ? 'premium' : 'sub');
function counts(settings) {
    const q = settings?.quota;
    return q && q.day === utcDay() ? q : { day: utcDay() };
}
export function check({ command, settings, isMain }) {
    const plan = planOf(settings, isMain);
    if (plan !== 'sub')
        return { ok: true, plan };
    const c = cfg(), name = String(command || '').toLowerCase();
    if (c.premiumOnly.includes(name))
        return { ok: false, reason: 'premium_only', plan };
    const key = c.commandQuota[name];
    if (key && Number.isFinite(c.daily[key])) {
        const used = counts(settings)[key] || 0;
        if (used >= c.daily[key])
            return { ok: false, reason: 'quota', plan, key, used, limit: c.daily[key] };
        return { ok: true, plan, key };
    }
    return { ok: true, plan };
}
export async function consume(db, botJid, key, settings) {
    const q = { ...counts(settings) };
    q[key] = (q[key] || 0) + 1;
    await db.updateSettings(botJid, 'quota', q);
    if (settings)
        settings.quota = q;
}
export function snapshot(settings, isMain = false) {
    const plan = planOf(settings, isMain), c = cfg(), used = counts(settings);
    const items = Object.keys(c.daily).map(key => {
        const limit = plan === 'sub' ? c.daily[key] : null, u = used[key] || 0;
        return { key, label: c.labels[key] || key, used: u, limit, remaining: limit === null ? null : Math.max(0, limit - u) };
    });
    return { plan, items, premiumOnly: c.premiumOnly, resetsAt: nextResetISO() };
}
