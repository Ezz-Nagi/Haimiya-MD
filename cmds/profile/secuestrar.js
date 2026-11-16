import db from '#db';
import { isCreator } from '../../lib/haimiya.js';
export default {
    command: ['secuestrar'],
    aliases: [],
    category: 'profile',
    desc: 'Realiza una acción administrativa forzada sobre una relación de perfil.',
    usage: 'secuestrar @usuario',
    isOwner: true,
    isAdmin: false,
    botAdmin: false,
    customPrefix: null,
    hidden: false,
    run: async ({ msg, sock, args }) => {
        if (!isCreator(msg.sender))
            return msg.reply('🚫 Solo el creador puede usar este comando.');
        const parent = msg.sender;
        const child = msg.mentionedJid?.[0] || msg.quoted?.sender;
        if (!child)
            return msg.reply('《✤》 Menciona o responde al usuario que quieres secuestrar (adoptar forzosamente).');
        if (parent === child)
            return msg.reply('《✤》 No puedes secuestrarte a ti mismo.');
        const parentData = await db.getUser(parent);
        const childData = await db.getUser(child);
        const isMarried = parentData?.marry;
        const spouse = isMarried ? parentData.marry : null;
        parentData.children = Array.isArray(parentData.children) ? parentData.children : [];
        childData.parents = Array.isArray(childData.parents) ? childData.parents : [];
        if (parentData.children.includes(child))
            return msg.reply('《✤》 Ese usuario ya es tu hijo/a.');
        if (childData.parents.includes(parent))
            return msg.reply('《✤》 Ya eres padre/madre de ese usuario.');
        if (childData.parents.length >= 2)
            return msg.reply('《✤》 Ese usuario ya tiene dos padres/madres registrados.');
        parentData.children.push(child);
        childData.parents.push(parent);
        if (spouse && spouse !== child && childData.parents.length < 2) {
            const spouseData = await db.getUser(spouse);
            spouseData.children = Array.isArray(spouseData.children) ? spouseData.children : [];
            if (!spouseData.children.includes(child))
                spouseData.children.push(child);
            childData.parents.push(spouse);
            await db.updateUser(spouse, 'children', spouseData.children);
        }
        await db.updateUser(parent, 'children', parentData.children);
        await db.updateUser(child, 'parents', childData.parents);
        const parentName = parentData.name || parent.split('@')[0];
        const spouseName = spouse ? (await db.getUser(spouse))?.name || spouse.split('@')[0] : 'Ninguno';
        const childName = childData.name || child.split('@')[0];
        return sock.reply(msg.chat, `🔥 *SECUESTRO COMPLETADO*\n\n👑 *${parentName}* ha secuestrado (adoptado forzosamente) a *${childName}*.\n\n💍 Pareja del secuestrador: *${spouseName}*\n\n> La adopción fue forzada y **no requiere aceptación**. ¡El creador siempre gana! 😈`, msg, { mentions: [parent, child] });
    }
};
