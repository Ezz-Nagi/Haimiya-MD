import db from '#db';
import { isCreator } from '../../lib/haimiya.js';
export default {
    command: ['aceptar'],
    aliases: ['acepto', 'accept'],
    category: 'profile',
    description: 'Acepta una solicitud pendiente de matrimonio o adopción.',
    desc: 'Acepta una solicitud pendiente de matrimonio o adopción.',
    usage: 'aceptar',
    isOwner: false,
    isAdmin: false,
    botAdmin: false,
    customPrefix: null,
    hidden: false,
    run: async ({ msg, sock }) => {
        const actor = msg.sender;
        const now = Date.now();
        if (global.marryRequests instanceof Map) {
            for (const [token, request] of global.marryRequests) {
                if (now - request.createdAt > 2 * 60 * 1000) {
                    global.marryRequests.delete(token);
                    continue;
                }
                if (request.proposee !== actor)
                    continue;
                if (msg.requestToken && token !== msg.requestToken)
                    continue;
                const a = await db.getUser(request.proposer);
                const b = await db.getUser(request.proposee);
                if (a.marry || b.marry) {
                    global.marryRequests.delete(token);
                    return msg.reply('《✤》 La propuesta ya no es válida porque una de las dos personas está casada.');
                }
                a.marry = request.proposee;
                b.marry = request.proposer;
                await db.updateUser(request.proposer, 'marry', b.id);
                await db.updateUser(request.proposee, 'marry', a.id);
                global.marryRequests.delete(token);
                return sock.reply(msg.chat, `💍 *MATRIMONIO CONFIRMADO*\n\n👑 *${a.name || request.proposer.split('@')[0]}* y *${b.name || request.proposee.split('@')[0]}* ahora están casad@s.`, msg, { mentions: [request.proposer, request.proposee] });
            }
        }
        if (global.adoptionRequests instanceof Map) {
            for (const [token, request] of global.adoptionRequests) {
                if (now - request.createdAt > 10 * 60 * 1000) {
                    global.adoptionRequests.delete(token);
                    continue;
                }
                if (request.child !== actor)
                    continue;
                if (msg.requestToken && token !== msg.requestToken)
                    continue;
                const parent = await db.getUser(request.parent);
                const child = await db.getUser(request.child);
                if (!parent.marry) {
                    global.adoptionRequests.delete(token);
                    return msg.reply('《✤》 La adopción ya no es válida porque la persona solicitante ya no está casada.');
                }
                parent.children = Array.isArray(parent.children) ? parent.children : [];
                child.parents = Array.isArray(child.parents) ? child.parents : [];
                if (child.parents.length >= 2 || parent.children.includes(request.child)) {
                    global.adoptionRequests.delete(token);
                    return msg.reply('《✤》 La adopción ya no puede registrarse porque la familia alcanzó su límite o el vínculo ya existe.');
                }
                parent.children.push(request.child);
                child.parents.push(request.parent);
                const spouseId = parent.marry;
                if (spouseId && spouseId !== request.child && child.parents.length < 2) {
                    const spouse = await db.getUser(spouseId);
                    spouse.children = Array.isArray(spouse.children) ? spouse.children : [];
                    if (!spouse.children.includes(request.child))
                        spouse.children.push(request.child);
                    if (!child.parents.includes(spouseId))
                        child.parents.push(spouseId);
                    await db.updateUser(spouseId, 'children', spouse.children);
                }
                await db.updateUser(request.parent, 'children', parent.children);
                await db.updateUser(request.child, 'parents', child.parents);
                global.adoptionRequests.delete(token);
                return sock.reply(msg.chat, `🏠 *ADOPCIÓN CONFIRMADA*\n\n👑 *${parent.name || request.parent.split('@')[0]}* y su pareja ahora figuran como padre/madre de *${child.name || request.child.split('@')[0]}*.\n\n> El vínculo familiar fue registrado correctamente.`, msg, { mentions: [request.parent, request.child, spouseId].filter(Boolean) });
            }
        }
        if (global.antiPrivateRequests instanceof Map && isCreator(actor)) {
            for (const [token, request] of global.antiPrivateRequests) {
                if (now - request.createdAt > 5 * 60 * 1000) {
                    global.antiPrivateRequests.delete(token);
                    continue;
                }
                if (request.botJid !== ((sock.user?.id || sock.user?.lid || '').split(':')[0] + '@s.whatsapp.net'))
                    continue;
                if (msg.requestToken && token !== msg.requestToken)
                    continue;
                await db.updateSettings(request.botJid, 'antiPrivate', request.nextState);
                global.antiPrivateRequests.delete(token);
                return msg.reply(request.nextState ? '🛡️ *ANTI PRIVADO ACTIVADO*\n\nHaimiya ya no responderá a comandos recibidos en chats privados.' : '🔓 *ANTI PRIVADO DESACTIVADO*\n\nHaimiya volverá a procesar comandos en chats privados.');
            }
        }
        return msg.reply('《✤》 No tienes ninguna solicitud pendiente que puedas aceptar.');
    }
};
