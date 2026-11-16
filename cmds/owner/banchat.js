import db from '#db';
import { refreshCache } from '../../lib/banchat.js';
const num = j => String(j || '').split('@')[0].split(':')[0];
const isGroupJid = j => /^\d+(-\d+)?@g\.us$/.test(String(j || ''));
export default {
    command: ['banchat'],
    aliases: [],
    category: 'owner',
    desc: 'Silencia al bot en los grupos: #banchat all | on | off | allow | deny | list',
    usage: 'banchat all | on | off | allow [id] | deny [id] | list',
    isOwner: true,
    perm: 'moderacion',
    isAdmin: false,
    botAdmin: false,
    customPrefix: null,
    hidden: false,
    run: async ({ msg, sock, args, usedPrefix }) => {
        const botJid = `${num(sock.user?.id)}@s.whatsapp.net`, phone = num(botJid);
        const settings = (await db.getSettings(botJid)) || {};
        const allowed = Array.isArray(settings.banchat_allowed) ? settings.banchat_allowed.filter(isGroupJid) : [];
        const on = !!settings.banchat_on;
        const sub = String(args[0] || '').toLowerCase();
        const save = async (patch) => {
            for (const [k, v] of Object.entries(patch))
                await db.updateSettings(botJid, k, v);
            await refreshCache(phone);
        };
        const nameOf = async (jid) => {
            try {
                return (await sock.groupMetadata(jid))?.subject || jid;
            }
            catch {
                return jid;
            }
        };
        const p = usedPrefix || '#';
        if (sub === 'all' || sub === 'todos') {
            await save({ banchat_on: true, banchat_allowed: [] });
            return msg.reply(`🚫 *Banchat TOTAL activado*\n\nEl bot no responderá en *ningún grupo*: ni comandos, ni bienvenidas, ni despedidas, ni avisos.\n› Los chats privados siguen funcionando.\n› Para volver: *${p}banchat off*\n› Para permitir un grupo: *${p}banchat allow* (dentro del grupo)`);
        }
        if (sub === 'on' || sub === 'activar') {
            await save({ banchat_on: true });
            return msg.reply(`🚫 *Banchat activado*\n\nEl bot solo responde en los grupos exceptuados *(${allowed.length})* y en privado.\n› *${p}banchat allow* exceptúa el grupo actual · *${p}banchat list* los muestra.`);
        }
        if (sub === 'off' || sub === 'desactivar') {
            await save({ banchat_on: false });
            return msg.reply('✅ *Banchat desactivado*\n\nEl bot vuelve a responder con normalidad en todos los grupos.');
        }
        if (['allow', 'permitir', 'add', 'deny', 'quitar', 'remove'].includes(sub)) {
            const adding = ['allow', 'permitir', 'add'].includes(sub);
            const target = isGroupJid(args[1]) ? args[1] : (msg.isGroup ? msg.chat : null);
            if (!target)
                return msg.reply(`✿ Úsalo dentro del grupo o indica su ID: *${p}banchat ${sub} 1203…@g.us*\n(Mira los ID con *${p}grupos*)`);
            const next = adding ? [...new Set([...allowed, target])] : allowed.filter(j => j !== target);
            await save({ banchat_allowed: next });
            const name = await nameOf(target);
            return msg.reply(adding ? `✅ *${name}* exceptuado: ahí el bot sí responde${on ? '' : ' (el banchat está desactivado; actívalo con ' + p + 'banchat on)'}.` : `🚫 *${name}* ya no está exceptuado${on ? ': el bot calla en ese grupo.' : '.'}`);
        }
        if (sub === 'list' || sub === 'lista') {
            if (!allowed.length)
                return msg.reply('📋 No hay grupos exceptuados.');
            const lines = [];
            for (const j of allowed.slice(0, 40))
                lines.push(`• ${await nameOf(j)}\n  ${j}`);
            return msg.reply(`📋 *Grupos exceptuados (${allowed.length})*\n\n${lines.join('\n')}`);
        }
        return msg.reply(`🚫 *Banchat* — ${on ? '🟢 *ACTIVO*' : '⚪ *INACTIVO*'}\n\n${on ? `El bot solo responde en privado y en *${allowed.length}* grupo(s) exceptuado(s).` : 'El bot responde con normalidad en todos los chats.'}\n\n› *${p}banchat all* · silencia TODOS los grupos\n› *${p}banchat on / off*\n› *${p}banchat allow / deny* · exceptúa o quita el grupo actual\n› *${p}banchat list*`);
    }
};
