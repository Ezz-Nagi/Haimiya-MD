const MODE = () => String(global.config?.theme || global.themeMode || 'auto').toLowerCase();
export function season(date = new Date()) {
    const mode = MODE();
    if (mode === 'halloween' || mode === 'christmas')
        return mode;
    if (mode === 'default' || mode === 'off')
        return 'default';
    const m = date.getMonth(), d = date.getDate();
    if ((m === 9 && d >= 15) || (m === 10 && d <= 3))
        return 'halloween';
    if (m === 11 || (m === 0 && d <= 6))
        return 'christmas';
    return 'default';
}
export const isHalloween = date => season(date) === 'halloween';
export const isChristmas = date => season(date) === 'christmas';
const HALLOWEEN = {
    name: 'halloween',
    icon: '🎃', ghost: '👻', bat: '🦇', web: '🕸️', skull: '💀', moon: '🌙',
    bullet: '🦇', item: '🎃', sub: '🕸️',
    top: '🦇 ⋆｡˚🎃˚｡⋆ 🦇',
    divider: '🕸️──────────────🕸️',
    bannerPath: '/banner-halloween.png',
    chip: '🎃',
    footer: '🎃 ¡Feliz Halloween! 👻'
};
const CHRISTMAS = {
    name: 'christmas',
    icon: '🎄', ghost: '⛄', bat: '❄️', web: '❄️', skull: '🎅', moon: '🌙',
    bullet: '❄️', item: '🎁', sub: '⭐',
    top: '❄️ ⋆｡˚🎄˚｡⋆ ❄️',
    divider: '❄️──────────────❄️',
    bannerPath: '/banner-christmas.png',
    chip: '🎄',
    footer: '🎄 ¡Feliz Navidad! 🎅'
};
const DEFAULT = {
    name: 'default',
    icon: '🪻', ghost: '✨', bat: '✿', web: '', skull: '', moon: '🌙',
    bullet: '✿', item: '✿', sub: '↳',
    top: '⌒࣪᷼⏜͡  ۪  ࿚ꨪᰰ࿙',
    divider: '───────────────',
    bannerPath: '',
    chip: '🪻',
    footer: ''
};
export const theme = () => ({ halloween: HALLOWEEN, christmas: CHRISTMAS }[season()] || DEFAULT);
export const SEASON_LINES = {
    halloween: {
        greet: ['🎃 ¿Truco o trato? Habla.', '👻 Buu… ¿qué quieres?', '🦇 Las sombras escuchan. Dime.', '🕸️ Entraste en mi telaraña. ¿Qué necesitas?'],
        error: ['💀 Algo salió mal… como en toda buena película de terror.', '👻 Un fantasma se comió tu comando. Inténtalo otra vez.', '🕸️ Quedé atrapado en una telaraña. Revisa los datos.'],
        wait: ['🦇 Espera… los murciélagos están trabajando.', '⏳🎃 Un momento, estoy cocinando la calabaza.'],
        success: ['🎃 Listo. Dulce truco.', '👻 Hecho. Sin sustos.', '🦇 Conjuro completado.'],
        denied: ['💀 No tienes permiso. Este lugar está embrujado.', '🕸️ Esa puerta está sellada para ti.'],
        invalidArgs: ['🕸️ Falta un ingrediente en la poción.', '🎃 Te faltó un dato, brujita.']
    },
    christmas: {
        greet: ['🎄 ¡Felices fiestas! ¿Qué necesitas?', '🎅 Jo, jo, jo… dime.', '⛄ ¡Hola! Aquí, calentita junto al árbol.', '🎁 ¿Ya abriste tu regalo? Cuéntame.'],
        error: ['❄️ Algo se congeló… inténtalo otra vez.', '🎅 Los duendes se equivocaron con ese comando.', '🎄 Una bolita se cayó del árbol. Revisa los datos.'],
        wait: ['🛷 Un momento, el trineo ya viene.', '⏳🎄 Envolviendo tu pedido…'],
        success: ['🎁 ¡Listo! Para ti.', '⭐ Hecho. ¡Feliz Navidad!', '🎅 Entregado.'],
        denied: ['🎅 Estás en la lista de traviesos para eso. No tienes permiso.', '❄️ Esa puerta está cerrada con nieve.'],
        invalidArgs: ['🎁 Falta un dato en el paquete.', '🎄 Te faltó algo en el comando.']
    }
};
export const HALLOWEEN_LINES = SEASON_LINES.halloween;
const MESS_CHRISTMAS = {
    socket: '🎄 Eso solo lo hace un Socket.',
    admin: '🎅 Solo los admins pueden… ¡están en la lista de buenos!',
    botAdmin: '⛄ Hazme admin del grupo y lo hago al instante.',
    comandooff: '🎁 Ese comando está desactivado en este grupo.',
    owner: '🔒 Solo el developer puede usar este comando.'
};
const MESS_HALLOWEEN = {
    socket: '🦇 Eso solo lo hace un Socket, mortal.',
    admin: '💀 ¿Admin? Tú no. Vuelve cuando seas parte del aquelarre.',
    botAdmin: '👻 Hazme admin del grupo primero o no podré invocar nada.',
    comandooff: '🎃 Ese comando está desactivado en este grupo.',
    owner: '🔒 Solo el developer puede usar este hechizo.'
};
export function applyTheme() {
    if (!global.mess)
        return;
    if (!global.__messDefault)
        global.__messDefault = { ...global.mess };
    Object.assign(global.mess, { halloween: MESS_HALLOWEEN, christmas: MESS_CHRISTMAS }[season()] || global.__messDefault);
}
export function startThemeLoop() {
    applyTheme();
    if (global.__themeLoop)
        return;
    global.__themeLoop = setInterval(applyTheme, 60 * 60 * 1000);
    global.__themeLoop.unref?.();
}
