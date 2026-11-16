const NUM = (jid = '') => String(jid).split('@')[0].split(':')[0].replace(/\D/g, '');
function normalizePendingEntry(x) {
    if (!x)
        return null;
    if (typeof x === 'string')
        return x;
    const candidates = [
        x.jid, x.id, x.lid,
        x.phone_number ? `${NUM(x.phone_number)}@s.whatsapp.net` : null,
        x.phoneNumber ? `${NUM(x.phoneNumber)}@s.whatsapp.net` : null
    ].filter(Boolean);
    return candidates[0] || null;
}
function pendingList(list) {
    return (list || []).map(normalizePendingEntry).filter(Boolean);
}
function matchTargets(all, text, mentionedJid = []) {
    const wanted = String(text || '').trim().toLowerCase();
    if (!wanted || wanted === 'all' || wanted === 'todos') {
        if (mentionedJid?.length) {
            const nums = mentionedJid.map(NUM);
            return all.filter(j => nums.includes(NUM(j)));
        }
        return all;
    }
    const num = NUM(wanted) || (mentionedJid?.[0] ? NUM(mentionedJid[0]) : '');
    if (!num)
        return [];
    return all.filter(j => NUM(j) === num);
}
async function applyAction(sock, group, targets, action) {
    const list = [...new Set(targets.filter(Boolean))];
    if (!list.length)
        return { ok: false, done: [] };
    const done = [];
    try {
        await sock.groupRequestParticipantsUpdate(group, list, action);
        return { ok: true, done: list };
    }
    catch {
        for (const jid of list) {
            try {
                await sock.groupRequestParticipantsUpdate(group, [jid], action);
                done.push(jid);
            }
            catch {
                const n = NUM(jid);
                for (const alt of [`${n}@s.whatsapp.net`, `${n}@lid`, jid]) {
                    try {
                        await sock.groupRequestParticipantsUpdate(group, [alt], action);
                        done.push(alt);
                        break;
                    }
                    catch { }
                }
            }
        }
    }
    return { ok: done.length > 0, done };
}
async function bulk(msg, sock, action, text) {
    if (!msg.isGroup)
        return msg.reply('《✤》 Solo en grupos.');
    const raw = await sock.groupRequestParticipantsList(msg.chat).catch(() => []);
    const all = pendingList(raw);
    if (!all.length)
        return msg.reply('《✤》 No hay solicitudes pendientes.');
    const targets = matchTargets(all, text, msg.mentionedJid || []);
    if (!targets.length) {
        return msg.reply('《✤》 No encontré esa solicitud en la lista pendiente.\nUsa *#solicitudes* para verlas.');
    }
    const { ok, done } = await applyAction(sock, msg.chat, targets, action);
    if (!ok) {
        return msg.reply('《✤》 No pude procesar la(s) solicitud(es).\n' +
            'El bot debe ser *admin* y el grupo tener *aprobación de miembros* activa.');
    }
    const still = pendingList(await sock.groupRequestParticipantsList(msg.chat).catch(() => []));
    const removed = done.filter(j => !still.some(s => NUM(s) === NUM(j)));
    const verb = action === 'approve' ? 'Aprobada(s)' : 'Denegada(s)';
    return msg.reply(`✎ ${verb} *${done.length}* solicitud(es).` +
        (removed.length !== done.length ? `\n_Pendientes restantes: ${still.length}_` : ''));
}
export default {
    command: ['aprobar'],
    aliases: ['aprobarsolicitudes'],
    category: 'group',
    hidden: false,
    desc: 'Aprueba solicitudes de ingreso pendientes (cualquier admin).',
    usage: 'aprobar [all|@usuario|número]',
    isAdmin: true,
    botAdmin: true,
    isOwner: false,
    run: async ({ msg, sock, text, args }) => {
        const t = text || args.join(' ');
        return bulk(msg, sock, 'approve', t);
    }
};
