import { requestGracefulRestart, activeTasks } from '../../lib/system/lifecycle.js';
import { panel } from '../../lib/system/ui.js';
export default {
    command: ['restart'],
    aliases: ['reiniciar'],
    desc: 'Reinicia el proceso cuando terminen las tareas activas y se guarden los datos.',
    usage: 'restart',
    category: 'owner',
    isAdmin: false,
    botAdmin: false,
    isOwner: true,
    hidden: false,
    run: async ({ msg }) => {
        await msg.reply(panel('Reinicio gradual solicitado', [`• *Tareas activas:* ${activeTasks()}`, '• Se bloquearán nuevas tareas durante el cierre.', '• Se guardarán sesiones y base de datos antes de salir.', '• El administrador del proceso deberá iniciar Haimiya de nuevo.'], { icon: '↻', footer: 'Cierre seguro' }));
        requestGracefulRestart();
    }
};
