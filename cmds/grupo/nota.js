import db from '#db';
const MAX_NOTES = 30, MAX_LEN = 1500;
const key = s => String(s || '').toLowerCase().replace(/[^\p{L}\p{N}_-]/gu, '').slice(0, 30);
export default {
    command: ['nota'],
    aliases: ['notas', 'note'],
    desc: 'Notas guardadas del grupo. Cualquiera las lee; los admins las crean y borran.',
    usage: 'nota <nombre> | nota lista | nota add <nombre> <texto> | nota del <nombre>',
    category: 'group',
    isOwner: false,
    isAdmin: false,
    botAdmin: false,
    customPrefix: null,
    hidden: false,
    run: async ({ msg, args, isAdmins, usedPrefix, command }) => {
        if (!msg.isGroup)
            return msg.reply('《✧》 Este comando solo funciona en grupos.');
        const chat = await db.getChat(msg.chat);
        const notes = chat.notes && typeof chat.notes === 'object' ? { ...chat.notes } : {};
        const sub = String(args[0] || '').toLowerCase();
        if (!sub || sub === 'lista' || sub === 'list') {
            const names = Object.keys(notes);
            return msg.reply(names.length ? `📝 *Notas del grupo* (${names.length})\n\n${names.map(n => '✦ ' + n).join('\n')}\n\nLeer: *${usedPrefix}${command} <nombre>*` : `📝 No hay notas.\nUn admin puede crear una con *${usedPrefix}${command} add <nombre> <texto>*.`);
        }
        if (sub === 'add' || sub === 'set' || sub === 'del' || sub === 'borrar' || sub === 'eliminar') {
            if (!isAdmins)
                return msg.reply('《✧》 Solo los admins pueden crear o borrar notas.');
            const name = key(args[1]);
            if (!name)
                return msg.reply(`《✧》 Uso: *${usedPrefix}${command} ${sub} <nombre>${sub === 'add' || sub === 'set' ? ' <texto>' : ''}*`);
            if (['del', 'borrar', 'eliminar'].includes(sub)) {
                if (!notes[name])
                    return msg.reply('《✧》 Esa nota no existe.');
                delete notes[name];
                await db.updateChat(msg.chat, 'notes', notes);
                return msg.reply(`📝 Nota *${name}* eliminada.`);
            }
            const body = args.slice(2).join(' ').trim() || String(msg.quoted?.text || msg.quoted?.body || '').trim();
            if (!body)
                return msg.reply('《✧》 Escribe el texto de la nota (o responde a un mensaje).');
            if (body.length > MAX_LEN)
                return msg.reply(`《✧》 Máximo ${MAX_LEN} caracteres por nota.`);
            if (!notes[name] && Object.keys(notes).length >= MAX_NOTES)
                return msg.reply(`《✧》 Ya hay ${MAX_NOTES} notas. Borra alguna primero.`);
            notes[name] = { text: body, by: msg.sender, at: Date.now() };
            await db.updateChat(msg.chat, 'notes', notes);
            return msg.reply(`📝 Nota *${name}* guardada. Léela con *${usedPrefix}${command} ${name}*`);
        }
        const n = notes[key(sub)];
        if (!n)
            return msg.reply(`《✧》 No existe la nota *${sub}*. Mira la lista con *${usedPrefix}${command} lista*.`);
        return msg.reply(`📝 *${key(sub)}*\n\n${n.text}`);
    }
};
