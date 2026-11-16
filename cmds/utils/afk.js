import db from '#db';
const fmtDur = ms => {
    const m = Math.floor(ms / 60000), h = Math.floor(m / 60), d = Math.floor(h / 24);
    return d ? `${d} d ${h % 24} h` : h ? `${h} h ${m % 60} min` : `${Math.max(m, 1)} min`;
};
const peek = jid => db.db?.users?.[jid];
const tag = jid => '@' + String(jid).split('@')[0];
export async function all({ msg, sock }) {
    try {
        if (!msg?.sender || msg.fromMe)
            return;
        const me = peek(msg.sender);
        if (me?.afk?.since && Date.now() - me.afk.since > 4000) {
            const mins = fmtDur(Date.now() - me.afk.since);
            await db.updateUser(msg.sender, 'afk', null);
            if (msg.isGroup)
                await sock.sendMessage(msg.chat, { text: `👋 ${tag(msg.sender)} ya no está AFK (estuvo ausente ${mins}).`, mentions: [msg.sender] }, { quoted: msg });
        }
        if (!msg.isGroup)
            return;
        const targets = [...new Set([...(msg.mentionedJid || []), msg.quoted?.sender].filter(Boolean))].filter(j => j !== msg.sender);
        const lines = [];
        for (const t of targets) {
            const u = peek(t);
            if (u?.afk?.since)
                lines.push(`💤 ${tag(t)} está AFK desde hace *${fmtDur(Date.now() - u.afk.since)}*${u.afk.reason ? `\n› Motivo: ${u.afk.reason}` : ''}`);
        }
        if (lines.length)
            await sock.sendMessage(msg.chat, { text: lines.join('\n\n'), mentions: targets }, { quoted: msg });
    }
    catch (e) {
        console.error('[afk]', e?.message || e);
    }
}
export default {
    command: ['afk'],
    aliases: ['ausente', 'brbafk'],
    desc: 'Márcate como ausente: si te mencionan, el bot avisa que no estás. Se quita solo cuando vuelves a escribir.',
    usage: 'afk [motivo]',
    category: 'utils',
    isOwner: false,
    isAdmin: false,
    botAdmin: false,
    customPrefix: null,
    hidden: false,
    run: async ({ msg, args }) => {
        const reason = args.join(' ').trim().slice(0, 150);
        await db.getUser(msg.sender);
        await db.updateUser(msg.sender, 'afk', { since: Date.now(), reason });
        return msg.reply(`💤 Ahora estás *AFK*${reason ? `: ${reason}` : ''}.\nAvisaré a quien te mencione. Se quita solo cuando vuelvas a escribir.`);
    }
};
