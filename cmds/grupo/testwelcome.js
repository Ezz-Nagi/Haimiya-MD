import db from '#db';
import { prepareWAMessageMedia } from 'ezz-baileys';
const FIXED_PHOTO = 'https://h.uguu.se/HYONeAcl.jpg';
async function buildCaption(kind, { msg, metadata, phone, memberCount, chat, botSettings }) {
    const tiempo = new Date().toLocaleDateString('es');
    const tiempo2 = new Date().toLocaleTimeString('es');
    if (kind === 'welcome') {
        const custom = (chat.welcomeMessage || botSettings?.welcomeMessage || '').trim();
        if (custom) {
            return custom
                .replace(/@user/g, `@${phone}`)
                .replace(/@group/g, metadata.subject || '')
                .replace(/@desc/g, metadata.desc || 'Sin descripción')
                .replace(/@members/g, String(memberCount))
                .replace(/@time/g, `${tiempo} ${tiempo2}`);
        }
        return `ത        ׂ𖹭     ׅ    ꒰͡     𝖭 ⋃ Σ 𝖵 𝖮     
𑄹𑄹  »   𝙐 𝙎 𝙀 𝙍!!*    ✬✫

⪩⪩   ֹ  \`𝖡𝗂𝖾ɳ𝗏𝖾𝗇𝗂𝖽@ 𝖺\`
                 \`${metadata.subject || ''}\`  ꒱꒱

*ֹ  ᦕ   ׄ                      _@${phone}_*

         ׅ     ⑅ ׄ     .˙ Disfruta tu estadía!ֹ

な⃟   ۟  ─ _Ahora somos *${memberCount}* miembros!_`;
    }
    const custom = (chat.byeMessage || botSettings?.byeMessage || '').trim();
    if (custom) {
        return custom
            .replace(/@user/g, `@${phone}`)
            .replace(/@group/g, metadata.subject || '')
            .replace(/@desc/g, metadata.desc || 'Sin descripción')
            .replace(/@members/g, String(memberCount))
            .replace(/@time/g, `${tiempo} ${tiempo2}`);
    }
    return `ത        ׂ𖹭     ׅ    ꒰͡     A ᗞＩO S     
𑄹𑄹  »   𝙐 𝙎 𝙀 𝙍!!*

⪩⪩   ֹ  \`𝙷𝚊𝚜𝚝𝚊 𝚕𝚞𝚎𝚐𝚘 𝚍𝚎\`
                 \`${metadata.subject || ''}\`

*ֹ  ᦕ   ׄ                      _@${phone}_*

         ׅ     ⑅ ׄ     .˙ Espero vuelvas Pronto!ֹ

な⃟   ۟  ─ _Ahora somos *${memberCount}* miembros!_`;
}
async function sendWithPreview(sock, chat, imageUrl, caption, mentions) {
    let imageMessage;
    try {
        imageMessage = (await prepareWAMessageMedia({ image: { url: imageUrl } }, { upload: sock.waUploadToServer, mediaTypeOverride: 'thumbnail-link' }))?.imageMessage;
    }
    catch { }
    const contextInfo = {
        mentionedJid: mentions || [],
        forwardingScore: 1,
        isForwarded: true
    };
    try {
        await sock.sendMessage(chat, { image: { url: imageUrl }, caption, contextInfo }, {});
        return;
    }
    catch { }
    const linkPreview = {
        'canonical-url': imageUrl,
        'matched-text': imageUrl,
        title: 'Haimiya',
        description: caption.slice(0, 80),
        jpegThumbnail: imageMessage?.jpegThumbnail ? Buffer.from(imageMessage.jpegThumbnail) : undefined,
        highQualityThumbnail: imageMessage,
        previewType: 0
    };
    await sock.sendMessage(chat, { text: caption, contextInfo, linkPreview });
}
async function runTest(kind, { msg, sock, args }) {
    if (!msg.isGroup)
        return msg.reply('Solo en grupos.');
    const metadata = await sock.groupMetadata(msg.chat).catch(() => null);
    if (!metadata)
        return msg.reply('No pude leer el grupo.');
    const phone = (msg.sender || '').split('@')[0];
    const memberCount = metadata.participants?.length || 0;
    const botJid = (sock.user?.id || '').split(':')[0].replace(/\D/g, '') + '@s.whatsapp.net';
    const chat = await db.getChat(msg.chat);
    const botSettings = await db.getSettings(botJid);
    let avatar = FIXED_PHOTO;
    const mode = String(args[0] || '').toLowerCase();
    if (mode === 'delfoto' || mode === 'botfoto' || mode === 'foto') {
        try {
            avatar = await sock.profilePictureUrl(botJid, 'image');
        }
        catch {
            avatar = FIXED_PHOTO;
        }
    }
    else {
        try {
            avatar = await sock.profilePictureUrl(msg.sender, 'image');
        }
        catch {
            avatar = botSettings?.fotoglobal || FIXED_PHOTO;
        }
    }
    const caption = await buildCaption(kind, { msg, metadata, phone, memberCount, chat, botSettings });
    await sendWithPreview(sock, msg.chat, avatar, caption.trim(), [msg.sender]);
}
export default {
    command: ['testwelcome', 'testgoodbye'],
    aliases: ['probienvenida', 'prodespedida'],
    category: 'group',
    desc: 'Prueba el mensaje de bienvenida configurado en el grupo.',
    isOwner: false,
    botAdmin: false,
    hidden: false,
    description: 'Simula bienvenida o despedida.',
    usage: 'testwelcome [delfoto] | testgoodbye [delfoto]',
    isAdmin: true,
    run: async (ctx) => {
        const cmd = String(ctx.command || '').toLowerCase();
        const kind = cmd.includes('good') || cmd.includes('desped') ? 'goodbye' : 'welcome';
        return runTest(kind, ctx);
    }
};
