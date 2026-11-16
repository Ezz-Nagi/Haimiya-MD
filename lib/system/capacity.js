import fs from 'fs';
import path from 'path';
import db from './database.js';
const DIRS = ['Sessions/Subs'];
export function sessionPhones() {
    const phones = new Set();
    for (const dir of DIRS) {
        const base = path.resolve(process.cwd(), dir);
        if (!fs.existsSync(base))
            continue;
        for (const d of fs.readdirSync(base))
            if (fs.existsSync(path.join(base, d, 'creds.json')))
                phones.add(d.replace(/\D/g, ''));
    }
    phones.delete('');
    return [...phones];
}
export function isPremiumPhone(phone) {
    const s = db.getSettings(`${String(phone).replace(/\D/g, '')}@s.whatsapp.net`);
    return s?.botprem === 1 || String(s?.type || '').toLowerCase() === 'premium';
}
export function countTiers() {
    const phones = sessionPhones();
    const premium = phones.filter(isPremiumPhone).length;
    return { total: phones.length, premium, free: phones.length - premium };
}
export function canLink({ premium = false } = {}) {
    const cap = db.getCapacity();
    const tiers = countTiers();
    if (premium)
        return Number.isFinite(cap.premiumBots) && tiers.premium >= cap.premiumBots ? { ok: false, reason: 'premium_limit', tiers, cap } : { ok: true, tiers, cap };
    return tiers.free >= cap.freeSubBots ? { ok: false, reason: 'free_limit', tiers, cap } : { ok: true, tiers, cap };
}
export default { sessionPhones, isPremiumPhone, countTiers, canLink };
