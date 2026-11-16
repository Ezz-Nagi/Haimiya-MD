import { createAnimeInteraction } from '../../lib/anime-interaction.js';

export default createAnimeInteraction({
  command: 'run',
  description: 'Salir a correr con alguien.',
  solo: 'salió a correr.',
  withUser: 'salió a correr con',
  aliases: []
});
