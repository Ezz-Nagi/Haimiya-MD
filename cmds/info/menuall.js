import menu from './menu.js';
export default {
    command: ['menuall', 'allmenu'],
    aliases: ['menutodo'],
    category: 'info',
    desc: 'Muestra todos los comandos de todas las categorías.',
    usage: 'menuall',
    isOwner: false,
    isAdmin: false,
    botAdmin: false,
    hidden: false,
    run: async (ctx) => {
        return menu.run({ ...ctx, command: 'menuall', args: ['all'] });
    }
};
