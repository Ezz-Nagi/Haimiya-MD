import fs from 'fs';
import path from 'path';
import { OWNER_JID } from '../haimiya.js';
const DB_DIR = path.join(process.cwd(), 'database', 'whatsapp');
const DB_PATH = path.join(DB_DIR, 'database.json');
const LEGACY_DB_PATH = path.join(process.cwd(), 'database', 'whatsapp', 'legacy-database.json');
const BACKUP_PATH = path.join(DB_DIR, 'database.backup.json');
const TEMP_PATH = path.join(DB_DIR, 'database.json.tmp');
let database = {
    users: {}, chats: {}, chat_users: {}, settings: {}, sticker_packs: {}, premium_codes: {},
    expansion_codes: {}, principal_codes: {}, capacity: {}, user_suspensions: {}
};
const clone = (value) => {
    if (Array.isArray(value))
        return value.map(clone);
    if (value && typeof value === 'object')
        return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, clone(v)]));
    return value;
};
const withDefaults = (defaults, value = {}, id) => ({ ...clone(defaults), ...(value && typeof value === 'object' ? value : {}), id });
export const defUser = {
    name: '', exp: 0, sugCooldown: 0, level: 0, Subs: 0, subBots: 0, premiumBots: 0,
    usedcommands: 0, pasatiempo: '', description: '', marry: '', children: [], parents: [],
    genre: '', birth: '', metadatos: null, metadatos2: null
};
export const defChat = {
    bannedGrupo: 0, welcomeMessage: '', byeMessage: '', welcome: 0, goodbye: 0, alerts: 0, rpg: 1, gacha: 1, adminonly: 0, expulsar: 0, warnLimit: 0, primaryBot: null, antispam: 0, antidelete: 0, antifake: 0, antibots: 0,
    antilinks: 1, antistatus: 0, personajesReservados: [], intercambios: [], timeTrade: 0,
    scheduledActions: [], groupOpenStatus: 0, autoAdmin: 0, autoAdminUsers: [], antiPrivate: 0,
    stickerCmds: {}, mutedUsers: [], joinRequestNotify: 1
};
const CHAT_USER_NUMERIC_FIELDS = new Set(['coins', 'bank', 'lastdungeon', 'lasthunt', 'lastfish', 'dailyStreak', 'crimeCooldown', 'mineCooldown', 'ritualCooldown', 'workCooldown', 'rtCooldown', 'slutCooldown', 'roboCooldown', 'pptCooldown', 'lastDaily', 'lastGachaRoll', 'usedTime']);
export const defChatUser = {
    coins: 0, bank: 0, lastdungeon: 0, lasthunt: 0, lastfish: 0, dailyStreak: 0,
    crimeCooldown: 0, mineCooldown: 0, ritualCooldown: 0, workCooldown: 0, rtCooldown: 0,
    slutCooldown: 0, roboCooldown: 0, pptCooldown: 0, lastDaily: 0, lastGachaRoll: 0,
    pendingGacha: null, characters: [], stats: {}, usedTime: null, warnings: []
};
export const defSets = {
    self: 0, prefijo: ['/', '#', '.'], commandsejecut: 0, type: 'Owner', link: 'https://haimiya.hidenplay.net',
    banner: 'https://magazine.jp.square-enix.com/top/shoei/9784301008668.jpg?t=20261102120701', bannerCustom: false,
    fotoglobal: 'https://magazine.jp.square-enix.com/top/shoei/9784301008668.jpg?t=20261102120701',
    currency: 'moras', namebot: 'Haimiya mío', namebot2: 'Haimiya mío', owner: '', ownerConfigured: false,
    tier: 'owner', botprem: 0, botmod: 0, maxSubBots: 2, maxPremiumBots: 5, autoAdmin: 0, autoAdminUsers: [], ausencia: 0
};
export const defStickerPack = { packs: [] };
function normalizeRoot(data) {
    const result = { ...database, ...(data && typeof data === 'object' ? data : {}) };
    for (const key of ['users', 'chats', 'chat_users', 'settings', 'sticker_packs', 'premium_codes', 'expansion_codes', 'principal_codes', 'capacity', 'user_suspensions']) {
        if (!result[key] || typeof result[key] !== 'object' || Array.isArray(result[key]))
            result[key] = {};
    }
    return result;
}
function backupCorruptFile() {
    try {
        if (fs.existsSync(DB_PATH))
            fs.copyFileSync(DB_PATH, `${BACKUP_PATH}.${Date.now()}`);
    }
    catch { }
}
function loadDatabase() {
    fs.mkdirSync(DB_DIR, { recursive: true });
    if (!fs.existsSync(DB_PATH) && fs.existsSync(LEGACY_DB_PATH)) {
        try {
            fs.copyFileSync(LEGACY_DB_PATH, DB_PATH);
        }
        catch { }
    }
    if (!fs.existsSync(DB_PATH))
        return normalizeRoot({});
    try {
        return normalizeRoot(JSON.parse(fs.readFileSync(DB_PATH, 'utf8')));
    }
    catch (error) {
        backupCorruptFile();
        console.error(`[Haimiya DB] database.json corrupto; se creó una base nueva. ${error.message}`);
        return normalizeRoot({});
    }
}
database = loadDatabase();
let saveTimer = null;
let dirty = false;
function writeNow() {
    fs.mkdirSync(DB_DIR, { recursive: true });
    const payload = JSON.stringify(database);
    const fd = fs.openSync(TEMP_PATH, 'w');
    try {
        fs.writeFileSync(fd, payload, 'utf8');
        fs.fsyncSync(fd);
    }
    finally {
        fs.closeSync(fd);
    }
    fs.renameSync(TEMP_PATH, DB_PATH);
    try {
        const dirFd = fs.openSync(DB_DIR, 'r');
        try {
            fs.fsyncSync(dirFd);
        }
        finally {
            fs.closeSync(dirFd);
        }
    }
    catch { }
    dirty = false;
}
function saveDatabase() {
    dirty = true;
    if (saveTimer)
        return;
    saveTimer = setTimeout(() => {
        saveTimer = null;
        try {
            writeNow();
        }
        catch (error) {
            console.error(`[Haimiya DB] No se pudo guardar: ${error.message}`);
        }
    }, 400);
    saveTimer.unref?.();
}
export function flushDatabase() {
    if (saveTimer) {
        clearTimeout(saveTimer);
        saveTimer = null;
    }
    if (dirty)
        writeNow();
    return true;
}
process.on('exit', () => {
    try {
        flushDatabase();
    }
    catch (error) {
        console.error(`[Haimiya DB] ${error.message}`);
    }
});
for (const signal of ['SIGINT', 'SIGTERM'])
    process.once(signal, () => {
        if (global.gracefulShutdown)
            return;
        try {
            flushDatabase();
        }
        catch (error) {
            console.error(`[Haimiya DB] ${error.message}`);
        }
        process.exit(0);
    });
