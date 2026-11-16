import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.resolve(__dirname, "../../database");
const FILE = path.join(DATA_DIR, "global-bans.json");
function ensureFile() {
    if (!fs.existsSync(DATA_DIR))
        fs.mkdirSync(DATA_DIR, { recursive: true });
    if (!fs.existsSync(FILE))
        fs.writeFileSync(FILE, "[]");
}
function normalizeJid(jid) {
    if (!jid)
        return null;
    let value = String(jid).trim();
    if (!value)
        return null;
    if (value.includes(":"))
        value = value.split(":")[0];
    if (value.includes("@"))
        return value;
    const number = value.replace(/\D/g, "");
    return number ? `${number}@s.whatsapp.net` : null;
}
function readBans() {
    ensureFile();
    try {
        const data = JSON.parse(fs.readFileSync(FILE, "utf8"));
        return Array.isArray(data) ? data : [];
    }
    catch {
        return [];
    }
}
function saveBans(data) {
    ensureFile();
    fs.writeFileSync(FILE, JSON.stringify(data, null, 2));
}
function phone(jid) {
    return String(jid || "").split("@")[0].replace(/\D/g, "");
}
export function isGloballyBanned(jid) {
    const normalized = normalizeJid(jid);
    if (!normalized)
        return false;
    const p = phone(normalized);
    return readBans().some(x => x?.jid === normalized || (p && x?.phone === p));
}
export function addGlobalBan(jid, info = {}) {
    const normalized = normalizeJid(jid);
    if (!normalized)
        return { success: false, reason: "invalid" };
    const p = phone(normalized);
    const bans = readBans();
    if (bans.some(x => x?.jid === normalized || (p && x?.phone === p))) {
        return { success: false, reason: "already_banned" };
    }
    bans.push({
        jid: normalized,
        phone: p,
        name: info.name || "Desconocido",
        bannedBy: info.bannedBy || null,
        date: new Date().toISOString()
    });
    saveBans(bans);
    return { success: true, jid: normalized };
}
export function removeGlobalBan(jid) {
    const normalized = normalizeJid(jid);
    if (!normalized)
        return { success: false, reason: "invalid" };
    const p = phone(normalized);
    const bans = readBans();
    const filtered = bans.filter(x => !(x?.jid === normalized || (p && x?.phone === p)));
    if (filtered.length === bans.length)
        return { success: false, reason: "not_banned" };
    saveBans(filtered);
    return { success: true, jid: normalized };
}
export function getGlobalBans() { return readBans(); }
export { normalizeJid };
