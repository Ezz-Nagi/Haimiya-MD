import fs from 'fs';
import path from 'path';
import { OWNER_JID, isCreator } from '../../lib/haimiya.js';
const CMDS_DIR = path.join(process.cwd(), 'cmds');
const sanitizeRelPath = (raw) => {
    let p = String(raw || '')
        .trim()
        .replace(/\\/g, '/')
        .replace(/^\/+/, '');
    if (p.toLowerCase().startsWith('cmds/')) {
        p = p.slice(5);
    }
    if (!p.toLowerCase().endsWith('.js')) {
        p = `${p}.js`;
    }
    if (!p ||
        p.includes('..') ||
        p.startsWith('/') ||
        /[^a-zA-Z0-9_\-./]/.test(p)) {
        return null;
    }
    return p;
};
const findPluginFile = (dirPath) => {
    if (!fs.existsSync(CMDS_DIR))
        return null;
    const target = dirPath.toLowerCase().endsWith('.js')
        ? dirPath.toLowerCase()
        : `${dirPath.toLowerCase()}.js`;
    const stack = [CMDS_DIR];
    while (stack.length > 0) {
        const currentDir = stack.pop();
        let entries;
        try {
            entries = fs.readdirSync(currentDir, { withFileTypes: true });
        }
        catch {
            continue;
        }
        for (const entry of entries) {
            const fullPath = path.join(currentDir, entry.name);
            if (entry.isDirectory()) {
                stack.push(fullPath);
            }
            else if (entry.name.endsWith('.js')) {
                const relativePath = path
                    .relative(CMDS_DIR, fullPath)
                    .replace(/\\/g, '/');
                if (relativePath.toLowerCase() === target) {
                    return fullPath;
                }
            }
        }
    }
    return null;
};
export default {
    command: ['delplugin'],
    aliases: ['deleteplugin', 'rmplugin'],
    category: 'developer',
    desc: 'Elimina un plugin de la carpeta de comandos.',
    usage: 'delplugin <ruta>',
    isAdmin: false,
    botAdmin: false,
    customPrefix: null,
    hidden: false,
    isOwner: true,
    isCreator: true,
    run: async ({ msg, sock, args, text, usedPrefix, command }) => {
        if (!isCreator(msg.sender) && msg.sender !== OWNER_JID) {
            return;
        }
        const rawPath = (text || args.join(' ') || '').trim();
        if (!rawPath) {
            return sock.reply(msg.chat, [
                `╭━━━〔 🗑️ DELPLUGIN 〕━━━╮`,
                ``,
                `❯ Uso:`,
                `${usedPrefix}${command} carpeta/nombre`,
                ``,
                `❯ Ejemplos:`,
                `${usedPrefix}${command} sticker/test`,
                `${usedPrefix}${command} owner/miplugin`,
                ``,
                `❯ Ver lista:`,
                `${usedPrefix}plugins`,
                `╰━━━━━━━━━━━━━━━━━━━━╯`
            ].join('\n'), msg);
        }
        const relPath = sanitizeRelPath(rawPath);
        if (!relPath) {
            return sock.reply(msg.chat, `《✧》 Ruta inválida.\n\n> Ejemplo: *sticker/test*`, msg);
        }
        const protectedFiles = new Set([
            'events.js'
        ]);
        if (protectedFiles.has(relPath.toLowerCase())) {
            return sock.reply(msg.chat, `《✧》 Ese archivo está protegido y no se puede eliminar con este comando.`, msg);
        }
        const filePath = findPluginFile(relPath.replace(/\.js$/i, ''));
        if (!filePath) {
            return sock.reply(msg.chat, `《✧》 No se encontró *cmds/${relPath}*.\n\n> Revisa con *${usedPrefix}plugins*`, msg);
        }
        const resolved = path.resolve(filePath);
        const cmdsResolved = path.resolve(CMDS_DIR);
        if (!resolved.startsWith(cmdsResolved + path.sep)) {
            return sock.reply(msg.chat, `《✧》 Ruta no permitida.`, msg);
        }
        try {
            fs.unlinkSync(filePath);
            try {
                if (typeof global.reload === 'function') {
                    global.reload(null, filePath);
                }
            }
            catch (e) {
                console.error('[DELPLUGIN] reload:', e?.message || e);
            }
            const relative = path.relative(CMDS_DIR, filePath).replace(/\\/g, '/');
            return sock.reply(msg.chat, [
                `《✧》 Plugin eliminado.`,
                ``,
                `❯ *cmds/${relative}*`,
                ``,
                `> Si el comando sigue en memoria, reinicia el bot.`
            ].join('\n'), msg);
        }
        catch (e) {
            console.error('[DELPLUGIN]', e);
            return sock.reply(msg.chat, `《✧》 No pude eliminar el plugin.\n\n> ${e?.message || e}`, msg);
        }
    }
};
