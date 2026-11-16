import db from "#db";
export default {
    command: [
        'welcome', 'bienvenidas',
        'alerts', 'alertas', 'antistatus', 'antiestados',
        'antilink', 'antienlaces', 'antilinks',
        'rpg', 'economy', 'bye', 'despedidas', 'economia',
        'adminonly', 'goodbye', 'onlyadmin',
        'autoacept', 'gacha'
    ],
    aliases: [],
    desc: 'Configura las opciones y sistemas disponibles del grupo.',
    usage: '<opción> <on|off>',
    category: 'group',
    isAdmin: true,
    isOwner: false,
    botAdmin: false,
    customPrefix: null,
    hidden: false,
    run: async ({ msg, sock, args, command, text, usedPrefix: prefix }) => {
        const chatData = await db.getChat(msg.chat);
        const stateArg = args[0]?.toLowerCase();
        const validStates = ['on', 'off', 'enable', 'disable'];
        const mapTerms = {
            antilinks: 'antilinks',
            antienlaces: 'antilinks',
            antistatus: 'antistatus',
            antiestados: 'antistatus',
            antilink: 'antilinks',
            welcome: 'welcome',
            goodbye: 'goodbye',
            despedidas: 'goodbye',
            bye: 'goodbye',
            bienvenidas: 'welcome',
            alerts: 'alerts',
            alertas: 'alerts',
            economy: 'rpg',
            economia: 'rpg',
            adminonly: 'adminonly',
            onlyadmin: 'adminonly',
            autoacept: 'autoacept',
            gacha: 'gacha'
        };
        const featureNames = {
            antilinks: 'el *AntiEnlace*',
            antistatus: 'el *AntiEstado*',
            welcome: 'el mensaje de *Bienvenida*',
            goodbye: 'el mensaje de *Despedida*',
            alerts: 'las *Alertas*',
            rpg: 'los comandos de *Economía*',
            adminonly: 'el modo *Solo Admin*',
            autoacept: 'el *AutoAcept*',
            gacha: 'el sistema de *Gacha*',
        };
        const featureTitles = {
            antilinks: 'AntiEnlace',
            antistatus: 'AntiEstado',
            welcome: 'Bienvenida',
            goodbye: 'Despedida',
            alerts: 'Alertas',
            rpg: 'Economía',
            adminonly: 'AdminOnly',
            autoacept: 'AutoAcept',
            gacha: 'Gacha',
            antibots: 'Anti-bots',
            antifake: 'Anti-fake',
            antispam: 'Anti-spam'
        };
        const normalizedKey = mapTerms[command] || command;
        const current = chatData[normalizedKey] === undefined ? 1 : chatData[normalizedKey] === 1;
        const estado = current ? '✓ Activado' : '✗ Desactivado';
        const nombreBonito = featureNames[normalizedKey] || `la función *${normalizedKey}*`;
        const titulo = featureTitles[normalizedKey] || normalizedKey;
        if (!stateArg) {
            return sock.reply(msg.chat, `*✩ ${titulo} (✿❛◡❛)*\n` +
                `❒ *Estado ›* ${estado}\n\n` +
                `ꕥ Un administrador puede activar o desactivar ${nombreBonito} utilizando:\n\n` +
                `> ● _Habilitar ›_ *${prefix + normalizedKey} enable*\n` +
                `> ● _Deshabilitar ›_ *${prefix + normalizedKey} disable*\n\n${dev}`, msg);
        }
        if (!validStates.includes(stateArg)) {
            return msg.reply(`《✤》 Estado no válido. Usa *on*, *off*, *enable* o *disable*\n\nEjemplo:\n${prefix}${normalizedKey} enable`);
        }
        const enabled = ['on', 'enable'].includes(stateArg);
        if (chatData[normalizedKey] === (enabled ? 1 : 0) && chatData[normalizedKey] !== undefined) {
            return msg.reply(`《✤》 *${titulo}* ya estaba *${enabled ? 'activado' : 'desactivado'}*.`);
        }
        await db.updateChat(msg.chat, normalizedKey, enabled ? 1 : 0);
        return msg.reply(`✎ Has *${enabled ? 'activado' : 'desactivado'}* ${nombreBonito}.`);
    }
};