function ensureObject(target, defaults, id) {
    const value = target[id];
    if (!value || typeof value !== 'object' || Array.isArray(value))
        target[id] = withDefaults(defaults, {}, id);
    else {
        for (const [key, defaultValue] of Object.entries(defaults)) {
            const cur = value[key];
            const missing = cur === undefined || cur === null || (typeof defaultValue === 'string' && String(cur).trim() === '');
            if (missing && defaultValue !== null && defaultValue !== undefined)
                value[key] = clone(defaultValue);
        }
        value.id ??= id;
    }
    return target[id];
}
export function initDB() { fs.mkdirSync(DB_DIR, { recursive: true }); writeNow(); return true; }
export function getUser(id, opt = {}) {
    if (!id) {
        const users = Object.values(database.users);
        if (opt.orderBy)
            users.sort((a, b) => ((b[opt.orderBy] || 0) - (a[opt.orderBy] || 0)) * (opt.desc === false ? -1 : 1));
        return users;
    }
    return ensureObject(database.users, defUser, id);
}
export function updateUser(id, field, val) { const user = getUser(id); user[field] = val; saveDatabase(); return true; }
export function getChat(id) { return id ? ensureObject(database.chats, defChat, id) : Object.values(database.chats); }
export function updateChat(id, field, val) { const chat = getChat(id); chat[field] = val; saveDatabase(); return true; }
export function getChatUser(chatId, userId, opt = {}) {
    if (!chatId)
        return Object.values(database.chat_users);
    if (!userId) {
        let users = Object.values(database.chat_users).filter(cu => cu.chat_id === chatId);
        if (opt.orderBy)
            users.sort((a, b) => ((b[opt.orderBy] || 0) - (a[opt.orderBy] || 0)) * (opt.desc === false ? -1 : 1));
        return users;
    }
    const key = `${chatId}:${userId}`;
    if (!database.chat_users[key] || typeof database.chat_users[key] !== 'object' || Array.isArray(database.chat_users[key]))
        database.chat_users[key] = { ...clone(defChatUser), chat_id: chatId, user_id: userId };
    else {
        for (const [keyName, defaultValue] of Object.entries(defChatUser))
            if (database.chat_users[key][keyName] === undefined || database.chat_users[key][keyName] === null && defaultValue !== null)
                database.chat_users[key][keyName] = clone(defaultValue);
        database.chat_users[key].chat_id = chatId;
        database.chat_users[key].user_id = userId;
    }
    for (const field of CHAT_USER_NUMERIC_FIELDS) {
        if (database.chat_users[key][field] == null)
            continue;
        const n = Number(database.chat_users[key][field]);
        database.chat_users[key][field] = Number.isFinite(n) ? n : (field === 'usedTime' ? null : 0);
    }
    database.chat_users[key].coins = Math.max(0, Math.floor(Number(database.chat_users[key].coins) || 0));
    database.chat_users[key].bank = Math.max(0, Math.floor(Number(database.chat_users[key].bank) || 0));
    if (!Array.isArray(database.chat_users[key].characters))
        database.chat_users[key].characters = [];
    if (!Array.isArray(database.chat_users[key].warnings))
        database.chat_users[key].warnings = [];
    if (!database.chat_users[key].stats || typeof database.chat_users[key].stats !== 'object' || Array.isArray(database.chat_users[key].stats))
        database.chat_users[key].stats = {};
    return database.chat_users[key];
}
export function updateChatUser(chatId, userId, field, val) {
    const user = getChatUser(chatId, userId);
    if (CHAT_USER_NUMERIC_FIELDS.has(field)) {
        const number = Number(val);
        if (!Number.isFinite(number))
            throw new TypeError(`Valor inválido para ${field}`);
        val = field === 'coins' || field === 'bank' ? Math.max(0, Math.floor(number)) : Math.max(0, number);
    }
    user[field] = val;
    saveDatabase();
    return true;
}
export function getChatUsers(chatId, opt = {}) { return getChatUser(chatId, null, opt); }
export function adjustCoins(chatId, userId, delta) {
    const amount = Number(delta);
    if (!Number.isFinite(amount))
        throw new TypeError('Cantidad de coins inválida');
    const user = getChatUser(chatId, userId);
    user.coins = Math.max(0, Math.floor(Number(user.coins) || 0) + Math.trunc(amount));
    saveDatabase();
    return user.coins;
}
export function adjustBank(chatId, userId, delta) {
    const amount = Number(delta);
    if (!Number.isFinite(amount))
        throw new TypeError('Cantidad de bank inválida');
    const user = getChatUser(chatId, userId);
    user.bank = Math.max(0, Math.floor(Number(user.bank) || 0) + Math.trunc(amount));
    saveDatabase();
    return user.bank;
}
function suspensionKey(botId, userId) {
    const bot = String(botId || '').trim().toLowerCase();
    const user = String(userId || '').trim().replace(/:\d+(?=@)/, '').toLowerCase();
    return `${bot}:${user}`;
}
export function setSuspension(botId, userId, duration, reason = '') {
    const until = Date.now() + Math.max(60_000, Math.floor(Number(duration) || 0));
    const key = suspensionKey(botId, userId);
    database.user_suspensions[key] = { botId, userId, until, reason: String(reason || '').slice(0, 240), createdAt: Date.now() };
    saveDatabase();
    return database.user_suspensions[key];
}
export function getSuspension(botId, userId) {
    const key = suspensionKey(botId, userId);
    const entry = database.user_suspensions[key];
    if (!entry)
        return null;
    if (Number(entry.until) <= Date.now()) {
        delete database.user_suspensions[key];
        saveDatabase();
        return null;
    }
    return entry;
}
export function clearSuspension(botId, userId) {
    const key = suspensionKey(botId, userId);
    if (!database.user_suspensions[key])
        return false;
    delete database.user_suspensions[key];
    saveDatabase();
    return true;
}
export function getSettings(id) {
    const settings = ensureObject(database.settings, defSets, id);
    if (OWNER_JID && settings.owner === OWNER_JID && settings.ownerConfigured !== true) {
        settings.owner = '';
        saveDatabase();
    }
    return settings;
}
export function updateSettings(id, field, val) { const settings = getSettings(id); settings[field] = val; saveDatabase(); return true; }
export function recordCommandUsage({ chatUser, user, settings, usedTime, exp, name, usedcommands, commandsejecut, stats }) {
    if (!chatUser || !user || !settings)
        return false;
    chatUser.usedTime = usedTime;
    chatUser.stats = stats;
    user.exp = exp;
    user.name = name;
    user.usedcommands = usedcommands;
    settings.commandsejecut = commandsejecut;
    saveDatabase();
    return true;
}
export function getStickersPack(id) { return id ? ensureObject(database.sticker_packs, defStickerPack, id) : Object.values(database.sticker_packs); }
export function updateStickersPack(id, field, val) { const pack = getStickersPack(id); pack[field] = val; saveDatabase(); return true; }
export function deletedb(type, ...ids) {
    if (!type || !ids.length)
        return false;
    const table = { user: 'users', chat: 'chats', settings: 'settings', stickerpack: 'sticker_packs' }[type];
    if (table) {
        if (!database[table][ids[0]])
            return false;
        delete database[table][ids[0]];
        saveDatabase();
        return true;
    }
    if (type === 'chatuser' && ids.length >= 2) {
        const key = `${ids[0]}:${ids[1]}`;
        if (!database.chat_users[key])
            return false;
        delete database.chat_users[key];
        saveDatabase();
        return true;
    }
    return false;
}
export function setCreate(table, identifier, field, value) {
    const obj = table === 'chat_users' ? getChatUser(identifier?.[0], identifier?.[1]) : table === 'users' ? getUser(identifier) : table === 'chats' ? getChat(identifier) : table === 'settings' ? getSettings(identifier) : null;
    if (!obj)
        return value;
    if (obj[field] === undefined) {
        obj[field] = value;
        saveDatabase();
    }
    return obj[field];
}
export function getPremiumCode(code) { return database.premium_codes[String(code || '').trim().toUpperCase()] || null; }
export function createPremiumCode(code, maxUses, createdBy = '') { const key = String(code || '').trim().toUpperCase(); database.premium_codes[key] = { code: key, maxUses: Math.max(1, Math.floor(Number(maxUses) || 1)), uses: 0, createdBy, createdAt: Date.now(), usedBy: [] }; saveDatabase(); return database.premium_codes[key]; }
export function redeemPremiumCode(code, userId = '') {
    const entry = getPremiumCode(code);
    if (!entry)
        return { ok: false, reason: 'not_found' };
    if (entry.uses >= entry.maxUses)
        return { ok: false, reason: 'exhausted', entry };
    entry.uses++;
    if (userId && !entry.usedBy.includes(userId))
        entry.usedBy.push(userId);
    saveDatabase();
    return { ok: true, entry };
}
export function refundPremiumCode(code, userId = '') {
    const entry = database.premium_codes[String(code || '').trim().toUpperCase()];
    if (!entry || entry.uses <= 0)
        return false;
    entry.uses--;
    if (userId) {
        const i = entry.usedBy.lastIndexOf(userId);
        if (i >= 0)
            entry.usedBy.splice(i, 1);
    }
    saveDatabase();
    return true;
}
const toLimit = (value, fallback) => (value === Infinity || value === 'Infinity' || value === 'infinity' || value === -1) ? Infinity : (value === null || value === undefined || value === '' || !Number.isFinite(Number(value)) ? fallback : Math.max(0, Math.floor(Number(value))));
const extraOf = () => (database.capacity && typeof database.capacity.extra === 'object' && database.capacity.extra) || {};
export function getCapacity() {
    const free = toLimit(global.botLimits?.freeSubBots, 20);
    const premium = toLimit(global.botLimits?.premiumBots, Infinity);
    const principal = toLimit(global.botLimits?.principalBots, 1);
    const extra = extraOf();
    return {
        freeSubBots: free + (Number(extra.sub) || 0),
        premiumBots: premium === Infinity ? Infinity : premium + (Number(extra.premium) || 0),
        principalBots: principal + (Number(extra.principal) || 0)
    };
}
export function addCapacity({ sub = 0, premium = 0, principal = 0 } = {}) {
    const extra = extraOf();
    database.capacity = { ...(database.capacity || {}), extra: {
            sub: (Number(extra.sub) || 0) + Math.max(0, Math.floor(Number(sub) || 0)),
            premium: (Number(extra.premium) || 0) + Math.max(0, Math.floor(Number(premium) || 0)),
            principal: (Number(extra.principal) || 0) + Math.max(0, Math.floor(Number(principal) || 0))
        } };
    saveDatabase();
    return getCapacity();
}
const codeKey = (code) => String(code || '').trim().toUpperCase();
function createCode(table, code, maxUses, createdBy = '', extra = {}) {
    const key = codeKey(code);
    database[table][key] = { code: key, maxUses: Math.max(1, Math.floor(Number(maxUses) || 1)), uses: 0, createdBy, createdAt: Date.now(), usedBy: [], ...extra };
    saveDatabase();
    return database[table][key];
}
function redeemCode(table, code, userId = '') {
    const entry = database[table][codeKey(code)];
    if (!entry)
        return { ok: false, reason: 'not_found' };
    if (entry.uses >= entry.maxUses)
        return { ok: false, reason: 'exhausted', entry };
    entry.uses++;
    if (userId && !entry.usedBy.includes(userId))
        entry.usedBy.push(userId);
    saveDatabase();
    return { ok: true, entry };
}
function refundCode(table, code, userId = '') {
    const entry = database[table][codeKey(code)];
    if (!entry || entry.uses <= 0)
        return false;
    entry.uses--;
    if (userId) {
        const i = entry.usedBy.lastIndexOf(userId);
        if (i >= 0)
            entry.usedBy.splice(i, 1);
    }
    saveDatabase();
    return true;
}
export const getExpansionCode = (code) => database.expansion_codes[codeKey(code)] || null;
export const createExpansionCode = (code, expansion = {}, maxUses = 1, createdBy = '') => createCode('expansion_codes', code, maxUses, createdBy, { expansion: { sub: Number(expansion.sub) || 0, premium: Number(expansion.premium) || 0, principal: Number(expansion.principal) || 0 } });
export const redeemExpansionCode = (code, userId) => redeemCode('expansion_codes', code, userId);
export const refundExpansionCode = (code, userId) => refundCode('expansion_codes', code, userId);
export const getPrincipalCode = (code) => database.principal_codes[codeKey(code)] || null;
export const createPrincipalCode = (code, maxUses = 1, createdBy = '') => createCode('principal_codes', code, maxUses, createdBy);
export const redeemPrincipalCode = (code, userId) => redeemCode('principal_codes', code, userId);
export const refundPrincipalCode = (code, userId) => refundCode('principal_codes', code, userId);
export function raw() { return database; }
export function clearCache() { return true; }
export function repairDatabase() {
    database = normalizeRoot(database);
    for (const [id, user] of Object.entries(database.users))
        database.users[id] = withDefaults(defUser, user, id);
    for (const [key, user] of Object.entries(database.chat_users))
        database.chat_users[key] = { ...clone(defChatUser), ...user };
    for (const [id, chat] of Object.entries(database.chats))
        database.chats[id] = withDefaults(defChat, chat, id);
    for (const [id, settings] of Object.entries(database.settings))
        database.settings[id] = withDefaults(defSets, settings, id);
    saveDatabase();
    return true;
}
export default { setSuspension, getSuspension, clearSuspension, adjustCoins, adjustBank, getCapacity, addCapacity, getExpansionCode, createExpansionCode, redeemExpansionCode, refundExpansionCode, getPrincipalCode, createPrincipalCode, redeemPrincipalCode, refundPrincipalCode, raw, flushDatabase, initDB, getUser, updateUser, getChat, updateChat, getChatUser, getChatUsers, updateChatUser, getSettings, updateSettings, recordCommandUsage, getStickersPack, updateStickersPack, deletedb, setCreate, getPremiumCode, createPremiumCode, redeemPremiumCode, refundPremiumCode, clearCache, repairDatabase, db: database };
