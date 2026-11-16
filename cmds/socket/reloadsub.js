import db from '#db';
import fs from 'fs';
import path from 'path';
import { jidDecode } from 'ezz-baileys';
import { isCreator, isMainBot } from '../../lib/haimiya.js';
export default {
    command: ['reloadsub'],
    aliases: [],
    desc: 'Recarga las instancias secundarias gestionadas por el bot.',
    usage: 'reloadsub',
    isOwner: true,
    isAdmin: false,
    botAdmin: false,
    customPrefix: null,
    hidden: false,
    category: 'socket',
    run: async ({ msg, sock }) => {
        if (isMainBot(sock)) {
            return msg.reply('✎ Este comando solo puede usarse desde un Sub-Bot o Premium.');
        }
        const authBotId = sock?.user?.id ? sock.user.id.split(':')[0] + '@s.whatsapp.net' : '';
        const settings = await db.getSettings(authBotId) || {};
        const senderPhone = String(msg.sender || '').split('@')[0].replace(/\D/g, '');
        const ownerPhone = String(settings.owner || '').split('@')[0].replace(/\D/g, '');
        if (!isCreator(msg.sender) && (!ownerPhone || senderPhone !== ownerPhone)) {
            return msg.reply(mess.socket);
        }
        const rawId = sock?.user?.id || '';
        const decoded = jidDecode(rawId);
        const cleanId = decoded?.user || rawId.split('@')[0];
        const sessionPath = path.join('Sessions', 'Subs', cleanId);
        if (!cleanId || !fs.existsSync(path.join(sessionPath, 'creds.json'))) {
            return msg.reply('✎ No encontré la sesión persistente de este Sub-Bot.');
        }
        void msg.reply('✦ Reiniciando únicamente este Sub-Bot...').catch(() => { });
        setTimeout(() => {
            try {
                if (sock?.ws && typeof sock.ws.close === 'function') {
                    sock.ws.close();
                }
                else if (typeof sock?.end === 'function') {
                    sock.end(new Error('ReloadSub solicitado'));
                }
            }
            catch (err) {
                console.error('[reloadsub] Error cerrando socket:', err?.message || err);
            }
        }, 250);
    },
};
