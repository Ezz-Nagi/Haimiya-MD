import { createAnimeInteraction } from '../../lib/anime-interaction.js';

export default createAnimeInteraction({
  command: 'gaming',
  description: 'Jugar videojuegos con alguien.',
  solo: 'está jugando videojuegos.',
  withUser: 'está jugando videojuegos con',
  aliases: []
});
