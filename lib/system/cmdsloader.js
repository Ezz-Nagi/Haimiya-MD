import fs from 'fs';
import path from 'path';
import chalk from 'chalk';
import { fileURLToPath, pathToFileURL } from 'url';
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const WA_FOLDER = path.resolve(__dirname, '../../cmds');
const pluginCache = new Map();
const debounceMap = new Map();
global.comandos = global.comandos instanceof Map ? global.comandos : new Map();
global.comandosWA = global.comandos;
global.plugins = global.plugins ?? {};
global.cmdsExecute = global.cmdsExecute ?? [];
global.cmdCollisions = global.cmdCollisions instanceof Map ? global.cmdCollisions : new Map();
global.customCommands = Array.isArray(global.customCommands) ? global.customCommands : [];
function normalizeCategory(value, key) {
    const folder = String(key || '').split('/')[0].toLowerCase();
    const aliases = { dl: 'download', downloads: 'download', grupo: 'group', grupos: 'group', economy: 'economy', economia: 'economy', util: 'utils', herramientas: 'utils', dev: 'developer' };
    const selected = String(value || folder || 'general').toLowerCase();
    return aliases[selected] || selected;
}
function registerModule(filePath, mod, platform) {
    const baseFolder = WA_FOLDER;
    const map = global.comandos;
    const execName = 'cmdsExecute';
    const key = path.relative(baseFolder, filePath).replace(/\\/g, '/').replace(/\.js$/, '');
    for (const [cmd, data] of map)
        if (data.pluginKey === key && data.platform === platform)
            map.delete(cmd);
    global[execName] = global[execName].filter(p => !(String(p.key).split('#')[0] === key && p.platform === platform));
    const dirname = path.dirname(filePath);
    global.plugins[`${platform}:${key}`] = { ...mod, dirname, platform };
    const defs = Array.isArray(mod?.default) ? mod.default
        : Array.isArray(mod?.commands) ? mod.commands
            : [mod?.default || {}];
    defs.forEach((cmd, i) => {
        if (!cmd || typeof cmd !== 'object')
            return;
        const subKey = i ? `${key}#${i}` : key;
        const allFn = typeof cmd.all === 'function' ? cmd.all : (i === 0 && typeof mod?.all === 'function' ? mod.all : null);
        const beforeFn = typeof cmd.before === 'function' ? cmd.before : (i === 0 && typeof mod?.before === 'function' ? mod.before : null);
        if (allFn)
            global[execName].push({ key: subKey, type: 'all', fn: allFn, dirname, platform });
        if (beforeFn)
            global[execName].push({ key: subKey, type: 'before', fn: beforeFn, dirname, platform });
        if (typeof cmd.run !== 'function')
            return;
        const declaredCommands = Array.isArray(cmd.command) ? cmd.command : cmd.command ? [cmd.command] : [];
        const explicitAliases = Array.isArray(cmd.aliases) ? cmd.aliases : cmd.aliases ? [cmd.aliases] : [];
        const normalizedCommands = declaredCommands.filter(Boolean).map(c => String(c).toLowerCase().trim());
        const normalizedAliases = [...new Set(explicitAliases.filter(Boolean).map(c => String(c).toLowerCase().trim()))];
        const canonical = normalizedCommands.length ? normalizedCommands : (cmd.customPrefix ? [key.split('/').pop().toLowerCase()] : []);
        if (!canonical.length)
            return;
        const base = {
            pluginKey: key,
            platform,
            run: cmd.run,
            category: normalizeCategory(cmd.category, key),
            description: cmd.description ?? cmd.desc ?? '',
            usage: cmd.usage ?? cmd.uso ?? '',
            isOwner: cmd.isOwner ?? false,
            isCreator: cmd.isCreator ?? false,
            perm: cmd.perm ?? null,
            isAdmin: cmd.isAdmin ?? false,
            botAdmin: cmd.botAdmin ?? false,
            customPrefix: cmd.customPrefix ?? null,
            hidden: cmd.hidden ?? cmd.oculto ?? false,
        };
        for (const name of canonical) {
            if (map.has(name) && map.get(name).pluginKey !== key) {
                const prev = map.get(name);
                global.cmdCollisions.set(name, [...(global.cmdCollisions.get(name) || []), prev.pluginKey, key]);
            }
            map.set(name, { ...base, command: name, aliases: normalizedAliases });
        }
        for (const alias of normalizedAliases) {
            if (canonical.includes(alias))
                continue;
            if (!map.has(alias))
                map.set(alias, { ...base, command: canonical[0], aliases: normalizedAliases });
        }
    });
}
async function importModule(filePath) {
    const mtime = fs.statSync(filePath).mtimeMs;
    const cached = pluginCache.get(filePath);
    if (cached?.mtime === mtime)
        return cached.mod;
    const mod = await import(`${pathToFileURL(filePath).href}?v=${mtime}`);
    pluginCache.set(filePath, { mtime, mod });
    return mod;
}
function collectFiles(dir, out = []) {
    let entries;
    try {
        entries = fs.readdirSync(dir, { withFileTypes: true });
    }
    catch {
        return out;
    }
    for (const entry of entries) {
        const full = path.join(dir, entry.name);
        if (entry.isDirectory())
            collectFiles(full, out);
        else if (entry.name.endsWith('.js'))
            out.push(full);
    }
    return out;
}
async function scan(dir, platform) {
    if (!fs.existsSync(dir))
        return { total: 0, errors: 0 };
    const files = collectFiles(dir).sort();
    const imported = await Promise.allSettled(files.map(file => importModule(file)));
    let errors = 0;
    imported.forEach((r, i) => {
        try {
            if (r.status === 'rejected')
                throw r.reason;
            registerModule(files[i], r.value, platform);
        }
        catch (e) {
            errors++;
            console.error(chalk.gray(`[ ✿ ] Error ${platform}/${path.relative(dir, files[i])}: ${e?.message ?? e}`));
        }
    });
    return { total: files.length, errors };
}
export default async function cmdsLoader() {
    const wa = await scan(WA_FOLDER, 'wa');
    global.comandosWA = global.comandos;
    const custom = new Map();
    for (const data of global.comandos.values())
        if (data?.customPrefix)
            custom.set(`${data.pluginKey}:${data.command}`, data);
    global.customCommands = [...custom.values()];
    console.log(chalk.green(`[ ✿ ] WA: ${global.comandos.size} cmds (${wa.total} archivos)` + (wa.errors ? ` · ${wa.errors} errores` : '')));
    if (global.cmdCollisions.size) {
        console.log(chalk.yellow(`[ ✿ ] Comandos repetidos (se usa el primero): ` + [...global.cmdCollisions].slice(0, 12).map(([k, v]) => `${k} → ${v[0]} (ignora ${v[1]})`).join(' | ')));
    }
    return { wa };
}
export async function load() {
    return cmdsLoader();
}
