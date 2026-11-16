import fs from 'node:fs';
import path from 'node:path';
import { OWNER_JID, ownerJid } from '../haimiya.js';
const FILE = path.resolve(process.cwd(), 'database', 'command-maintenance.json');
const WINDOW = 10 * 60_000;
const COOLDOWN = 15 * 60_000;
const LIMIT = 5;
const failures = new Map();
let state = { paused: {} };
try {
    const data = JSON.parse(fs.readFileSync(FILE, 'utf8'));
    if (data && typeof data === 'object' && data.paused && typeof data.paused === 'object')
        state = data;
}
catch { }
function persist() {
    try {
        fs.mkdirSync(path.dirname(FILE), { recursive: true });
        const temp = `${FILE}.${process.pid}.tmp`;
        fs.writeFileSync(temp, JSON.stringify(state));
        fs.renameSync(temp, FILE);
    }
    catch (error) {
        console.error('[command-maintenance]', error?.message || error);
    }
}
function keyOf(botId, command) {
    return `${String(botId || 'global').toLowerCase()}:${String(command || '').toLowerCase()}`;
}
export function commandMaintenance(botId, command) {
    const key = keyOf(botId, command);
    const entry = state.paused[key];
    if (!entry)
        return null;
    if (entry.until && entry.until <= Date.now()) {
        delete state.paused[key];
        persist();
        return null;
    }
    return entry;
}
export function setCommandMaintenance(botId, command, on, reason = 'Mantenimiento manual', automatic = false) {
    const key = keyOf(botId, command);
    if (on)
        state.paused[key] = { command: String(command).toLowerCase(), reason: String(reason).slice(0, 240), automatic, since: Date.now(), until: automatic ? Date.now() + COOLDOWN : 0 };
    else
        delete state.paused[key];
    persist();
    return state.paused[key] || null;
}
export function listCommandMaintenance(botId) {
    const prefix = `${String(botId || 'global').toLowerCase()}:`;
    const now = Date.now();
    const result = [];
    for (const [key, value] of Object.entries(state.paused)) {
        if (!key.startsWith(prefix))
            continue;
        if (value.until && value.until <= now) {
            delete state.paused[key];
            continue;
        }
        result.push(value);
    }
    persist();
    return result;
}
export async function noteCommandFailure({ sock, command, botId, settings, error }) {
    const name = String(command || 'unknown').toLowerCase();
    const key = keyOf(botId, name);
    const now = Date.now();
    const recent = (failures.get(key) || []).filter(time => now - time <= WINDOW);
    recent.push(now);
    failures.set(key, recent);
    if (recent.length < LIMIT || commandMaintenance(botId, name))
        return false;
    setCommandMaintenance(botId, name, true, `Fallos repetidos: ${recent.length} en ${Math.round(WINDOW / 60000)} minutos`, true);
    const owner = ownerJid(settings?.owner || '');
    const targets = [...new Set([owner, OWNER_JID].filter(Boolean))];
    const text = `⚠️ *Haimiya-MD · mantenimiento automático*\n\nEl comando *${name}* quedó pausado tras ${recent.length} fallos en 10 minutos.\nMotivo: ${String(error?.message || error || 'Error repetido').slice(0, 180)}\nRevisión: ${new Date(now + COOLDOWN).toLocaleString('es-CO')}\n\nReactivar: #mantenimiento ${name} off`;
    for (const jid of targets) {
        try {
            await sock.sendMessage(jid, { text });
        }
        catch { }
    }
    return true;
}
export function noteCommandSuccess({ command, botId }) {
    failures.delete(keyOf(botId, command));
}
export default { commandMaintenance, setCommandMaintenance, listCommandMaintenance, noteCommandFailure, noteCommandSuccess };
