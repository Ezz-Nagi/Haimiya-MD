import { isCreator } from '../../lib/haimiya.js';
export default {
    command: ['rechazar'],
    aliases: ['rechazo', 'reject'],
    category: 'profile',
    description: 'Rechaza una solicitud pendiente de matrimonio o adopción.',
    desc: 'Rechaza una solicitud pendiente de matrimonio o adopción.',
    usage: 'rechazar',
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
                if (request.proposee === actor) {
                    global.marryRequests.delete(token);
                    return sock.reply(msg.chat, '💔 La propuesta de matrimonio fue rechazada.', msg, { mentions: [request.proposer, request.proposee] });
                }
            }
        }
        if (global.adoptionRequests instanceof Map) {
            for (const [token, request] of global.adoptionRequests) {
                if (now - request.createdAt > 10 * 60 * 1000) {
                    global.adoptionRequests.delete(token);
                    continue;
                }
                if (request.child === actor) {
                    global.adoptionRequests.delete(token);
                    return sock.reply(msg.chat, '🏠 La solicitud de adopción fue rechazada. No se registró ningún vínculo familiar.', msg, { mentions: [request.parent, request.child] });
                }
            }
        }
        if (global.antiPrivateRequests instanceof Map && isCreator(actor)) {
            for (const [token, request] of global.antiPrivateRequests) {
                if (now - request.createdAt > 5 * 60 * 1000) {
                    global.antiPrivateRequests.delete(token);
                    continue;
                }
                global.antiPrivateRequests.delete(token);
                return msg.reply('《✤》 Solicitud de Anti Privado cancelada. No se realizó ningún cambio.');
            }
        }
        return msg.reply('《✤》 No tienes ninguna solicitud pendiente que puedas rechazar.');
    }
};
