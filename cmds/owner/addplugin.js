import fs from 'fs';
import path from 'path';
import { downloadContentFromMessage } from 'ezz-baileys';
import { OWNER_JID, isCreator } from '../../lib/haimiya.js';
const CMDS_DIR = path.resolve(process.cwd(), 'cmds');
const PENDING_TTL_MS = 5 * 60 * 1000;
global.pendingAddPlugin ??= new Map();
const getText = msg => {
    return String(msg?.text ||
        msg?.body ||
        msg?.message?.conversation ||
        msg?.message?.extendedTextMessage?.text ||
        '').trim();
};
const getDocument = msg => {
    return (msg?.message?.documentMessage ||
        msg?.message?.viewOnceMessage?.message?.documentMessage ||
        msg?.message?.viewOnceMessageV2?.message?.documentMessage ||
        msg?.message?.viewOnceMessageV2Extension?.message?.documentMessage ||
        null);
};
const getDocumentName = msg => {
    const document = getDocument(msg);
    return (document?.fileName ||
        msg?.filename ||
        msg?.fileName ||
        null);
};
const isReplyTo = (msg, messageId) => {
    if (!messageId)
        return false;
    const quoted = msg?.message?.extendedTextMessage?.contextInfo?.stanzaId ||
        msg?.message?.documentWithCaptionMessage?.message?.extendedTextMessage?.contextInfo?.stanzaId ||
        msg?.quoted?.id ||
        msg?.quoted?.key?.id;
    return quoted === messageId;
};
const sanitizeFolder = raw => {
    let folder = String(raw || '')
        .trim()
        .replace(/\\/g, '/')
        .replace(/^\/+/, '');
    if (folder.toLowerCase().startsWith('cmds/')) {
        folder = folder.slice(5);
    }
    if (!folder)
        return null;
    if (!folder.endsWith('/')) {
        folder += '/';
    }
    if (folder.includes('..') ||
        folder.startsWith('/') ||
        folder.includes('//') ||
        /[^a-zA-Z0-9_\-./]/.test(folder)) {
        return null;
    }
    return folder;
};
const safeFileName = filename => {
    const name = path.basename(String(filename || '').trim());
    if (!name)
        return null;
    if (name === '.' ||
        name === '..' ||
        name.includes('/') ||
        name.includes('\\') ||
        name.includes('..') ||
        /[<>:"|?*\x00-\x1F]/.test(name)) {
        return null;
    }
    return name;
};
const downloadDocument = async (msg) => {
    const document = getDocument(msg);
    if (!document) {
        throw new Error('No se encontró el archivo adjunto.');
    }
    const filename = safeFileName(getDocumentName(msg));
    if (!filename) {
        throw new Error('El archivo no tiene un nombre válido.');
    }
    const stream = await downloadContentFromMessage(document, 'document');
    const chunks = [];
    for await (const chunk of stream) {
        chunks.push(Buffer.from(chunk));
    }
    const buffer = Buffer.concat(chunks);
    if (!buffer.length) {
        throw new Error('El archivo está vacío.');
    }
    const sample = buffer.subarray(0, Math.min(buffer.length, 8192));
    for (const byte of sample) {
        if (byte === 0) {
            throw new Error('El archivo no parece ser un archivo de texto.');
        }
    }
    return {
        filename,
        buffer
    };
};
const saveFile = (folder, filename, buffer) => {
    const relativePath = path.posix.join(folder, filename);
    const fullPath = path.resolve(CMDS_DIR, relativePath);
    const cmdsRoot = path.resolve(CMDS_DIR);
    if (fullPath !== cmdsRoot &&
        !fullPath.startsWith(cmdsRoot + path.sep)) {
        throw new Error('Ruta fuera de cmds/');
    }
    const directory = path.dirname(fullPath);
    fs.mkdirSync(directory, {
        recursive: true
    });
    fs.writeFileSync(fullPath, buffer);
    try {
        if (typeof global.reload === 'function') {
            global.reload(null, fullPath);
        }
    }
    catch (e) {
        console.error('[ADDPLUGIN] reload:', e?.message || e);
    }
    return {
        fullPath,
        relativePath
    };
};
export default {
    command: ['addplugin'],
    aliases: ['saveplugin'],
    category: 'developer',
    desc: 'Instala un plugin enviando un archivo y respondiendo a él.',
    usage: 'addplugin',
    isAdmin: false,
    botAdmin: false,
    customPrefix: null,
    hidden: false,
    isOwner: true,
    isCreator: true,
    all: async ({ msg, sock }) => {
        try {
            if (!msg?.sender)
                return;
            if (!isCreator(msg.sender) &&
                msg.sender !== OWNER_JID) {
                return;
            }
            const pending = global.pendingAddPlugin.get(msg.sender);
            if (!pending)
                return;
            if (Date.now() > pending.expires) {
                global.pendingAddPlugin.delete(msg.sender);
                return sock.reply(msg.chat, '《✧》 El addplugin ha expirado.', msg);
            }
            if (pending.chat !== msg.chat) {
                return;
            }
            if (!isReplyTo(msg, pending.messageId)) {
                return;
            }
            const document = getDocument(msg);
            if (!document) {
                return sock.reply(msg.chat, [
                    '《✧》 Debes responder directamente',
                    'al mensaje del archivo con otro archivo.',
                    '',
                    'Ejemplo:',
                    '*#addplugin utils/*'
                ].join('\n'), msg);
            }
            const downloaded = await downloadDocument(msg);
            global.pendingAddPlugin.delete(msg.sender);
            try {
                const result = saveFile(pending.folder, downloaded.filename, downloaded.buffer);
                await sock.reply(msg.chat, [
                    '《✧》 Archivo guardado correctamente.',
                    '',
                    `❯ Archivo › *${downloaded.filename}*`,
                    `❯ Ruta › *${result.relativePath}*`,
                    `❯ Tamaño › ${downloaded.buffer.length} bytes`,
                    '',
                    '> Hot-reload aplicado si el loader está activo.'
                ].join('\n'), msg);
            }
            catch (e) {
                console.error('[ADDPLUGIN] save:', e);
                await sock.reply(msg.chat, [
                    '《✧》 No pude guardar el archivo.',
                    '',
                    `> ${e?.message || e}`
                ].join('\n'), msg);
            }
        }
        catch (e) {
            console.error('[ADDPLUGIN all]', e);
        }
    },
    run: async ({ msg, sock, args, text, usedPrefix, command }) => {
        if (!isCreator(msg.sender) &&
            msg.sender !== OWNER_JID) {
            return;
        }
        const rawFolder = (text ||
            args.join(' ') ||
            '').trim();
        if (!rawFolder) {
            return sock.reply(msg.chat, [
                '╭━━━〔 ➕ ADDPLUGIN 〕━━━╮',
                '',
                '❯ Uso:',
                `${usedPrefix}${command} carpeta/`,
                '',
                '❯ Ejemplos:',
                `${usedPrefix}${command} utils/`,
                `${usedPrefix}${command} owner/`,
                `${usedPrefix}${command} lib/system/`,
                `${usedPrefix}${command} anime/`,
                '',
                '❯ Flujo:',
                '1. Ejecuta el comando con la carpeta',
                '2. El bot responde con la solicitud',
                '3. Responde a ese mensaje con el archivo',
                '4. El archivo se guarda automáticamente',
                '',
                '❯ Ejemplo:',
                `${usedPrefix}${command} utils/`,
                '> Respondes con escuela.js',
                '> Resultado: cmds/utils/escuela.js',
                '',
                '❯ Cancelar:',
                `${usedPrefix}${command} cancel`,
                '╰━━━━━━━━━━━━━━━━━━━━╯'
            ].join('\n'), msg);
        }
        if (/^cancel(ar)?$/i.test(rawFolder)) {
            if (global.pendingAddPlugin.has(msg.sender)) {
                global.pendingAddPlugin.delete(msg.sender);
                return sock.reply(msg.chat, '《✧》 Pendiente de addplugin cancelado.', msg);
            }
            return sock.reply(msg.chat, '《✧》 No tienes ningún addplugin pendiente.', msg);
        }
        const folder = sanitizeFolder(rawFolder);
        if (!folder) {
            return sock.reply(msg.chat, [
                '《✧》 Carpeta inválida.',
                '',
                'Usa una carpeta dentro de cmds/.',
                '',
                'Ejemplos:',
                '*utils/*',
                '*owner/*',
                '*lib/system/*'
            ].join('\n'), msg);
        }
        const textMessage = await sock.reply(msg.chat, [
            '╭━━━〔 ➕ ADDPLUGIN 〕━━━╮',
            '',
            `❯ Destino › *cmds/${folder}*`,
            '',
            '❯ Ahora responde a ESTE mensaje',
            'con el archivo que quieres subir.',
            '',
            'Ejemplo:',
            '📄 escuela.js',
            '',
            '→ Se guardará automáticamente como:',
            `*cmds/${folder}escuela.js*`,
            '',
            '❯ Tiempo límite: 5 minutos',
            `❯ Cancelar: ${usedPrefix}${command} cancel`,
            '╰━━━━━━━━━━━━━━━━━━━━╯'
        ].join('\n'), msg);
        const messageId = textMessage?.key?.id ||
            textMessage?.id ||
            null;
        global.pendingAddPlugin.set(msg.sender, {
            folder,
            chat: msg.chat,
            messageId,
            expires: Date.now() + PENDING_TTL_MS
        });
        return textMessage;
    }
};
