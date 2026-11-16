import db from "#db";
import fs from 'fs';
import path from 'path';
import { jidDecode } from 'ezz-baileys';
import { cancel, release, unregisterConnection } from '../../lib/wa/session-guard.js';
export default {
    command: ['logout'],
    aliases: [],
    desc: 'Cierra la sesión del socket actual.',
    usage: 'logout',
    isOwner: false,
    isAdmin: false,
    botAdmin: false,
    customPrefix: null,
    hidden: false,
    category: 'socket',
    run: async ({ msg, sock, args, command, text, usedPrefix: prefix }) => {
        const rawId = sock.user?.id || '';
        const decoded = jidDecode(rawId);
        const cleanId = decoded?.user || rawId.split('@')[0];
        const sessionTypes = ['Subs'];
        const basePath = 'Sessions';
        const sessionPath = sessionTypes
            .map((type) => path.join(basePath, type, cleanId))
            .find((p) => fs.existsSync(p));
        if (!sessionPath) {
            return msg.reply('✎ Este comando solo puede ser usado desde una instancia de Sub-Bot.');
        }
        try {
            await msg.reply('✐ Cerrando sesión del Socket...');
            const absoluteSession = path.resolve(sessionPath);
            cancel(absoluteSession);
            try {
                sock.__superseded = true;
            }
            catch { }
            try {
                global.__authStores?.get(absoluteSession)?.flush?.();
            }
            catch { }
            unregisterConnection(sock);
            await sock.logout();
            release(absoluteSession, sock);
            setTimeout(() => {
                if (fs.existsSync(sessionPath)) {
                    fs.rmSync(sessionPath, { recursive: true, force: true });
                }
            }, 2000);
            setTimeout(() => {
            }, 3000);
        }
        catch (err) {
            await msg.reply(msgglobal);
        }
    },
};
