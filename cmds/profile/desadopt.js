import db from "#db";
export default {
    command: ['desadoptar'],
    aliases: ['desadopta', 'disown'],
    category: 'profile',
    description: 'Termina una relación de adopción registrada.',
    desc: 'Termina una relación de adopción registrada.',
    usage: 'desadoptar @usuario',
    isOwner: false,
    isAdmin: false,
    botAdmin: false,
    customPrefix: null,
    hidden: false,
    run: async ({ msg, sock }) => {
        const actor = msg.sender;
        const target = msg.mentionedJid?.[0] || msg.quoted?.sender;
        if (!target)
            return msg.reply('《✤》 Usa *desadoptar @user* para terminar una adopción.');
        if (actor === target)
            return msg.reply('《✤》 No puedes desadoptarte a ti mismo.');
        const actorData = await db.getUser(actor);
        const targetData = await db.getUser(target);
        actorData.children = Array.isArray(actorData.children) ? actorData.children : [];
        targetData.parents = Array.isArray(targetData.parents) ? targetData.parents : [];
        const isParent = actorData.children.includes(target) && targetData.parents.includes(actor);
        const isChild = targetData.children?.includes(actor) && actorData.parents?.includes(target);
        if (!isParent && !isChild) {
            return msg.reply('《✤》 No existe una adopción registrada entre ustedes.');
        }
        const parentId = isParent ? actor : target;
        const childId = isParent ? target : actor;
        const parentData = isParent ? actorData : targetData;
        const childData = isParent ? targetData : actorData;
        parentData.children = (parentData.children || []).filter(id => id !== childId);
        childData.parents = (childData.parents || []).filter(id => id !== parentId);
        const spouse = parentData.marry;
        if (spouse && spouse !== childId) {
            const spouseData = await db.getUser(spouse);
            spouseData.children = Array.isArray(spouseData.children) ? spouseData.children : [];
            if (spouseData.children.includes(childId)) {
                spouseData.children = spouseData.children.filter(id => id !== childId);
                await db.updateUser(spouse, 'children', spouseData.children);
            }
            childData.parents = childData.parents.filter(id => id !== spouse);
        }
        await db.updateUser(parentId, 'children', parentData.children);
        await db.updateUser(childId, 'parents', childData.parents);
        const parentName = parentData.name || parentId.split('@')[0];
        const childName = childData.name || childId.split('@')[0];
        return sock.reply(msg.chat, `✦ *ADOPCIÓN TERMINADA*\n\n👤 *${parentName}* ya no figura como padre/madre de *${childName}*.\n\n> El vínculo familiar fue eliminado correctamente.`, msg, { mentions: [parentId, childId] });
    }
};
