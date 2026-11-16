import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { OWNER_JID } from "../haimiya.js";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const databaseDir = path.resolve(__dirname, "../../database");
const staffFile = path.join(databaseDir, "staff.json");
const DEVELOPER_JID = OWNER_JID;
export const PERMS = {
    moderacion: "Banear/desbanear usuarios globales (#betar, #unbetar, #banlist) y chats (#banchat)",
    economia: "Dar o quitar coins, exp y niveles (#addcoins, #delcoins, #addexp, #delexp, #addlvl, #dellvl)",
    broadcast: "Enviar anuncios masivos (#broadcast)",
    grupos: "Ver y salir de grupos del bot (#grupos, #exitgrupo)",
    bots: "Gestionar subbots (#bots, #reloadsub, #bloquearcmd, #mantenimiento)",
    premium: "Gestionar el plan Premium de los subbots"
};
export const ROLE_PRESETS = {
    developer: Object.keys(PERMS),
    admin: ["moderacion", "economia", "broadcast", "grupos", "bots", "premium"],
    moderador: ["moderacion", "grupos"],
    soporte: ["bots", "premium"],
    helper: ["moderacion"]
};
const DEFAULT_STAFF = DEVELOPER_JID ? [{ jid: DEVELOPER_JID, role: 'Developer', perms: Object.keys(PERMS) }] : [];
function ensureDatabase() {
    if (!fs.existsSync(databaseDir)) {
        fs.mkdirSync(databaseDir, {
            recursive: true
        });
    }
    if (!fs.existsSync(staffFile)) {
        fs.writeFileSync(staffFile, JSON.stringify(DEFAULT_STAFF, null, 2), "utf8");
    }
}
function readStaff() {
    ensureDatabase();
    try {
        const data = fs.readFileSync(staffFile, "utf8");
        const staff = JSON.parse(data);
        if (!Array.isArray(staff)) {
            fs.writeFileSync(staffFile, JSON.stringify(DEFAULT_STAFF, null, 2), "utf8");
            return [...DEFAULT_STAFF];
        }
        return staff;
    }
    catch {
        fs.writeFileSync(staffFile, JSON.stringify(DEFAULT_STAFF, null, 2), "utf8");
        return [...DEFAULT_STAFF];
    }
}
function saveStaff(staff) {
    ensureDatabase();
    fs.writeFileSync(staffFile, JSON.stringify(staff, null, 2), "utf8");
    return staff;
}
function normalizeJid(jid) {
    if (!jid)
        return null;
    return String(jid)
        .trim()
        .replace(/:\d+(?=@)/, "")
        .replace(/@c\.us$/, "@s.whatsapp.net");
}
function presetFor(role) {
    return ROLE_PRESETS[String(role || "").trim().toLowerCase()] || null;
}
function presetLabel(role) {
    const r = String(role).trim().toLowerCase();
    return r.charAt(0).toUpperCase() + r.slice(1);
}
function isDeveloperJid(jid) {
    const phone = String(jid || "").split("@")[0].split(":")[0].replace(/\D/g, "");
    if (!phone)
        return false;
    if (phone === DEVELOPER_JID.split("@")[0])
        return true;
    return (global.ownerWA || []).some(o => String(o).replace(/\D/g, "") === phone);
}
export function getPerms(jid) {
    if (isDeveloperJid(jid))
        return Object.keys(PERMS);
    const member = getStaffMember(jid);
    return member && Array.isArray(member.perms) ? [...member.perms] : [];
}
export function hasPerm(jid, perm) {
    if (!perm)
        return false;
    return getPerms(jid).includes(perm);
}
export function grantPerms(jid, perms = []) {
    const normalized = normalizeJid(jid);
    const staff = readStaff();
    const member = staff.find(m => normalizeJid(m.jid) === normalized);
    if (!member)
        return { success: false, error: "Este usuario no pertenece al staff." };
    if (normalized === DEVELOPER_JID)
        return { success: false, error: "El Developer ya tiene todos los permisos." };
    const invalid = perms.filter(p => !PERMS[p]);
    if (invalid.length)
        return { success: false, error: `Permiso desconocido: ${invalid.join(", ")}` };
    member.perms = [...new Set([...(member.perms || []), ...perms])];
    saveStaff(staff);
    return { success: true, member };
}
export function revokePerms(jid, perms = []) {
    const normalized = normalizeJid(jid);
    const staff = readStaff();
    const member = staff.find(m => normalizeJid(m.jid) === normalized);
    if (!member)
        return { success: false, error: "Este usuario no pertenece al staff." };
    if (normalized === DEVELOPER_JID)
        return { success: false, error: "No se pueden quitar permisos al Developer." };
    const all = perms.includes("all") || perms.includes("todos");
    member.perms = all ? [] : (member.perms || []).filter(p => !perms.includes(p));
    saveStaff(staff);
    return { success: true, member };
}
export function getStaff() {
    return readStaff();
}
export function addStaff(jid, role) {
    const normalized = normalizeJid(jid);
    if (!normalized) {
        return {
            success: false,
            error: "JID inválido."
        };
    }
    const staff = readStaff();
    const exists = staff.find(member => normalizeJid(member.jid) === normalized);
    if (exists) {
        return {
            success: false,
            error: "Este usuario ya pertenece al staff."
        };
    }
    const roleName = String(role || "Staff").trim() || "Staff";
    const preset = presetFor(roleName);
    const member = {
        jid: normalized,
        role: preset ? presetLabel(roleName) : roleName,
        perms: preset ? [...preset] : []
    };
    staff.push(member);
    saveStaff(staff);
    return {
        success: true,
        member
    };
}
export function removeStaff(jid) {
    const normalized = normalizeJid(jid);
    const staff = readStaff();
    const index = staff.findIndex(member => normalizeJid(member.jid) === normalized);
    if (index === -1) {
        return {
            success: false,
            error: "Este usuario no pertenece al staff."
        };
    }
    if (normalized === DEVELOPER_JID) {
        return {
            success: false,
            error: "El Developer principal no puede ser eliminado."
        };
    }
    const removed = staff.splice(index, 1)[0];
    saveStaff(staff);
    return {
        success: true,
        member: removed
    };
}
export function setStaffRole(jid, role) {
    const normalized = normalizeJid(jid);
    const newRole = String(role || "").trim();
    if (!newRole) {
        return {
            success: false,
            error: "Debes especificar un nuevo cargo."
        };
    }
    const staff = readStaff();
    const member = staff.find(item => normalizeJid(item.jid) === normalized);
    if (!member) {
        return {
            success: false,
            error: "Este usuario no pertenece al staff."
        };
    }
    if (normalized === DEVELOPER_JID) {
        member.role = "Developer";
    }
    else {
        const preset = presetFor(newRole);
        member.role = preset ? presetLabel(newRole) : newRole;
        if (preset)
            member.perms = [...preset];
    }
    saveStaff(staff);
    return {
        success: true,
        member
    };
}
export function getStaffMember(jid) {
    const normalized = normalizeJid(jid);
    const staff = readStaff();
    return staff.find(member => normalizeJid(member.jid) === normalized) || null;
}
export function isStaff(jid) {
    return Boolean(getStaffMember(jid));
}
export function resetStaff() {
    saveStaff([...DEFAULT_STAFF]);
    return [...DEFAULT_STAFF];
}
export function staffFileExists() {
    return fs.existsSync(staffFile);
}
export function getStaffFile() {
    return staffFile;
}
export { normalizeJid };
