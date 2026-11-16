import db from '#db';
function requestsMap() {
    global.adoptionRequests = global.adoptionRequests instanceof Map ? global.adoptionRequests : new Map();
    return global.adoptionRequests;
}
export default {
    command: ['adoptar'],
    aliases: ['adopt', 'adopta'],
    category: 'profile',
    description: 'Envía una solicitud de adopción a un usuario.',
    desc: 'Envía una solicitud de adopción a otro usuario.',
    usage: 'adoptar @usuario',
    isOwner: false,
    isAdmin: false,
    botAdmin: false,
    customPrefix: null,
    hidden: false,
    run: async ({ msg }) => {
        const parent = msg.sender;
        const child = msg.mentionedJid?.[0] || msg.quoted?.sender;
        if (!child)
            return msg.reply('《✤》 Usa *#adoptar @user* para enviar una solicitud de adopción.');
        if (parent === child)
            return msg.reply('《✤》 No puedes adoptarte a ti mismo.');
        const parentData = await db.getUser(parent);
        const childData = await db.getUser(child);
        if (!parentData?.marry)
            return msg.reply('《✤》 Solo puedes solicitar una adopción si ya estás casad@.');
        parentData.children = Array.isArray(parentData.children) ? parentData.children : [];
        childData.parents = Array.isArray(childData.parents) ? childData.parents : [];
        if (parentData.children.includes(child))
            return msg.reply('《✤》 Ese usuario ya es tu hijo/a.');
        if (childData.parents.includes(parent))
            return msg.reply('《✤》 Ya eres padre/madre de ese usuario.');
        if (childData.parents.length >= 2)
            return msg.reply('《✤》 Ese usuario ya tiene dos padres/madres registrados.');
        const requests = requestsMap();
        for (const [token, request] of requests) {
            if (Date.now() - request.createdAt > 10 * 60 * 1000)
                requests.delete(token);
            else if (request.parent === parent && request.child === child)
                return msg.reply('《✤》 Ya existe una solicitud de adopción pendiente para ese usuario.');
        }
        const token = `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
        requests.set(token, { group: msg.chat, parent, child, createdAt: Date.now() });
        setTimeout(() => requests.delete(token), 10 * 60 * 1000);
        const parentName = parentData.name || parent.split('@')[0];
        const spouseData = await db.getUser(parentData.marry);
        const spouseName = spouseData?.name || parentData.marry.split('@')[0];
        return msg.reply(`╭─〔 🏠 *SOLICITUD DE ADOPCIÓN* 〕─╮\n\n👑 *${parentName}* quiere adoptarte, @${child.split('@')[0]}.\n\n💍 La persona solicitante está casad@ con *${spouseName}* y, si aceptas, la adopción quedará registrada en la familia.\n\n> Para responder:\n> *#aceptar* — aceptar la adopción\n> *#rechazar* — rechazarla\n\n> Esta solicitud solo puede responderla la persona que será adoptada y expira en *10 minutos*.\n╰────────────────────────╯`, { mentions: [parent, child, parentData.marry] });
    }
};
