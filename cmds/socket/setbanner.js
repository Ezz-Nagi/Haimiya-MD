import db from "#db";
import { canManageBot, getBotSettingsId } from "../../lib/haimiya.js";
export default {
    command: ["setbanner"],
    aliases: ["setmenubanner"],
    desc: "Configura el banner del bot (URL o imagen).",
    usage: "setbanner <url> | responde / envía una imagen",
    isOwner: false,
    isAdmin: false,
    botAdmin: false,
    customPrefix: null,
    hidden: false,
    category: "socket",
    run: async ({ msg, sock, args }) => {
        const idBot = getBotSettingsId(sock);
        if (!idBot)
            return msg.reply("❌ No pude identificar esta sesión del bot.");
        const config = db.getSettings(idBot);
        if (!canManageBot(msg.sender, config, sock))
            return msg.reply(mess.socket);
        const value = args.join(" ").trim();
        if (!value) return msg.reply("❖ Usa #setbanner <URL pública directa>. No se suben imágenes a alojamientos externos.");
        if (!/^https?:\/\//i.test(value)) return msg.reply("❌ La URL debe comenzar con https:// o http://");
        config.banner = value;
        db.updateSettings(idBot, "banner", value);
        db.updateSettings(idBot, "bannerCustom", true);
        const saved = db.getSettings(idBot);
        if (saved.banner !== value || saved.bannerCustom !== true) return msg.reply("❌ No pude verificar el guardado del banner.");
        return msg.reply("❖ Banner actualizado y guardado para esta sesión.");
    }
};
