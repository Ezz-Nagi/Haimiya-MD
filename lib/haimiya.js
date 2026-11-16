import { config } from '../settings.js';
import { season, SEASON_LINES } from './system/theme.js';
export const OWNER_NUMBER = String(config.ownerNumber || '').replace(/\D/g, '');
export const OWNER_JID = OWNER_NUMBER ? `${OWNER_NUMBER}@s.whatsapp.net` : '';
export const OWNER_JID_TAIL = OWNER_NUMBER;
export function normalizeJid(jid = '') {
    return String(jid || '').replace(/:\d+(?=@)/, '').trim();
}
export function phoneOf(jid = '') {
    const value = normalizeJid(jid);
    return value.split('@')[0].replace(/\D/g, '');
}
export function ownerJid(value = '') {
    const raw = normalizeJid(value);
    if (!raw)
        return '';
    if (raw.includes('@'))
        return raw;
    const digits = raw.replace(/\D/g, '');
    return digits ? `${digits}@s.whatsapp.net` : '';
}
export function getBotSettingsId(sock) {
    const raw = normalizeJid(sock?.user?.id || sock?.user?.lid || '');
    if (!raw)
        return '';
    if (raw.endsWith('@s.whatsapp.net') || raw.endsWith('@lid'))
        return raw;
    const digits = raw.replace(/\D/g, '');
    return digits ? `${digits}@s.whatsapp.net` : raw;
}
export function isCreator(jid = '') {
    const s = String(jid || '');
    const digits = s.replace(/\D/g, '');
    if (digits && (global.owner || []).some(o => String(o).replace(/\D/g, '') === digits))
        return true;
    const phone = phoneOf(s) || digits;
    if (phone && phone === String(OWNER_NUMBER).replace(/\D/g, ''))
        return true;
    if (phone && (global.ownerWA || []).some(o => String(o).replace(/\D/g, '') === phone))
        return true;
    return false;
}
export function isCreatorWA(jid = '') {
    const phone = phoneOf(jid);
    if (!phone)
        return false;
    if (phone === String(OWNER_NUMBER).replace(/\D/g, ''))
        return true;
    return (global.ownerWA || []).some(o => String(o).replace(/\D/g, '') === phone);
}
export function isMainBot(sock) {
    if (sock?.isPrincipal === true)
        return true;
    const current = phoneOf(sock?.user?.id || sock?.user?.lid || '');
    const main = phoneOf(global?.sock?.user?.id || global?.sock?.user?.lid || '');
    return Boolean(current && main && current === main);
}
export function isPremiumBot(settings = {}) {
    return settings?.botprem === 1 || String(settings?.tier || '').toLowerCase() === 'premium' || String(settings?.type || '').toLowerCase() === 'premium';
}
export function formatUptime(ms = 0) {
    const total = Math.max(0, Math.floor(Number(ms) / 1000) || 0);
    const d = Math.floor(total / 86400);
    const h = Math.floor((total % 86400) / 3600);
    const m = Math.floor((total % 3600) / 60);
    const s = total % 60;
    return [d && `${d}d`, (d || h) && `${h}h`, (d || h || m) && `${m}m`, `${s}s`].filter(Boolean).join(' ');
}
export function isOwner(id = '', settings = {}) {
    if (isCreator(id))
        return true;
    const configured = []
        .concat(settings?.owner ?? [])
        .map(o => String(o).split('@')[0].replace(/\D/g, ''))
        .filter(Boolean);
    const me = String(id ?? '').split('@')[0].replace(/\D/g, '');
    return Boolean(me && configured.includes(me));
}
export function canManageBot(senderJid = '', botSettings = {}, sock = null) {
    if (isCreator(senderJid))
        return true;
    const configuredOwner = phoneOf(botSettings?.owner || '');
    return Boolean(configuredOwner && phoneOf(senderJid) === configuredOwner);
}
const pool = {
    error: [
        '🙄 Algo salió mal. Revisa eso.',
        '😑 No funcionó. Corrige los datos e inténtalo otra vez.',
        'Tsk... hubo un problema.'
    ],
    ownerError: [
        'Tsk, Ezz... algo salió mal. Dame un segundo.',
        '🙄 Ezz, eso falló. Ya veo qué pasó.'
    ],
    wait: [
        '⏳ Espera.',
        '😑 Un momento.'
    ],
    ownerWait: [
        'Tsk... espera un segundo, Ezz.',
        'Ya voy, Ezz. No te desesperes.'
    ],
    invalidArgs: [
        '😑 Falta un dato.',
        '🙄 Te falta un argumento.'
    ],
    ownerInvalidArgs: [
        'Tsk, Ezz. Falta un argumento.',
        'Ezz, revisa los datos que enviaste.'
    ],
    denied: [
        '😑 No tienes permiso.',
        '🙄 No puedes hacer eso.'
    ],
    ownerDenied: [
        'Tsk, Ezz... eso no debería bloquearte.',
        '🙄 Ezz, esa restricción está mal configurada.'
    ],
    greet: [
        '😑 ¿Qué quieres?',
        '🙄 Habla.'
    ],
    ownerGreet: [
        'Tsk, Ezz... ¿qué necesitas?',
        '🙄 ¿Otra vez tú? Dime qué hacemos.'
    ],
    success: [
        '😐 Listo.',
        'Hecho.'
    ],
    ownerSuccess: [
        'Tsk... listo, Ezz.',
        'Hecho. No pongas esa cara, Ezz.'
    ]
};
function pick(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
}
export function say(type, senderJid = '') {
    const ownerPool = pool[`owner${type.charAt(0).toUpperCase()}${type.slice(1)}`];
    if (isCreator(senderJid) && ownerPool)
        return pick(ownerPool);
    const seasonal = SEASON_LINES[season()]?.[type];
    if (seasonal && Math.random() < 0.5)
        return pick(seasonal);
    return pick(pool[type] || pool.error);
}
export default {
    formatUptime, isOwner, getBotSettingsId,
    OWNER_NUMBER,
    OWNER_JID,
    OWNER_JID_TAIL,
    normalizeJid,
    phoneOf,
    isCreator,
    isMainBot,
    isPremiumBot,
    canManageBot,
    say
};
