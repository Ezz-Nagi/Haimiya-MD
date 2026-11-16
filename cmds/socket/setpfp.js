import db from "#db";
import { canManageBot } from "../../lib/haimiya.js";
import * as Jimp from 'jimp';
async function resizeImage(media) {
    const jimp = await Jimp.read(media);
    const min = jimp.getWidth();
    const max = jimp.getHeight();
    const cropped = jimp.crop(0, 0, min, max);
    return {
        img: await cropped.scaleToFit(720, 720).getBufferAsync(Jimp.MIME_JPEG),
        preview: await cropped.normalize().getBufferAsync(Jimp.MIME_JPEG),
    };
}
export default {
    command: ['setimage'],
    aliases: ['setpfp', 'setbotphoto', 'setbotavatar'],
    desc: 'Cambia la foto de perfil del bot.',
    usage: 'setimage',
    isOwner: false,
    isAdmin: false,
    botAdmin: false,
    customPrefix: null,
    hidden: false,
    category: 'socket',
    run: async ({ msg, sock, args }) => {
        const idBot = sock.user.id.split(':')[0] + '@s.whatsapp.net';
        const config = await db.getSettings(idBot);
        if (!canManageBot(msg.sender, config, sock))
            return msg.reply(mess.socket);
        const q = msg.quoted || msg;
        const mime = (q.msg || q).mimetype || q.mediaType || '';
        if (!/image/g.test(mime))
            return msg.reply('✿ Debes enviar o citar una imagen para cambiar la foto de perfil del bot.');
        const media = await q.download();
        if (!media)
            return msg.reply('❀ No se pudo descargar la imagen.');
        const jid = sock.user.id.split(':')[0] + '@s.whatsapp.net';
        if (args[1] === 'full') {
            const { img } = await resizeImage(media);
            await sock.query({
                tag: 'iq',
                attrs: {
                    to: jid,
                    type: 'set',
                    xmlns: 'w:profile:picture',
                },
                content: [
                    {
                        tag: 'picture',
                        attrs: { type: 'image' },
                        content: img,
                    },
                ],
            });
        }
        else {
            await sock.updateProfilePicture(jid, media);
        }
        return msg.reply(`✿ Se ha actualizado la foto de perfil de *${config.namebot}*!`);
    },
};
