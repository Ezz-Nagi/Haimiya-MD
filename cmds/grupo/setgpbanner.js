import db from "#db";
import sharp from "sharp";
export default {
    command: ["setgpbanner"],
    aliases: ["setgppfp", "setgpicon"],
    desc: "Configura la imagen de perfil del grupo.",
    usage: "setgpbanner (responde a una imagen)",
    isOwner: false,
    customPrefix: null,
    hidden: false,
    category: "group",
    isAdmin: true,
    botAdmin: true,
    run: async ({ msg, sock }) => {
        const q = msg.quoted ? msg.quoted : msg;
        const mime = (q.msg || q).mimetype || q.mediaType || "";
        if (!/image/.test(mime))
            return msg.reply("《✤》 Responde a una imagen para cambiar el perfil del grupo.");
        let img;
        try {
            img = await q.download();
        }
        catch (e) {
            return msg.reply("✎ No se pudo descargar la imagen.");
        }
        if (!img || !img.length)
            return msg.reply("✎ No se pudo descargar la imagen.");
        try {
            let buffer = Buffer.from(img);
            try {
                buffer = await sharp(buffer)
                    .rotate()
                    .resize(640, 640, { fit: "cover" })
                    .jpeg({ quality: 90 })
                    .toBuffer();
            }
            catch {
            }
            await sock.updateProfilePicture(msg.chat, buffer);
            return msg.reply("✐ La imagen del grupo se actualizó con éxito.");
        }
        catch (e) {
            console.error("[setgpbanner]", e?.message || e);
            const hint = /not-authorized|403|401/i.test(String(e?.message || e))
                ? "\n(El bot necesita ser administrador del grupo.)"
                : "";
            return msg.reply(`❌ No se pudo actualizar la imagen del grupo.${hint}`);
        }
    }
};
