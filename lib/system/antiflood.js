const buckets = new Map();
const strikes = new Map();
const WINDOWS = [10_000, 60_000, 600_000];
const HEAVY = /^(?:ai|chatgpt|gemini|claude|img|play|playprem|facebook|mediafire|twitter|ig|yt|youtube|download)$/i;
const now = () => Date.now();
function identity(input) {
    if (input && typeof input === 'object') {
        const user = String(input.user || 'unknown');
        const chat = String(input.chat || 'unknown');
        const bot = String(input.bot || 'unknown');
        const command = String(input.command || 'unknown').toLowerCase();
        return { user, chat, bot, command, keys: [`user:${user}`, `chat:${chat}`, `bot:${bot}:user:${user}`], strikeKey: `${bot}:${user}` };
    }
    const raw = String(input || 'unknown');
    return { user: raw, chat: raw, bot: 'legacy', command: '', keys: [`legacy:${raw}`], strikeKey: `legacy:${raw}` };
}
function getBucket(key, windowMs, t) {
    const mapKey = `${key}|${windowMs}`;
    let entry = buckets.get(mapKey);
    if (!entry || t >= entry.until) {
        entry = { count: 0, until: t + windowMs, blockedUntil: 0 };
        buckets.set(mapKey, entry);
    }
    return entry;
}
export function checkFlood(input, options = {}) {
    const t = now();
    const id = identity(input);
    const heavy = options.heavy ?? HEAVY.test(id.command);
    const weight = Math.max(1, Math.min(10, Number(options.weight) || (heavy ? 3 : 1)));
    const legacy = Number.isFinite(options.max) || Number.isFinite(options.windowMs);
    const windows = legacy
        ? [{ ms: Math.max(1000, Number(options.windowMs) || WINDOWS[0]), max: Math.max(1, Number(options.max) || 12) }]
        : [
            { ms: WINDOWS[0], max: heavy ? 5 : 16 },
            { ms: WINDOWS[1], max: heavy ? 18 : 55 },
            { ms: WINDOWS[2], max: heavy ? 70 : 180 }
        ];
    if (Number.isFinite(options.maxShort))
        windows[0].max = options.maxShort;
    if (Number.isFinite(options.maxMedium) && windows[1])
        windows[1].max = options.maxMedium;
    if (Number.isFinite(options.maxLong) && windows[2])
        windows[2].max = options.maxLong;
    if (Array.isArray(options.windows)) {
        for (let i = 0; i < Math.min(3, options.windows.length); i++) {
            const w = options.windows[i];
            if (w && Number.isFinite(w.ms) && Number.isFinite(w.max))
                windows[i] = { ms: Math.max(1000, w.ms), max: Math.max(1, w.max) };
        }
    }
    const entries = [];
    for (const key of id.keys)
        for (const w of windows)
            entries.push({ key, w, entry: getBucket(key, w.ms, t) });
    const blocked = entries.find(x => x.entry.blockedUntil > t);
    if (blocked)
        return { ok: false, level: 'hard', retryIn: blocked.entry.blockedUntil - t, reason: 'blocked' };
    for (const x of entries)
        x.entry.count += weight;
    const exceeded = entries.find(x => x.entry.count > x.w.max);
    if (!exceeded) {
        const near = entries.some(x => x.entry.count >= x.w.max * 0.8);
        return { ok: true, ...(near ? { level: 'soft' } : {}) };
    }
    const old = strikes.get(id.strikeKey);
    const strike = old && t - old.lastAt < 24 * 60 * 60_000 ? old.count + 1 : 1;
    const duration = Math.min(30_000 * (2 ** Math.min(strike - 1, 6)), 30 * 60_000);
    strikes.set(id.strikeKey, { count: strike, lastAt: t, blockedUntil: t + duration });
    for (const x of entries)
        x.entry.blockedUntil = Math.max(x.entry.blockedUntil, t + duration);
    return { ok: false, level: strike >= 4 ? 'ban' : 'hard', retryIn: duration, reason: 'rate_limit' };
}
const cleanup = setInterval(() => {
    const t = now();
    for (const [key, entry] of buckets)
        if (entry.until < t && entry.blockedUntil < t)
            buckets.delete(key);
    for (const [key, entry] of strikes)
        if (entry.lastAt + 24 * 60 * 60_000 < t)
            strikes.delete(key);
    if (buckets.size > 50_000) {
        const excess = buckets.size - 40_000;
        let n = 0;
        for (const key of buckets.keys()) {
            buckets.delete(key);
            if (++n >= excess)
                break;
        }
    }
}, 90_000);
cleanup.unref?.();
export function getFloodStats() { return { buckets: buckets.size, users: strikes.size }; }
