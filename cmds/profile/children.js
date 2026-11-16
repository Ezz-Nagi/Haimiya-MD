import db from "#db";
export default {
    command: ['hijos'],
    aliases: ['familia'],
    category: 'profile',
    description: 'Muestra padres/madres e hijos registrados.',
    desc: 'Muestra la familia registrada, incluyendo padres e hijos.',
    usage: 'hijos',
    isOwner: false,
    isAdmin: false,
    botAdmin: false,
    customPrefix: null,
    hidden: false,
    run: async ({ msg, sock }) => {
        const user = await db.getUser(msg.sender);
        const children = Array.isArray(user.children) ? user.children : [];
        const parents = Array.isArray(user.parents) ? user.parents : [];
        const names = async (ids) => Promise.all(ids.map(async (id) => {
            const u = await db.getUser(id);
            return `• @${id.split('@')[0]} — ${u.name || 'Sin nombre'}`;
        }));
        const p = await names(parents);
        const c = await names(children);
        return sock.reply(msg.chat, `👨‍👩‍👧‍👦 *FAMILIA DE ${user.name || msg.sender.split('@')[0]}*\n\n👨‍👩‍👧 *Padres/madres:*\n${p.length ? p.join('\n') : '• Ninguno'}\n\n🧒 *Hijos/as:*\n${c.length ? c.join('\n') : '• Ninguno'}`, msg, { mentions: [...parents, ...children] });
    }
};
