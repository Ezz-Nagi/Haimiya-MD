import fs from 'fs';
import path from 'path';
const FILE = path.resolve(process.cwd(), 'database', 'runtime.json');
const PROTECTED = new Set(['bloquearcmd', 'desbloquearcmd', 'mantenimiento', 'mantemiento', 'restart', 'menu', 'help', 'allmenu', 'perms', 'roles']);
let state = { maintenance: { on: false, message: '' }, blocked: [] };
try {
    const d = JSON.parse(fs.readFileSync(FILE, 'utf8'));
    state.maintenance = { on: !!d?.maintenance?.on, message: String(d?.maintenance?.message || '') };
    state.blocked = Array.isArray(d?.blocked) ? d.blocked.map(x => String(x).toLowerCase()) : [];
}
catch { }
function save() {
    try {
        fs.mkdirSync(path.dirname(FILE), { recursive: true });
        fs.writeFileSync(FILE + '.tmp', JSON.stringify(state, null, 2));
        fs.renameSync(FILE + '.tmp', FILE);
    }
    catch (e) {
        console.error('[runtime] no se pudo guardar:', e?.message || e);
    }
}
export const isMaintenance = () => state.maintenance.on;
export const maintenanceMessage = () => state.maintenance.message;
export function setMaintenance(on, message = '') {
    state.maintenance = { on: !!on, message: String(message || '').slice(0, 300) };
    save();
    return state.maintenance;
}
export const isBlocked = name => state.blocked.includes(String(name || '').toLowerCase());
export const listBlocked = () => [...state.blocked];
export function blockCmd(name) {
    const n = String(name || '').toLowerCase().trim();
    if (!n)
        return { success: false, error: 'Indica el comando.' };
    if (PROTECTED.has(n))
        return { success: false, error: 'Ese comando no se puede bloquear.' };
    if (state.blocked.includes(n))
        return { success: false, error: 'Ya estaba bloqueado.' };
    state.blocked.push(n);
    save();
    return { success: true };
}
export function unblockCmd(name) {
    const n = String(name || '').toLowerCase().trim();
    if (!state.blocked.includes(n))
        return { success: false, error: 'Ese comando no estaba bloqueado.' };
    state.blocked = state.blocked.filter(x => x !== n);
    save();
    return { success: true };
}
