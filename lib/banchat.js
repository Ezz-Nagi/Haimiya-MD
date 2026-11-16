global.banchatSettingsCache = global.banchatSettingsCache instanceof Map ? global.banchatSettingsCache : new Map();
import db from './system/database.js';
async function loadFromDB(phone) {
    try {
        const s = (await db.getSettings(phone + '@s.whatsapp.net')) || {};
        const data = {
            banchat_on: !!s.banchat_on,
            banchat_allowed: Array.isArray(s.banchat_allowed) ? s.banchat_allowed : []
        };
        global.banchatSettingsCache.set(phone, data);
        return data;
    }
    catch (e) {
        console.error('[banchat load]', e.message);
        return { banchat_on: false, banchat_allowed: [] };
    }
}
export async function refreshCache(phone) {
    global.banchatSettingsCache.delete(phone);
    return await loadFromDB(phone);
}
export async function isAllowedForSubbotAsync(phone, chatJid) {
    if (!phone)
        return true;
    if (!String(chatJid || '').endsWith('@g.us'))
        return true;
    let s = global.banchatSettingsCache.get(phone);
    if (!s)
        s = await loadFromDB(phone);
    if (!s.banchat_on)
        return true;
    return s.banchat_allowed.includes(chatJid);
}
export function isAllowedForSubbot(phone, chatJid) {
    if (!phone)
        return true;
    if (!String(chatJid || '').endsWith('@g.us'))
        return true;
    const s = global.banchatSettingsCache.get(phone);
    if (!s)
        return true;
    if (!s.banchat_on)
        return true;
    return s.banchat_allowed.includes(chatJid);
}
