import fs from 'fs';
import path from 'path';
import { OWNER_NUMBER } from '../haimiya.js';
const FILE = path.join(process.cwd(), 'database', 'promos.json');
const WEEK = 7 * 24 * 3600 * 1000;
const DAY = 24 * 3600 * 1000;
const DEV_NUMBERS = new Set([OWNER_NUMBER]);
let __cache = null;
let __cacheAt = 0;
function load() {
    try {
        if (__cache && Date.now() - __cacheAt < 2000)
            return __cache;
        if (!fs.existsSync(FILE)) {
            __cache = { pending: [], active: [], history: [], notifications: [] };
            __cacheAt = Date.now();
            try {
                fs.mkdirSync(path.dirname(FILE), { recursive: true });
                fs.writeFileSync(FILE, JSON.stringify(__cache, null, 2));
            }
            catch { }
            return __cache;
        }
        const raw = fs.readFileSync(FILE, 'utf8');
        const d = JSON.parse(raw);
        __cache = {
            pending: Array.isArray(d.pending) ? d.pending : [],
            active: Array.isArray(d.active) ? d.active : [],
            history: Array.isArray(d.history) ? d.history : [],
            notifications: Array.isArray(d.notifications) ? d.notifications : []
        };
        __cacheAt = Date.now();
        return __cache;
    }
    catch {
        __cache = { pending: [], active: [], history: [], notifications: [] };
        __cacheAt = Date.now();
        return __cache;
    }
}
export function warmPromos() {
    load();
    return true;
}
function save(d) {
    try {
        fs.mkdirSync(path.dirname(FILE), { recursive: true });
        fs.writeFileSync(FILE, JSON.stringify(d, null, 2));
        __cache = d;
        __cacheAt = Date.now();
    }
    catch (e) {
        console.error('[promos save]', e?.message || e);
    }
}
function onlyDigits(s) {
    return String(s || '').replace(/\D/g, '');
}
export function isDeveloperId(userId) {
    const d = onlyDigits(userId);
    return DEV_NUMBERS.has(d) || d.endsWith(OWNER_NUMBER);
}
export function listNotifications(userId) {
    const d = load();
    return (d.notifications || [])
        .filter(n => !userId || n.userId === userId || n.userId === 'all' || n.userId === 'dev')
        .slice(-80);
}
export function pushNotification(n) {
    const d = load();
    d.notifications = d.notifications || [];
    d.notifications.push({
        id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
        at: Date.now(),
        read: false,
        ...n
    });
    if (d.notifications.length > 300)
        d.notifications = d.notifications.slice(-300);
    save(d);
}
export function markNotificationsRead(userId) {
    const d = load();
    for (const n of d.notifications || []) {
        if (!userId || n.userId === userId || n.userId === 'all')
            n.read = true;
    }
    save(d);
}
function countThisWeek(d, userId) {
    const uid = String(userId);
    const since = Date.now() - WEEK;
    return [...(d.history || []), ...(d.active || []), ...(d.pending || [])]
        .filter(p => String(p.userId) === uid && (p.at || 0) >= since)
        .length;
}
export function requestPromo({ userId, title, link, type = 'group', premium = false, phone = '', description = '', members = 0 }) {
    const d = load();
    if (!title || !link || !/^https?:\/\//i.test(link)) {
        return { ok: false, error: 'Título y link https válidos requeridos.' };
    }
    const dev = isDeveloperId(userId);
    const limit = dev ? Infinity : (premium ? 10 : 1);
    const used = countThisWeek(d, userId);
    if (used >= limit) {
        return {
            ok: false,
            error: premium
                ? `Límite premium: 10 promociones por semana (llevas ${used}).`
                : 'Solo 1 promoción por semana en plan gratis. Pasa a Premium para hasta 10.'
        };
    }
    const item = {
        id: 'p' + Date.now().toString(36),
        userId: String(userId || 'anon'),
        title: String(title).slice(0, 80),
        link: String(link).slice(0, 300),
        type: type || 'group',
        at: Date.now(),
        status: 'pending',
        clicks: 0,
        premium: !!premium,
        phone: String(phone || '').replace(/\D/g, '').slice(0, 15),
        description: String(description || '').slice(0, 300),
        members: Number(members) || 0
    };
    if (dev) {
        item.status = 'active';
        item.approvedBy = 'auto-dev';
        item.starts = Date.now();
        item.ends = Date.now() + DAY;
        d.active.push(item);
        d.history.push({ ...item });
        pushNotification({ userId: 'all', type: 'promo_live', text: `Nueva promo: ${item.title}` });
        save(d);
        return { ok: true, item, auto: true };
    }
    d.pending.push(item);
    pushNotification({ userId: 'dev', type: 'promo_pending', text: `Nueva promo pendiente: ${item.title}`, promoId: item.id });
    save(d);
    return { ok: true, item, auto: false };
}
export function approvePromo(id, developerId = 'dev') {
    const d = load();
    const i = d.pending.findIndex(p => p.id === id);
    if (i < 0)
        return { ok: false, error: 'No encontrada en pendientes' };
    const item = d.pending.splice(i, 1)[0];
    item.status = 'active';
    item.approvedBy = developerId;
    item.starts = Date.now();
    item.ends = Date.now() + DAY;
    item.clicks = item.clicks || 0;
    d.active.push(item);
    d.history.push({ ...item });
    pushNotification({ userId: item.userId, type: 'promo_approved', text: `Tu promoción "${item.title}" fue aprobada (24h).` });
    save(d);
    return { ok: true, item };
}
export function rejectPromo(id) {
    const d = load();
    const i = d.pending.findIndex(p => p.id === id);
    if (i < 0)
        return { ok: false, error: 'No encontrada' };
    const item = d.pending.splice(i, 1)[0];
    item.status = 'rejected';
    d.history.push(item);
    pushNotification({ userId: item.userId, type: 'promo_rejected', text: `Tu promoción "${item.title}" fue rechazada.` });
    save(d);
    return { ok: true };
}
export function getActivePromos() {
    const d = load();
    const now = Date.now();
    const active = (d.active || []).filter(p => p.ends > now);
    return active.sort((a, b) => (b.clicks || 0) - (a.clicks || 0));
}
export function getPendingPromos() {
    return load().pending || [];
}
export function trackClick(id) {
    const d = load();
    const p = (d.active || []).find(x => x.id === id);
    if (!p)
        return { ok: false };
    p.clicks = (p.clicks || 0) + 1;
    save(d);
    return { ok: true, clicks: p.clicks, link: p.link };
}
export function topPromos(limit = 20) {
    const d = load();
    const now = Date.now();
    const active = (d.active || []).filter(p => p.ends > now);
    const past = (d.history || []).filter(p => p.status === 'active' || p.clicks);
    const map = new Map();
    for (const p of [...active, ...past]) {
        const prev = map.get(p.id);
        if (!prev || (p.clicks || 0) > (prev.clicks || 0))
            map.set(p.id, p);
    }
    return [...map.values()].sort((a, b) => (b.clicks || 0) - (a.clicks || 0)).slice(0, limit);
}
export function deletePromo(id) {
    const d = load();
    let found = false;
    d.active = (d.active || []).filter(p => {
        if (p.id === id) {
            found = true;
            return false;
        }
        return true;
    });
    d.pending = (d.pending || []).filter(p => {
        if (p.id === id) {
            found = true;
            return false;
        }
        return true;
    });
    if (found) {
        d.history = d.history || [];
        d.history.push({ id, status: 'deleted', at: Date.now() });
        save(d);
    }
    return { ok: found };
}
