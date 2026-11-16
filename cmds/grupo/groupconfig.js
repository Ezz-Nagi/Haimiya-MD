import db from '#db';
export default {
  command: ['groupconfig', 'configgrupo'], aliases: ['ajustesgrupo'],
  desc: 'Muestra el estado de las herramientas de administración del grupo.',
  usage: 'groupconfig', category: 'group',
  isOwner: false, isAdmin: true, botAdmin: false, hidden: false,
  run: async ({ msg }) => {
    if (!msg.isGroup) return msg.reply('Este comando solo funciona en grupos.');
    const c = await db.getChat(msg.chat);
    const on = v => Number(v) === 1 ? 'ON' : 'OFF';
    return msg.reply(`⚙️ *CONFIGURACIÓN DEL GRUPO*\n\n` +
      `• Bienvenidas: *${on(c.welcome)}*\n` +
      `• Despedidas: *${on(c.goodbye)}*\n` +
      `• Anti-spam: *${on(c.antispam)}*\n` +
      `• Anti-delete: *${on(c.antidelete)}*\n` +
      `• Anti-bots: *${on(c.antibots)}*\n` +
      `• Anti-fake: *${on(c.antifake)}*\n` +
      `• Anti-links: *${on(c.antilinks)}*\n` +
      `• Anti-status: *${on(c.antistatus)}*\n` +
      `• Admin-only: *${on(c.adminonly)}*\n` +
      `• Aviso de solicitudes: *${on(c.joinRequestNotify)}*\n\n` +
      `Consulta #menuall para ver todos los controles disponibles.`);
  }
};
