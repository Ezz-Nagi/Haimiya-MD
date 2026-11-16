import db from "#db";
export default {
    command: ['gp'],
    aliases: [],
    desc: 'Muestra información y metadatos del grupo actual.',
    usage: 'gp',
    isOwner: false,
    isAdmin: false,
    botAdmin: false,
    customPrefix: null,
    hidden: false,
    category: 'group',
    run: async ({ msg, sock, args }) => {
        const from = msg.chat;
        const groupMetadata = msg.isGroup ? await sock.groupMetadata(from).catch(() => { }) : '';
        if (!groupMetadata)
            return msg.reply("No se pudo obtener la información del grupo.");
        const groupName = groupMetadata.subject;
        const groupCreator = groupMetadata.owner ? '@' + groupMetadata.owner.split('@')[0] : 'Desconocido';
        const totalParticipants = groupMetadata.participants.length;
        const chat = await db.getChat(msg.chat);
        const chatUsers = await db.getChatUser(msg.chat);
        const botId = sock.user.id.split(':')[0] + "@s.whatsapp.net";
        const botSettings = await db.getSettings(botId);
        const botname = botSettings.namebot2;
        const monedas = botSettings.currency;
        let totalCoins = 0;
        let registeredUsersInGroup = 0;
        let totalClaimedWaifus = 0;
        for (const participant of groupMetadata.participants) {
            const fullId = participant.phoneNumber || participant.id || participant.jid;
            const user = chatUsers.find(u => u.user_id === fullId);
            if (user) {
                registeredUsersInGroup++;
                totalCoins += Number(user.coins) || 0;
                const personagens = Array.isArray(user.characters) ? user.characters : [];
                totalClaimedWaifus += personagens.length;
            }
        }
        const rawPrimary = typeof chat.primaryBot === 'string' ? chat.primaryBot : '';
        const botprimary = rawPrimary.endsWith('@s.whatsapp.net')
            ? `@${rawPrimary.split('@')[0]}`
            : 'Aleatorio';
        const on = v => (Number(v) === 1 || v === true) ? '✓ Activado' : '✘ Desactivado';
        const wa = (flag, yes, no) => flag ? yes : no;
        const warnInfo = chat.expulsar && chat.warnLimit ? `✓ Expulsa a las ${chat.warnLimit} advertencias` : '✘ Desactivado';
        const muted = Array.isArray(chat.mutedUsers) ? chat.mutedUsers.length : 0;
        const addMode = groupMetadata.memberAddMode;
        const ephemeral = Number(groupMetadata.ephemeralDuration) || 0;
        const ephemeralTxt = !ephemeral ? '✘ Desactivados' : ephemeral >= 7776000 ? '✓ 90 días' : ephemeral >= 604800 ? '✓ 7 días' : '✓ 24 horas';
        const settings = {
            bot: on(!chat.bannedGrupo),
            antiLinks: on(chat.antilinks),
            antistatus: on(chat.antistatus),
            antibots: on(chat.antibots),
            antifake: on(chat.antifake),
            antispam: on(chat.antispam),
            antidelete: on(chat.antidelete),
            welcomes: on(chat.welcome),
            goodbye: on(chat.goodbye),
            alerts: on(chat.alerts),
            rpg: on(chat.rpg),
            gacha: on(chat.gacha),
            adminMode: on(chat.adminonly),
            joinNotify: on(chat.joinRequestNotify),
            botprimary: botprimary
        };
        try {
            let message = `*「✿」Grupo ◢ ${groupName} ◤*\n\n`;
            message += `➪ *Creador ›* ${groupCreator}\n`;
            message += `❖ Bot Principal › *${settings.botprimary}*\n`;
            message += `❒ Usuarios › *${totalParticipants}*\n`;
            message += `ꕥ Registrados › *${registeredUsersInGroup}*\n`;
            message += `✿ Claims › *${totalClaimedWaifus}*\n`;
            message += `⛁ Dinero › *${totalCoins.toLocaleString()} ${monedas}*\n\n`;
            message += `➪ *Protecciones:*\n`;
            message += `✐ AntiLinks › *${settings.antiLinks}*\n`;
            message += `✐ AntiStatus › *${settings.antistatus}*\n`;
            message += `✐ AntiBots › *${settings.antibots}*\n`;
            message += `✐ AntiFake › *${settings.antifake}*\n`;
            message += `✐ AntiSpam › *${settings.antispam}*\n`;
            message += `✐ AntiDelete › *${settings.antidelete}*\n`;
            message += `✐ Warns › *${warnInfo}*\n`;
            message += `✐ Muteados › *${muted}*\n\n`;
            message += `➪ *Funciones:*\n`;
            message += `✐ ${botname} › *${settings.bot}*\n`;
            message += `✐ Bienvenidas › *${settings.welcomes}*\n`;
            message += `✐ Despedidas › *${settings.goodbye}*\n`;
            message += `✐ Alertas › *${settings.alerts}*\n`;
            message += `✐ Economía › *${settings.rpg}*\n`;
            message += `✐ Gacha › *${settings.gacha}*\n`;
            message += `✐ ModoAdmin › *${settings.adminMode}*\n`;
            message += `✐ Aviso de solicitudes › *${settings.joinNotify}*\n\n`;
            message += `➪ *Ajustes de WhatsApp:*\n`;
            message += `✐ Chat › *${wa(groupMetadata.announce, '🔒 Cerrado (solo admins escriben)', '🔓 Abierto')}*\n`;
            message += `✐ Editar info › *${wa(groupMetadata.restrict, '🔒 Solo admins', '🔓 Todos')}*\n`;
            message += `✐ Agregar miembros › *${addMode === 'admin_add' ? 'Solo admins' : addMode === 'all_member_add' ? 'Todos' : 'No disponible'}*\n`;
            message += `✐ Aprobar ingresos › *${wa(groupMetadata.joinApprovalMode, '✓ Activado', '✘ Desactivado')}*\n`;
            message += `✐ Mensajes temporales › *${ephemeralTxt}*`;
            const mentionOw = groupMetadata.owner ? groupMetadata.owner : '';
            const mentions = [rawPrimary, mentionOw].filter(Boolean);
            await sock.reply(msg.chat, message.trim(), msg, { mentions });
        }
        catch (e) {
            await msg.reply('《✧》 No pude mostrar la información del grupo.');
        }
    }
};
